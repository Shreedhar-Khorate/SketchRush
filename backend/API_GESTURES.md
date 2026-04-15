# SketchRush Gesture API Documentation

## Overview

The gesture API provides REST endpoints and MJPEG streaming for air canvas drawing with hand gesture recognition using MediaPipe.

## Base URL

```
http://localhost:8000
```

## Gesture Recognition

### Hand Gestures Supported

- **DRAW**: Index finger up (pointing) → draws on canvas
- **MOVE**: Index + middle fingers up → cursor position (no drawing)
- **ERASE**: Pinch gesture (thumb + index close) → eraser/stop drawing
- **CLEAR**: Fist (all fingers down) → clears entire canvas
- **NONE**: Unrecognized gesture

## REST Endpoints

### 1. Get Gesture Status

Returns current gesture mode status and canvas settings.

```http
GET /gesture/status
```

**Response:**

```json
{
  "active": true,
  "color": "#ff4d6d",
  "brush_size": 5,
  "is_eraser": false
}
```

### 2. Start Gesture Mode

Initializes webcam capture and gesture recognition.

```http
POST /gesture/start
```

**Response:**

```json
{
  "status": "started",
  "active": true
}
```

**Notes:**

- Requires webcam access
- Background thread handles continuous capture
- Safe to call multiple times

### 3. Stop Gesture Mode

Stops webcam capture and releases camera resource.

```http
POST /gesture/stop
```

**Response:**

```json
{
  "status": "stopped",
  "active": false
}
```

### 4. Set Drawing Color

Changes the brush color for drawing.

```http
POST /gesture/set_color?color=%23ff4d6d
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `color` | string | Hex color code (default: `#1a1a2e`) |

**Available Colors:**

```
#1a1a2e  (Dark blue-black)
#f8faff  (Off-white)
#ff4d6d  (Red-pink)
#ff8c42  (Orange)
#ffd166  (Yellow)
#00e5a0  (Mint green)
#00d4ff  (Cyan)
#6378ff  (Electric blue)
#c77dff  (Purple)
#ff6eb4  (Hot pink)
#a0522d  (Brown)
#6b7280  (Gray)
```

**Response:**

```json
{
  "status": "success",
  "color": "#ff4d6d"
}
```

**Error Response (invalid color):**

```json
{
  "status": "error",
  "message": "Unknown color. Available: [...]"
}
```

### 5. Set Brush Size

Adjusts the brush stroke thickness.

```http
POST /gesture/set_brush_size?size=10
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `size` | integer | Brush size in pixels (1-60, default: 5) |

**Response:**

```json
{
  "status": "success",
  "brush_size": 10
}
```

### 6. Toggle Eraser Mode

Enables/disables eraser tool (draws with white to erase).

```http
POST /gesture/set_eraser?enabled=true
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `enabled` | boolean | Eraser state (default: false) |

**Response:**

```json
{
  "status": "success",
  "is_eraser": true
}
```

### 7. Clear Canvas

Clears all drawings from the canvas.

```http
POST /gesture/clear
```

**Response:**

```json
{
  "status": "success",
  "message": "Canvas cleared"
}
```

**Notes:**

- Resets all strokes
- Triggers `on_clear` callback
- Canvas color remains unchanged

### 8. Save Canvas

Saves the current canvas as a PNG image file.

```http
POST /gesture/save
```

**Success Response:**

```json
{
  "status": "success",
  "filename": "sketch_20240415_153022.png",
  "url": "/static/saved_sketches/sketch_20240415_153022.png"
}
```

**Error Response:**

```json
{
  "status": "error",
  "message": "Failed to save canvas"
}
```

**Notes:**

- Files saved to `backend/static/saved_sketches/`
- Filename format: `sketch_YYYYMMDD_HHMMSS.png`
- Timestamp uses server local time

### 9. Get Current Canvas

Retrieves the current canvas as a JPEG image.

```http
GET /gesture/canvas
```

**Response:**

- Content-Type: `image/jpeg`
- Binary JPEG image data

**Use Cases:**

- Thumbnail generation
- Canvas preview
- Client-side snapshots

### 10. Stream MJPEG Feed

