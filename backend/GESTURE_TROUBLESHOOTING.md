# Air Canvas (Gesture Mode) Troubleshooting Guide

## Issue: Camera window opens but not working properly

When you click the "✋ Gesture" button, a camera view window opens but it's showing an error or blank screen.

### Step 1: Check Backend is Running

Before using gesture mode, the backend must be running:

```bash
# In terminal, navigate to backend directory
cd backend

# Option A: Quick start (use provided script)
./run.bat

# Option B: Manual start
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Expected output:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

### Step 2: Verify Backend Health

Open a new terminal/PowerShell and test the health endpoint:

```powershell
# PowerShell
Invoke-WebRequest http://localhost:8000/health
```

**✅ Expected response:**

```json
{ "status": "ok", "version": "2.0.0" }
```

### Step 3: Check Webcam Access

Your browser needs permission to access the webcam. When you click the gesture button:

1. **Browser may ask:** "Allow SketchRush to access your camera?"
   - ✅ Click **Allow**
   - ❌ Do NOT click Deny

2. **Allowed but still showing error?**
   - Check browser settings:
     - Chrome: Settings → Privacy → Camera → Allow localhost:5173
     - Firefox: Preferences → Privacy → Permissions → Camera
     - Edge: Settings → Privacy → Camera
     - Safari: System Preferences → Security & Privacy → Camera

### Step 4: Check Webcam Hardware

Ensure your webcam is actually connected and available:

```powershell
# Check for camera devices on Windows
Get-PnpDevice -Class Camera
```

If no camera is listed:

- ✅ Connect a USB webcam
- ✅ Enable built-in webcam in BIOS (if laptop)
- ✅ Make sure no other app (Zoom, Teams, Discord) is using the camera

### Step 5: Check Backend Logs

Look at the backend terminal for error messages when you click Gesture button:

**Good signs:**

```
✅ Webcam opened successfully, starting capture thread...
```

**Bad signs:**

```
❌ Failed to open webcam at index 0
❌ Webcam opened but cannot read frames
```

### Step 6: Restart Everything

Sometimes a clean restart fixes issues:

1. **Stop everything:**
   - Close the game in browser
   - Kill the backend (Ctrl+C in terminal)
   - Kill the frontend (Ctrl+C in terminal)

2. **Close websocket connections:**
   - Close all browser tabs with the game
   - Wait 5 seconds

3. **Restart in order:**

   ```bash
   # Terminal 1 - Start Backend
   cd backend && ./run.bat

   # Terminal 2 - Start Frontend
   cd frontend && ./run.bat
   ```

4. **Full browser restart:**
   - Close ALL browser windows
   - Clear browser cache (Ctrl+Shift+Delete)
   - Reopen the application

## Common Error Messages

### Error: "Webcam Not Available"

The GestureOverlay shows error "❌ Webcam Not Available"

**Causes & Solutions:**

1. **Backend not running**

   ```
   ✓ Check backend terminal shows "Uvicorn running on..."
   ✓ Stop and restart backend with ./run.bat
   ```

2. **Camera in use by another app**

   ```
   ✓ Close Zoom, Teams, Discord, OBS, etc.
   ✓ Check Windows Settings → Privacy → Camera (see what apps have access)
   ```

3. **Camera disabled in browser**

   ```
   ✓ Chrome: Settings → Privacy → Camera → Allow localhost:5173
   ✓ Firefox: Preferences → Privacy → Allow "http://localhost:5173"
   ```

4. **No webcam connected**
   ```
   ✓ Physical connection: Check USB cable
   ✓ Permissions: Windows Settings → Privacy → Camera
   ✓ Enable in BIOS if laptop: F2/F12 during startup
   ```

### Error: "Initializing webcam..." (Stuck loading)

The gesture overlay shows loading spinner for more than 5 seconds.

**Solutions:**

1. **Webcam startup is slow:**

   ```
   ✓ Wait 10-15 seconds (some cameras are slow to initialize)
   ✓ Close other programs using CPU
   ```

2. **Backend didn't start gesture capture:**

   ```
   ✓ Check backend terminal for errors
   ✓ Restart backend: Ctrl+C then ./run.bat
   ```

3. **Network/CORS issue:**
   ```
   ✓ Verify backend URL in env: VITE_BACKEND_URL=http://localhost:8000
   ✓ Check browser console (F12) for CORS errors
   ✓ Ensure backend has CORS enabled
   ```

### Error: "Gesture mode not active" in browser console

The image fails to load with error about gesture mode not active.

**Cause:** The `/gesture/feed` endpoint returned 400 error because `air_canvas.active` is False

**Solutions:**

1. **Gesture didn't start on backend:**

   ```python
   # Check backend logs for:
   ✓ "Webcam opened successfully" = GOOD
   ✓ "Failed to open webcam" = BAD
   ```

2. **Only drawer can use gestures:**

   ```
   ✓ Make sure you are the DRAWER (word displayed in header)
   ✓ Non-drawers cannot start gesture mode
   ✓ Wait for your turn or start a new game
   ```

3. **Incomplete Socket.IO connection:**
   ```
   ✓ Check Network tab in F12 for /socket.io/ errors
   ✓ Restart frontend: Ctrl+C then ./run.bat
   ✓ Restart backend: Ctrl+C then ./run.bat
   ```

## Advanced Diagnostics

### Check Backend Console Output

When you click Gesture button, the backend terminal should show:

```
[Detailed expected messages]
- "Attempting to open webcam..."
- "✅ Webcam opened successfully..."
- Socket event "start_gesture" received
```

### Check Browser Console (Press F12)

1. Open browser DevTools (F12)
2. Click Console tab
3. Click Gesture button
4. Look for errors like:
   - `[GestureOverlay] Failed to load MJPEG feed from http://localhost:8000/gesture/feed`
   - CORS errors
   - Network errors

