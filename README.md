# 🎨 SketchRush

SketchRush is a real-time multiplayer drawing and guessing web application inspired by Skribbl.io, enhanced with client-side AI hand gesture drawing using MediaPipe hand-tracking.

**Tagline:** _"Draw Fast. Guess Faster."_

---

## 🌐 Live URLs

* **Live Demo (Frontend):** [https://sketch-rush-orpin.vercel.app](https://sketch-rush-orpin.vercel.app)
* **Backend Service:** [https://sketchrush-backend.onrender.com](https://sketchrush-backend.onrender.com)

---

## 🚀 Quick Start

### Prerequisites

* Node.js 18+ & npm
* Python 3.10+

### Easy Startup Scripts (Windows)

For convenience, you can start the project using the preconfigured batch files:

* **Start Backend:**
  ```bash
  cd backend
  ./run.bat
  ```
* **Start Frontend:**
  ```bash
  cd frontend
  ./run.bat
  ```

---

### Manual Setup

#### 1. Backend Setup (FastAPI)
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
The backend will run on [http://localhost:8000](http://localhost:8000).

#### 2. Frontend Setup (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The frontend will run on [http://localhost:5173](http://localhost:5173).

---

## 📋 Features

### Core Features
* 🎨 **Interactive Drawing Canvas** - Smooth freehand drawing with brush size and color palette controls.
* ✋ **Gesture Drawing Mode (AI-Powered)** - Zero-lag, client-side hand gesture recognition using MediaPipe. Drawing is fully run in the browser (WASM) for high performance and cloud deployment compatibility.
* 🌐 **Real-time Multiplayer Sync** - Sub-second drawing and chat synchronization via WebSocket (`Socket.IO`).
* 🏠 **Lobby & Room System** - Private rooms with custom alphanumeric codes, hosts, and customizable round numbers.
* 💬 **Real-time Chat & Guessing** - Active chat panels that auto-detect correct guesses and dynamically calculate points.
* 🏆 **Dynamic Leaderboard** - Points are awarded based on time remaining and accuracy, with live player card rankings.
* ⏱️ **Turn & Game Loop Timers** - Fully automated round transitions with 5-second count downs, timer ticks, and auto-draw protection.

---

## ✋ Gesture Guide (Air Canvas)

When it is your turn to draw, click the **✋ Gesture** button to activate the camera. Run the following gestures:

| Gesture | Hand Position | Action |
| :--- | :--- | :--- |
| 👆 **Draw** | Index finger raised, others folded | Draw on the canvas |
| ✌️ **Hover / Move** | Index & middle fingers raised | Move cursor without drawing |
| 🤏 **Erase** | Thumb & index pinched | Erase lines (White Brush) |
| ✊ **Clear** | Fist (all fingers down) | Clear entire canvas |

---

## 🏗️ Technical Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite, Vanilla CSS, Framer Motion, Anime.js |
| **AI Vision** | MediaPipe Tasks-Vision (HandLandmarker WASM) |
| **Backend** | Python 3.10+, FastAPI |
| **Real-time** | Socket.IO |

---

## 📁 Project Structure

```
SketchRush/
├── frontend/
│   ├── src/
│   │   ├── components/       # UI elements (DrawingCanvas, GestureOverlay, ChatPanel, etc.)
│   │   ├── pages/            # View pages (HomePage, GamePage)
│   │   ├── socket/           # socketManager client configuration
│   │   ├── hooks/            # useSocket state syncing hook
│   │   ├── App.jsx           # React routing
│   │   └── main.jsx          # Entry point
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite config
├── backend/
│   ├── app/
│   │   ├── game/             # GameManager core logic & word list
│   │   ├── models/           # Pydantic schemas (Room, Player)
│   │   └── socket/           # Socket.IO events and room timers
│   ├── main.py               # FastAPI server entry point
│   └── requirements.txt      # Python dependencies
├── README.md                 # This file
├── LICENSE                   # MIT License
└── prd.md                    # Product Requirements Document
```

---

## 🔌 Socket.IO Events

### Client ➔ Server
* `join_room`: Join a room with `{ room: "XXXXX", playerName: "Alice", avatar: "🦊" }`
* `leave_room`: Notify server that client has left.
* `start_game`: Start game with `{ max_rounds: N }` (Host only).
* `draw`: Broadcast line segment data `{ x, y, prevX, prevY, color, size, isEraser, mode }`.
* `guess`: Submit text guess `{ word: "..." }`.
* `message`: Send chat message `{ text: "..." }`.
* `clear_canvas`: Clear drawing canvas for all clients in the room.

### Server ➔ Client
* `room_joined`: Confirms lobby admission and delivers initial player list.
* `players_update`: Emitted when player list, host, or scores change.
* `turn_started`: Notifies clients which player is drawing, starts countdown.
* `word_choices`: Delivers 4 random word choices (drawer only).
* `word_selected`: Begins drawing round with word hint (e.g. `_ _ _`).
* `timer_tick`: Syncs countdown timer seconds.
* `correct_guess`: Broadcasts that a player guessed the word.
* `round_ended`: Shows round leaderboard and reveals correct word.
* `game_ended`: Final standings and winner display.

---

## 🛣️ Roadmap

### Completed Features (Phase 1 & 2)
* [x] **Real-time Canvas Drawing Sync**
* [x] **Auto-balancing Timer & Turn Management**
* [x] **Dynamic Multi-select Rounds System**
* [x] **Webcam-less Gesture AI (MediaPipe WASM)** - Moved hand-tracking to client-side, making SketchRush fully cloud-deployable without server-side CPU overhead.
* [x] **UX Polish & Animations** - Added particles, glowing paths, custom CSS custom cursors, and responsive modal transitions.

### Future Enhancements (Phase 3)
* [ ] Database integration for persistent game history and accounts
* [ ] Sound effects and visual countdown haptics
* [ ] Custom user-generated word packs
* [ ] Spectator mode for full rooms

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Submit a pull request with details of changes

---

## 📝 License

Distributed under the MIT License. See [LICENSE](./LICENSE) for more details.

---

**Let's Draw. Let's Guess. Let's Win! ⚡**
