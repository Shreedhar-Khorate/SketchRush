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
from app.gesture.air_canvas import air_canvas

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
# room_code → asyncio task tracking time remaining
room_time_left: dict[str, int] = {}

ROUND_DURATION = 60  # seconds
LEAVE_BONUS_POINTS = 50


# ── Helpers ───────────────────────────────────────────────────────────────────

async def _broadcast_players(room_code: str):
    """Emit updated player list to everyone in the room."""
    room = game_manager.get_room(room_code)
    if not room:
        return
    await sio.emit(
        "players_update",
        {
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


async def _handle_player_leave(room_code: str, player_name: str, was_host: bool, was_drawer: bool):
    room = game_manager.get_room(room_code)
    if not room:
        return

    # Reassign host if needed
    if was_host and room.players:
        new_host = room.players[0]
        room.host_id = new_host.id
        await sio.emit("host_changed", {"host_id": new_host.id}, room=room_code)
        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"👑 {new_host.name} is now the host."},
            room=room_code,
        )

    # If fewer than 2 players remain, pause the game
    if len(room.players) < 2:
        room.game_state = GameState.WAITING
        await sio.emit(
            "chat_message",
            {"type": "system", "content": "⏸️ Not enough players — waiting for more to join."},
            room=room_code,
        )
        await _broadcast_players(room_code)
        return

    # Award same bonus points to remaining players
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

    # If the drawer left mid-turn, skip to the next drawer immediately
    if was_drawer and room.players and room.game_state in (GameState.DRAWING, GameState.CHOOSING_WORD):
        air_canvas.stop_capture()
        air_canvas.on_draw_point = None
        air_canvas.on_clear = None
        air_canvas.on_gesture = None

        await sio.emit("canvas_cleared", {}, room=room_code)

        advanced, _ = game_manager.next_turn(room_code)
        if advanced:
            await _start_turn(room_code)
        else:
            room.game_state = GameState.GAME_END
            final_board = [
                {"id": p.id, "name": p.name, "avatar": p.avatar, "score": p.score}
                for p in game_manager.get_leaderboard(room_code)
            ]
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


async def _start_turn(room_code: str):
    """Set up a new drawing turn and notify all clients to choose a word."""
    logger.info(f"[_start_turn] Starting turn for room {room_code}")
    room = game_manager.get_room(room_code)
    if not room:
        logger.error(f"[_start_turn] Room {room_code} not found")
        return
    if len(room.players) < 2:
        room.game_state = GameState.WAITING
        await sio.emit(
            "chat_message",
            {"type": "system", "content": "⏸️ Waiting for at least 2 players to start."},
            room=room_code,
        )
        await _broadcast_players(room_code)
        return

    # Generate 4 word choices for the drawer
    word_choices = game_manager.get_word_choices(room_code)  # sets CHOOSING_WORD state
    drawer = game_manager.get_current_drawer(room_code)
    logger.info(f"[_start_turn] Current drawer: {drawer.id if drawer else 'NONE'}, Players count: {len(room.players)}, Current index: {room.current_drawer_index}")
    
    game_manager.mark_drawer(room_code)
    round_correct[room_code] = set()
    room_time_left[room_code] = ROUND_DURATION

    if not drawer:
        logger.error(f"[_start_turn] No drawer found for room {room_code}")
        return

    logger.info(f"[_start_turn] Emitting turn_started for {drawer.name}")
    # Notify everyone about who is drawing (state = choosing_word)
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

    # Send the 4 word choices only to the drawer
    drawer_sid = player_to_sid.get(drawer.id)
    if drawer_sid:
        await sio.emit("word_choices", {"choices": word_choices}, to=drawer_sid)
    else:
        # Drawer disconnected — auto-pick first word
        logger.warning(f"[_start_turn] Drawer SID not found, auto-selecting word")
        if word_choices:
            game_manager.select_word_from_choices(room_code, word_choices[0])
            selected_word = room.current_word
            hint = game_manager.build_hint(selected_word, reveal_count=0)

            # Notify all players that word was selected and drawing can begin
            await sio.emit(
                "word_selected",
                {
                    "hint": hint,
                    "word_length": len(selected_word),
                    "drawer_id": drawer.id,
                },
                room=room_code,
            )

            # Start the round timer (async task — calls _end_round on timeout)
            game_manager.start_round_timer(room_code, ROUND_DURATION)

            # Also run timer tick coroutine for UI countdown
            asyncio.create_task(_tick_timer(room_code, ROUND_DURATION))

    # System chat message
    await sio.emit(
        "chat_message",
        {
            "type": "system",
            "content": f"🎨 {drawer.name} is choosing a word to draw!",
        },
        room=room_code,
    )

    await _broadcast_players(room_code)


