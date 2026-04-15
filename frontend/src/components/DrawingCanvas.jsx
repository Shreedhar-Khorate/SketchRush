import { useEffect, useRef } from 'react'

export default function DrawingCanvas({
  color = '#3B82F6',
  brushSize = 5,
  isEraser = false,
  clearSignal = 0,
}) {
  const canvasRef = useRef(null)
  const isDrawingRef = useRef(false)
  const lastX = useRef(0)
  const lastY = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    
    // Set canvas resolution
    canvas.width = 800
    canvas.height = 600

    // Initialize canvas with white background
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }, [])

  useEffect(() => {
    // Handle clear signal
    if (clearSignal > 0) {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [clearSignal])

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    const clientX = e.clientX || e.touches?.[0]?.clientX || 0
    const clientY = e.clientY || e.touches?.[0]?.clientY || 0

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const { x, y } = getCanvasCoordinates(e)
    lastX.current = x
    lastY.current = y
    isDrawingRef.current = true

    const ctx = canvas.getContext('2d')
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e) => {
    if (!isDrawingRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const { x, y } = getCanvasCoordinates(e)

    if (isEraser) {
      ctx.clearRect(x - brushSize / 2, y - brushSize / 2, brushSize, brushSize)
    } else {
      ctx.strokeStyle = color
      ctx.lineWidth = brushSize
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineTo(x, y)
      ctx.stroke()
    }
  }

  const endDrawing = () => {
    isDrawingRef.current = false
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-card/30 rounded-lg p-4">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={endDrawing}
        onMouseLeave={endDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={endDrawing}
        className="w-full max-w-full border-2 border-border rounded-lg bg-white shadow-lg"
        style={{
          aspectRatio: '4/3',
          touchAction: 'none',
        }}
      />
    </div>
  )
}