### Check Network Tab (F12)

1. Open DevTools Network tab
2. Click Gesture button
3. Look for:
   - Socket.IO "start_gesture" message (should be green)
   - `/gesture/feed` request (should return image/mjpeg)
   - If `/gesture/feed` returns 400, error is in backend

### Test Endpoints Directly

```powershell
# 1. Health check
Invoke-WebRequest http://localhost:8000/health

# 2. Gesture status (before starting)
Invoke-WebRequest http://localhost:8000/gesture/status

# 3. Start gesture via REST (optional)
Invoke-WebRequest -Method POST http://localhost:8000/gesture/start
```

## Performance Tips

If gesture recognition is slow or laggy:

1. **Reduce browser tabs:** Close other tabs to free RAM
2. **Close background apps:** Teams, Discord, Chrome extensions
3. **Lower display resolution:** Some webcams perform better at 720p
4. **Reduce video quality:** Backend defaults to 75% JPEG quality

## Still Not Working?

1. **Collect debug info:**
   - Screenshot of error message
   - Backend terminal output
   - Browser console output (F12)

2. **Check these files:**
   - `/backend/API_GESTURES.md` - Full API documentation
   - `/backend/GESTURE_INTEGRATION.md` - Frontend integration guide
   - `/backend/app/gesture/air_canvas.py` - Gesture logic

3. **Restart cleanly:**

   ```bash
   # Kill all Python processes
   taskkill /F /IM python.exe

   # Kill all Node processes
   taskkill /F /IM node.exe

   # Wait 5 seconds
   # Restart backend and frontend
   ```

## Hardware Requirements

For gesture mode to work properly, you need:

- ✅ **Webcam:** USB or built-in camera
- ✅ **Good lighting:** Hand gestures need to be visible
- ✅ **Browser:** Chrome, Firefox, Edge (Safari has limited camera support)
- ✅ **RAM:** 6GB+ for backend + frontend
- ✅ **Network:** Localhost (no network latency needed)

## Browser Compatibility

| Browser | Gesture Support | Notes                |
| ------- | --------------- | -------------------- |
| Chrome  | ✅ Full Support | Recommended          |
| Firefox | ✅ Full Support | Works well           |
| Edge    | ✅ Full Support | Chromium-based       |
| Safari  | ⚠️ Limited      | MJPEG may not stream |
| Opera   | ✅ Full Support | Chromium-based       |

---

**Still need help?** Review the full documentation:

- [API_GESTURES.md](../API_GESTURES.md) - API reference
- [GESTURE_INTEGRATION.md](../GESTURE_INTEGRATION.md) - Integration guide
- [README.md](../README.md) - Setup guide
