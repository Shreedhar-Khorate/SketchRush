from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.socket.events import create_socket_app, get_sio
from app.game.game_manager import GameManager

# Initialize FastAPI app
app = FastAPI(
    title="SketchRush API",
    description="Real-time multiplayer drawing and guessing game",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize game manager
game_manager = GameManager()

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

# Get rooms endpoint
@app.get("/rooms")
async def get_rooms():
    return {
        "rooms": [
            {
                "code": code,
                "players_count": len(room.players),
                "max_players": room.max_players,
                "game_state": room.game_state
            }
            for code, room in game_manager.rooms.items()
        ]
    }

# Get room details
@app.get("/rooms/{room_code}")
async def get_room(room_code: str):
    room_code = room_code.upper()
    room = game_manager.get_room(room_code)
    
    if not room:
        return {"error": "Room not found"}, 404
    
    return {
        "code": room.code,
        "players": [
            {
                "id": p.id,
                "name": p.name,
                "avatar": p.avatar,
                "score": p.score,
                "is_drawing": p.is_drawing
            }
            for p in room.players
        ],
        "game_state": room.game_state,
        "round_number": room.round_number,
        "max_rounds": room.max_rounds
    }

# Mount Socket.IO
socket_app = create_socket_app()
app.mount("/socket.io", socket_app)

# Alternative socket.io path for compatibility
@app.get("/socket.io/")
async def socket_root():
    return {"error": "Use WebSocket instead"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True
    )
