# SketchRush Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Python 3.8+
- Webcam (for gesture mode)

### Step 1: Setup Virtual Environment

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate it
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 3: Run the Server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

You should see:

```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

### Step 4: Test the API

In a new terminal:

```bash
# Test health check
curl http://localhost:8000/health

# Start gesture mode
curl -X POST http://localhost:8000/gesture/start

# View the stream in your browser
# Open: http://localhost:8000/gesture/feed (as img src)

# Set a color
curl -X POST "http://localhost:8000/gesture/set_color?color=%23ff4d6d"

# Save your drawing
curl -X POST http://localhost:8000/gesture/save
```

## 📝 Available Endpoints

### Quick Reference

| Method | Endpoint                           | Purpose        |
| ------ | ---------------------------------- | -------------- |
| GET    | `/health`                          | Health check   |
| POST   | `/gesture/start`                   | Start webcam   |
| POST   | `/gesture/stop`                    | Stop webcam    |
| GET    | `/gesture/feed`                    | MJPEG stream   |
| GET    | `/gesture/status`                  | Current status |
| POST   | `/gesture/set_color?color=HEX`     | Change color   |
| POST   | `/gesture/set_brush_size?size=N`   | Set brush size |
| POST   | `/gesture/set_eraser?enabled=BOOL` | Toggle eraser  |
| POST   | `/gesture/clear`                   | Clear canvas   |
| POST   | `/gesture/save`                    | Save canvas    |

### Available Colors

```
#1a1a2e (Dark)       #ff4d6d (Red-Pink)   #ff8c42 (Orange)
#ffd166 (Yellow)     #00e5a0 (Green)      #00d4ff (Cyan)
#6378ff (Blue)       #c77dff (Purple)     #ff6eb4 (Hot Pink)
#a0522d (Brown)      #6b7280 (Gray)       #f8faff (White)
```

## 🎨 Gesture Recognition

While drawing, use these hand gestures:

```
INDEX FINGER UP     → Draw
TWO FINGERS UP      → Move cursor (no drawing)
PINCH (THUMB+INDEX) → Erase
FIST (ALL DOWN)     → Clear canvas
```

## 📁 Project Structure

```
backend/
├── main.py                      # FastAPI app
├── app/
│   ├── gesture/air_canvas.py   # Hand detection & drawing
│   ├── game/game_manager.py    # Game logic
│   ├── models/models.py        # Data models
│   └── socket/events.py        # Socket.IO events
├── static/
│   └── saved_sketches/         # Saved drawings (auto-created)
├── requirements.txt            # Dependencies
├── README.md                   # Full documentation
├── API_GESTURES.md            # API reference
└── GESTURE_INTEGRATION.md     # Frontend integration
```

## 🔌 Frontend Integration

### React Example

```javascript
// Get gesture status
const status = await fetch("http://localhost:8000/gesture/status").then((r) =>
  r.json(),
);

// Start gesture mode
await fetch("http://localhost:8000/gesture/start", { method: "POST" });

// Display stream
<img src="http://localhost:8000/gesture/feed" alt="Canvas" />;

// Set color
await fetch("http://localhost:8000/gesture/set_color?color=%23ff4d6d", {
  method: "POST",
});

// Save
const result = await fetch("http://localhost:8000/gesture/save", {
  method: "POST",
}).then((r) => r.json());
console.log("Saved at:", result.url);
```

See detailed examples in `GESTURE_INTEGRATION.md`

## ⚙️ Configuration

Most settings are configured via API endpoints. To customize behavior:

### Gesture Detection

Edit `app/gesture/air_canvas.py`:

- `FINGER_TIPS` and `FINGER_PIPS`: Landmark indices
- `detect_gesture()`: Custom gesture logic
- `min_detection_confidence`: MediaPipe setting

### Canvas

Edit `app/gesture/air_canvas.py`:

- `COLORS_BGR`: Available colors
- Canvas dimensions: 640x480
- Eraser multiplier: 3x brush size

### Server

Edit `main.py`:

- Port: Change 8000 to another port
- Host: Change 0.0.0.0 for local-only access
- Reload: Set False for production

## 🆘 Troubleshooting

### Webcam not found

```
SketchRush backend warning: No webcam found
```

**Solution:**

- Check device permissions
- Try `/gesture/stop` then `/gesture/start`
- Restart the app

### CORS errors in frontend

**Solution:** CORS is already enabled in `main.py`. If issues persist:

```python
# Ensure this is in main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Save location issues

Files are saved to `backend/static/saved_sketches/`

**If saving fails:**

- Check directory exists
- Verify write permissions
- Check disk space

## 📚 Documentation Files

- **README.md** - Setup and overview
- **API_GESTURES.md** - Complete API reference with examples
- **GESTURE_INTEGRATION.md** - Frontend integration guide with code samples

## 🔗 Useful Commands

```bash
# Run with custom port
uvicorn main:app --reload --host 0.0.0.0 --port 8080

# Production mode (no reload)
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4

# Check installed packages
pip list

# Upgrade FastAPI/uvicorn
pip install --upgrade fastapi uvicorn

# Generate requirements.txt
pip freeze > requirements.txt
```

## 📊 API Response Format

All endpoints return JSON responses:

### Success

```json
{
  "status": "success",
  "data": {...}
}
```

### Error

```json
{
  "status": "error",
  "message": "Error description"
}
```

## 🚀 Next Steps

1. **For Frontend Development**: Read `GESTURE_INTEGRATION.md`
2. **For API Details**: Read `API_GESTURES.md`
3. **For Production**: See deployment section in README.md

## 📞 API Base URL

During development:

```
http://localhost:8000
```

## ✅ Testing Checklist

- [ ] Virtual environment activated
- [ ] Dependencies installed
- [ ] Backend server running (http://localhost:8000/health returns OK)
- [ ] Webcam is accessible
- [ ] Can start gesture mode (`/gesture/start`)
- [ ] MJPEG stream displays (`/gesture/feed`)
- [ ] Can set colors via API
- [ ] Can save drawings

Once all are checked, you're ready to integrate with the frontend!

---

**Need more help?** Check the full documentation in `README.md` and `API_GESTURES.md`
