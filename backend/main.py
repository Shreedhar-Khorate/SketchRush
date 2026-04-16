"""
SketchRush FastAPI + Socket.IO server entry point.

REST Endpoints:
  GET  /              → health check
  GET  /health        → health check
  GET  /rooms         → list active rooms
  GET  /rooms/{code}  → room detail
  GET  /gesture/feed  → MJPEG webcam + canvas stream
  GET  /gesture/status → get gesture mode status
  GET  /gesture/canvas → get current canvas as JPEG
  POST /gesture/start → start webcam capture
  POST /gesture/stop  → stop webcam capture
  POST /gesture/set_color → set drawing color
  POST /gesture/set_brush_size → set brush size
  POST /gesture/set_eraser → enable/disable eraser
  POST /gesture/clear → clear canvas
  POST /gesture/save  → save canvas as PNG
  WS   /socket.io/    → Socket.IO (drawing, chat, game events)
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles

from app.socket.events import create_socket_app, get_sio, game_manager
from app.gesture.air_canvas import air_canvas

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── App lifecycle ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SketchRush backend starting...")
    yield
    logger.info("SketchRush backend shutting down...")
    air_canvas.stop_capture()


app = FastAPI(
    title="SketchRush API",
    description="Real-time multiplayer drawing & guessing game",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
allowed_origins_list = [origin.strip() for origin in allowed_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── REST endpoints ────────────────────────────────────────────────────────────

@app.get("/")
@app.get("/health")
async def health():
    return {"status": "ok", "version": "2.0.0"}


@app.get("/rooms")
async def get_rooms():
    return {
        "rooms": [
            {
                "code": code,
                "players_count": len(room.players),
                "max_players": room.max_players,
                "game_state": room.game_state,
            }
            for code, room in game_manager.rooms.items()
        ]
    }


@app.get("/rooms/{room_code}")
async def get_room(room_code: str):
    room = game_manager.get_room(room_code.upper())
    if not room:
        return Response(content='{"error":"Room not found"}', status_code=404, media_type="application/json")
    return {
        "code": room.code,
        "game_state": room.game_state,
        "round_number": room.round_number,
        "max_rounds": room.max_rounds,
        "players": [
            {
                "id": p.id,
                "name": p.name,
                "avatar": p.avatar,
                "score": p.score,
                "is_drawing": p.is_drawing,
            }
            for p in room.players
        ],
    }


# ── Gesture MJPEG feed ────────────────────────────────────────────────────────

@app.get("/gesture/feed")
async def gesture_feed():
    """
    Stream the webcam + canvas side-by-side as MJPEG.
    The frontend displays this in an <img> tag when gesture mode is active.
    """
    if not air_canvas.active:
        return Response(
            content='{"error":"Gesture mode not active"}',
            status_code=400,
            media_type="application/json",
        )

    def generate():
        yield from air_canvas.generate_frames()

    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )


@app.get("/gesture/status")
async def gesture_status():
    return {
        "active": air_canvas.active,
        "color": air_canvas.color_hex,
        "brush_size": air_canvas.brush_size,
        "is_eraser": air_canvas.is_eraser,
    }


# ── Gesture Control endpoints ─────────────────────────────────────────────────

@app.post("/gesture/start")
async def gesture_start():
    """Start webcam capture and gesture recognition."""
    air_canvas.start_capture()
    return {"status": "started", "active": air_canvas.active}


@app.post("/gesture/stop")
async def gesture_stop():
    """Stop webcam capture and gesture recognition."""
    air_canvas.stop_capture()
    return {"status": "stopped", "active": air_canvas.active}


@app.post("/gesture/set_color")
async def gesture_set_color(color: str = "#1a1a2e"):
    """Set the drawing color (hex format)."""
    if color not in air_canvas.COLORS_BGR:
        return {
            "status": "error",
            "message": f"Unknown color. Available: {list(air_canvas.COLORS_BGR.keys())}"
        }
    air_canvas.set_color(color)
    return {"status": "success", "color": color}


@app.post("/gesture/set_brush_size")
async def gesture_set_brush_size(size: int = 5):
    """Set the brush size (1-60)."""
    air_canvas.set_brush_size(size)
    return {"status": "success", "brush_size": air_canvas.brush_size}


@app.post("/gesture/set_eraser")
async def gesture_set_eraser(enabled: bool = False):
    """Enable or disable eraser mode."""
    air_canvas.set_eraser(enabled)
    return {"status": "success", "is_eraser": air_canvas.is_eraser}


@app.post("/gesture/clear")
async def gesture_clear():
    """Clear the canvas."""
    air_canvas.clear()
    return {"status": "success", "message": "Canvas cleared"}


@app.post("/gesture/save")
async def gesture_save():
    """Save the current canvas as a PNG file."""
    filename = air_canvas.save_canvas()
    if filename:
        return {
            "status": "success",
            "filename": filename,
            "url": f"/static/saved_sketches/{filename}"
        }
    else:
        return {
            "status": "error",
            "message": "Failed to save canvas"
        }


@app.get("/gesture/canvas")
async def gesture_get_canvas():
    """Get the current canvas as a JPEG image."""
    canvas_bytes = air_canvas.get_canvas_jpeg()
    return Response(content=canvas_bytes, media_type="image/jpeg")


# ── Mount Socket.IO ───────────────────────────────────────────────────────────
socket_app = create_socket_app()
app.mount("/socket.io", socket_app)


# ── Mount static files (for saved sketches) ────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), 'static')
os.makedirs(static_dir, exist_ok=True)
os.makedirs(os.path.join(static_dir, 'saved_sketches'), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        reload_excludes=["*.pyc", "__pycache__"],
    )
