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
  const predictLoop = useCallback(() => {
    const video     = videoRef.current
    const canvas    = canvasRef.current
    const landmarker = landmarkerRef.current

    if (!video || !canvas || !landmarker || video.readyState < 2) {
      rafRef.current = requestAnimationFrame(predictLoop)
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
    rafRef.current = requestAnimationFrame(predictLoop)
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
          // ── Minimized PiP pill — canvas fully unoccluded ───────────────────
          <motion.div
            key="gesture-pip-min"
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.9 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              right: '16px',
              bottom: '16px',
              zIndex: 32,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'var(--surface)',
              border: '2.5px solid var(--line)',
              boxShadow: '3px 3px 0 var(--shadow)',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontSize: '16px' }}>✋</span>
            {status === 'active' && (
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text)' }}>
                {info.icon} {info.label}
              </span>
            )}
            {status === 'loading' && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block', fontSize: '13px' }}
              >⚙️</motion.span>
            )}
            <button
              onClick={() => setMinimized(false)}
              title="Expand gesture panel"
              style={{
                padding: '4px 8px', borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '1.5px solid var(--line)',
                color: 'var(--text)',
                fontSize: '11px', fontWeight: 800,
                cursor: 'pointer',
              }}
            >▲</button>
            {onClose && (
              <button
                onClick={onClose}
                style={{
                  padding: '4px 8px', borderRadius: '8px',
                  background: 'var(--coral)',
                  border: '1.5px solid var(--line)',
                  color: 'var(--text)',
                  fontSize: '11px', fontWeight: 800,
                  cursor: 'pointer',
                }}
              >✕ Stop</button>
            )}
          </motion.div>
        ) : (
          // ── Full PiP panel (compact, bottom-right, canvas stays visible) ──
          <motion.div
            key="gesture-overlay"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.94, y: 12  }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position:  'fixed',
              right:     '16px',
              bottom:    '16px',
              width:     '240px',
              maxWidth:  '92vw',
              zIndex:    32,
              borderRadius: '16px',
              overflow:  'hidden',
              background: 'var(--surface)',
              border:    '3px solid var(--line)',
              boxShadow: '6px 6px 0 var(--shadow)',
              fontFamily: 'var(--font-body)',
            }}
          >
            {/* ── Header ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '2px solid var(--line)',
              background: 'var(--surface-2)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '15px' }}>✋</span>
                <span style={{ fontWeight: 700, fontSize: '11px', color: 'var(--text)' }}>
                  Gesture Mode
                </span>
                {status === 'active' && (
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: 'var(--green)',
                    display: 'inline-block',
                    animation: 'pulse 1.5s infinite',
                  }} />
                )}
                {status === 'loading' && (
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'inline-block', fontSize: '11px' }}
                  >⚙️</motion.span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {/* Gesture badge */}
                <AnimatePresence mode="wait">
                  {status === 'active' && (
                    <motion.div
                      key={gesture}
                      initial={{ opacity: 0, x: 4 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{   opacity: 0, x: -4 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '2px 7px', borderRadius: '99px',
                        background: `color-mix(in srgb, ${info.color} 15%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${info.color} 35%, transparent)`,
                        fontSize: '10px', fontWeight: 700, color: info.color,
                      }}
                    >
                      <span>{info.icon}</span>
                      <span>{info.label}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Minimize button */}
                <button
                  onClick={() => setMinimized(true)}
                  title="Minimize to pill"
                  style={{
                    padding: '3px 7px', borderRadius: '7px',
                    background: 'rgba(99,120,255,0.12)',
                    border: '1px solid rgba(99,120,255,0.25)',
                    color: 'var(--text-muted)',
                    fontSize: '10px', fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                >▼</button>

                {/* Stop button */}
                {onClose && (
                  <button
                    onClick={onClose}
                    style={{
                      padding: '3px 7px', borderRadius: '7px',
                      background: 'rgba(248,81,73,0.12)',
                      border: '1px solid rgba(248,81,73,0.3)',
                      color: 'var(--red)',
                      fontSize: '10px', fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                    }}
                  >✕</button>
                )}
              </div>
            </div>

            {/* ── Video / Status area (compact PiP size) ── */}
            <div style={{ position: 'relative', width: '100%', background: '#000', minHeight: '130px' }}>

              {/* Loading state */}
              {status === 'loading' && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 4,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', background: 'rgba(6,9,24,0.95)',
                  color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center', padding: '16px',
                }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                    style={{ fontSize: '26px' }}
                  >⚙️</motion.div>
                  <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: '11px' }}>Loading AI Model…</div>
                  <div style={{ fontSize: '10px', opacity: 0.7 }}>First time may take a moment</div>
                </div>
              )}

              {/* Error state */}
              {status === 'error' && (
                <div style={{
                  width: '100%', minHeight: '130px',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: '8px', background: 'rgba(248,81,73,0.06)',
                  padding: '16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: '28px' }}>❌</div>
                  <div style={{ fontWeight: 700, color: 'var(--red)', fontSize: '11px' }}>
                    Gesture Mode Failed
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {errorMsg}
                  </div>
                  <button
                    onClick={onClose}
                    style={{
                      marginTop: '4px', padding: '6px 14px', borderRadius: '8px',
                      background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,0.3)',
                      color: 'var(--red)', fontWeight: 700, fontSize: '11px', cursor: 'pointer',
                    }}
                  >Close</button>
                </div>
              )}

              {/* Webcam video — compact PiP max 140px tall */}
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

              {/* Live labels */}
              {status === 'active' && (
                <div style={{
                  position: 'absolute', bottom: '6px', left: '6px',
                  display: 'flex', gap: '4px', zIndex: 5,
                }}>
                  <span className="badge badge-brand" style={{ opacity: 0.85, fontSize: '9px', padding: '2px 6px' }}>
                    📷 Cam
                  </span>
                  <span className="badge badge-green" style={{ opacity: 0.85, fontSize: '9px', padding: '2px 6px' }}>
                    🤖 AI
                  </span>
                </div>
              )}
            </div>

            {/* ── Compact Gesture Guide ── */}
            <div style={{
              padding: '8px 12px',
              borderTop: '2px solid var(--line)',
              background: 'var(--surface-2)',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { icon: '☝️', label: 'Draw',   color: 'var(--text)' },
                  { icon: '✌️', label: 'Pause',  color: 'var(--text)' },
                  { icon: '✊', label: 'Clear',  color: 'var(--text)' },
                  { icon: '🤏', label: 'Erase',  color: 'var(--text)' },
                ].map(g => (
                  <div key={g.label} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 8px', borderRadius: '8px',
                    background: 'var(--surface)',
                    border: '1.5px solid var(--line)',
                    boxShadow: '1.5px 1.5px 0 var(--shadow)',
                    fontSize: '11px', fontWeight: 800, color: g.color,
                  }}>
                    <span style={{ fontSize: '13px' }}>{g.icon}</span>
                    <span>{g.label}</span>
                  </div>
                ))}
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
