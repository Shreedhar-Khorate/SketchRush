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


async def _start_turn(room_code: str):
    """Set up a new drawing turn and notify all clients."""
    room = game_manager.get_room(room_code)
    if not room:
        return

    word = game_manager.select_word(room_code)
    drawer = game_manager.get_current_drawer(room_code)
    game_manager.mark_drawer(room_code)
    round_correct[room_code] = set()
    room_time_left[room_code] = ROUND_DURATION

    hint = game_manager.build_hint(word, reveal_count=0)

    # Notify everyone about who is drawing (but not the word)
    await sio.emit(
        "turn_started",
        {
            "drawer_id": drawer.id,
            "drawer_name": drawer.name,
            "drawer_avatar": drawer.avatar,
            "round": room.round_number,
            "max_rounds": room.max_rounds,
            "hint": hint,
            "time": ROUND_DURATION,
        },
        room=room_code,
    )

    # Send the actual word only to the drawer
    drawer_sid = player_to_sid.get(drawer.id)
    if drawer_sid:
        await sio.emit("word_to_draw", {"word": word}, to=drawer_sid)

    # System chat message
    await sio.emit(
        "chat_message",
        {
            "type": "system",
            "content": f"🎨 {drawer.name} is drawing! Start guessing!",
        },
        room=room_code,
    )

    await _broadcast_players(room_code)

    # Start countdown timer
    game_manager.start_round_timer(room_code, ROUND_DURATION)

    # Also run a coroutine that ticks time updates
    asyncio.create_task(_tick_timer(room_code, ROUND_DURATION))


async def _tick_timer(room_code: str, duration: int):
    """Emit timer ticks each second until round ends."""
    for t in range(duration, -1, -1):
        room = game_manager.get_room(room_code)
        if not room or room.game_state == GameState.GAME_END:
            break
        room_time_left[room_code] = t
        await sio.emit("timer_tick", {"time": t}, room=room_code)

        # Reveal a letter at half-time and quarter-time
        if room.current_word:
            if t == duration // 2:
                hint = game_manager.build_hint(room.current_word, reveal_count=1)
                await sio.emit("hint_update", {"hint": hint}, room=room_code)
            elif t == duration // 4:
                hint = game_manager.build_hint(room.current_word, reveal_count=2)
                await sio.emit("hint_update", {"hint": hint}, room=room_code)

        if t == 0:
            break
        await asyncio.sleep(1)


async def _end_round(room_code: str):
    """Called when round timer expires or all players guessed."""
    room = game_manager.get_room(room_code)
    if not room:
        return

    correct_word = room.current_word or "?"
    leaderboard = [
        {"id": p.id, "name": p.name, "avatar": p.avatar, "score": p.score}
        for p in game_manager.get_leaderboard(room_code)
    ]

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

    await asyncio.sleep(4)  # show leaderboard briefly

    advanced = game_manager.next_turn(room_code)
    if advanced:
        await sio.emit("canvas_cleared", {}, room=room_code)
        await _start_turn(room_code)
    else:
        # Game over
        room = game_manager.get_room(room_code)
        if room:
            room.game_state = GameState.GAME_END
        final_board = leaderboard  # already sorted
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
            if room:
                player = game_manager.get_player(room_code, player_id)
                if player:
                    player_name = player.name

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
            await _broadcast_players(room_code)

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
            game_manager.remove_player_from_room(room_code, player_id)
            await sio.leave_room(sid, room_code)
            await sio.emit("player_left", {"player_id": player_id}, room=room_code)
            await sio.emit(
                "chat_message",
                {"type": "system", "content": f"👋 {name} left the game."},
                room=room_code,
            )
            await _broadcast_players(room_code)

    # ── Game ──────────────────────────────────────────────────────────────────

    @sio.event
    async def start_game(sid, data=None):
        room_code = sid_to_room.get(sid)
        player_id = sid_to_player.get(sid)
        if not room_code:
            return

        room = game_manager.get_room(room_code)
        if not room:
            return
        if room.host_id != player_id:
            await sio.emit("error", {"message": "Only the host can start the game."}, to=sid)
            return

        if not game_manager.start_game(room_code):
            await sio.emit("error", {"message": "Not enough players (need at least 2)."}, to=sid)
            return

        await sio.emit("game_started", {"room_code": room_code}, room=room_code)
        await sio.emit(
            "chat_message",
            {"type": "system", "content": "⚡ Game started! Let's go!"},
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
        drawer = game_manager.get_current_drawer(room_code)
        if drawer and drawer.id != player_id:
            return  # not the drawer
        await sio.emit("draw", data, room=room_code, skip_sid=sid)

    @sio.event
    async def clear_canvas(sid, data=None):
        room_code = sid_to_room.get(sid)
        if not room_code:
            return
        player_id = sid_to_player.get(sid)
        drawer = game_manager.get_current_drawer(room_code)
        if drawer and drawer.id != player_id:
            return
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

        def _on_draw(x_norm, y_norm, color, size, is_eraser):
            """Called by air_canvas on each gesture-drawn point."""
            asyncio.run_coroutine_threadsafe(
                sio.emit(
                    "draw",
                    {
                        "x": x_norm,
                        "y": y_norm,
                        "color": color,
                        "size": size,
                        "isEraser": is_eraser,
                        "mode": "gesture",
                    },
                    room=room_code,
                ),
                asyncio.get_event_loop(),
            )

        def _on_clear():
            asyncio.run_coroutine_threadsafe(
                sio.emit("canvas_cleared", {}, room=room_code),
                asyncio.get_event_loop(),
            )

        def _on_gesture(gesture_name):
            asyncio.run_coroutine_threadsafe(
                sio.emit("gesture_detected", {"gesture": gesture_name}, to=sid),
                asyncio.get_event_loop(),
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
