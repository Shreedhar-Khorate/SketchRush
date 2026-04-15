# SketchRush — Design Document

## Overview

**SketchRush** is a real-time multiplayer drawing & guessing game with a fast-paced, gaming-inspired UI. Players join rooms, take turns drawing, and compete by guessing words quickly.

---

## Tech Stack

| Layer        | Technology                     |
|--------------|--------------------------------|
| Framework    | React 18         |
| Build Tool   | Vite 5                         |
| Styling      | Tailwind CSS v3 + Design Tokens|
| Animations   | Framer Motion                  |
| UI Base      | shadcn/ui (customized)         |
| Routing      | React Router v6                |
| State        | React useState (local)         |

---

## Design System

### Theme

Dark mode by default with a gradient background.

```
Background Gradient: linear-gradient(135deg, #0F172A → #1E1B4B)
```

### Color Palette

| Token              | HSL Value              | Hex       | Usage                        |
|--------------------|------------------------|-----------|------------------------------|
| `--background`     | 222 47% 11%            | #0F172A   | Page background              |
| `--foreground`     | 210 20% 95%            | #ECF0F5   | Primary text                 |
| `--card`           | 217 33% 17%            | #1E293B   | Panels, cards, sidebars      |
| `--primary`        | 217 91% 60%            | #3B82F6   | Buttons, links, active state |
| `--secondary`      | 142 71% 45%            | #22C55E   | Success, correct guess       |
| `--accent`         | 25 95% 53%             | #F97316   | Warnings, crown, highlights  |
| `--destructive`    | 0 84% 60%              | #EF4444   | Errors, eraser hint          |
| `--muted`          | 217 33% 17%            | #1E293B   | Inactive surfaces            |
| `--muted-foreground`| 215 14% 65%           | #9CA3AF   | Secondary text               |
| `--border`         | 217 33% 25%            | #374151   | Borders, dividers            |

### Drawing Colors

| Name   | Hex       |
|--------|-----------|
| Red    | #EF4444   |
| Blue   | #3B82F6   |
| Green  | #22C55E   |
| Yellow | #EAB308   |
| White  | #FFFFFF   |
| Black  | #000000   |

### Typography

- **Font Family:** Inter, sans-serif
- **Headings:** 24–32px, bold (700)
- **Subheadings:** 18–22px, semi-bold (600)
- **Body:** 14–16px, regular (400)
- **Buttons:** 14px, medium (500)

### Utility Classes (defined in `index.css`)

| Class            | Effect                                      |
|------------------|---------------------------------------------|
| `.glass-panel`   | Semi-transparent card with backdrop blur     |
| `.neon-glow-blue`| Blue box-shadow glow                        |
| `.neon-glow-green`| Green box-shadow glow                      |
| `.neon-glow-orange`| Orange box-shadow glow                    |
| `.neon-text-blue`| Blue text-shadow glow                       |
| `.neon-text-green`| Green text-shadow glow                     |

### Animations (Tailwind keyframes)

| Name           | Description                         |
|----------------|-------------------------------------|
| `pulse-neon`   | Opacity pulse for active indicators |
| `glow`         | Box-shadow breathing glow           |

### Framer Motion Patterns

- **Button hover:** `scale: 1.05`
- **Button tap:** `scale: 0.95`
- **Page enter:** `opacity: 0 → 1`, `y: 30 → 0`
- **List items:** staggered `x: 10 → 0` with delay
- **Timer critical:** `scale: [1, 1.1, 1]` pulsing loop

---

## Routing

| Path             | Page Component | Description                  |
|------------------|----------------|------------------------------|
| `/`              | `HomePage`     | Lobby — name, avatar, join   |
| `/game/:roomId`  | `GamePage`     | Main game board              |
| `*`              | `NotFound`     | 404 fallback                 |

---

## Pages

### `HomePage` (`src/pages/HomePage.tsx`)

The landing/lobby screen where players set up before joining a game.

**Sections:**
1. **Logo & Tagline** — "⚡ SketchRush" with neon glow
2. **Name Input** — Text field, max 16 chars
3. **Avatar Picker** — 6×2 grid of 12 emoji characters (Fox, Cat, Dragon, Robot, Alien, Wizard, Ninja, Rocket, Unicorn, Ghost, Skull, Fire)
4. **Live Preview** — Shows selected avatar + entered name
5. **Join Mode Tabs:**
   - *Quick Play* — Generates random 5-char room code
   - *Private Room* — Text input for room code (uppercase, monospace)
