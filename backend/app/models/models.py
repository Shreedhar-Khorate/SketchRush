from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from enum import Enum


class GameState(str, Enum):
    WAITING = "waiting"
    CHOOSING_WORD = "choosing_word"
    DRAWING = "drawing"
    GUESSING = "guessing"
    ROUND_END = "round_end"
    GAME_END = "game_end"


class Player(BaseModel):
    id: str
    name: str
    avatar: str
    score: int = 0
    is_drawing: bool = False
    is_connected: bool = True

    class Config:
        from_attributes = True


class Room(BaseModel):
    code: str
    host_id: str
    players: List[Player] = []
    current_drawer_index: int = 0
    current_word: Optional[str] = None
    game_state: GameState = GameState.WAITING
    round_number: int = 0
    max_rounds: int = 5
    timer: int = 60
    created_at: datetime = None
    max_players: int = 8

    class Config:
        from_attributes = True


class DrawEvent(BaseModel):
    x: float
    y: float
    color: str
    size: float


class GuessEvent(BaseModel):
    player_id: str
    word: str


class ChatMessage(BaseModel):
    player_id: str
    player_name: str
    message: str
    timestamp: datetime = None
    is_system: bool = False


class JoinRoomRequest(BaseModel):
    room_code: str
    player_name: str
    avatar: str


class StartGameRequest(BaseModel):
    room_code: str
