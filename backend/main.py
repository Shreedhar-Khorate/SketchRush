"""
SketchRush FastAPI + Socket.IO server entry point.

NOTE: Gesture/hand-tracking was moved fully to the client (browser MediaPipe).
      This server only handles: game rooms, Socket.IO drawing events, REST health.

REST Endpoints:
  GET  /              → health check
  GET  /health        → health check
  GET  /rooms         → list active rooms
  GET  /rooms/{code}  → room detail
  WS   /socket.io/    → Socket.IO (drawing, chat, game events)
"""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.socket.events import create_socket_app, get_sio, game_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ── App lifecycle ─────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SketchRush backend starting...")
    yield
    logger.info("SketchRush backend shutting down...")


app = FastAPI(
    title="SketchRush API",
    description="Real-time multiplayer drawing & guessing game",
    version="2.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Set ALLOWED_ORIGINS env var in production to your Vercel URL, e.g.:
#   ALLOWED_ORIGINS=https://sketchrush.vercel.app
allowed_origins = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:3000"
)
allowed_origins_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]

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
        return Response(
            content='{"error":"Room not found"}',
            status_code=404,
            media_type="application/json",
        )
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


# ── Mount Socket.IO ───────────────────────────────────────────────────────────
socket_app = create_socket_app()
app.mount("/socket.io", socket_app)


# ── Mount static files ────────────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,
    )
