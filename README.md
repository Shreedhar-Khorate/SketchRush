# SketchRush

SketchRush is a real-time multiplayer drawing and guessing web application inspired by Skribbl.io, enhanced with AI-powered hand gesture drawing using computer vision.

**Tagline:** _"Draw Fast. Guess Faster."_

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ & npm
- Python 3.8+

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

### Backend Setup

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

The backend will run on `http://localhost:8000`

## 📋 Features

### Core Features

- 🎨 **HTML5 Canvas Drawing** - Freehand drawing with brush size and color controls
- ✋ **Gesture Drawing Mode** - Hand gesture recognition for drawing (AI-powered)
- 🌐 **Real-time Multiplayer** - WebSocket-based live synchronization
- 🏠 **Room System** - Create or join rooms with room codes
- 💬 **Live Chat** - Real-time messaging and guess input
- 🏆 **Scoring System** - Points for correct guesses and drawer performance
- ⏱️ **Timer** - 60-second round timer with visual feedback
- 👥 **Player Rankings** - Live leaderboard during gameplay

### Game Modes

- **Quick Play** - Auto-generate room code
- **Private Room** - Join with custom room code

## 🏗️ Architecture

### Frontend (React + Vite)

- **Framework:** React 19 with Vite
- **Styling:** Tailwind CSS + Custom Design System
- **Animations:** Framer Motion
- **Real-time:** Socket.IO Client
- **Routing:** React Router v6

### Backend (Python)

- **Framework:** FastAPI
- **Real-time:** Socket.IO
- **Game Logic:** Room management, turn system, scoring

## 📁 Project Structure

```
SketchRush/
├── frontend/
│   ├── src/
│   │   ├── components/       # Game components
│   │   ├── pages/            # Page components
│   │   ├── socket/           # Socket.IO integration
│   │   ├── hooks/            # Custom React hooks
│   │   ├── App.jsx           # Main app with routing
│   │   └── main.jsx          # Entry point
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── backend/
│   ├── app/
│   │   ├── game/             # Game logic
│   │   ├── models/           # Data models
│   │   └── socket/           # Socket events
│   ├── main.py               # FastAPI app
│   └── requirements.txt
└── README.md
```

## 🎮 Game Flow

1. **Home** - Enter name and select avatar
2. **Create/Join Room** - Quick play or private room
3. **Lobby** - Wait for players to join
4. **Game Start** - Host starts the game
5. **Drawing Round** - One player draws, others guess
6. **Scoring** - Points awarded for correct guesses
7. **Next Round** - Automatic turn rotation
8. **Game End** - Final leaderboard display

## 🎯 Component Tree

```
App
├── HomePage
│   ├── Logo
│   ├── Name Input
│   ├── Avatar Picker
│   └── Join Options
└── GamePage
    ├── GameHeader
    │   ├── Logo
    │   ├── Room Code
    │   ├── Player Count
    │   └── Timer
    ├── DrawingToolbar
    │   ├── Color Palette
    │   ├── Brush Sizes
    │   ├── Tools (Eraser, Clear)
    │   └── Mode Toggle
    ├── DrawingCanvas (HTML5)
    └── Sidebar
        ├── PlayerList
        └── ChatPanel
```

## 🎨 Design System

### Colors

- **Primary:** #3B82F6 (Blue)
- **Secondary:** #22C55E (Green)
- **Accent:** #F97316 (Orange)
- **Background:** #0F172A (Dark Navy)
- **Card:** #1E293B (Slate)

### Typography

- **Font:** Inter, sans-serif
- **Headings:** 24–32px, bold
- **Body:** 14–16px, regular
- **Buttons:** 14px, medium

### Effects

- Neon glow on active elements
- Smooth canvas drawing
- Animated transitions
- Responsive layouts

## 📱 Responsive Design

- **Mobile** (`< 640px`) - Stacked layout, bottom sheet sidebar
- **Tablet** (`640–1024px`) - Wrapped toolbar, full-width canvas
- **Desktop** (`> 1024px`) - Full side-by-side layout

## 🔌 Socket.IO Events

### Join Room

```json
{ "room": "XXXXX", "playerName": "Alice", "avatar": "🦊" }
```

### Draw

```json
{ "x": 100, "y": 200, "color": "#3B82F6", "size": 5 }
```

### Guess

```json
{ "word": "cat" }
```

See [Backend README](./backend/README.md) for full event documentation.

## 🚀 Deployment

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render)

1. Create new Web Service on Render
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set `FRONTEND_URL` environment variable

## 📦 Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | React 19, Vite, Tailwind CSS, Framer Motion |
| Backend    | FastAPI, Python 3.8+                        |
| Real-time  | Socket.IO (v4)                              |
| Styling    | Tailwind CSS v4                             |
| Animations | Framer Motion, Tailwind Keyframes           |

## 🛣️ Roadmap

### Phase 1 (MVP)

- [x] Frontend UI and components
- [x] Backend game logic
- [ ] Testing and debugging
- [ ] Performance optimization

### Phase 2

- [ ] Gesture drawing (MediaPipe)
- [ ] Database integration
- [ ] User accounts
- [ ] Statistics tracking
- [ ] Word pack management

### Phase 3

- [ ] Spectator mode
- [ ] Replay system
- [ ] Sound effects
- [ ] Mobile app
- [ ] AI drawing recognition

## 🤝 Contributing

To contribute:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

MIT License - See [LICENSE](./LICENSE) file for details.

## 👨‍💻 Author

Shreedhar Khorate

## 📞 Support

For issues and feature requests, please open an issue on GitHub.

---

**Let's Draw. Let's Guess. Let's Win! ⚡**
