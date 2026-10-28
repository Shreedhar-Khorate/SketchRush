/**
 * GestureOverlay — Client-Side MediaPipe Hand Tracking
 *
 * Replaces the old MJPEG server stream approach.
 * The browser now:
 *   1. Accesses the local webcam via getUserMedia
 *   2. Loads the MediaPipe HandLandmarker WASM model
 *   3. Runs gesture detection on every animation frame
 *   4. Calls onDraw() / onClear() directly — same payload as mouse drawing
 *
 * This works on any cloud deployment (no server webcam needed).
 */
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'

// ── Gesture IDs (mirrors Python backend logic) ─────────────────────────────
const GESTURE_DRAW  = 'draw'   // index finger up only
const GESTURE_MOVE  = 'move'   // index + middle up (hover, no draw)
const GESTURE_CLEAR = 'clear'  // fist (all fingers down)
const GESTURE_ERASE = 'erase'  // thumb-index pinch
const GESTURE_NONE  = 'none'

const GESTURE_META = {
  [GESTURE_DRAW]:  { icon: '☝️', label: 'Drawing',  color: 'var(--green)' },
  [GESTURE_MOVE]:  { icon: '✌️', label: 'Paused',   color: 'var(--blue)' },
  [GESTURE_CLEAR]: { icon: '✊', label: 'Clearing', color: 'var(--red)' },
  [GESTURE_ERASE]: { icon: '🤏', label: 'Erasing',  color: 'var(--amber)' },
  [GESTURE_NONE]:  { icon: '✋', label: 'Ready',    color: 'var(--text-muted)' },
}

// MediaPipe landmark indices
const TIP  = [4, 8, 12, 16, 20]   // thumb, index, middle, ring, pinky tips
const PIP  = [3, 6, 10, 14, 18]   // same fingers' PIP joints

// ── Drawing quality constants ───────────────────────────────────────────────
const SMOOTHING_ALPHA = 0.25   // EMA factor: lower=smoother/slower, higher=responsive/jittery
const MIN_MOVE_DIST   = 0.003  // normalised (0-1): skip micro-jitter under this distance
const SEND_INTERVAL   = 50    // ms between draw events sent to server (= 20fps cap)

// Frames a gesture must be stable before it fires (@ ~60fps)
// Destructive gestures need a long deliberate hold to avoid accidents
const STABLE_FRAMES = {
  [GESTURE_CLEAR]: 24,  // ~400ms hold to clear whole canvas
  [GESTURE_ERASE]: 8,   // ~130ms hold to enter erase mode
  [GESTURE_DRAW]:  2,   // near-instant (just debounce 1 frame)
  [GESTURE_MOVE]:  3,
  [GESTURE_NONE]:  2,
}

/**
 * Determine which fingers are raised.
 * Returns array of 1/0 for [thumb, index, middle, ring, pinky].
 * Mirrored frame so thumb check uses X axis.
 */
function fingersUp(lm) {
  const up = []
  // Thumb: tip.x < pip.x in mirrored frame
  up.push(lm[TIP[0]].x < lm[PIP[0]].x ? 1 : 0)
  // Other fingers: tip.y < pip.y means raised
  for (let i = 1; i < 5; i++) {
    up.push(lm[TIP[i]].y < lm[PIP[i]].y ? 1 : 0)
  }
  return up
}

function detectGesture(lm) {
  const up = fingersUp(lm)

  // Pinch distance (thumb tip → index tip), normalized 0-1
  const dx = lm[TIP[0]].x - lm[TIP[1]].x
  const dy = lm[TIP[0]].y - lm[TIP[1]].y
  const pinchDist = Math.sqrt(dx * dx + dy * dy)

  if (pinchDist < 0.06) return GESTURE_ERASE            // pinch
  if (up.reduce((a, b) => a + b, 0) === 0) return GESTURE_CLEAR // fist
  if (up[1] === 1 && up[2] === 0) return GESTURE_DRAW          // index only
  if (up[1] === 1 && up[2] === 1) return GESTURE_MOVE          // index+middle
  return GESTURE_NONE
}

