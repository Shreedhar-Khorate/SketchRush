"""
Socket.IO event handlers for SketchRush.

All real-time game events are handled here:
  - Connection / disconnection
  - Room join / leave
  - Drawing (mouse & gesture)
  - Chat / guessing
  - Game lifecycle (start / next_turn / game_end)
  - Gesture module control (start/stop webcam)
"""

import uuid
import asyncio
import logging
from socketio import AsyncServer, ASGIApp

from app.game.game_manager import GameManager
from app.models.models import GameState

logger = logging.getLogger(__name__)

# ── Socket.IO server ──────────────────────────────────────────────────────────
sio = AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    ping_timeout=60,
    ping_interval=25,
    logger=False,
    engineio_logger=False,
)

# ── Shared state ──────────────────────────────────────────────────────────────
game_manager = GameManager()

# sid → player_id
sid_to_player: dict[str, str] = {}
# sid → room_code
sid_to_room: dict[str, str] = {}
# player_id → sid  (reverse lookup)
player_to_sid: dict[str, str] = {}
# room_code → set of player_ids who guessed correctly this round
round_correct: dict[str, set] = {}
# room_code → int tracking time remaining (for scoring)
room_time_left: dict[str, int] = {}
# room_code → asyncio.Task for auto word pick timeout
word_choice_tasks: dict[str, asyncio.Task] = {}
# room_code → asyncio.Task for the active round timer (tick + end)
round_timer_tasks: dict[str, asyncio.Task] = {}
# room_code → bool: _end_round already running (dedup guard)
round_ending: dict[str, bool] = {}
# room_code → original creator player_id (host never changes)
room_creator: dict[str, str] = {}

ROUND_DURATION = 60       # seconds per drawing turn
WORD_CHOICE_TIMEOUT = 12  # seconds drawer has to pick a word
LEAVE_BONUS_POINTS = 50


# ── Low-level task helpers ────────────────────────────────────────────────────

def _cancel_task(tasks_dict: dict, room_code: str):
    task = tasks_dict.pop(room_code, None)
    if task and not task.done():
        task.cancel()


def _cancel_word_choice(room_code: str):
    _cancel_task(word_choice_tasks, room_code)


def _cancel_round_timer(room_code: str):
    """Cancel the combined tick+end timer task for a room."""
    _cancel_task(round_timer_tasks, room_code)


def _cleanup_room_state(room_code: str):
    """Clean up all room-specific dictionary mappings and cancel active timers to prevent memory leaks."""
    _cancel_round_timer(room_code)
    _cancel_word_choice(room_code)
    
    round_correct.pop(room_code, None)
    room_time_left.pop(room_code, None)
    round_ending.pop(room_code, None)
    room_creator.pop(room_code, None)
    
    logger.info(f"[cleanup] Cleaned up all cached state for empty room {room_code}")


def _start_round_timer(room_code: str, duration: int):
    """
    Start a single asyncio task that:
      1. Ticks the countdown every second (emitting timer_tick)
      2. Calls _end_round when the timer hits zero
    Any previous timer task for this room is cancelled first.
    """
    _cancel_round_timer(room_code)

    async def _run():
        logger.info(f"[timer] Starting {duration}s timer for room {room_code}")
        for t in range(duration, -1, -1):
            room = game_manager.get_room(room_code)
            if not room:
                logger.warning(f"[timer] Room {room_code} gone, stopping")
                return
            if room.game_state not in (GameState.DRAWING, GameState.CHOOSING_WORD):
                logger.info(f"[timer] Room {room_code} state={room.game_state}, stopping timer")
                return
            room_time_left[room_code] = t
            if room.game_state == GameState.DRAWING:
                await sio.emit("timer_tick", {"time": t}, room=room_code)
            if t == 0:
                logger.info(f"[timer] Timeout for room {room_code}, ending round")
                # Remove ourselves from the dict BEFORE calling _end_round.
                # If we don't do this, _end_round will call _cancel_round_timer
                # which cancels the currently-running task (self-cancellation bug).
                round_timer_tasks.pop(room_code, None)
                await _end_round(room_code)
                return
            await asyncio.sleep(1)

    task = asyncio.create_task(_run())
    round_timer_tasks[room_code] = task