6. **Join Button** — Navigates to `/game/:roomId` with player state

**State:** `playerName`, `selectedAvatar`, `joinMode`, `roomCode`, `error`

---

### `GamePage` (`src/pages/GamePage.tsx`)

The main game board. Receives `playerName` and `avatar` via `location.state`.

**Layout (desktop):**
```
┌──────────────────────────────────────────────┐
│  GameHeader                                  │
├──────────────────────────────────────────────┤
│  DrawingToolbar                              │
├────────────────────────────┬─────────────────┤
│                            │  PlayerList     │
│     DrawingCanvas          ├─────────────────┤
│                            │  ChatPanel      │
│                            │                 │
└────────────────────────────┴─────────────────┘
```

**Layout (mobile):** Sidebar hidden, accessible via floating button → slides up as bottom sheet.

**State:** `selectedColor`, `brushSize`, `isEraser`, `gestureMode`, `clearSignal`, `showSidebar`

---

## Components

### `GameHeader` (`src/components/GameHeader.tsx`)

Top bar with branding and game status.

| Element        | Detail                                      |
|----------------|---------------------------------------------|
| Logo           | "⚡ SketchRush", neon blue text glow        |
| Room Code      | Displayed with `#` icon                     |
| Player Count   | "4/8" with Users icon                       |
| Timer          | 60s countdown, color shifts at 20s/10s, pulses at ≤10s |

**Props:** `roomCode?: string`

---

### `DrawingToolbar` (`src/components/DrawingToolbar.tsx`)

Horizontal bar with all drawing controls.

| Section        | Controls                                    |
|----------------|---------------------------------------------|
| Color Palette  | 6 circular color buttons, glow on active    |
| Brush Sizes    | 4 presets (2, 5, 10, 18px), shown as dots   |
| Tools          | Eraser toggle, Clear canvas button          |
| Mode Toggle    | Mouse / Gesture switch with icon            |

**Props:** `selectedColor`, `onColorChange`, `brushSize`, `onBrushSizeChange`, `isEraser`, `onToggleEraser`, `onClear`, `gestureMode`, `onToggleGesture`

---

### `DrawingCanvas` (`src/components/DrawingCanvas.tsx`)

HTML5 Canvas element for freehand drawing.

- **Resolution:** 800×600 internal, scales responsively via CSS
- **Aspect Ratio:** 4:3
- **Supports:** mouse and touch input
- **Cursor:** crosshair
- **Clear:** triggered via `clearSignal` prop increment

**Props:** `color`, `brushSize`, `isEraser`, `clearSignal`

---

### `PlayerList` (`src/components/PlayerList.tsx`)

Sorted list of players by score (descending).

| Feature           | Detail                                   |
|-------------------|------------------------------------------|
| Current player    | Marked with "(you)" tag                  |
| Drawing player    | Blue border + pencil icon with pulse     |
| Top scorer        | Crown icon + accent color                |
| Score display     | Right-aligned, muted text                |

**Props:** `currentPlayer?: string`, `currentAvatar?: string`

---

### `ChatPanel` (`src/components/ChatPanel.tsx`)

Real-time chat and guess input.

| Feature        | Detail                                      |
|----------------|---------------------------------------------|
| System msgs    | Centered, accent color, "🎯" prefix         |
| Correct guess  | Green text with ✅ icon                      |
| Normal msgs    | Blue username + white text                  |
| Input          | Text field + send button, Enter to submit   |

**Props:** `playerName?: string`

---

## Responsive Breakpoints

| Breakpoint | Behavior                                     |
|------------|----------------------------------------------|
| `< 640px`  | Stacked layout, sidebar as bottom sheet      |
| `640–1024px`| Toolbar wraps, canvas fills width            |
| `> 1024px` | Full side-by-side layout with sidebar        |

---

## File Structure

---

## Future Considerations

- **Real-time sync:** Socket.IO / WebSocket integration for live drawing & chat
- **Auth:** Player accounts and persistent scores
- **Word system:** Timed word selection modal between rounds
- **Waiting lobby:** Pre-game screen showing connected players
- **Sound effects:** Timer ticks, correct guess chime, round transitions
- **Room sharing:** Copy-to-clipboard link/code
- **Gesture drawing:** Camera-based hand tracking mode
