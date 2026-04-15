# SketchRush Gesture API Integration Guide

This guide shows how to integrate the gesture-controlled air canvas API with your frontend application.

## Frontend Integration Examples

### 1. Basic Setup with React/JavaScript

#### Install Dependencies

```bash
npm install axios
```

#### Create a Gesture Service (`hooks/useGesture.js`)

```javascript
import { useState, useCallback } from "react";

const GESTURE_API = "http://localhost:8000";

export const useGesture = () => {
  const [status, setStatus] = useState({
    active: false,
    color: "#1a1a2e",
    brush_size: 5,
    is_eraser: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${GESTURE_API}/gesture/status`);
      const data = await res.json();
      setStatus(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GESTURE_API}/gesture/start`, {
        method: "POST",
      });
      const data = await res.json();
      setStatus((prev) => ({ ...prev, active: data.active }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const stop = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${GESTURE_API}/gesture/stop`, {
        method: "POST",
      });
      const data = await res.json();
      setStatus((prev) => ({ ...prev, active: data.active }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const setColor = useCallback(async (color) => {
    try {
      const res = await fetch(
        `${GESTURE_API}/gesture/set_color?color=${encodeURIComponent(color)}`,
        { method: "POST" },
      );
      if (res.ok) {
        setStatus((prev) => ({ ...prev, color, is_eraser: false }));
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const setBrushSize = useCallback(async (size) => {
    try {
      const res = await fetch(
        `${GESTURE_API}/gesture/set_brush_size?size=${Math.max(1, Math.min(60, size))}`,
        { method: "POST" },
      );
      if (res.ok) {
        setStatus((prev) => ({ ...prev, brush_size: size }));
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const setEraser = useCallback(async (enabled) => {
    try {
      const res = await fetch(
        `${GESTURE_API}/gesture/set_eraser?enabled=${enabled}`,
        { method: "POST" },
      );
      if (res.ok) {
        setStatus((prev) => ({
          ...prev,
          is_eraser: enabled,
          color: "#1a1a2e",
        }));
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      await fetch(`${GESTURE_API}/gesture/clear`, { method: "POST" });
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const save = useCallback(async () => {
    try {
      const res = await fetch(`${GESTURE_API}/gesture/save`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.status === "success") {
        return data.url;
      } else {
        throw new Error(data.message);
      }
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  return {
    status,
    loading,
    error,
    start,
    stop,
    setColor,
    setBrushSize,
    setEraser,
    clear,
    save,
    fetchStatus,
  };
};
```

#### Use in Components

```javascript
import useGesture from "./hooks/useGesture";

export const GesturePanel = () => {
  const gesture = useGesture();
  const [savedUrl, setSavedUrl] = useState(null);

  const handleStart = async () => {
    await gesture.start();
  };

  const handleStop = async () => {
    await gesture.stop();
  };

  const handleSave = async () => {
    const url = await gesture.save();
    setSavedUrl(url);
  };

  return (
    <div className="gesture-panel">
      <div className="controls">
        {!gesture.status.active ? (
          <button onClick={handleStart}>Start Gesture Mode</button>
        ) : (
          <button onClick={handleStop}>Stop Gesture Mode</button>
        )}
      </div>

      {gesture.status.active && (
        <>
          <div className="color-selector">
            <button
              onClick={() => gesture.setColor("#ff4d6d")}
              style={{ backgroundColor: "#ff4d6d" }}
            />
            <button
              onClick={() => gesture.setColor("#ff8c42")}
              style={{ backgroundColor: "#ff8c42" }}
            />
            <button
              onClick={() => gesture.setColor("#ffd166")}
              style={{ backgroundColor: "#ffd166" }}
            />
            <button
              onClick={() => gesture.setColor("#00e5a0")}
              style={{ backgroundColor: "#00e5a0" }}
            />
          </div>

          <div className="brush-size">
            <input
              type="range"
              min="1"
              max="60"
              value={gesture.status.brush_size}
              onChange={(e) => gesture.setBrushSize(Number(e.target.value))}
            />
            <span>Size: {gesture.status.brush_size}px</span>
          </div>

          <button
            onClick={() => gesture.setEraser(!gesture.status.is_eraser)}
            className={gesture.status.is_eraser ? "active" : ""}
          >
            Eraser
          </button>

          <button onClick={gesture.clear}>Clear Canvas</button>
          <button onClick={handleSave}>Save Drawing</button>

          <img
            src={`${GESTURE_API}/gesture/feed`}
            alt="Gesture Canvas"
            className="gesture-stream"
          />

          {savedUrl && (
            <div className="saved">
              <p>Drawing saved!</p>
              <a href={savedUrl}>View</a>
            </div>
          )}
        </>
      )}

      {gesture.error && <div className="error">{gesture.error}</div>}
    </div>
  );
};
```

### 2. Raw Fetch Examples

#### Start Gesture Mode and Stream

```javascript
// Start gesture capture
async function startGesture() {
  const response = await fetch("http://localhost:8000/gesture/start", {
    method: "POST",
  });
  console.log(await response.json());
}

// Display the stream
function displayStream() {
  const img = document.getElementById("gesture-stream");
  img.src = "http://localhost:8000/gesture/feed";
}

// Set color
async function setDrawingColor(hexColor) {
  const response = await fetch(
    `http://localhost:8000/gesture/set_color?color=${encodeURIComponent(hexColor)}`,
    { method: "POST" },
  );
  console.log(await response.json());
}
```

### 3. HTML/CSS Example

```html
<!DOCTYPE html>
<html>
  <head>
    <style>
      .gesture-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px;
      }

      .controls {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }

      .color-palette {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 8px;
      }

      .color-button {
        width: 40px;
        height: 40px;
        border: 2px solid transparent;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .color-button:hover,
      .color-button.active {
        border-color: #333;
        transform: scale(1.1);
      }

      .gesture-stream {
        max-width: 100%;
        border: 2px solid #ddd;
        border-radius: 8px;
      }

      button {
        padding: 8px 16px;
        background: #3b82f6;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      }

      button:hover {
        background: #2563eb;
      }

      button:disabled {
        background: #ccc;
        cursor: not-allowed;
      }

      .slider {
        width: 100%;
        max-width: 200px;
      }

      .status {
        padding: 12px;
        background: #f0f0f0;
        border-radius: 4px;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="gesture-container">
      <h1>SketchRush - Air Canvas</h1>

      <div class="status" id="status">Status: Inactive</div>

      <div class="controls">
        <button id="startBtn" onclick="startGesture()">Start</button>
        <button id="stopBtn" onclick="stopGesture()" disabled>Stop</button>
        <button id="clearBtn" onclick="clearCanvas()" disabled>Clear</button>
        <button id="saveBtn" onclick="saveCanvas()" disabled>Save</button>
      </div>

      <div>
        <label for="brushSize">Brush Size:</label>
        <input
          type="range"
          id="brushSize"
          min="1"
          max="60"
          value="5"
          class="slider"
          onchange="setBrushSize(this.value)"
          disabled
        />
        <span id="sizeValue">5px</span>
      </div>

      <div>
        <label>Colors:</label>
        <div class="color-palette" id="colorPalette"></div>
      </div>

      <div>
        <button id="eraserBtn" onclick="toggleEraser()" disabled>
          ✏️ Eraser
        </button>
      </div>

      <img id="gestureStream" class="gesture-stream" alt="Gesture Canvas" />
    </div>

    <script src="gesture-client.js"></script>
  </body>
</html>
```

#### `gesture-client.js`

```javascript
const API_URL = "http://localhost:8000";

const colors = [
  "#1a1a2e",
  "#ff4d6d",
  "#ff8c42",
  "#ffd166",
  "#00e5a0",
  "#00d4ff",
  "#6378ff",
  "#c77dff",
];

let isActive = false;
let currentColor = colors[1];

function updateUI() {
  document.getElementById("startBtn").disabled = isActive;
  document.getElementById("stopBtn").disabled = !isActive;
  document.getElementById("clearBtn").disabled = !isActive;
  document.getElementById("saveBtn").disabled = !isActive;
  document.getElementById("brushSize").disabled = !isActive;
  document.getElementById("eraserBtn").disabled = !isActive;
  document.getElementById("status").textContent =
    `Status: ${isActive ? "Drawing" : "Inactive"}`;
}

async function startGesture() {
  try {
    const res = await fetch(`${API_URL}/gesture/start`, { method: "POST" });
    const data = await res.json();
    isActive = data.active;
    if (isActive) {
      document.getElementById("gestureStream").src = `${API_URL}/gesture/feed`;
    }
    updateUI();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function stopGesture() {
  try {
    const res = await fetch(`${API_URL}/gesture/stop`, { method: "POST" });
    const data = await res.json();
    isActive = !data.active;
    updateUI();
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function setColor(color) {
  try {
    await fetch(
      `${API_URL}/gesture/set_color?color=${encodeURIComponent(color)}`,
      { method: "POST" },
    );
    currentColor = color;
    document.querySelectorAll(".color-button").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.color === color);
    });
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function setBrushSize(size) {
  try {
    await fetch(`${API_URL}/gesture/set_brush_size?size=${size}`, {
      method: "POST",
    });
    document.getElementById("sizeValue").textContent = size + "px";
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function toggleEraser() {
  try {
    const res = await fetch(`${API_URL}/gesture/set_eraser?enabled=true`, {
      method: "POST",
    });
    const data = await res.json();
    document
      .getElementById("eraserBtn")
      .classList.toggle("active", data.is_eraser);
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function clearCanvas() {
  if (confirm("Clear the entire canvas?")) {
    try {
      await fetch(`${API_URL}/gesture/clear`, { method: "POST" });
    } catch (err) {
      alert("Error: " + err.message);
    }
  }
}

async function saveCanvas() {
  try {
    const res = await fetch(`${API_URL}/gesture/save`, { method: "POST" });
    const data = await res.json();
    if (data.status === "success") {
      alert(`Saved! View at: ${data.url}`);
    } else {
      alert("Save failed: " + data.message);
    }
  } catch (err) {
    alert("Error: " + err.message);
  }
}

// Initialize color palette
window.addEventListener("DOMContentLoaded", () => {
  const palette = document.getElementById("colorPalette");
  colors.forEach((color) => {
    const btn = document.createElement("button");
    btn.className = "color-button";
    btn.style.backgroundColor = color;
    btn.dataset.color = color;
    if (color === currentColor) btn.classList.add("active");
    btn.onclick = () => setColor(color);
    palette.appendChild(btn);
  });
  updateUI();
});
```

## Testing the API

### Using cURL

```bash
# Start gesture mode
curl -X POST http://localhost:8000/gesture/start

# Set color
curl -X POST "http://localhost:8000/gesture/set_color?color=%23ff4d6d"

# Set brush size
curl -X POST "http://localhost:8000/gesture/set_brush_size?size=10"

# Get status
curl http://localhost:8000/gesture/status

# Clear canvas
curl -X POST http://localhost:8000/gesture/clear

# Save canvas
curl -X POST http://localhost:8000/gesture/save

# Stop gesture mode
curl -X POST http://localhost:8000/gesture/stop
```

### In Browser Console

```javascript
// Set color
fetch("http://localhost:8000/gesture/set_color?color=%23ff4d6d", {
  method: "POST",
});

// Set brush size
fetch("http://localhost:8000/gesture/set_brush_size?size=15", {
  method: "POST",
});

// Save
fetch("http://localhost:8000/gesture/save", { method: "POST" })
  .then((r) => r.json())
  .then((d) => console.log(d));
```

## Troubleshooting Integration

### CORS Issues

If you get CORS errors, ensure the backend is running with CORS enabled:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Stream Not Loading

- Ensure gesture mode is started before accessing `/gesture/feed`
- Check that your webcam is accessible
- Verify browser allows webcam access in security settings

### Endpoints Returning 404

- Verify the backend is running on `http://localhost:8000`
- Check the port number is correct
- Ensure you're using the right endpoint paths

## Performance Tips

1. **Debounce color/size changes**: Avoid sending requests on every input change
2. **Use the stream endpoint**: Display the MJPEG stream, don't poll the canvas endpoint
3. **Batch operations**: Group related API calls when possible
4. **Cache status**: Call `/gesture/status` when needed, not in a loop

## See Also

- [API_GESTURES.md](./API_GESTURES.md) - Full API documentation
- [main.py](./main.py) - Backend implementation
- [air_canvas.py](./app/gesture/air_canvas.py) - Gesture recognition logic