# ── Broadcast helpers ─────────────────────────────────────────────────────────

async def _broadcast_players(room_code: str):
    """Emit updated player list to everyone in the room."""
    room = game_manager.get_room(room_code)
    if not room:
        return
    # Always use the original creator as host_id
    creator_id = room_creator.get(room_code, room.host_id)
    await sio.emit(
        "players_update",
        {
            "host_id": creator_id,
            "players": [
                {
                    "id": p.id,
                    "name": p.name,
                    "avatar": p.avatar,
                    "score": p.score,
                    "is_drawing": p.is_drawing,
                }
                for p in room.players
            ]
        },
        room=room_code,
    )


# ── Player leave handling ─────────────────────────────────────────────────────

async def _handle_player_leave(room_code: str, player_name: str, was_host: bool, was_drawer: bool):
    room = game_manager.get_room(room_code)
    if not room:
        return

    # The original creator is always the host — do NOT reassign.
    # Just notify players that the host left; the room pauses.
    if was_host and room.players:
        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"👑 The host ({player_name}) left the room. Game paused — waiting for host to return or a new game."},
            room=room_code,
        )
        # Pause any ongoing game
        _cancel_round_timer(room_code)
        _cancel_word_choice(room_code)
        round_ending.pop(room_code, None)
        room.game_state = GameState.WAITING

    # If fewer than 2 players remain, pause the game
    if len(room.players) < 2:
        room.game_state = GameState.WAITING
        _cancel_round_timer(room_code)
        _cancel_word_choice(room_code)
        await sio.emit(
            "chat_message",
            {"type": "system", "content": "⏸️ Not enough players — waiting for more to join."},
            room=room_code,
        )
        await _broadcast_players(room_code)
        return

    # Award bonus points to remaining players
    if room.players:
        for p in room.players:
            p.score += LEAVE_BONUS_POINTS
        await sio.emit(
            "chat_message",
            {
                "type": "system",
                "content": f"⚖️ {player_name} left — everyone gets {LEAVE_BONUS_POINTS} pts.",
            },
            room=room_code,
        )
        await _broadcast_players(room_code)

    # If the drawer left mid-turn, end the round immediately
    if was_drawer and room.game_state in (GameState.DRAWING, GameState.CHOOSING_WORD):
        await sio.emit("canvas_cleared", {}, room=room_code)
        await _end_round(room_code)


# ── Turn management ───────────────────────────────────────────────────────────

