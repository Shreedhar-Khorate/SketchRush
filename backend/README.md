# 🐍 SketchRush Backend

FastAPI & Socket.IO server for SketchRush, providing real-time room lifecycle coordination, socket line synchronizations, scoring, and turn management.

---

## 📋 Features

* ⚡ **Room Management** - Join/leave handling, host designation, and room state mapping.
* 🌐 **Real-time Synchronization** - Low-latency coordinate and stroke sync for the drawing canvas.
* 💬 **Chat & Guess Handling** - Dynamic matching of guesses against active words, computing time-weighted scores.
* ⏱️ **Robust Game Loops** - Server-side asyncio watchdog tasks managing turns, choice timeouts, and round transitions.

---

## 🛠️ Requirements

* Python 3.10+
* Virtual environment (`venv`)

---

## 🚀 Setup

### 1. Initialize Virtual Environment
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

### 3. Run Development Server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The server will run on [http://localhost:8000](http://localhost:8000).

---

## 🔌 API Endpoints

### Health & Details
* **GET** `/` - General health status check
* **GET** `/health` - Detailed health check with application version
* **GET** `/rooms` - Returns JSON list of all active lobbies and player counts
* **GET** `/rooms/{room_code}` - Returns detailed player list, host, and game status for a room code

---

## 📡 Socket.IO Event Reference

### Client ➔ Server

#### `join_room`
Lobby admission request.
```json
{
  "room": "ROOMCODE",
  "playerName": "Alice",
  "avatar": "🦊"
}
```

#### `start_game`
Starts drawing rounds (Host only).
```json
{
  "max_rounds": 3
}
```

#### `draw`
Line stroke data package.
```json
{
  "x": 0.45,
  "y": 0.32,
  "prevX": 0.43,
  "prevY": 0.31,
  "color": "#1A1A2E",
  "size": 5,
  "isEraser": false,
  "mode": "mouse"
}
```

#### `guess`
Submits active guess word.
```json
{
  "word": "cat"
}
```

#### `message`
Sends chat messaging.
```json
{
  "text": "Hello world!"
}
```

#### `clear_canvas`
Triggers canvas clearing.

---

### Server ➔ Client

#### `room_joined`
Initial state configuration payload.
```json
{
  "room_code": "ROOMCODE",
  "player_id": "uuid",
  "is_host": true,
  "host_id": "uuid",
  "players": [...],
  "game_state": "waiting"
}
```

#### `players_update`
Emitted when player list, host, or scores change.

#### `turn_started`
Notifies client that a new drawer is active.
```json
{
  "drawer_id": "uuid",
  "drawer_name": "Alice",
  "drawer_avatar": "🦊",
  "round": 1,
  "max_rounds": 3,
  "time": 60,
  "state": "choosing_word"
}
```

#### `word_choices`
Random word banks for choice selection (Drawer only).

#### `word_selected`
Begins drawing round, syncing hint to players.
```json
{
  "hint": "_ _ _",
  "word_length": 3,
  "drawer_id": "uuid"
}
```

#### `timer_tick`
Countdown updates.

#### `correct_guess`
Confirms matching correct guess and points awarded.

#### `round_ended`
Reveals correct word and standings.

#### `game_ended`
Declares winner and complete results standings.

---

## 📦 Tech Stack

* **FastAPI** - High performance web framework.
* **python-socketio** - Socket.IO server implementation matching v4 protocol.
* **Uvicorn** - ASGI server implementation.
