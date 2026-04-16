import { motion } from 'framer-motion'

const COLORS = [
  { name: 'Black', hex: '#0D1117' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Gray', hex: '#8B949E' },
  { name: 'Red', hex: '#F85149' },
  { name: 'Orange', hex: '#F0A500' },
  { name: 'Yellow', hex: '#D29922' },
  { name: 'Green', hex: '#3FB950' },
  { name: 'Teal', hex: '#39D353' },
  { name: 'Blue', hex: '#2F81F7' },
  { name: 'Indigo', hex: '#6E40C9' },
  { name: 'Purple', hex: '#A371F7' },
  { name: 'Pink', hex: '#F778BA' },
]

const BRUSH_SIZES = [
  { label: 'XS', value: 2, dotSize: 4 },
  { label: 'S', value: 5, dotSize: 8 },
  { label: 'M', value: 10, dotSize: 12 },
  { label: 'L', value: 18, dotSize: 16 },
]

export default function DrawingToolbar({
  selectedColor = '#1a1a2e',
  onColorChange = () => { },
  brushSize = 5,
  onBrushSizeChange = () => { },
  isEraser = false,
  onToggleEraser = () => { },
  onClear = () => { },
  gestureMode = false,
  onToggleGesture = () => { },
}) {
  return (
    <div
      className="w-full px-4 py-3"
      style={{
        background: 'var(--surface-raised)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="flex flex-wrap items-center gap-4 justify-between">

        {/* Color Palette */}
        <div className="flex items-center gap-3">
          {/* Currently selected display */}
          <div
            className="w-9 h-9 rounded-xl shrink-0 relative"
            style={{
              background: isEraser ? 'var(--red-bg)' : selectedColor,
              border: '1px solid var(--border)',
              cursor: 'default',
            }}
            title={isEraser ? 'Eraser' : `Current: ${selectedColor}`}
          >
            {isEraser && (
              <span className="absolute inset-0 flex items-center justify-center text-sm">🧹</span>
            )}
          </div>

          {/* Color swatches */}
          <div className="flex gap-1.5 flex-wrap">
            {COLORS.map((color) => (
              <motion.button
                key={color.hex}
                onClick={() => { onColorChange(color.hex); onToggleEraser(false) }}
                whileHover={{ scale: 1.2, y: -2 }}
                whileTap={{ scale: 0.88 }}
                title={color.name}
                className="relative rounded-lg"
                style={{
                  width: '24px',
                  height: '24px',
                  background: color.hex,
                  border: selectedColor === color.hex && !isEraser
                    ? '2px solid var(--text)'
                    : '1px solid var(--border)',
                  transition: 'all 0.15s ease',
                }}
              >
                {selectedColor === color.hex && !isEraser && (
                  <motion.div
                    layoutId="color-ring"
                    className="absolute -inset-1 rounded-xl"
                    style={{ border: `2px solid var(--text)` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px hidden lg:block" style={{ background: 'var(--border-subtle)' }} />

        {/* Brush Sizes */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold hidden sm:block" style={{ color: 'var(--text-muted)' }}>
            SIZE
          </span>
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
          >
            {BRUSH_SIZES.map((size) => (
              <motion.button
                key={size.value}
                onClick={() => onBrushSizeChange(size.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: brushSize === size.value ? 'var(--amber-bg)' : 'transparent',
                  border: brushSize === size.value ? '1px solid rgba(240,165,0,0.4)' : '1px solid transparent',
                }}
                title={`Brush ${size.label} (${size.value}px)`}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: `${size.dotSize}px`,
                    height: `${size.dotSize}px`,
                    background: brushSize === size.value ? 'var(--amber)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px hidden lg:block" style={{ background: 'var(--border-subtle)' }} />

        {/* Tools */}
        <div className="flex items-center gap-2">
          {/* Eraser */}
          <motion.button
            onClick={() => onToggleEraser(!isEraser)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: isEraser ? 'var(--red-bg)' : 'var(--surface)',
              border: isEraser ? '1px solid rgba(248,81,73,0.5)' : '1px solid var(--border)',
              color: isEraser ? 'var(--red)' : 'var(--text-muted)',
            }}
            title="Eraser"
          >
            🧹 <span className="hidden sm:inline">Eraser</span>
          </motion.button>

          {/* Clear */}
          <motion.button
            onClick={onClear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
            }}
            title="Clear Canvas"
          >
            🗑️ <span className="hidden sm:inline">Clear</span>
          </motion.button>

          {/* Gesture Mode */}
          <motion.button
            onClick={() => onToggleGesture(!gestureMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{
              background: gestureMode ? 'var(--green-bg)' : 'var(--surface)',
              border: gestureMode ? '1px solid rgba(63,185,80,0.5)' : '1px solid var(--border)',
              color: gestureMode ? 'var(--green)' : 'var(--text-muted)',
            }}
            title="Toggle Gesture Drawing"
          >
            ✋ <span className="hidden sm:inline">Gesture</span>
            {gestureMode && (
              <span
                className="w-1.5 h-1.5 rounded-full ml-1 animate-pulse"
                style={{ background: 'var(--green)' }}
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