// ── Component ──────────────────────────────────────────────────────────────

export default function GestureOverlay({
  active    = false,
  onDraw    = null,   // ({ x, y, prevX, prevY, color, size, isEraser, mode }) => void
  onClear   = null,   // () => void
  onClose   = null,   // () => void
  color     = '#0D1117',
  brushSize = 5,
  isEraser  = false,
}) {
  const videoRef    = useRef(null)
  const canvasRef   = useRef(null)
  const rafRef      = useRef(null)
  const landmarkerRef = useRef(null)
  const streamRef   = useRef(null)
  const prevPosRef       = useRef(null)   // { x, y } last smoothed draw point (raw MediaPipe coords)
  const prevGestureRef   = useRef(GESTURE_NONE)
  // New: smoothing, throttle, gesture stability
  const smoothedPosRef   = useRef(null)   // EMA-smoothed position
  const lastSendRef      = useRef(0)      // timestamp of last sendDraw call
  const stableRef        = useRef({ gesture: GESTURE_NONE, count: 0 }) // stability counter

  const [status, setStatus]   = useState('idle')   // idle | loading | active | error
  const [errorMsg, setErrorMsg] = useState('')
  const [gesture, setGesture] = useState(GESTURE_NONE)
  const [minimized, setMinimized] = useState(false)

  // Keep latest props in refs so the rAF loop always reads fresh values
  const colorRef     = useRef(color)
  const brushRef     = useRef(brushSize)
  const eraserRef    = useRef(isEraser)
  const onDrawRef    = useRef(onDraw)
  const onClearRef   = useRef(onClear)
  useEffect(() => { colorRef.current   = color     }, [color])
  useEffect(() => { brushRef.current   = brushSize }, [brushSize])
  useEffect(() => { eraserRef.current  = isEraser  }, [isEraser])
  useEffect(() => { onDrawRef.current  = onDraw    }, [onDraw])
  useEffect(() => { onClearRef.current = onClear   }, [onClear])
  // Reset minimized state when gesture mode is deactivated
  useEffect(() => { if (!active) setMinimized(false) }, [active])

  // ── Cleanup helper ────────────────────────────────────────────────────────
  const stopAll = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    prevPosRef.current     = null
    prevGestureRef.current  = GESTURE_NONE
    smoothedPosRef.current  = null
    lastSendRef.current     = 0
    stableRef.current       = { gesture: GESTURE_NONE, count: 0 }
  }, [])

  // ── Main rAF prediction loop ──────────────────────────────────────────────
  const predictLoop = useCallback(function loop() {
    const video     = videoRef.current
    const canvas    = canvasRef.current
    const landmarker = landmarkerRef.current

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop)
      return
    }

    const ctx = canvas.getContext('2d')
    canvas.width  = video.videoWidth
    canvas.height = video.videoHeight
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Run detection
    const nowMs = performance.now()
    let results
    try {
      results = landmarker.detectForVideo(video, nowMs)
    } catch {
      rafRef.current = requestAnimationFrame(predictLoop)
      return
    }

    let detectedGesture = GESTURE_NONE

    if (results.landmarks && results.landmarks.length > 0) {
      const lm = results.landmarks[0]

      detectedGesture = detectGesture(lm)

      // ── Gesture stability counter ──────────────────────────────────────────
      // Requires a gesture to be held for STABLE_FRAMES[gesture] frames
      // before it's considered "confirmed". This prevents accidental clear/erase.
      const stable = stableRef.current
      if (detectedGesture === stable.gesture) {
        stable.count = Math.min(stable.count + 1, 60) // cap to avoid overflow
      } else {
        stable.gesture = detectedGesture
        stable.count   = 1
      }
      const requiredFrames = STABLE_FRAMES[detectedGesture] ?? 3
      const confirmed = stable.count >= requiredFrames

      // Draw skeleton on overlay canvas
      drawSkeleton(ctx, lm, canvas.width, canvas.height, detectedGesture)

      // Raw index fingertip position (normalised 0-1 from MediaPipe)
      const ix = lm[TIP[1]].x
      const iy = lm[TIP[1]].y

      // ── EMA smoothing ──────────────────────────────────────────────────────
      // Exponential moving average reduces hand jitter without adding lag
      const prev = smoothedPosRef.current
      smoothedPosRef.current = prev
        ? {
            x: prev.x + SMOOTHING_ALPHA * (ix - prev.x),
            y: prev.y + SMOOTHING_ALPHA * (iy - prev.y),
          }
        : { x: ix, y: iy }
      const { x: sx, y: sy } = smoothedPosRef.current

      if (confirmed && detectedGesture === GESTURE_CLEAR
          && stable.count === requiredFrames) {
        // Fire ONCE exactly when the hold threshold is first reached
        if (onClearRef.current) onClearRef.current()
        prevPosRef.current    = null
        smoothedPosRef.current = null

      } else if (confirmed && (detectedGesture === GESTURE_DRAW || detectedGesture === GESTURE_ERASE)) {
        const prevPos = prevPosRef.current
        const nowMs   = performance.now()

        // ── Minimum movement gate ─────────────────────────────────────────────
        // Skip frames where the finger barely moved — eliminates fast micro-strokes
        const dist = prevPos
          ? Math.hypot(sx - prevPos.x, sy - prevPos.y)
          : Infinity

        // ── 20fps send throttle ───────────────────────────────────────────────
        // Limits server events to SEND_INTERVAL ms apart so other players
        // receive a steady stream without packet flooding
        const elapsed = nowMs - lastSendRef.current

        if (dist > MIN_MOVE_DIST && elapsed >= SEND_INTERVAL) {
          if (onDrawRef.current) {
            onDrawRef.current({
              // Flip x: video is CSS-mirrored (scaleX -1) so 1-sx maps
              // the finger position to the correct side of the drawing canvas
              x:        1 - sx,
              y:        sy,
              prevX:    prevPos ? 1 - prevPos.x : 1 - sx,
              prevY:    prevPos ? prevPos.y      : sy,
              color:    colorRef.current,
              size:     brushRef.current,
              isEraser: detectedGesture === GESTURE_ERASE || eraserRef.current,
              mode:     'gesture',
            })
          }
          prevPosRef.current = { x: sx, y: sy }  // store smoothed raw coords
          lastSendRef.current = nowMs
        }
      } else {
        // Any non-draw gesture breaks the current stroke
        prevPosRef.current = null
      }

      prevGestureRef.current = detectedGesture
    } else {
      // No hand detected — reset everything
      prevPosRef.current     = null
      smoothedPosRef.current = null
      stableRef.current      = { gesture: GESTURE_NONE, count: 0 }
      prevGestureRef.current = GESTURE_NONE
      detectedGesture        = GESTURE_NONE
    }

    setGesture(detectedGesture)
    rafRef.current = requestAnimationFrame(loop)
  }, [])

  // ── Initialize MediaPipe & webcam when active ─────────────────────────────
  useEffect(() => {
    if (!active) {
      stopAll()
      setStatus('idle')
      setGesture(GESTURE_NONE)
      return
    }

    let cancelled = false
    setStatus('loading')
    setErrorMsg('')

    async function init() {
      try {
        // 1. Load MediaPipe WASM
        if (!landmarkerRef.current) {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
          )
          const lm = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numHands: 1,
            minHandDetectionConfidence: 0.6,
            minHandPresenceConfidence:  0.5,
            minTrackingConfidence:      0.5,
          })
          if (cancelled) { lm.close(); return }
          landmarkerRef.current = lm
        }

        // 2. Open webcam
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }

        setStatus('active')

        // 3. Start prediction loop
        rafRef.current = requestAnimationFrame(predictLoop)
      } catch (err) {
        if (cancelled) return
        console.error('[GestureOverlay]', err)
        if (err.name === 'NotAllowedError') {
          setErrorMsg('Camera permission denied. Allow camera access and try again.')
        } else if (err.name === 'NotFoundError') {
          setErrorMsg('No webcam found. Connect a camera and try again.')
        } else {
          setErrorMsg(`Failed to start gesture mode: ${err.message}`)
        }
        setStatus('error')
      }
    }

    init()
    return () => {
      cancelled = true
      stopAll()
    }
  }, [active, predictLoop, stopAll])

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopAll()
      if (landmarkerRef.current) {
        landmarkerRef.current.close()
        landmarkerRef.current = null
      }
    }
  }, [stopAll])

  const info = GESTURE_META[gesture] || GESTURE_META[GESTURE_NONE]

  return (
    <AnimatePresence>
      {active && (
        minimized ? (
          // ── Minimized pill (Neo-Brutalism) ──
          <motion.div
            key="gesture-pill"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed right-3 sm:right-4 bottom-20 sm:bottom-4 z-40 bg-[#FFD84D] border-[2.5px] border-[#171717] shadow-[3.5px_3.5px_0px_#171717] px-2.5 sm:px-3 py-1.5 flex items-center gap-1.5 sm:gap-2"
          >
            <span className="text-sm">✋</span>
            {status === 'active' && (
              <span className="text-xs font-black uppercase text-[#171717]">
                {info.icon} {info.label}
              </span>
            )}
            {status === 'loading' && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block text-xs"
              >⚙️</motion.span>
            )}
            <button
              type="button"
              onClick={() => setMinimized(false)}
              title="Expand gesture panel"
              className="px-2 py-0.5 bg-white border border-[#171717] text-[10px] font-black uppercase cursor-pointer hover:bg-[#FFF8E7]"
            >▲</button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="px-2 py-0.5 bg-[#FF6B6B] text-white border border-[#171717] text-[10px] font-black uppercase cursor-pointer"
              >✕ STOP</button>
            )}
          </motion.div>
        ) : (
          // ── Full PiP monitor (Neo-Brutalism) ──
          <motion.div
            key="gesture-overlay"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.2 }}
            className="fixed right-3 sm:right-4 bottom-20 sm:bottom-4 w-60 sm:w-64 max-w-[88vw] z-40 bg-white border-[2.5px] border-[#171717] shadow-[4px_4px_0px_#171717] sm:shadow-[5px_5px_0px_#171717] overflow-hidden flex flex-col"
          >
            {/* ── Header ── */}
            <div className="bg-[#FFD84D] border-b-2 border-[#171717] px-3 py-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">✋</span>
                <span className="font-black text-xs uppercase text-[#171717]">
                  AIR CANVAS AI
                </span>
                {status === 'active' && (
                  <span className="w-2 h-2 rounded-full bg-[#10B981] border border-black animate-pulse" />
                )}
                {status === 'loading' && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="inline-block text-xs"
                  >⚙️</motion.span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {/* Gesture badge */}
                <AnimatePresence mode="wait">
                  {status === 'active' && (
                    <motion.div
                      key={gesture}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="px-2 py-0.5 bg-white border border-[#171717] text-[10px] font-black uppercase text-[#171717]"
                    >
                      <span>{info.icon} {info.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Minimize button */}
                <button
                  type="button"
                  onClick={() => setMinimized(true)}
                  title="Minimize panel"
                  className="w-5 h-5 bg-white border border-[#171717] text-[10px] font-black flex items-center justify-center cursor-pointer hover:bg-[#FFF8E7]"
                >▼</button>

                {/* Stop button */}
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-5 h-5 bg-[#FF6B6B] text-white border border-[#171717] text-[10px] font-black flex items-center justify-center cursor-pointer"
                  >✕</button>
                )}
              </div>
            </div>

            {/* ── Video / Status area ── */}
            <div className="relative w-full bg-[#171717] min-h-[130px] border-b-2 border-[#171717]">

              {/* Loading state */}
              {status === 'loading' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#FFF8E7] text-center p-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    className="text-2xl"
                  >⚙️</motion.div>
                  <div className="font-black text-xs uppercase text-[#171717]">Loading AI Model...</div>
                  <div className="text-[10px] font-bold text-[#6B7280]">Initializing MediaPipe Vision</div>
                </div>
              )}

              {/* Error state */}
              {status === 'error' && (
                <div className="w-full min-h-[130px] flex flex-col items-center justify-center gap-2 bg-[#FFE5E5] p-3 text-center">
                  <div className="text-2xl">❌</div>
                  <div className="font-black text-xs uppercase text-[#FF0033]">
                    Camera Access Failed
                  </div>
                  <div className="text-[10px] font-bold text-[#454545] leading-tight">
                    {errorMsg}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-1 px-3 py-1 bg-[#FF6B6B] text-white border border-[#171717] font-black text-[10px] uppercase cursor-pointer"
                  >CLOSE</button>
                </div>
              )}

              {/* Webcam video feed */}
              <video
                ref={videoRef}
                muted
                playsInline
                style={{
                  width: '100%',
                  display: status === 'active' ? 'block' : 'none',
                  maxHeight: '140px',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%',
                  pointerEvents: 'none',
                  display: status === 'active' ? 'block' : 'none',
                  transform: 'scaleX(-1)',
                }}
              />

              {/* Live overlay tag */}
              {status === 'active' && (
                <div className="absolute bottom-2 left-2 flex gap-1 z-10">
                  <span className="px-1.5 py-0.5 bg-[#FFD84D] border border-black text-[9px] font-black uppercase">
                    📷 WEBCAM
                  </span>
                  <span className="px-1.5 py-0.5 bg-[#B7F56A] border border-black text-[9px] font-black uppercase">
                    AI TRACK
                  </span>
                </div>
              )}
            </div>

            {/* ── Compact Gesture Quick Sheet ── */}
            <div className="p-2 bg-[#FFF8E7] flex flex-col gap-1">
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-1 bg-white border border-[#171717] flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="text-xs">☝️</span>
                  <span>Index: DRAW</span>
                </div>
                <div className="p-1 bg-white border border-[#171717] flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="text-xs">✌️</span>
                  <span>Two: PAUSE</span>
                </div>
                <div className="p-1 bg-white border border-[#171717] flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="text-xs">🤏</span>
                  <span>Pinch: ERASE</span>
                </div>
                <div className="p-1 bg-white border border-[#171717] flex items-center gap-1.5 text-[10px] font-bold">
                  <span className="text-xs">✊</span>
                  <span>Fist: CLEAR</span>
                </div>
              </div>
            </div>
          </motion.div>
        )
      )}
    </AnimatePresence>
  )
}