Real-time MJPEG stream showing webcam + canvas side-by-side.

```http
GET /gesture/feed
```

**Response:**

- Content-Type: `multipart/x-mixed-replace; boundary=frame`
- JPEG frames (typically 30 fps)

**HTML Usage:**

```html
<img src="http://localhost:8000/gesture/feed" alt="Gesture Canvas" />
```

**Notes:**

- Only works if gesture mode is active (`/gesture/start` called)
- Displays webcam on left, canvas on right
- Resolution: 480x1280 pixels (480x640 each side)

## Color System

### Supported Color Definitions (BGR in OpenCV)

All colors are specified as hex strings. Internal conversion to BGR for OpenCV:

| Hex Code | RGB        | BGR        | Visual    |
| -------- | ---------- | ---------- | --------- |
| #1a1a2e  | 26,26,46   | 46,26,26   | Dark Blue |
| #ff4d6d  | 255,77,109 | 109,77,255 | Red-Pink  |
| #ff8c42  | 255,140,66 | 66,140,255 | Orange    |

## API Usage Examples

### JavaScript/Fetch

```javascript
// Start gesture mode
await fetch("http://localhost:8000/gesture/start", { method: "POST" });

// Set color to red-pink
await fetch("http://localhost:8000/gesture/set_color?color=%23ff4d6d", {
  method: "POST",
});

// Set brush size to 15
await fetch("http://localhost:8000/gesture/set_brush_size?size=15", {
  method: "POST",
});

// Save canvas
const response = await fetch("http://localhost:8000/gesture/save", {
  method: "POST",
});
const data = await response.json();
console.log("Saved:", data.url);

// Stop gesture mode
await fetch("http://localhost:8000/gesture/stop", { method: "POST" });
```

### Python/Requests

```python
import requests

BASE_URL = 'http://localhost:8000'

# Start gesture
requests.post(f'{BASE_URL}/gesture/start')

# Set color
requests.post(f'{BASE_URL}/gesture/set_color', params={'color': '#ff4d6d'})

# Save canvas
resp = requests.post(f'{BASE_URL}/gesture/save')
print(resp.json()['url'])

# Stop gesture
requests.post(f'{BASE_URL}/gesture/stop')
```

## Canvas Storage

Saved canvases are stored in:

```
backend/static/saved_sketches/
```

To serve these files:

- REST API endpoint: `/static/saved_sketches/{filename}`
- Direct file access: `backend/static/saved_sketches/{filename}`

## Error Handling

### Common Errors

**Gesture mode not active:**

```json
{
  "error": "Gesture mode not active"
}
```

_Solution:_ Call `/gesture/start` first

**Invalid color:**

```json
{
  "status": "error",
  "message": "Unknown color. Available: [list]"
}
```

_Solution:_ Use one of the available colors

**Save failed:**

```json
{
  "status": "error",
  "message": "Failed to save canvas"
}
```

_Solution:_ Check disk permissions and disk space

## Performance Considerations

- **MJPEG Streaming**: ~30 fps, quality: 75% JPEG
- **Canvas Resolution**: 640x480 pixels
- **Brush Sizes**: 1-60 pixels
- **Max Strokes**: ~2048 points per deque
- **Thread-Safe**: All operations use locks for concurrent access

## Integration with Socket.IO

The gesture module can emit drawing events via Socket.IO:

```python
# In frontend, listen for gesture drawing:
socket.on('draw_point', (data) => {
  // data: { x_norm, y_norm, color, size, eraser }
});

socket.on('gesture_change', (data) => {
  // data: { gesture: 'DRAW' | 'MOVE' | 'ERASE' | 'CLEAR' }
});
```

## Troubleshooting

### Webcam not opening

- Check device permissions
- Ensure no other app is using the camera
- Try `/gesture/stop` then `/gesture/start`

### Drawings not appearing

- Ensure `/gesture/set_color` has been called with valid color
- Check that gesture is `DRAW` (index finger only)
- Verify hand is properly detected (landmark overlay visible)

### Save location issues

- Check `backend/static/saved_sketches/` exists
- Verify write permissions on the directory
- Check available disk space
