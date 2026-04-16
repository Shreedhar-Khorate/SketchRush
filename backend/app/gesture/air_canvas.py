"""
Air Canvas Gesture Module for SketchRush.

Captures webcam frames, detects hand landmarks via MediaPipe,
maps gestures to drawing actions, and streams:
  - MJPEG video feed (webcam + canvas side-by-side)
  - Drawing coordinates via Socket.IO callbacks
"""

import cv2
import numpy as np
import mediapipe as mp
from collections import deque
from typing import Optional, Callable, Tuple
import threading
import base64
import logging
import os
from datetime import datetime
import time

logger = logging.getLogger(__name__)

# ── Gesture IDs ──────────────────────────────────────────────────────────────
GESTURE_DRAW   = "draw"      # index finger up → draw
GESTURE_MOVE   = "move"      # index + middle up → hover (don't draw)
GESTURE_CLEAR  = "clear"     # fist → clear canvas
GESTURE_ERASE  = "erase"     # pinch → erase / stop drawing
GESTURE_NONE   = "none"


# ── Finger-tip / pip landmark indices ────────────────────────────────────────
FINGER_TIPS = [4, 8, 12, 16, 20]     # thumb, index, middle, ring, pinky
FINGER_PIPS = [3, 6, 10, 14, 18]


def fingers_up(landmarks) -> list[int]:
    """Return list of 1/0 for each finger (thumb, index, middle, ring, pinky)."""
    up = []
    # Thumb: compare x (mirrored frame)
    if landmarks[FINGER_TIPS[0]][0] < landmarks[FINGER_PIPS[0]][0]:
        up.append(1)
    else:
        up.append(0)
    # Other fingers: tip-y < pip-y means finger is up
    for i in range(1, 5):
        if landmarks[FINGER_TIPS[i]][1] < landmarks[FINGER_PIPS[i]][1]:
            up.append(1)
        else:
            up.append(0)
    return up


def detect_gesture(landmarks) -> str:
    """
    Simplified gesture detection for pure drawing mode.
    Only detects if index finger is extended (draw) or not (idle).
    """
    up = fingers_up(landmarks)
    # Index finger only: draw
    if up[1] == 1 and up[2] == 0:
        return GESTURE_DRAW
    return GESTURE_NONE