async def _start_turn(room_code: str):
    """Set up a new drawing turn — pick a drawer, send word choices, start timers."""
    logger.info(f"[_start_turn] Starting turn for room {room_code}")
    room = game_manager.get_room(room_code)
    if not room:
        logger.error(f"[_start_turn] Room {room_code} not found")
        return

    # Need at least 2 players
    if len(room.players) < 2:
        room.game_state = GameState.WAITING
        await sio.emit(
            "chat_message",
            {"type": "system", "content": "⏸️ Waiting for at least 2 players to start."},
            room=room_code,
        )
        await _broadcast_players(room_code)
        return

    # Validate the drawer exists BEFORE touching any state
    drawer = game_manager.get_current_drawer(room_code)
    logger.info(
        f"[_start_turn] drawer={drawer.id if drawer else 'NONE'}, "
        f"players={len(room.players)}, index={room.current_drawer_index}"
    )
    if not drawer:
        logger.error(f"[_start_turn] No drawer for room {room_code} — resetting to WAITING")
        room.game_state = GameState.WAITING
        await sio.emit(
            "chat_message",
            {"type": "system", "content": "⚠️ Could not determine drawer — game paused. Host can restart."},
            room=room_code,
        )
        await _broadcast_players(room_code)
        return

    # Cancel any leftover tasks from the previous turn
    _cancel_word_choice(room_code)
    _cancel_round_timer(room_code)
    round_ending.pop(room_code, None)

    # Set up fresh round state
    word_choices = game_manager.get_word_choices(room_code)   # → sets CHOOSING_WORD
    game_manager.mark_drawer(room_code)
    round_correct[room_code] = set()
    room_time_left[room_code] = ROUND_DURATION

    logger.info(f"[_start_turn] Emitting turn_started for {drawer.name}")
    await sio.emit(
        "turn_started",
        {
            "drawer_id": drawer.id,
            "drawer_name": drawer.name,
            "drawer_avatar": drawer.avatar,
            "round": room.round_number,
            "max_rounds": room.max_rounds,
            "time": ROUND_DURATION,
            "state": "choosing_word",
        },
        room=room_code,
    )

    drawer_sid = player_to_sid.get(drawer.id)
    if drawer_sid:
        # Send word choices to the drawer; start auto-pick timer
        await sio.emit("word_choices", {"choices": word_choices}, to=drawer_sid)

        async def _auto_pick_word():
            logger.info(f"[_auto_pick] Will fire in {WORD_CHOICE_TIMEOUT}s for room {room_code}")
            await asyncio.sleep(WORD_CHOICE_TIMEOUT)
            logger.info(f"[_auto_pick] Firing for room {room_code}")
            r = game_manager.get_room(room_code)
            if not r or r.game_state != GameState.CHOOSING_WORD or r.current_word:
                return
            choices = r.word_choices or []
            if not choices:
                return
            if not game_manager.select_word_from_choices(room_code, choices[0]):
                return
            await _begin_drawing_phase(room_code)

        word_choice_tasks[room_code] = asyncio.create_task(_auto_pick_word())

        # Also start combined word-choice + draw timer as watchdog
        _start_round_timer(room_code, WORD_CHOICE_TIMEOUT + ROUND_DURATION)

    else:
        # Drawer is disconnected — auto-pick word immediately and start drawing
        logger.warning(f"[_start_turn] Drawer SID not found, auto-selecting word")
        if word_choices and game_manager.select_word_from_choices(room_code, word_choices[0]):
            await _begin_drawing_phase(room_code)
        else:
            # No choices — something is very wrong, skip this turn
            logger.error(f"[_start_turn] No word choices available for room {room_code}")
            room.game_state = GameState.WAITING
            await _broadcast_players(room_code)
            return

    await sio.emit(
        "chat_message",
        {"type": "system", "content": f"🎨 {drawer.name} is choosing a word to draw!"},
        room=room_code,
    )
    await _broadcast_players(room_code)


async def _begin_drawing_phase(room_code: str):
    """
    Called after a word is confirmed (by drawer selection or auto-pick).
    Emits word_selected, starts the proper 60-second draw timer.
    """
    room = game_manager.get_room(room_code)
    if not room or not room.current_word:
        logger.error(f"[_begin_drawing_phase] No word set for room {room_code}")
        return

    word = room.current_word
    hint = game_manager.build_hint(word, reveal_count=0)
    drawer = game_manager.get_current_drawer(room_code)
    room.game_state = GameState.DRAWING

    await sio.emit(
        "word_selected",
        {
            "hint": hint,
            "word_length": len(word),
            "drawer_id": drawer.id if drawer else None,
        },
        room=room_code,
    )

    if drawer:
        drawer_sid = player_to_sid.get(drawer.id)
        if drawer_sid:
            await sio.emit("word_to_draw", {"word": word}, to=drawer_sid)

    # Cancel the watchdog timer (WORD_CHOICE + ROUND), replace with just ROUND timer
    _cancel_round_timer(room_code)
    _start_round_timer(room_code, ROUND_DURATION)
    logger.info(f"[_begin_drawing_phase] Drawing started for room {room_code}, word='{word}'")