// ── Skeleton drawing helper ────────────────────────────────────────────────

const CONNECTIONS = [
  [0,1],[1,2],[2,3],[3,4],           // thumb
  [0,5],[5,6],[6,7],[7,8],           // index
  [0,9],[9,10],[10,11],[11,12],      // middle
  [0,13],[13,14],[14,15],[15,16],    // ring
  [0,17],[17,18],[18,19],[19,20],    // pinky
  [5,9],[9,13],[13,17],              // palm
]

function drawSkeleton(ctx, lm, w, h, gesture) {
  const dotColor  = gesture === GESTURE_DRAW  ? '#3FB950'
                  : gesture === GESTURE_CLEAR ? '#F85149'
                  : gesture === GESTURE_ERASE ? '#F0A500'
                  : '#2F81F7'
  const lineColor = `${dotColor}66`

  ctx.lineWidth = 1.5
  ctx.strokeStyle = lineColor

  // Draw connections
  for (const [a, b] of CONNECTIONS) {
    ctx.beginPath()
    ctx.moveTo(lm[a].x * w, lm[a].y * h)
    ctx.lineTo(lm[b].x * w, lm[b].y * h)
    ctx.stroke()
  }

  // Draw landmark dots
  for (let i = 0; i < lm.length; i++) {
    const r = i === TIP[1] ? 5 : 3   // index tip is larger
    ctx.beginPath()
    ctx.arc(lm[i].x * w, lm[i].y * h, r, 0, Math.PI * 2)
    ctx.fillStyle = i === TIP[1] ? dotColor : `${dotColor}cc`
    ctx.fill()
  }
}
