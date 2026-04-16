# SketchRush — Design System

## Philosophy

SketchRush uses a dark, editorial, code-native aesthetic — like GitHub meets a game dashboard. No neon gradients, no cartoonish colours, no AI-looking glassmorphism. Every surface should feel intentional: high contrast, data-dense but never cluttered, with amber as the single expressive accent.

The visual language is:

- **Dark by default.** Not "edgy dark" — professionally dark, like VS Code or Linear.
- **Typographically anchored.** Content hierarchy through weight and size, not colour noise.
- **Purposeful colour.** Amber for action, blue for information, green for success, red for errors. Never decorative.
- **Flat surfaces.** No gradients, no blurs, no glow effects. Depth via layered backgrounds and subtle borders.

---

## Tech Stack

- React + Vite (JavaScript)
- Tailwind CSS
- Anime.js
- GSAP
- Framer Motion

---

## Typography

**Font family:** Inter (primary), SF Mono / Fira Code (monospace for room codes, stats)

| Role       | Size  | Weight | Letter Spacing | Line Height | Usage                                  |
|------------|-------|--------|----------------|-------------|----------------------------------------|
| Display    | 32px  | 700    | -0.02em        | 1.2         | Hero tagline, game-over score          |
| Heading    | 22px  | 600    | -0.01em        | 1.3         | Page titles, section headers           |
| Subheading | 16px  | 500    | 0              | 1.4         | Card titles, panel headers             |
| Body       | 14px  | 400    | 0              | 1.6         | Descriptions, chat messages            |
| Caption    | 12px  | 400    | 0              | 1.5         | Metadata, timestamps, hints            |
| Mono       | 13px  | 400    | 0.06em         | 1.4         | Room codes, scores, coordinates        |

**Rules:**
- Never use `font-weight: 300` (too thin on dark backgrounds)
- Inter numerals: use `font-variant-numeric: tabular-nums` for timers and scores
- Mono font for all room codes — always uppercase with letter-spacing

---

## Color System

### Base Palette

| Token              | Hex       | Usage                                      |
|--------------------|-----------|---------------------------------------------|
| `--bg`             | `#0D1117` | Page background, canvas background          |
| `--surface`        | `#161B22` | Cards, panels, sidebars, modals             |
| `--surface-raised` | `#1C2333` | Toolbars, input backgrounds, hover states   |
| `--border`         | `#30363D` | All borders and dividers                    |
| `--border-subtle`  | `#21262D` | Inner dividers, secondary separators        |
| `--text`           | `#E6EDF3` | Primary text                                |
| `--text-muted`     | `#8B949E` | Secondary text, labels, placeholders        |
| `--text-faint`     | `#484F58` | Disabled states, ghost text                 |

### Semantic Colours

| Token         | Hex                        | Usage                                           |
|---------------|----------------------------|-------------------------------------------------|
| `--amber`     | `#F0A500`                  | Primary action, CTAs, timer bar, highlights     |
| `--amber-bg`  | `rgba(240,165,0,0.10)`     | Subtle amber fills (badges, toasts)             |
| `--blue`      | `#2F81F7`                  | Usernames, links, "drawing" indicator, info     |
| `--blue-bg`   | `rgba(47,129,247,0.10)`    | Badge backgrounds                               |
| `--green`     | `#3FB950`                  | Correct guess, success states, score gain       |
| `--green-bg`  | `rgba(63,185,80,0.10)`     | Correct guess message background                |
| `--red`       | `#F85149`                  | Errors, leave button, wrong guess, eraser hint  |
| `--red-bg`    | `rgba(248,81,73,0.10)`     | Destructive badge backgrounds                   |
| `--purple`    | `#A371F7`                  | Host badge, special role indicators             |
| `--purple-bg` | `rgba(163,113,247,0.10)`   | Host badge background                           |

### Drawing Canvas Colours

| Name   | Hex       |
|--------|-----------|
| White  | `#E6EDF3` |
| Black  | `#0D1117` |
| Gray   | `#8B949E` |
| Red    | `#F85149` |
| Orange | `#F0A500` |
| Yellow | `#D29922` |
| Green  | `#3FB950` |
| Teal   | `#39D353` |
| Blue   | `#2F81F7` |
| Indigo | `#6E40C9` |
| Purple | `#A371F7` |
| Pink   | `#F778BA` |