async def _tick_timer(room_code: str, duration: int):
    """Emit timer ticks each second until round ends."""
    for t in range(duration, -1, -1):
        room = game_manager.get_room(room_code)
        if not room or room.game_state not in (GameState.DRAWING,):
            break
        room_time_left[room_code] = t
        await sio.emit("timer_tick", {"time": t}, room=room_code)

        if t == 0:
            break
        await asyncio.sleep(1)


async def _end_round(room_code: str):
    """Called when round timer expires or all players guessed."""
    room = game_manager.get_room(room_code)
    if not room:
        return

    # Guard: don't end a round that's already ended
    if room.game_state in (GameState.GAME_END,):
        return

    correct_word = room.current_word or "?"
    leaderboard = [
        {"id": p.id, "name": p.name, "avatar": p.avatar, "score": p.score}
        for p in game_manager.get_leaderboard(room_code)
    ]

    # Stop gesture/webcam capture for the current drawer
    air_canvas.stop_capture()
    air_canvas.on_draw_point = None
    air_canvas.on_clear = None
    air_canvas.on_gesture = None

    # Set state to ROUND_END to stop timer ticks
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

    await asyncio.sleep(3)  # show leaderboard

    advanced, round_completed = game_manager.next_turn(room_code)
    if advanced:
        # Clear canvas for all players between turns
        await sio.emit("canvas_cleared", {}, room=room_code)

        if round_completed:
            # 5-second countdown before the next round
            for countdown in range(5, 0, -1):
                await sio.emit(
                    "round_countdown",
                    {"countdown": countdown},
                    room=room_code,
                )
                await asyncio.sleep(1)

            # Signal countdown done
            await sio.emit("round_countdown", {"countdown": 0}, room=room_code)

        await _start_turn(room_code)
    else:
        # Game over
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


# Register timeout callback on game_manager
async def _on_round_timeout(room_code: str):
    await _end_round(room_code)

game_manager.on_round_timeout = _on_round_timeout


# ── Event handlers ────────────────────────────────────────────────────────────

