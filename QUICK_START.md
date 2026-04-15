# 🎮 SketchRush - Quick Start (Fixed!)

## What Was Fixed

✅ **Bug: Air Canvas Camera Not Working**

- Fixed `_combined_frame` initialization issue in air_canvas.py
- Added better error detection and error messages in GestureOverlay
- Improved webcam startup logging for debugging

✅ **Improvements Made:**

- Better error handling with loading states
- Clear error messages when webcam fails
- Detailed troubleshooting guide
- Easy startup scripts (run.bat)

---

## 🚀 Quick Start

### Terminal 1: Start Backend

```bash
cd backend
./run.bat
```

**✅ Wait for:**

```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2: Start Frontend

```bash
cd frontend
./run.bat
```

**✅ Wait for:**

```
  ➜  Local:   http://localhost:5173
```

### Terminal 3: Open in Browser

```bash
# Open browser to:
http://localhost:5173
```

---

## 🎨 Using Air Canvas (Gesture Mode)

### Step 1: Start a Game

1. Enter your name
2. Create or join a room
3. Start the game when everyone is ready

### Step 2: When It's Your Turn to Draw

- Look for **"🎨 You're Drawing"** in the header
- Look for the **"✋ Gesture"** button in the toolbar

### Step 3: Activate Gesture Mode

1. Click the **"✋ Gesture"** button
2. Allow browser to access camera when prompted
3. A camera window will appear

### Step 4: Draw with Hand Gestures

| Gesture                    | Action                   |
| -------------------------- | ------------------------ |
| 👆 **Index finger up**     | Draw on canvas           |
| ✌️ **Two fingers up**      | Move cursor (no drawing) |
| 👌 **Pinch (thumb+index)** | Stop drawing / Erase     |
| ✊ **Fist**                | Clear entire canvas      |

### Step 5: Control Drawing

- **Color:** Click any color in the toolbar
- **Brush Size:** Use Size selector (S, M, L)
- **Eraser:** Click 🧹 button
- **Clear:** Click 🗑️ button
- **Exit:** Click the ✕ button in gesture window

---

## 🆘 Camera Not Working?

### Quick Checklist

- [ ] Backend is running? (Check Terminal 1)
- [ ] Browser allowed camera? (Allow when prompted)
- [ ] You're the drawer? (Check header for word)
- [ ] Webcam is connected? (Check laptop/USB)

### Still not working?

See: [GESTURE_TROUBLESHOOTING.md](./GESTURE_TROUBLESHOOTING.md)

---

## 📊 What Happens Behind the Scenes

```
1. You click ✋ Gesture
   ↓
2. Frontend sends "start_gesture" via Socket.IO
   ↓
3. Backend starts webcam capture (in background thread)
   ↓
4. Browser requests /gesture/feed endpoint
   ↓
5. Backend streams MJPEG video from webcam
   ↓
6. MediaPipe detects hand landmarks
   ↓
7. Drawing sent to canvas via Socket.IO
   ↓
8. Other players see your drawing in real-time
```

---

## 🎯 Files That Were Fixed

### Backend

- **`app/gesture/air_canvas.py`**
  - Fixed: `_combined_frame` initialization
  - Added: Better error logging in `start_capture()`
  - Added: Webcam availability check

- **`main.py`**
  - Already had all gesture endpoints
  - No changes needed

### Frontend

- **`components/GestureOverlay.jsx`**
  - Added: Error state detection
  - Added: Loading indicator
  - Added: User-friendly error messages
  - Added: Helpful troubleshooting hints

- **`hooks/useSocket.js`**
  - Already properly implemented
  - No changes needed

### New Files

- **`backend/run.bat`** - Easy startup script
- **`frontend/run.bat`** - Easy startup script
- **`backend/GESTURE_TROUBLESHOOTING.md`** - Detailed troubleshooting guide

---

## ✨ Tips for Best Results

### Optimal Setup

1. **Lighting**: Good lighting on your hand (not backlit)
2. **Distance**: Arm's length away from webcam
3. **Hand visibility**: Keep entire hand in frame
4. **Clear background**: Avoid cluttered backgrounds
5. **Webcam position**: Camera at eye level

### Hand Gestures

- **Draw Gesture**: Slow, smooth movements
- **Move Gesture**: Quick hovering to change position
- **Pinch Gesture**: Thumb and index very close (< 40px)
- **Clear Gesture**: Full fist, all fingers down

### Performance

- Close other apps (Zoom, Teams, Discord)
- Close other browser tabs
- Disable browser extensions if slow
- Ensure backend has sufficient CPU

---

## 🔧 Troubleshooting Checklist

If **camera window is blank/black**:

1. ✓ Backend is running (`run.bat`)
2. ✓ Browser allowed camera access
3. ✓ Webcam LED is on
4. ✓ No other app using camera
5. ✓ Browser cache cleared (Ctrl+Shift+Delete)

If **"Initializing webcam..." spinner won't stop**:

1. ✓ Restart backend (Ctrl+C, then run.bat)
2. ✓ Close other camera apps
3. ✓ Disconnect/reconnect webcam
4. ✓ Restart browser completely

If **hand not being detected**:

1. ✓ Better lighting needed
2. ✓ Keep entire hand in frame
3. ✓ Steady hand position
4. ✓ Check backend console for "gesture_detected"

---

## 📞 Need Help?

### Documentation

- [GESTURE_TROUBLESHOOTING.md](./GESTURE_TROUBLESHOOTING.md) - Detailed troubleshooting
- [API_GESTURES.md](./API_GESTURES.md) - Full API reference
- [GESTURE_INTEGRATION.md](./GESTURE_INTEGRATION.md) - Integration guide
- [README.md](./README.md) - Setup and overview

### Check Logs

- **Backend logs**: Terminal where you ran `run.bat`
- **Browser logs**: Press F12 → Console tab
- **Network logs**: Press F12 → Network tab

---

## 🎉 You're All Set!

Everything should now work smoothly:

```
✅ Backend running (run.bat)
✅ Frontend running (run.bat)
✅ Camera window loads properly
✅ Hand gestures detected
✅ Drawing synced to all players
✅ Real-time multiplayer drawing!
```

**Enjoy the game!** 🚀

---

**Last Updated:** April 15, 2026
**Backend Version:** 2.0.0 (with fixes)
**Status:** ✅ Production Ready
