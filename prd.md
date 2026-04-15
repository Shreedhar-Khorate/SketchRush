# 📄 Product Requirements Document (PRD)

## 🧩 Product Name

**SketchRush**

---

## 🎯 Tagline

**“Draw Fast. Guess Faster.”**

---

## 🧭 Overview

SketchRush is a real-time multiplayer drawing and guessing web application inspired by Skribbl.io, enhanced with AI-powered hand gesture drawing using computer vision.

The platform allows users to:

* Draw using a mouse (traditional mode)
* Draw using hand gestures via webcam (AI mode)
* Guess words in real-time
* Compete with friends in multiplayer rooms

---

## 🎯 Objectives

* Build a real-time multiplayer drawing platform
* Integrate gesture-based drawing using AI
* Deliver smooth and low-latency gameplay
* Create a scalable and modern web application
* Provide an engaging user experience

---

## 👥 Target Users

* Students and college users
* Casual gamers
* Friends and online groups
* Developers (portfolio/demo use)

---

## 🧠 Core Features

### 1. 🎨 Drawing System

* HTML5 Canvas-based drawing board
* Brush size control
* Brush color selection
* Background color customization
* Eraser tool
* Smooth drawing using interpolation

---

### 2. ✋ Gesture Drawing Mode (AI Feature)

Powered by:

* OpenCV
* MediaPipe

Features:

* Single hand detection (max 1 hand)
* Real-time hand tracking
* Gesture mapping:

| Gesture         | Action            |
| --------------- | ----------------- |
| ☝️ Index finger | Draw              |
| ✌️ Two fingers  | Move cursor       |
| ✊ Fist          | Clear canvas      |
| 👍 Thumb        | Change color      |
| 🤟 Gesture      | Change brush size |
| 🤏 Pinch        | Stop drawing      |

---

### 3. 🌐 Multiplayer System

* Real-time drawing synchronization
* WebSocket-based communication using Socket.IO
* Multiple players per room (recommended: 4–8 players)
* Room-based session management

---

### 4. 🏠 Room / Lobby System

* Create room
* Join via room code
* Display connected players
* Host controls game start

---

### 5. 🎮 Game Logic

* Turn-based gameplay
* One player draws at a time
* Other players guess
* Timer per round (60–90 seconds)
* Automatic turn switching
* Random word selection

---

### 6. 💬 Chat & Guess System

* Real-time chat
* Guess validation system
* Hidden word hints (e.g., _ _ _ _ )
* Instant feedback on correct guesses

---

### 7. 🏆 Scoring System

* Points for correct guesses
* Points for drawer (based on guesses)
* Leaderboard display after each round

---

### 8. 💾 Save & History

* Save sketches as images
* Store leaderboard and match history
* Optional user profiles

---

## ⚙️ Tech Stack

### 🎨 Frontend

* React + Vite
* HTML5 Canvas API
* Socket.IO Client
* Framer Motion

---

### ⚙️ Backend

* FastAPI
* python-socketio

---

### ✋ AI / Gesture Module

* OpenCV
* MediaPipe

---

### 💾 Database

* Supabase

---

### 🌐 Deployment

* Vercel (Frontend)
* Render (Backend)

---

## 🧱 System Architecture

```id="arch1"
React UI (Canvas + Controls)
        ↓
Socket.IO Client
        ↓
FastAPI + Socket.IO Server
        ↓
Game Logic + Room Management
        ↓
Broadcast Events to Players

+ Gesture Module (OpenCV + MediaPipe)
        ↓
Convert Hand → Coordinates → Send to Server
```

---

## 🔌 Real-Time Communication

Protocol:

* WebSockets (via Socket.IO)

Main Events:

* join_room
* leave_room
* draw
* guess
* start_game
* next_turn

---

## 📡 Data Format (Drawing Event)

```json id="data1"
{
  "x": 120,
  "y": 300,
  "color": [255, 0, 0],
  "size": 10,
  "mode": "gesture",
  "room": "ROOM123"
}
```

---

## 🎮 Game Flow

1. User opens application
2. Creates or joins a room
3. Players join lobby
4. Host starts game
5. System selects a drawer
6. Drawer receives a word
7. Drawer draws (mouse or gesture)
8. Others guess via chat
9. Points are assigned
10. Next player turn begins
11. Game ends after all rounds

---

## ⚠️ Constraints & Challenges

* Real-time latency issues
* Gesture detection accuracy
* Synchronization across clients
* Camera permission handling
* Network reliability

---

## 🔒 Non-Functional Requirements

* Low latency (<200ms)
* Responsive UI
* Cross-browser compatibility
* Scalable backend architecture
* Stable WebSocket connection

---

## 🚀 Future Enhancements

* AI-based drawing recognition
* Voice-based guessing system
* Mobile gesture support
* Custom word packs
* Spectator mode
* Replay system

---

## 📦 Folder Structure (High-Level)

```id="folder1"
frontend/
  ├── components/
  ├── pages/
  ├── canvas/
  ├── socket/

backend/
  ├── main.py
  ├── socket/
  ├── game_logic/
  ├── gesture_module/
```

---

## 🏆 Success Metrics

* Smooth real-time drawing
* Accurate gesture tracking
* Stable multiplayer sessions
* High user engagement

---

## 📌 Conclusion

SketchRush is an innovative real-time multiplayer drawing game that combines traditional gameplay with AI-powered gesture interaction. It showcases modern web technologies, real-time systems, and computer vision, making it a strong and unique project for academic and professional use.

---
