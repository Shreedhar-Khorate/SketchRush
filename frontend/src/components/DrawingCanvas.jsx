import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DrawingCanvas({
  color = '#1a1a2e',
  brushSize = 5,
  isEraser = false,
  clearSignal = 0,
  isDrawing = false,          // true = this client is the drawer
  onDraw = null,              // (strokeData) → void  sent to server
  onClearCanvas = null,       // () → void  sent to server
  onRemoteDraw = null,        // ref — set to the remote-draw handler
  onRemoteClear = null,       // ref — set to the remote-clear handler
}) {
  const canvasRef     = useRef(null)
  const isMouseDown   = useRef(false)
  const lastPos       = useRef({ x: 0, y: 0 })
  const [showClearFx, setShowClearFx]   = useState(false)
  const [cursorPos, setCursorPos]       = useState({ x: -200, y: -200 })
  const [isOnCanvas, setIsOnCanvas]     = useState(false)

  // ── Canvas init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = 800
    canvas.height = 600
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, 800, 600)
  }, [])

  // ── Clear signal (local toolbar button) ───────────────────────────────────
  useEffect(() => {
    if (clearSignal < 1) return
    _clearCanvas()
    if (onClearCanvas) onClearCanvas()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clearSignal])

  // ── Register remote draw/clear handlers via refs ──────────────────────────
  useEffect(() => {
    if (onRemoteDraw)  onRemoteDraw.current  = _applyRemoteDraw
    if (onRemoteClear) onRemoteClear.current = _clearCanvas
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, brushSize, isEraser])

  // ── Canvas utilities ──────────────────────────────────────────────────────
  const _clearCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setShowClearFx(true)
    setTimeout(() => setShowClearFx(false), 500)
  }, [])

  /** Draw a line segment on the canvas (used for both local and remote strokes) */
  const _drawSegment = useCallback((
    canvas, x0, y0, x1, y1,
    strokeColor = '#1a1a2e', strokeSize = 5, eraser = false
  ) => {
    const ctx = canvas.getContext('2d')
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(x0, y0)
    ctx.lineTo(x1, y1)
    ctx.strokeStyle = eraser ? '#ffffff' : strokeColor
    ctx.lineWidth   = eraser ? strokeSize * 3 : strokeSize
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.stroke()
    // Fill dot at tip for smooth curves
    ctx.beginPath()
    ctx.arc(x1, y1, (eraser ? strokeSize * 3 : strokeSize) / 2, 0, Math.PI * 2)
    ctx.fillStyle = eraser ? '#ffffff' : strokeColor
    ctx.fill()
    ctx.restore()
  }, [])

  /** Apply a stroke received from the server (normalized 0-1 coords) */
  const _applyRemoteDraw = useCallback((data) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const { x, y, prevX, prevY, color: c, size, isEraser: erase } = data
    const w = canvas.width
    const h = canvas.height
    // Coords may be normalized (0-1) or absolute pixels
    const toAbs = (v, dim) => v <= 1 ? v * dim : v
    _drawSegment(
      canvas,
      toAbs(prevX ?? x, w), toAbs(prevY ?? y, h),
      toAbs(x, w),          toAbs(y, h),
      c, size, erase
    )
  }, [_drawSegment])

  // ── Pointer coordinate helpers ─────────────────────────────────────────────
  const _getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0
    const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? 0
    return {
      x:       (clientX - rect.left) * scaleX,
      y:       (clientY - rect.top)  * scaleY,
      screenX: clientX - rect.left,
      screenY: clientY - rect.top,
    }
  }

  // ── Mouse / touch handlers ────────────────────────────────────────────────
  const handlePointerDown = (e) => {
    if (!isDrawing) return
    const { x, y } = _getCanvasCoords(e)
    isMouseDown.current = true
    lastPos.current = { x, y }
  }

  const handlePointerMove = (e) => {
    const { x, y, screenX, screenY } = _getCanvasCoords(e)
    setCursorPos({ x: screenX, y: screenY })

    if (!isDrawing || !isMouseDown.current) return

    const canvas = canvasRef.current
    const prev   = lastPos.current

    // Draw locally
    _drawSegment(canvas, prev.x, prev.y, x, y, color, brushSize, isEraser)

    // Send normalized coords to server
    if (onDraw) {
      onDraw({
        x: x / canvas.width,
        y: y / canvas.height,
        prevX: prev.x / canvas.width,
        prevY: prev.y / canvas.height,
        color,
        size: brushSize,
        isEraser,
        mode: 'mouse',
      })
    }

    lastPos.current = { x, y }
  }

  const handlePointerUp = () => { isMouseDown.current = false }

  // ── Render ────────────────────────────────────────────────────────────────
  const cursorSize = isEraser ? brushSize * 3 + 8 : brushSize + 6
  const cursorBorder = isEraser
    ? '2px dashed rgba(255,77,109,0.8)'
    : `2px solid ${color === '#f8faff' ? '#333' : color}`

  return (
    <div className="w-full h-full flex items-stretch relative" style={{ minHeight: 0 }}>
      <div
        className="flex-1 relative rounded-2xl overflow-hidden"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 0 40px rgba(99,120,255,0.08), 0 8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Clear flash */}
        <AnimatePresence>
          {showClearFx && (
            <motion.div
              key="clearfx"
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="absolute inset-0 z-10 pointer-events-none"
              style={{ background: 'rgba(99,120,255,0.18)' }}
            />
          )}
        </AnimatePresence>

        {/* Corner accents */}
        {[
          { pos: 'top-0 left-0',    r: '12px 0 0 0' },
          { pos: 'top-0 right-0',   r: '0 12px 0 0' },
          { pos: 'bottom-0 left-0', r: '0 0 0 12px' },
          { pos: 'bottom-0 right-0',r: '0 0 12px 0' },
        ].map(({ pos, r }, i) => (
          <div key={i} className={`absolute ${pos} w-5 h-5 pointer-events-none z-10`}
            style={{
              borderTop:    i < 2   ? '2px solid rgba(99,120,255,0.4)' : 'none',
              borderBottom: i >= 2  ? '2px solid rgba(99,120,255,0.4)' : 'none',
              borderLeft:   i % 2 === 0 ? '2px solid rgba(99,120,255,0.4)' : 'none',
              borderRight:  i % 2 !== 0 ? '2px solid rgba(99,120,255,0.4)' : 'none',
              borderRadius: r,
            }}
          />
        ))}

        {/* "Not your turn" overlay */}
        {!isDrawing && (
          <div
            className="absolute inset-0 z-10 flex items-end justify-center pb-4 pointer-events-none"
          >
            <span
              className="badge badge-brand text-xs px-3 py-1"
              style={{ opacity: 0.7 }}
            >
              👀 Watch & Guess — it&apos;s not your turn
            </span>
          </div>
        )}

        {/* Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={() => { handlePointerUp(); setIsOnCanvas(false) }}
          onMouseEnter={() => setIsOnCanvas(true)}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            aspectRatio: '4/3',
            touchAction: 'none',
            cursor: 'none',
            background: '#ffffff',
          }}
        />

        {/* Custom cursor */}
        {isOnCanvas && isDrawing && (
          <div
            className="absolute pointer-events-none z-20"
            style={{
              left: cursorPos.x,
              top:  cursorPos.y,
              transform: 'translate(-50%, -50%)',
              width:  `${cursorSize}px`,
              height: `${cursorSize}px`,
              border: cursorBorder,
              borderRadius: isEraser ? '4px' : '50%',
              boxShadow: isEraser ? 'none' : `0 0 8px ${color}88`,
              transition: 'width 0.1s, height 0.1s',
            }}
          />
        )}

        {/* Brush info badge */}
        <div className="absolute bottom-3 left-3 z-10 pointer-events-none">
          <span className="badge badge-brand" style={{ opacity: 0.65 }}>
            {isEraser ? '🧹 Eraser' : '🖌️ Brush'} · {brushSize}px
          </span>
        </div>
      </div>
    </div>
  )
}