---

## Spacing & Geometry

### Spacing Scale

Use multiples of 4px throughout:

| Token | Value | Usage                                |
|-------|-------|--------------------------------------|
| `xs`  | 4px   | Icon gaps, tight inline padding      |
| `sm`  | 8px   | Input internal padding, tag gaps     |
| `md`  | 12px  | Component padding, list item gaps    |
| `lg`  | 16px  | Card internal padding                |
| `xl`  | 24px  | Section spacing                      |
| `2xl` | 32px  | Page-level vertical rhythm           |
| `3xl` | 48px  | Between major layout blocks          |

### Border Radius

| Token  | Value    | Usage                                   |
|--------|----------|-----------------------------------------|
| `sm`   | 4px      | Badges, tags, small chips               |
| `md`   | 8px      | Buttons, inputs, toolbar items          |
| `lg`   | 12px     | Cards, panels, modals                   |
| `xl`   | 16px     | Large modals, bottom sheets             |
| `full` | 9999px   | Avatar circles, color dots, pill badges |

### Borders

- All borders use `0.5px` with `--border` colour. Use `1px` only for focused/active state.
- No `box-shadow` for visual decoration. `box-shadow` is reserved for focus rings only:

```css
box-shadow: 0 0 0 3px rgba(240, 165, 0, 0.3); /* amber focus ring */
```

---

## Components

### Buttons

Three variants. All use `border-radius: 8px`, `font-size: 13px`, `font-weight: 500`, `padding: 9px 18px`.

**Primary** — Amber fill. Used for the single primary action per screen.

```css
background: #F0A500;
color: #0D1117;
border: none;
```

**Secondary** — Outlined. Used for secondary or alternative actions.

```css
background: transparent;
color: #E6EDF3;
border: 1px solid #30363D;
/* On hover: background: #1C2333 */
```

**Destructive / Ghost** — For dangerous actions (leave room, clear canvas).

```css
background: transparent;
color: #F85149;
border: 1px solid #F85149;
```

**Disabled state** for all buttons:

```css
opacity: 0.4;
cursor: not-allowed;
```

**Framer Motion:**
- Hover: `scale: 1.02`
- Tap: `scale: 0.97`
- Transition: `{ type: "spring", stiffness: 400, damping: 25 }`

---

### Input Fields

```css
background: #1C2333;
border: 1px solid #30363D;
border-radius: 8px;
padding: 10px 14px;
font-size: 14px;
color: #E6EDF3;
outline: none;
transition: border-color 0.15s;
```

**Focus state:**

```css
border-color: #F0A500;
box-shadow: 0 0 0 3px rgba(240, 165, 0, 0.15);
```

**Placeholder:** `color: #484F58`

For room code inputs: add `font-family: monospace; letter-spacing: 0.12em; text-transform: uppercase`

---

### Cards / Panels

Single surface layer. No inner shadow, no gradient.

```css
background: #161B22;
border: 1px solid #30363D;
border-radius: 12px;
padding: 20px;
```

**Raised variant** (for toolbars, nested sections):

```css
background: #1C2333;
border: 1px solid #21262D;
border-radius: 8px;
```

---

### Badges

Pill-shaped, small, semantic. Always use `border-radius: 9999px`, `font-size: 11px`, `font-weight: 500`.

| Variant  | Background   | Text       | Border                       |
|----------|-------------|------------|------------------------------|
| Drawing  | `--blue-bg`  | `--blue`   | `1px solid rgba(blue, 0.3)`  |
| Correct  | `--green-bg` | `--green`  | `1px solid rgba(green, 0.3)` |
| Round    | `--amber-bg` | `--amber`  | `1px solid rgba(amber, 0.3)` |
| Host     | `--purple-bg`| `--purple` | `1px solid rgba(purple, 0.3)`|
| Error    | `--red-bg`   | `--red`    | `1px solid rgba(red, 0.3)`   |

---

### Avatar / Player Icon

Circular container, 36px default (28px compact, 48px lobby).