def create_socket_app():
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
                was_host = room.host_id == player_id
                drawer = game_manager.get_current_drawer(room_code)
                was_drawer = drawer is not None and drawer.id == player_id

            game_manager.remove_player_from_room(room_code, player_id)

            # Notify room
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
            raw_code  = data.get("room", "").strip().upper()
            player_name = data.get("playerName", "Anonymous")[:16]
            avatar    = data.get("avatar", "🦊")
            player_id = sid_to_player.get(sid)

            if not player_id:
                await sio.emit("error", {"message": "Not identified. Reconnect."}, to=sid)
                return

            # Create room if needed
            if not game_manager.get_room(raw_code):
                game_manager.create_room(player_id, room_code=raw_code)

            if not game_manager.add_player_to_room(raw_code, player_id, player_name, avatar):
                await sio.emit("error", {"message": "Room is full or already joined."}, to=sid)
                return

            sid_to_room[sid] = raw_code
            await sio.enter_room(sid, raw_code)

            room = game_manager.get_room(raw_code)
            is_host = room.host_id == player_id

            await sio.emit(
                "room_joined",
                {
                    "room_code": raw_code,
                    "player_id": player_id,
                    "is_host": is_host,
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
            was_host = room.host_id == player_id if room else False
            drawer = game_manager.get_current_drawer(room_code) if room else None
            was_drawer = drawer is not None and drawer.id == player_id
            game_manager.remove_player_from_room(room_code, player_id)
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
        data = data or {}
        logger.info(f"[start_game] Called by player {player_id} in room {room_code}, data: {data}")
        if not room_code:
            return

        room = game_manager.get_room(room_code)
        if not room:
            return
        if room.host_id != player_id:
            await sio.emit("error", {"message": "Only the host can start the game."}, to=sid)
            return

        # Set max_rounds if provided
        max_rounds = data.get('max_rounds')
        if max_rounds and isinstance(max_rounds, int) and 1 <= max_rounds <= 10:
            room.max_rounds = max_rounds
            logger.info(f"[start_game] Set max_rounds to {max_rounds} for room {room_code}")

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
        data = data or {}
        logger.info(f"[restart_game] Called by player {player_id} in room {room_code}, data: {data}")
        if not room_code:
            return

        room = game_manager.get_room(room_code)
        if not room:
            return
        if room.host_id != player_id:
            await sio.emit("error", {"message": "Only the host can restart the game."}, to=sid)
            return

        # Reset game state
        max_rounds = data.get('max_rounds', room.max_rounds)
        if max_rounds and isinstance(max_rounds, int) and 1 <= max_rounds <= 10:
            room.max_rounds = max_rounds

        # Reset all players' scores and drawing state
        for p in room.players:
            p.score = 0
            p.is_drawing = False

        room.game_state = GameState.DRAWING
        room.round_number = 1
        room.current_drawer_index = 0
        room.current_word = None
        room.word_choices = None

        logger.info(f"[restart_game] Game restarted for room {room_code} with {room.max_rounds} rounds")
        
        # Clear canvas for all players
        await sio.emit("canvas_cleared", {}, room=room_code)
        
        # Broadcast updated players
        await _broadcast_players(room_code)
        
        # Emit game started event
        await sio.emit("game_started", {"room_code": room_code}, room=room_code)
        await sio.emit(
            "chat_message",
            {"type": "system", "content": f"🔄 Game restarted! {room.max_rounds} rounds! Let's go again!"},
            room=room_code,
        )
        await _start_turn(room_code)

    @sio.event
    async def request_next_turn(sid, data=None):
        """Host can manually skip turn."""
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
            return
        
        room = game_manager.get_room(room_code)
        drawer = game_manager.get_current_drawer(room_code)
        
        # Only the drawer can select a word
        if not drawer or drawer.id != player_id:
            await sio.emit("error", {"message": "Only the drawer can select a word."}, to=sid)
            return
        
        selected_word = data.get("word", "")
        if not game_manager.select_word_from_choices(room_code, selected_word):
            await sio.emit("error", {"message": "Invalid word selection."}, to=sid)
            return
        
        # Word is now selected, build hint and start the round
        word = room.current_word
        hint = game_manager.build_hint(word, reveal_count=0)

        # Notify all players that word was selected and drawing can begin
        await sio.emit(
            "word_selected",
            {
                "hint": hint,
                "word_length": len(word),
                "drawer_id": drawer.id,
            },
            room=room_code,
        )

        # Send the actual word to the drawer only
        drawer_sid = player_to_sid.get(drawer.id)
        if drawer_sid:
            await sio.emit("word_to_draw", {"word": word}, to=drawer_sid)

        # Update chat
        await sio.emit(
            "chat_message",
            {
                "type": "system",
                "content": f"🎨 {drawer.name} has chosen! Start guessing!",
            },
            room=room_code,
        )

        # Start the round timer (async task — calls _end_round on timeout)
        game_manager.start_round_timer(room_code, ROUND_DURATION)

        # Also run timer tick coroutine for UI countdown
        asyncio.create_task(_tick_timer(room_code, ROUND_DURATION))

    # ── Drawing ───────────────────────────────────────────────────────────────

    @sio.event
    async def draw(sid, data):
        """
        Broadcast a drawing stroke segment to all other players.
        data: { x, y, prevX, prevY, color, size, isEraser, mode }
        """
        room_code = sid_to_room.get(sid)
        if not room_code:
            return
        # Only allow the current drawer to draw
        player_id = sid_to_player.get(sid)
        room = game_manager.get_room(room_code)
        if not room or room.game_state != GameState.DRAWING:
            return  # Game not in drawing state
        drawer = game_manager.get_current_drawer(room_code)
        if not drawer or drawer.id != player_id:
            return  # not the drawer
        await sio.emit("draw", data, room=room_code, skip_sid=sid)

    @sio.event
    async def clear_canvas(sid, data=None):
        room_code = sid_to_room.get(sid)
        if not room_code:
            return
        player_id = sid_to_player.get(sid)
        room = game_manager.get_room(room_code)
        if not room or room.game_state != GameState.DRAWING:
            return  # Game not in drawing state
        drawer = game_manager.get_current_drawer(room_code)
        if not drawer or drawer.id != player_id:
            return  # not the drawer
        await sio.emit("canvas_cleared", {}, room=room_code)

    # ── Chat & Guessing ───────────────────────────────────────────────────────

    @sio.event
    async def guess(sid, data):
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code or not player_id:
            return

        word = data.get("word", "").strip()
        if not word:
            return

        room   = game_manager.get_room(room_code)
        player = game_manager.get_player(room_code, player_id)
        if not room or not player:
            return

        # Only allow guessing during DRAWING state
        if room.game_state != GameState.DRAWING:
            return

        # Drawer cannot guess
        drawer = game_manager.get_current_drawer(room_code)
        if drawer and drawer.id == player_id:
            return

        # Already guessed correctly?
        if player_id in round_correct.get(room_code, set()):
            return

        is_correct = game_manager.check_guess(room_code, word)

        if is_correct:
            time_left = room_time_left.get(room_code, ROUND_DURATION)
            points    = game_manager.award_guess_points(room_code, player_id, time_left, ROUND_DURATION)
            round_correct.setdefault(room_code, set()).add(player_id)

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

            # If everyone (except drawer) guessed → end round early
            non_drawers = [p for p in room.players if not p.is_drawing]
            if len(round_correct.get(room_code, set())) >= len(non_drawers):
                await _end_round(room_code)
        else:
            # Broadcast as normal chat
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

    # ── Gesture / Air Canvas ─────────────────────────────────────────────────

    @sio.event
    async def start_gesture(sid, data=None):
        """Client requests gesture mode — start webcam capture."""
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code or not player_id:
            return

        # Only the drawer can use gesture
        drawer = game_manager.get_current_drawer(room_code)
        if not drawer or drawer.id != player_id:
            await sio.emit("error", {"message": "Only the drawer can use gesture mode."}, to=sid)
            return

        # Capture the event loop BEFORE starting the background thread
        loop = asyncio.get_event_loop()

        # Track previous point for gesture drawing to create proper line segments
        prev_point = {"x": None, "y": None}

        def _on_draw(x_norm, y_norm, color, size, is_eraser):
            """Called by air_canvas on each gesture-drawn point."""
            asyncio.run_coroutine_threadsafe(
                sio.emit(
                    "draw",
                    {
                        "x": x_norm,
                        "y": y_norm,
                        "prevX": prev_point["x"],
                        "prevY": prev_point["y"],
                        "color": color,
                        "size": size,
                        "isEraser": is_eraser,
                        "mode": "gesture",
                    },
                    room=room_code,
                ),
                loop,
            )
            # Update previous point for next call
            prev_point["x"] = x_norm
            prev_point["y"] = y_norm

        def _on_clear():
            asyncio.run_coroutine_threadsafe(
                sio.emit("canvas_cleared", {}, room=room_code),
                loop,
            )

        def _on_gesture(gesture_name):
            # Reset previous point when gesture changes to prevent line artifacts
            if gesture_name != "draw":
                prev_point["x"] = None
                prev_point["y"] = None
            asyncio.run_coroutine_threadsafe(
                sio.emit("gesture_detected", {"gesture": gesture_name}, to=sid),
                loop,
            )

        air_canvas.on_draw_point = _on_draw
        air_canvas.on_clear      = _on_clear
        air_canvas.on_gesture    = _on_gesture
        air_canvas.start_capture()

        await sio.emit("gesture_started", {"status": "ok", "active": air_canvas.active}, to=sid)

    @sio.event
    async def stop_gesture(sid, data=None):
        """Stop gesture/webcam capture."""
        air_canvas.stop_capture()
        await sio.emit("gesture_stopped", {}, to=sid)

    @sio.event
    async def gesture_color(sid, data):
        """Update drawing color for air canvas."""
        color = data.get("color", "#1a1a2e")
        air_canvas.set_color(color)

    @sio.event
    async def gesture_brush_size(sid, data):
        """Update brush size for air canvas."""
        size = int(data.get("size", 5))
        air_canvas.set_brush_size(size)

    @sio.event
    async def gesture_eraser(sid, data):
        """Toggle eraser mode for air canvas."""
        enabled = bool(data.get("enabled", False))
        air_canvas.set_eraser(enabled)

    return ASGIApp(sio)


def get_sio():
    return sio