async def _end_round(room_code: str):
    """Called when timer expires OR all players guessed correctly."""
    logger.info(f"[_end_round] Entry for room {room_code}")
    room = game_manager.get_room(room_code)
    if not room:
        logger.warning(f"[_end_round] Room {room_code} not found")
        return

    logger.info(f"[_end_round] state={room.game_state}, round={room.round_number}/{room.max_rounds}")

    # Already at game end — nothing to do
    if room.game_state == GameState.GAME_END:
        logger.warning(f"[_end_round] Already GAME_END for {room_code}")
        return

    # Dedup: only one _end_round runs at a time per room
    if round_ending.get(room_code):
        logger.warning(f"[_end_round] Already ending for {room_code}, skipping duplicate")
        return
    round_ending[room_code] = True

    try:
        # Cancel all running timers immediately
        _cancel_word_choice(room_code)
        _cancel_round_timer(room_code)

        correct_word = room.current_word or "?"
        leaderboard = [
            {"id": p.id, "name": p.name, "avatar": p.avatar, "score": p.score}
            for p in game_manager.get_leaderboard(room_code)
        ]

        # Transition to ROUND_END so timer and draw events are ignored
        room.game_state = GameState.ROUND_END

        await sio.emit(
            "round_ended",
            {"word": correct_word, "leaderboard": leaderboard},
            room=room_code,
        )
        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"⏱️ Round over! The word was '{correct_word}'."},
            room=room_code,
        )

        await asyncio.sleep(3)  # show leaderboard briefly

        # Advance game state
        advanced, _ = game_manager.next_turn(room_code)
        logger.info(f"[_end_round] next_turn returned advanced={advanced} for {room_code}")

        if not advanced:
            # All rounds done → game over
            room = game_manager.get_room(room_code)
            if room:
                room.game_state = GameState.GAME_END
            final_board = leaderboard
            await sio.emit(
                "game_ended",
                {"leaderboard": final_board, "winner": final_board[0] if final_board else None},
                room=room_code,
            )
            await sio.emit(
                "chat_message",
                {"type": "system", "content": "🏆 Game over! Thanks for playing SketchRush!"},
                room=room_code,
            )
            await sio.emit("round_countdown", {"countdown": 0}, room=room_code)
            return

        # Clear canvas for everyone
        await sio.emit("canvas_cleared", {}, room=room_code)

        # 5-second countdown before next turn
        for countdown in range(5, 0, -1):
            await sio.emit("round_countdown", {"countdown": countdown}, room=room_code)
            await asyncio.sleep(1)

        # Signal countdown done — frontend clears the modal
        await sio.emit("round_countdown", {"countdown": 0}, room=room_code)

        # Small buffer so clients process the countdown=0 before turn_started arrives
        await asyncio.sleep(0.3)

        # Clear dedup flag BEFORE starting next turn
        round_ending.pop(room_code, None)

        logger.info(f"[_end_round] Starting next turn for room {room_code}")
        await _start_turn(room_code)
        logger.info(f"[_end_round] _start_turn complete for room {room_code}")

    except asyncio.CancelledError:
        logger.warning(f"[_end_round] CancelledError for room {room_code}")
        raise
    except Exception as e:
        logger.exception(f"[_end_round] Exception during transition: {e}")
        await sio.emit(
            "error",
            {"message": "Round transition failed. Please restart the game."},
            room=room_code,
        )
        await sio.emit("round_countdown", {"countdown": 0}, room=room_code)
    finally:
        round_ending.pop(room_code, None)


# Register timeout callback on game_manager (kept for compatibility)
async def _on_round_timeout(room_code: str):
    await _end_round(room_code)

game_manager.on_round_timeout = _on_round_timeout


# ── Event handlers ────────────────────────────────────────────────────────────