```css
width: 36px;
height: 36px;
border-radius: 50%;
background: #1C2333;
display: flex;
align-items: center;
justify-content: center;
font-size: 18px;
flex-shrink: 0;
```

Active drawing player: add `outline: 2px solid #2F81F7; outline-offset: 2px`

---

### Player List Item

Horizontal flex row:

```
[Avatar 36px] [Name + Status badge] [Score right-aligned]
```

- Name: `font-size: 13px`, `font-weight: 500`, `color: --text`
- Score: `font-size: 13px`, `font-weight: 600`, `color: --amber`, `font-variant-numeric: tabular-nums`
- "(you)" tag: `font-size: 11px`, `color: --text-muted`, `margin-left: 6px`
- Separator between players: `border-top: 1px solid --border-subtle`

---

### Timer

Display as a large tabular numeral with a thin progress bar beneath.

```css
font-size: 48px;
font-weight: 700;
color: #E6EDF3;
letter-spacing: -0.04em;
font-variant-numeric: tabular-nums;
```

**Progress bar:**

```css
height: 4px;
background: #30363D;
border-radius: 2px;
```

**Fill colour by time remaining:**
- `> 20s`: `#F0A500` (amber)
- `11–20s`: `#D29922` (darker amber, warn)
- `≤ 10s`: `#F85149` (red)

**At ≤ 10s**, animate the number with Framer Motion:

```jsx
animate={{ scale: [1, 1.08, 1] }}
transition={{ repeat: Infinity, duration: 1 }}
```

---

### Chat Panel

Messages container with fixed height and overflow scroll. No background on individual messages except special system events.

| Type          | Style                                                              |
|---------------|--------------------------------------------------------------------|
| Normal msg    | Username in `--blue`, `font-weight: 500`. Message in `--text-muted` |
| Correct guess | Entire row `--green`, `font-weight: 500`, prefixed with `✓`        |
| System event  | Centered, `--amber`, `font-size: 12px`, `--amber-bg` background    |

- Input row: `background: --surface-raised`, `border-top: 1px solid --border`
- Send button: amber fill, same height as input field, no border-radius on left side.

---

### Drawing Toolbar

Horizontal row. Background: `--surface-raised`. Sections separated by 1px vertical dividers.

**Section 1 — Colour dots**
- 22px circles, `border-radius: 50%`
- Active: `outline: 2px solid --text; outline-offset: 2px`

**Section 2 — Brush sizes**
- Shown as filled circles of actual size (4px, 8px, 13px, 18px)
- Active: `outline: 2px solid --amber; outline-offset: 2px`

**Section 3 — Tool buttons** (eraser, clear)
- 32×32 icon buttons: `background: --surface`, `border: 1px solid --border`, `border-radius: 6px`
- Eraser hover: `border-color: --blue`
- Clear hover: `border-color: --red`, `color: --red`

---

## Layout

### Desktop (≥ 1024px)

```
┌─────────────────────────────────────────────────────────┐
│  GameHeader  [Logo]  [Room: XKTR9]  [4/8 👥]  [Timer]  │
├─────────────────────────────────────────────────────────┤
│  DrawingToolbar                                          │
├───────────────────────────────┬─────────────────────────┤
│                               │  PlayerList             │
│     DrawingCanvas (4:3)       ├─────────────────────────┤
│     background: #0D1117       │  ChatPanel              │
│     border: 1px #30363D       │                         │
│                               │                         │
└───────────────────────────────┴─────────────────────────┘
```

- Canvas column: `flex: 1 1 0`, `min-width: 480px`
- Sidebar column: `width: 300px`, fixed, not resizable
- Sidebar: two stacked panels, PlayerList top ~40%, ChatPanel remaining ~60%

### Tablet (640px–1024px)

- Sidebar collapses to a floating toggle button (bottom-right)
- On tap: sidebar slides up as a bottom sheet
- Bottom sheet: `border-radius: 16px 16px 0 0`, `background: --surface`, `height: 60vh`, drag-to-dismiss

### Mobile (< 640px)

- Toolbar wraps to two rows
- Canvas fills 100% width
- Bottom sheet same as tablet

---

## Page: Home / Lobby

