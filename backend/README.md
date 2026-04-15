# SketchRush Backend

Real-time multiplayer drawing and guessing game backend built with FastAPI and Socket.IO.

## Requirements

- Python 3.8+
- pip

## Setup

### 1. Create Virtual Environment

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 4. Run Development Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The server will be available at `http://localhost:8000`

## API Endpoints

### Health Check

- **GET** `/health` - Check if server is running

### Rooms

- **GET** `/rooms` - List all active rooms
- **GET** `/rooms/{room_code}` - Get room details and player list

## Socket.IO Events

### Client → Server

#### `join_room`

Join a game room.

```json
{
  "room": "XXXXX",
  "playerName": "John",
  "avatar": "🦊"
}
```

#### `leave_room`

Leave the current room.

#### `start_game`

Start the game (host only).

#### `draw`

Send drawing coordinates.

```json
{
  "x": 100,
  "y": 200,
  "color": "#3B82F6",
  "size": 5
}
```

#### `guess`

Submit a guess.

```json
{
  "word": "cat"
}
```

#### `message`

Send a chat message.

```json
{
  "text": "Hello everyone!"
}
```

#### `clear_canvas`

Clear the drawing canvas.

### Server → Client

#### `player_joined`

A player joined the room.

```json
{
  "player_id": "uuid",
  "player_name": "John",
  "avatar": "🦊",
  "room_code": "XXXXX",
  "players_count": 4
}
```

#### `player_left`

A player left the room.

#### `game_started`

Game has started.

```json
{
  "room_code": "XXXXX",
  "drawer_id": "uuid",
  "drawer_name": "John"
}
```

#### `word_selected`

A word has been selected (drawer only).

```json
{
  "word": "cat"
}
```

#### `draw`

Drawing event from another player.

#### `correct_guess`

A player guessed correctly.

```json
{
  "player_id": "uuid",
  "player_name": "John",
  "word": "cat"
}
```

#### `wrong_guess`

A player guessed incorrectly.

#### `message`

Chat message received.

```json
{
  "player_id": "uuid",
  "player_name": "John",
  "message": "Hello!"
}
```

## Project Structure

```
backend/
├── app/
│   ├── game/
│   │   ├── game_manager.py     # Game logic and room management
│   │   └── __init__.py
│   ├── models/
│   │   ├── models.py           # Pydantic models
│   │   └── __init__.py
│   ├── socket/
│   │   ├── events.py           # Socket.IO event handlers
│   │   └── __init__.py
│   └── __init__.py
├── main.py                      # FastAPI application
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment variables template
└── README.md                    # This file
```

## Development Tips

- Hot reload is enabled with `--reload` flag
- WebSocket connection issues? Check CORS settings in `main.py`
- Use browser DevTools Network tab to debug Socket.IO connections
- Logs are printed to console for debugging

## Deployment

### Using Render

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Use `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Using Railway

1. Connect your GitHub repository
2. Add environment variables
3. Set start command: `pip install -r requirements.txt && uvicorn main:app --host 0.0.0.0 --port $PORT`

## Future Enhancements

- [ ] Database integration for persistent game history
- [ ] User authentication and accounts
- [ ] Word pack customization
- [ ] Advanced scoring system
- [ ] Spectator mode
- [ ] Replay system
- [ ] Statistics tracking