def create_socket_app(other_asgi_app=None):
    """Wire all Socket.IO events and return the ASGI app."""

    @sio.event
    async def connect(sid, environ):
        player_id = str(uuid.uuid4())
        sid_to_player[sid] = player_id
        player_to_sid[player_id] = sid
        logger.info(f"Client connected: sid={sid} player_id={player_id}")
        await sio.emit("connected", {"player_id": player_id}, to=sid)

    @sio.event
    async def disconnect(sid):
        player_id = sid_to_player.pop(sid, None)
        if player_id:
            player_to_sid.pop(player_id, None)

        room_code = sid_to_room.pop(sid, None)
        if room_code:
            room = game_manager.get_room(room_code)
            player_name = "Unknown"
            was_host = False
            was_drawer = False
            if room:
                player = game_manager.get_player(room_code, player_id)
                if player:
                    player_name = player.name
                was_host = room_creator.get(room_code, room.host_id) == player_id
                drawer = game_manager.get_current_drawer(room_code)
                was_drawer = drawer is not None and drawer.id == player_id

            game_manager.remove_player_from_room(room_code, player_id)

            # Clean up room state if the room was deleted (last player left)
            if not game_manager.get_room(room_code):
                _cleanup_room_state(room_code)

            await sio.emit(
                "player_left",
                {"player_id": player_id, "player_name": player_name},
                room=room_code,
            )
            await sio.emit(
                "chat_message",
                {"type": "system", "content": f"👋 {player_name} left the game."},
                room=room_code,
            )
            await _handle_player_leave(room_code, player_name, was_host, was_drawer)

        logger.info(f"Client disconnected: sid={sid}")

    # ── Room ──────────────────────────────────────────────────────────────────

    @sio.event
    async def join_room(sid, data):
        try:
            raw_code   = data.get("room", "").strip().upper()
            player_name = data.get("playerName", "Anonymous")[:16]
            avatar     = data.get("avatar", "🦊")
            player_id  = sid_to_player.get(sid)

            if not player_id:
                await sio.emit("error", {"message": "Not identified. Reconnect."}, to=sid)
                return

            # Create room if it doesn't exist — first joiner is always the creator/host
            if not game_manager.get_room(raw_code):
                game_manager.create_room(player_id, room_code=raw_code)
                room_creator[raw_code] = player_id  # lock in the original creator
                logger.info(f"[join_room] Room {raw_code} created by player {player_id}")

            if not game_manager.add_player_to_room(raw_code, player_id, player_name, avatar):
                await sio.emit("error", {"message": "Room is full or already joined."}, to=sid)
                return

            sid_to_room[sid] = raw_code
            await sio.enter_room(sid, raw_code)

            room = game_manager.get_room(raw_code)
            # is_host: only the original creator is host
            creator_id = room_creator.get(raw_code, room.host_id)
            is_host = creator_id == player_id

            await sio.emit(
                "room_joined",
                {
                    "room_code": raw_code,
                    "player_id": player_id,
                    "is_host": is_host,
                    "host_id": creator_id,
                    "players": [
                        {"id": p.id, "name": p.name, "avatar": p.avatar, "score": p.score}
                        for p in room.players
                    ],
                    "game_state": room.game_state,
                },
                to=sid,
            )

            await sio.emit(
                "player_joined",
                {"player_id": player_id, "player_name": player_name, "avatar": avatar},
                room=raw_code,
                skip_sid=sid,
            )
            await sio.emit(
                "chat_message",
                {"type": "system", "content": f"🎮 {player_name} joined the room!"},
                room=raw_code,
            )
            await _broadcast_players(raw_code)
            logger.info(f"Player {player_name} joined room {raw_code}")

        except Exception as e:
            logger.exception("join_room error")
            await sio.emit("error", {"message": str(e)}, to=sid)

    @sio.event
    async def leave_room(sid, data=None):
        room_code = sid_to_room.pop(sid, None)
        player_id = sid_to_player.get(sid)
        if room_code and player_id:
            player = game_manager.get_player(room_code, player_id)
            name = player.name if player else "Player"
            room = game_manager.get_room(room_code)
            was_host = (room_creator.get(room_code, room.host_id) == player_id) if room else False
            drawer = game_manager.get_current_drawer(room_code) if room else None
            was_drawer = drawer is not None and drawer.id == player_id
            game_manager.remove_player_from_room(room_code, player_id)
            # Clean up room state if room was deleted
            if not game_manager.get_room(room_code):
                _cleanup_room_state(room_code)
            await sio.leave_room(sid, room_code)
            await sio.emit("player_left", {"player_id": player_id}, room=room_code)
            await sio.emit(
                "chat_message",
                {"type": "system", "content": f"👋 {name} left the game."},
                room=room_code,
            )
            await _handle_player_leave(room_code, name, was_host, was_drawer)

    # ── Game ──────────────────────────────────────────────────────────────────

    @sio.event
    async def start_game(sid, data=None):
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not isinstance(data, dict):
            data = {}
        logger.info(f"[start_game] Called by {player_id} in room {room_code}, data={data}")
        if not room_code:
            return

        room = game_manager.get_room(room_code)
        if not room:
            return

        # Only the original creator (host) can start
        creator_id = room_creator.get(room_code, room.host_id)
        if creator_id != player_id:
            await sio.emit("error", {"message": "Only the host (room creator) can start the game."}, to=sid)
            return

        # max_rounds MUST be provided — host is required to select it
        max_rounds = data.get("max_rounds")
        if not max_rounds or not isinstance(max_rounds, int) or not (1 <= max_rounds <= 10):
            await sio.emit("error", {"message": "Please select the number of rounds (1–10) before starting."}, to=sid)
            return
        room.max_rounds = max_rounds
        logger.info(f"[start_game] Set max_rounds={max_rounds} for room {room_code}")

        if not game_manager.start_game(room_code):
            await sio.emit("error", {"message": "Not enough players (need at least 2)."}, to=sid)
            return

        logger.info(f"[start_game] Game started for room {room_code} with {room.max_rounds} rounds")
        await sio.emit("game_started", {"room_code": room_code}, room=room_code)
        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"⚡ Game started! {room.max_rounds} rounds! Let's go!"},
            room=room_code,
        )
        await _start_turn(room_code)

    @sio.event
    async def restart_game(sid, data=None):
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not isinstance(data, dict):
            data = {}
        logger.info(f"[restart_game] Called by {player_id} in room {room_code}")
        if not room_code:
            return

        room = game_manager.get_room(room_code)
        if not room:
            return

        # Only the original creator (host) can restart
        creator_id = room_creator.get(room_code, room.host_id)
        if creator_id != player_id:
            await sio.emit("error", {"message": "Only the host (room creator) can restart the game."}, to=sid)
            return

        # Cancel any ongoing timers
        _cancel_round_timer(room_code)
        _cancel_word_choice(room_code)
        round_ending.pop(room_code, None)

        max_rounds = data.get("max_rounds", room.max_rounds)
        if max_rounds and isinstance(max_rounds, int) and 1 <= max_rounds <= 10:
            room.max_rounds = max_rounds

        for p in room.players:
            p.score = 0
            p.is_drawing = False

        room.game_state = GameState.DRAWING
        room.round_number = 1
        room.current_drawer_index = 0
        room.current_word = None
        room.word_choices = None

        logger.info(f"[restart_game] Restarted room {room_code} with {room.max_rounds} rounds")
        await sio.emit("canvas_cleared", {}, room=room_code)
        await _broadcast_players(room_code)
        await sio.emit("game_started", {"room_code": room_code}, room=room_code)
        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"🔄 Game restarted! {room.max_rounds} rounds! Let's go again!"},
            room=room_code,
        )
        await _start_turn(room_code)

    @sio.event
    async def request_next_turn(sid, data=None):
        """Host can manually skip the current turn."""
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code:
            return
        room = game_manager.get_room(room_code)
        if room and room.host_id == player_id:
            await _end_round(room_code)

    @sio.event
    async def select_word(sid, data=None):
        """Drawer selects a word from the 4 choices."""
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code or not data:
            logger.warning("[select_word] Missing room_code or data")
            return

        logger.info(f"[select_word] Player {player_id} selecting word in room {room_code}")
        room = game_manager.get_room(room_code)
        drawer = game_manager.get_current_drawer(room_code)

        if not drawer or drawer.id != player_id:
            logger.warning(f"[select_word] Unauthorised — drawer={drawer.id if drawer else None}, player={player_id}")
            await sio.emit("error", {"message": "Only the drawer can select a word."}, to=sid)
            return

        selected_word = data.get("word", "")
        logger.info(f"[select_word] Attempting to select: '{selected_word}'")
        if not game_manager.select_word_from_choices(room_code, selected_word):
            logger.warning(f"[select_word] Invalid word selection: '{selected_word}'")
            await sio.emit("error", {"message": "Invalid word selection."}, to=sid)
            return

        # Cancel the auto-pick timer — drawer chose manually
        _cancel_word_choice(room_code)

        logger.info(f"[select_word] Word selected. Starting drawing phase for room {room_code}")
        await _begin_drawing_phase(room_code)

        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"🎨 {drawer.name} has chosen! Start guessing!"},
            room=room_code,
        )

    # ── Drawing ───────────────────────────────────────────────────────────────

    @sio.event
    async def draw(sid, data):
        """Broadcast a drawing stroke to all other players."""
        room_code = sid_to_room.get(sid)
        if not room_code:
            return
        if not isinstance(data, dict):
            return
        player_id = sid_to_player.get(sid)
        room = game_manager.get_room(room_code)
        if not room or room.game_state != GameState.DRAWING:
            return
        drawer = game_manager.get_current_drawer(room_code)
        if not drawer or drawer.id != player_id:
            return
        await sio.emit("draw", data, room=room_code, skip_sid=sid)

    @sio.event
    async def clear_canvas(sid, data=None):
        room_code = sid_to_room.get(sid)
        if not room_code:
            return
        player_id = sid_to_player.get(sid)
        room = game_manager.get_room(room_code)
        if not room or room.game_state != GameState.DRAWING:
            return
        drawer = game_manager.get_current_drawer(room_code)
        if not drawer or drawer.id != player_id:
            return
        await sio.emit("canvas_cleared", {}, room=room_code)

    # ── Chat & Guessing ───────────────────────────────────────────────────────

    @sio.event
    async def guess(sid, data):
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code or not player_id:
            return
        if not isinstance(data, dict):
            return

        word = data.get("word", "").strip()
        if not word:
            return

        room   = game_manager.get_room(room_code)
        player = game_manager.get_player(room_code, player_id)
        if not room or not player:
            return

        logger.info(f"[guess] {player.name} guessed '{word}' state={room.game_state}")

        if room.game_state != GameState.DRAWING:
            return

        drawer = game_manager.get_current_drawer(room_code)
        if drawer and drawer.id == player_id:
            return  # drawer can't guess

        if player_id in round_correct.get(room_code, set()):
            return  # already guessed correctly

        is_correct = game_manager.check_guess(room_code, word)

        if is_correct:
            time_left = room_time_left.get(room_code, ROUND_DURATION)
            points    = game_manager.award_guess_points(room_code, player_id, time_left, ROUND_DURATION)
            round_correct.setdefault(room_code, set()).add(player_id)
            logger.info(f"[guess] Correct! {player.name} +{points}pts, correct={len(round_correct[room_code])}")

            await sio.emit(
                "correct_guess",
                {
                    "player_id": player_id,
                    "player_name": player.name,
                    "player_avatar": player.avatar,
                    "points": points,
                    "word": room.current_word,
                },
                room=room_code,
            )
            await sio.emit(
                "chat_message",
                {
                    "type": "correct",
                    "player": player.name,
                    "avatar": player.avatar,
                    "content": word,
                    "points": points,
                },
                room=room_code,
            )
            await _broadcast_players(room_code)

            # End round early if all non-drawers guessed correctly
            non_drawers = [p for p in room.players if not p.is_drawing]
            correct_count = len(round_correct.get(room_code, set()))
            logger.info(f"[guess] {correct_count}/{len(non_drawers)} non-drawers correct")
            if correct_count >= len(non_drawers):
                logger.info(f"[guess] All guessed! Ending round early for {room_code}")
                await _end_round(room_code)
        else:
            await sio.emit(
                "chat_message",
                {
                    "type": "message",
                    "player": player.name,
                    "avatar": player.avatar,
                    "content": word,
                },
                room=room_code,
            )

    @sio.event
    async def message(sid, data):
        """Plain chat message (non-guess)."""
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code or not player_id:
            return
        if not isinstance(data, dict):
            return

        player = game_manager.get_player(room_code, player_id)
        if not player:
            return

        text = str(data.get("text", "")).strip()[:200]
        if not text:
            return

        await sio.emit(
            "chat_message",
            {
                "type": "message",
                "player": player.name,
                "avatar": player.avatar,
                "content": text,
            },
            room=room_code,
        )

    return ASGIApp(sio, other_asgi_app)


def get_sio():
    return sio