Layout: centered column, `max-width: 480px`, vertically centered in viewport.

**Sections (top to bottom):**

1. **Logo mark** — "SketchRush" in Display weight. Subtitle: "Draw Fast. Guess Faster." in Caption weight, `--text-muted`

2. **Name input** — full width, placeholder "Your name…", max 16 chars, char counter `12/16` in `--text-faint`

3. **Avatar grid** — 4×3 grid of emoji avatars. Each avatar in a 52×52 rounded container (`border-radius: 12px`, `background: --surface-raised`). Selected state: `border: 2px solid --amber`

4. **Live preview** — small horizontal row showing selected avatar + name. `background: --surface-raised`, `border-radius: 8px`, `padding: 10px 14px`

5. **Join mode tabs** — two tabs: "Quick Play" / "Private Room". Tab indicator: 2px amber underline on active

6. **Room code input** (Private Room only) — monospace, uppercase, placeholder "ENTER CODE"

7. **Join button** — full-width Primary button

---

## Page: Game

Described in the Layout section above. Additional detail:

**GameHeader:**
- Left: Logo mark (smaller, 20px, `font-weight: 600`)
- Center: Room code in mono + copy icon, player count with `--text-muted`
- Right: Timer display

**Word hint area** — appears between toolbar and canvas:

```
_ _ _ _ _ _ _    (7 letters)
```

- Monospace, `font-size: 22px`, `letter-spacing: 0.2em`
- Correct letters revealed in `--amber`

**Round indicator** — small badge above the canvas or in header: `Round 3 / 5`

---

## Animations

All UI animations use **Framer Motion**, **GSAP**, and **Anime.js**. Keep them fast and purposeful.

### Framer Motion

Used for component-level mount/unmount, layout, and interaction animations.

| Element              | Animation                              | Duration  |
|----------------------|----------------------------------------|-----------|
| Page enter           | `opacity: 0→1, y: 20→0`               | 250ms     |
| Button hover         | `scale: 1.02`                          | 150ms     |
| Button tap           | `scale: 0.97`                          | 100ms     |
| Avatar select        | `scale: 0.95→1` spring                 | 200ms     |
| Chat message appear  | `opacity: 0→1, x: -8→0`               | 180ms     |
| Correct guess banner | `opacity: 0→1, y: -10→0`, green flash  | 250ms     |
| Timer critical (≤10s)| `scale: [1, 1.08, 1]` repeat           | 1000ms    |
| Bottom sheet         | `y: 100%→0` spring, damping: 30        | 300ms     |
| Tab indicator        | `layoutId` shared layout animation      | —         |

### GSAP

Used for timeline-based sequences, complex chained animations, and canvas-adjacent effects.

| Element                   | Animation                                              | Duration  |
|---------------------------|--------------------------------------------------------|-----------|
| Score tick                | `gsap.to(el, { innerText: newScore, snap: { innerText: 1 }, duration: 0.6 })` | 600ms |
| Round transition          | Timeline: canvas fade out → "Round N" scale in → fade out → new round fade in | 1500ms total |
| Game over scoreboard      | Staggered `gsap.from` on player rows: `y: 30, opacity: 0, stagger: 0.1` | 800ms |
| Word reveal               | Per-letter stagger: `opacity: 0→1, y: -10→0, stagger: 0.05` | 400ms |
| Drawing sync pulse        | `gsap.to(canvasBorder, { borderColor: "#2F81F7", repeat: 1, yoyo: true })` | 300ms |
| Countdown (3-2-1-Go)      | `gsap.timeline()`: scale 0→1.2→1 per number, then "Go!" with amber color | 3000ms |

### Anime.js

Used for particle effects, SVG animations, and decorative micro-interactions.

| Element                   | Animation                                              | Duration  |
|---------------------------|--------------------------------------------------------|-----------|
| Correct guess confetti    | `anime({ targets: particles, translateY: [-20, 100], opacity: [1, 0], scale: [1, 0.5], delay: anime.stagger(30) })` | 800ms |
| Lobby background dots     | Floating ambient dots: `translateY` loop, random delays, `opacity: [0.1, 0.3]` | 4000ms loop |
| Avatar select ripple      | Expanding ring from avatar center: `scale: [0, 2], opacity: [0.4, 0]` | 400ms |
| Timer urgency particles   | At ≤ 10s: small red dots drifting upward from timer | 1000ms loop |
| Room code copy feedback   | Checkmark SVG draw: `strokeDashoffset` animation | 300ms |
| Logo entrance (lobby)     | SVG path draw + letter stagger with `anime.stagger(40)` | 600ms |

