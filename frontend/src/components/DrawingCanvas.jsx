import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function DrawingCanvas({
  color = '#171717',
  brushSize = 5,
  isEraser = false,
  clearSignal = 0,
  isDrawing = false,          // true = this client is the drawer
  onDraw = null,              // (strokeData) → void sent to server
  onClearCanvas = null,       // () → void sent to server
  onRemoteDraw = null,        // ref — set to the remote-draw handler
  onRemoteClear = null,       // ref — set to the remote-clear handler
}) {
  const canvasRef     = useRef(null)
  const isMouseDown   = useRef(false)
  const lastPos       = useRef({ x: 0, y: 0 })
  const [showClearFx, setShowClearFx]   = useState(false)
  const [cursorPos, setCursorPos]       = useState({ x: -200, y: -200 })
  const [isOnCanvas, setIsOnCanvas]     = useState(false)

  // ── Canvas utilities ───────────────────────────────────────────────────────
  const _clearCanvas = useCallback(() => {
    try {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      setShowClearFx(true)
      setTimeout(() => setShowClearFx(false), 400)
    } catch (err) {
      console.error('[DrawingCanvas] Error clearing canvas:', err)
    }
  }, [])

  const _drawSegment = useCallback((
    canvas, x0, y0, x1, y1,
    strokeColor = '#171717', strokeSize = 5, eraser = false
  ) => {
    try {
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      if (!Number.isFinite(x0) || !Number.isFinite(y0) || !Number.isFinite(x1) || !Number.isFinite(y1)) {
        return
      }
      
      ctx.save()
      ctx.beginPath()
      ctx.moveTo(x0, y0)
      ctx.lineTo(x1, y1)
      ctx.strokeStyle = eraser ? '#FFFFFF' : strokeColor
      ctx.lineWidth   = eraser ? strokeSize * 3.5 : strokeSize
      ctx.lineCap     = 'round'
      ctx.lineJoin    = 'round'
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x1, y1, (eraser ? strokeSize * 3.5 : strokeSize) / 2, 0, Math.PI * 2)
      ctx.fillStyle = eraser ? '#FFFFFF' : strokeColor
      ctx.fill()
      ctx.restore()
    } catch (err) {
      console.error('[DrawingCanvas] Error drawing segment:', err)
    }
  }, [])

  const _applyRemoteDraw = useCallback((data) => {
    try {
      if (!data) return
      const canvas = canvasRef.current
      if (!canvas) return
      
      const { x, y, prevX, prevY, color: c, size, isEraser: erase } = data
      if (typeof x !== 'number' || typeof y !== 'number') return
      
      const w = canvas.width
      const h = canvas.height
      const toAbs = (v, dim) => {
        if (typeof v !== 'number') return 0
        return v <= 1 ? v * dim : v
      }
      
      _drawSegment(
        canvas,
        toAbs(prevX ?? x, w), toAbs(prevY ?? y, h),
        toAbs(x, w),          toAbs(y, h),
        c || '#171717', size || 5, erase || false
      )
    } catch (err) {
      console.error('[DrawingCanvas] Error in _applyRemoteDraw:', err)
    }
  }, [_drawSegment])

  // ── Canvas init ────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    try {
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      canvas.width  = 800
      canvas.height = 600
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, 800, 600)
    } catch (err) {
      console.error('[DrawingCanvas] Error initializing canvas:', err)
    }
  }, [])

  // ── Clear signal ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (clearSignal < 1) return
    _clearCanvas()
  }, [clearSignal, _clearCanvas])

  // ── Register remote draw/clear handlers ────────────────────────────────────
  useEffect(() => {
    if (onRemoteDraw)  onRemoteDraw.current  = _applyRemoteDraw
    if (onRemoteClear) onRemoteClear.current = _clearCanvas
  }, [onRemoteDraw, onRemoteClear, _applyRemoteDraw, _clearCanvas])

  // ── Pointer coordinate helpers ─────────────────────────────────────────────
  const _getCanvasCoords = (e) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, screenX: 0, screenY: 0 }
    
    const rect   = canvas.getBoundingClientRect()
    const scaleX = canvas.width  / rect.width
    const scaleY = canvas.height / rect.height
    
    let clientX = 0
    let clientY = 0
    
    if (e.clientX !== undefined) {
      clientX = e.clientX
      clientY = e.clientY
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    }
    
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
    try {
      const { x, y } = _getCanvasCoords(e)
      isMouseDown.current = true
      lastPos.current = { x, y }
    } catch (err) {
      console.error('[DrawingCanvas] Error in handlePointerDown:', err)
    }
  }

  const handlePointerMove = (e) => {
    try {
      const { x, y, screenX, screenY } = _getCanvasCoords(e)
      setCursorPos({ x: screenX, y: screenY })

      if (!isDrawing || !isMouseDown.current) return

      const canvas = canvasRef.current
      if (!canvas) return
      const prev = lastPos.current

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
    } catch (err) {
      console.error('[DrawingCanvas] Error in handlePointerMove:', err)
    }
  }

  const handlePointerUp = () => { isMouseDown.current = false }

  const containerRef = useRef(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // ── Maintain exact 4:3 aspect ratio ────────────────────────────────────────
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // Account for 6px offset shadow and 3px border to avoid container overflow
        const availW = Math.max(width - 12, 120)
        const availH = Math.max(height - 12, 90)
        let newWidth = availW
        let newHeight = availW * (3 / 4)
        if (newHeight > availH) {
          newHeight = availH
          newWidth = availH * (4 / 3)
        }
        setCanvasSize({ width: Math.floor(newWidth), height: Math.floor(newHeight) })
      }
    })
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [])

  const scale = canvasSize.width / 800
  const scaledBrushSize = brushSize * scale
  const cursorSize = isEraser ? scaledBrushSize * 3.5 + 8 : Math.max(scaledBrushSize + 4, 10)
  const cursorBorder = isEraser
    ? '2px dashed #FF6B6B'
    : `2px solid ${color === '#FFFFFF' ? '#171717' : color}`

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center relative p-1" style={{ minHeight: 0 }}>
      
      {/* Desk Board Shadow & Frame */}
      <div
        className="canvas-desk relative"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          boxShadow: '6px 6px 0px #171717',
          border: '3px solid #171717',
          borderRadius: '4px',
        }}
      >
        {/* Wipe Flash Effect */}
        <AnimatePresence>
          {showClearFx && (
            <motion.div
              key="clearfx"
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 z-30 pointer-events-none bg-[#FFD84D]"
            />
          )}
        </AnimatePresence>

        {/* Paper Corner Accents (Neo-Brutalist Drafting Style) */}
        <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-[#171717] z-10 pointer-events-none" />
        <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-[#171717] z-10 pointer-events-none" />
        <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-[#171717] z-10 pointer-events-none" />
        <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-[#171717] z-10 pointer-events-none" />

        {/* Spectator Overlay Banner */}
        {!isDrawing && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="neo-badge neo-badge-lavender text-xs py-1 px-3 shadow-[2px_2px_0px_#171717]">
              👀 WATCH & GUESS THE WORD IN THE CHAT
            </div>
          </div>
        )}

        {/* Brush Info Badge */}
        {isDrawing && (
          <div className="absolute top-2 left-2 z-20 pointer-events-none">
            <div className="neo-badge neo-badge-white text-[10px] py-0.5 px-2">
              {isEraser ? '🧹 ERASER' : '🖌️ BRUSH'} · {brushSize}PX
            </div>
          </div>
        )}

        {/* The HTML5 Canvas Surface */}
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
            touchAction: 'none',
            cursor: isDrawing ? 'none' : 'default',
            background: '#FFFFFF',
          }}
        />

        {/* Custom Sharp Drawing Cursor */}
        {isOnCanvas && isDrawing && (
          <div
            className="absolute pointer-events-none z-30"
            style={{
              left: cursorPos.x,
              top:  cursorPos.y,
              transform: 'translate(-50%, -50%)',
              width:  `${cursorSize}px`,
              height: `${cursorSize}px`,
              border: cursorBorder,
              borderRadius: isEraser ? '2px' : '50%',
              backgroundColor: isEraser ? 'rgba(255,107,107,0.15)' : 'transparent',
              transition: 'width 0.08s, height 0.08s',
            }}
          />
        )}

      </div>
    </div>
  )
}