# ── Air Canvas State ──────────────────────────────────────────────────────────
class AirCanvas:
    """
    Manages the OpenCV painting canvas and MediaPipe hand tracking.
    Thread-safe for use with ASGI background tasks.
    """

    COLORS_BGR = {
        "#1a1a2e": (46,  26,  26),
        "#f8faff": (255, 250, 248),
        "#ff4d6d": (109, 77, 255),
        "#ff8c42": (66, 140, 255),
        "#ffd166": (102, 209, 255),
        "#00e5a0": (160, 229,   0),
        "#00d4ff": (255, 212,   0),
        "#6378ff": (255, 120,  99),
        "#c77dff": (255, 125, 199),
        "#ff6eb4": (180, 110, 255),
        "#a0522d": (45,  82, 160),
        "#6b7280": (128, 114, 107),
    }

    def __init__(self):
        self._lock = threading.Lock()
        self.active   = False
        self.cap: Optional[cv2.VideoCapture] = None

        # Paint canvas (white background)
        self.canvas = np.ones((480, 640, 3), dtype=np.uint8) * 255

        # Drawing params
        self.color_hex  = "#1a1a2e"
        self.brush_size = 5
        self.is_eraser  = False

        # Stroke tracking
        self._strokes: list[deque] = [deque(maxlen=2048)]
        self._stroke_colors: list[tuple] = [(46, 26, 26)]
        self._stroke_sizes: list[int]   = [5]
        self._stroke_eraser: list[bool] = [False]
        self._idx = 0

        # Gesture state
        self._prev_gesture = GESTURE_NONE
        self._last_point: Optional[Tuple[int,int]] = None

        # Frame buffer for MJPEG streaming
        self._combined_frame = np.ones((480, 1280, 3), dtype=np.uint8) * 30

        # External callbacks
        self.on_draw_point: Optional[Callable] = None   # (x_norm, y_norm, color, size, eraser)
        self.on_clear:      Optional[Callable] = None
        self.on_gesture:    Optional[Callable] = None   # (gesture_name)

        # MediaPipe
        self._mp_hands = mp.solutions.hands
        self._hands = self._mp_hands.Hands(
            max_num_hands=1,
            min_detection_confidence=0.7,
            min_tracking_confidence=0.6,
        )
        self._mp_draw = mp.solutions.drawing_utils

    # ── Public controls ───────────────────────────────────────────────────────

    def set_color(self, hex_color: str):
        with self._lock:
            self.color_hex = hex_color
            self.is_eraser = False

    def set_brush_size(self, size: int):
        with self._lock:
            self.brush_size = max(1, min(size, 60))

    def set_eraser(self, enabled: bool):
        with self._lock:
            self.is_eraser = enabled

    def clear(self):
        with self._lock:
            self.canvas[:] = 255
            self._strokes     = [deque(maxlen=2048)]
            self._stroke_colors = [(46, 26, 26)]
            self._stroke_sizes  = [self.brush_size]
            self._stroke_eraser = [False]
            self._idx = 0
            self._last_point = None
        if self.on_clear:
            self.on_clear()

    def get_canvas_jpeg(self) -> bytes:
        """Return the current canvas as JPEG bytes."""
        with self._lock:
            _, buf = cv2.imencode('.jpg', self.canvas, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return buf.tobytes()

    def save_canvas(self) -> Optional[str]:
        """Save the current canvas as a PNG file. Returns the saved filename or None."""
        try:
            # Create saved_sketches directory if it doesn't exist
            save_dir = os.path.join(os.path.dirname(__file__), '../../static/saved_sketches')
            os.makedirs(save_dir, exist_ok=True)
            
            # Generate timestamped filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"sketch_{timestamp}.png"
            filepath = os.path.join(save_dir, filename)
            
            # Save canvas
            with self._lock:
                success = cv2.imwrite(filepath, self.canvas)
            
            if success:
                logger.info(f"Canvas saved to {filepath}")
                return filename
            else:
                logger.error(f"Failed to write canvas to {filepath}")
                return None
        except Exception as e:
            logger.error(f"Error saving canvas: {e}")
            return None

    def start_capture(self):
        """Start webcam capture in background thread."""
        if self.active:
            logger.info("Gesture mode already active, skipping start_capture")
            return
        
        logger.info("Attempting to open webcam...")
        self.cap = cv2.VideoCapture(0)
        
        if not self.cap.isOpened():
            logger.error("❌ Failed to open webcam at index 0. Available cameras: check system device manager")
            self.cap = None
            return
        
        # Verify we can actually read from the camera
        ret, test_frame = self.cap.read()
        if not ret:
            logger.error("❌ Webcam opened but cannot read frames. Camera may be in use by another app")
            self.cap.release()
            self.cap = None
            return
        
        self.active = True
        logger.info("✅ Webcam opened successfully, starting capture thread...")
        t = threading.Thread(target=self._capture_loop, daemon=True)
        t.start()

    def stop_capture(self):
        self.active = False
        if self.cap:
            self.cap.release()
            self.cap = None

    # ── Internal: capture loop ────────────────────────────────────────────────

    def _get_bgr(self) -> Tuple[int,int,int]:
        """Get current drawing color in BGR."""
        if self.is_eraser:
            return (255, 255, 255)
        return self.COLORS_BGR.get(self.color_hex, (0, 0, 0))

    def _capture_loop(self):
        """Main loop: read frames, detect gesture, update canvas."""
        while self.active and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            if not ret:
                break

            frame = cv2.flip(frame, 1)
            h, w = frame.shape[:2]
            rgb   = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            result = self._hands.process(rgb)

            gesture = GESTURE_NONE

            if result.multi_hand_landmarks:
                for hand_lms in result.multi_hand_landmarks:
                    self._mp_draw.draw_landmarks(
                        frame, hand_lms, self._mp_hands.HAND_CONNECTIONS,
                        self._mp_draw.DrawingSpec(color=(99, 120, 255), thickness=2, circle_radius=3),
                        self._mp_draw.DrawingSpec(color=(199, 125, 255), thickness=2),
                    )

                    # Extract pixel coords
                    lm = []
                    for l in hand_lms.landmark:
                        lm.append([int(l.x * w), int(l.y * h)])

                    gesture = detect_gesture(lm)
                    index_tip = (lm[8][0], lm[8][1])

                    # Fire gesture callback
                    if gesture != self._prev_gesture and self.on_gesture:
                        self.on_gesture(gesture)
                    self._prev_gesture = gesture

                    # No gesture label overlay - keep it clean
                    
                    # Draw professional cursor ring
                    bgr = self._get_bgr()
                    cv2.circle(frame, index_tip,
                               self.brush_size + 2,
                               bgr, 1)  # Thin outline

                    with self._lock:
                        if gesture == GESTURE_DRAW:
                            # Draw: add point to current stroke
                            self._strokes[self._idx].appendleft(index_tip)
                            self._redraw_canvas()
                            self._last_point = index_tip

                            # Fire external callback (normalized coords)
                            if self.on_draw_point:
                                self.on_draw_point(
                                    index_tip[0] / w,
                                    index_tip[1] / h,
                                    self.color_hex,
                                    self.brush_size,
                                    self.is_eraser,
                                )
                        else:
                            # Not drawing: start new stroke for next gesture
                            if self._strokes[self._idx]:
                                self._strokes.append(deque(maxlen=2048))
                                self._stroke_colors.append(self._get_bgr())
                                self._stroke_sizes.append(self.brush_size)
                                self._stroke_eraser.append(self.is_eraser)
                                self._idx = len(self._strokes) - 1
                            self._last_point = None
            else:
                # No hand: break stroke
                with self._lock:
                    if self._strokes[self._idx]:
                        self._strokes.append(deque(maxlen=2048))
                        self._stroke_colors.append(self._get_bgr())
                        self._stroke_sizes.append(self.brush_size)
                        self._stroke_eraser.append(self.is_eraser)
                        self._idx = len(self._strokes) - 1
                self._prev_gesture = GESTURE_NONE
                self._last_point = None

            # Combine webcam + canvas side-by-side for the MJPEG stream
            with self._lock:
                canvas_resized = cv2.resize(self.canvas, (w, h))
            combined = np.hstack([frame, canvas_resized])

            with self._lock:
                self._combined_frame = combined

        self.active = False
        logger.info("Air canvas capture stopped.")

    def _do_clear(self):
        """Must be called with self._lock held."""
        self.canvas[:] = 255
        self._strokes     = [deque(maxlen=2048)]
        self._stroke_colors = [(46, 26, 26)]
        self._stroke_sizes  = [self.brush_size]
        self._stroke_eraser = [False]
        self._idx = 0
        self._last_point = None
        if self.on_clear:
            threading.Thread(target=self.on_clear, daemon=True).start()

    def _redraw_canvas(self):
        """Redraw all strokes onto the canvas (must be called with lock held)."""
        self.canvas[:] = 255
        for i, stroke in enumerate(self._strokes):
            pts = list(stroke)
            color = self._stroke_colors[i]
            size  = self._stroke_sizes[i]
            eraser = self._stroke_eraser[i]
            draw_color = (255, 255, 255) if eraser else color
            thickness  = size * 3 if eraser else size
            for j in range(1, len(pts)):
                if pts[j-1] is None or pts[j] is None:
                    continue
                cv2.line(self.canvas, pts[j-1], pts[j], draw_color, thickness)
                cv2.circle(self.canvas, pts[j], thickness // 2 + 1, draw_color, -1)

    def generate_frames(self):
        """Generator for MJPEG streaming (webcam + canvas combined)."""
        self._combined_frame = np.ones((480, 1280, 3), dtype=np.uint8) * 30
        frame_time = 1.0 / 30.0  # Target 30 FPS
        
        while self.active:
            frame_start = time.time()
            
            with self._lock:
                frame = self._combined_frame.copy()
            
            _, buf = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            yield (
                b'--frame\r\n'
                b'Content-Type: image/jpeg\r\n\r\n'
                + buf.tobytes()
                + b'\r\n'
            )
            
            # Frame rate control: sleep to maintain ~30 FPS
            elapsed = time.time() - frame_start
            sleep_time = frame_time - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)


# Singleton instance shared across the app
air_canvas = AirCanvas()