### Animation Rules

- **Framer Motion** for React component lifecycle (mount, unmount, layout, hover, tap)
- **GSAP** for timelines, number counting, sequenced multi-step animations
- **Anime.js** for particles, SVG path drawing, ambient decorative motion
- Never exceed 300ms for interaction feedback (hover, tap, toggle)
- Ambient/decorative loops are fine at 2000–4000ms
- All interaction animations must use `spring` or `easeOut` — never `ease-in-out` on micro-interactions
- Disable all non-essential animations when `prefers-reduced-motion: reduce` is active

---

## CSS Custom Properties

```css
:root {
  --bg:               #0D1117;
  --surface:          #161B22;
  --surface-raised:   #1C2333;
  --border:           #30363D;
  --border-subtle:    #21262D;
  --text:             #E6EDF3;
  --text-muted:       #8B949E;
  --text-faint:       #484F58;

  --amber:            #F0A500;
  --amber-bg:         rgba(240, 165, 0, 0.10);
  --blue:             #2F81F7;
  --blue-bg:          rgba(47, 129, 247, 0.10);
  --green:            #3FB950;
  --green-bg:         rgba(63, 185, 80, 0.10);
  --red:              #F85149;
  --red-bg:           rgba(248, 81, 73, 0.10);
  --purple:           #A371F7;
  --purple-bg:        rgba(163, 113, 247, 0.10);

  --radius-sm:        4px;
  --radius-md:        8px;
  --radius-lg:        12px;
  --radius-xl:        16px;
}
```

---

## Tailwind Config Additions

```js
theme: {
  extend: {
    colors: {
      bg:              '#0D1117',
      surface:         '#161B22',
      raised:          '#1C2333',
      border:          '#30363D',
      'border-subtle': '#21262D',
      text:            '#E6EDF3',
      muted:           '#8B949E',
      faint:           '#484F58',
      amber:           '#F0A500',
      'sr-blue':       '#2F81F7',
      'sr-green':      '#3FB950',
      'sr-red':        '#F85149',
      'sr-purple':     '#A371F7',
    },
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['"SF Mono"', '"Fira Code"', 'monospace'],
    },
    borderRadius: {
      DEFAULT: '8px',
      sm:  '4px',
      md:  '8px',
      lg:  '12px',
      xl:  '16px',
    },
    keyframes: {
      'timer-pulse': {
        '0%, 100%': { transform: 'scale(1)' },
        '50%':       { transform: 'scale(1.08)' },
      },
    },
    animation: {
      'timer-pulse': 'timer-pulse 1s ease-in-out infinite',
    },
  },
},
```

---

## Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Use amber as the single accent colour | Use multiple accent colours simultaneously |
| Use semantic colours for their specific meaning | Use green for things that aren't "correct/success" |
| Layer surfaces: `--bg` → `--surface` → `--surface-raised` | Use gradients or mesh backgrounds |
| Use `font-variant-numeric: tabular-nums` for numbers | Use proportional numerals in timers or scores |
| Use `font-family: mono` for room codes | Mix fonts casually |
| Keep borders at 0.5–1px | Use thick borders for visual decoration |
| Add focus rings using `box-shadow` on interactive elements | Skip focus states |
| Use spring animations from Framer Motion | Use `ease-in-out` on UI micro-interactions |
| Keep motion fast (150–300ms) | Add slow transitions (> 400ms) to common UI |
| Derive depth from layered backgrounds | Use `drop-shadow` or `box-shadow` for card depth |
| Use GSAP for timelines and number animations | Use GSAP for simple hover/tap (use Framer instead) |
| Use Anime.js for particles and SVG path drawing | Use Anime.js for layout animations (use Framer instead) |
| Respect `prefers-reduced-motion` | Run decorative animations regardless of user preference |
