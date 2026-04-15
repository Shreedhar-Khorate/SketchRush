import { motion } from 'framer-motion'

const COLORS = [
  { name: 'Black', hex: '#1a1a2e' },
  { name: 'White', hex: '#f8faff' },
  { name: 'Red', hex: '#ff4d6d' },
  { name: 'Orange', hex: '#ff8c42' },
  { name: 'Yellow', hex: '#ffd166' },
  { name: 'Green', hex: '#00e5a0' },
  { name: 'Cyan', hex: '#00d4ff' },
  { name: 'Blue', hex: '#6378ff' },
  { name: 'Purple', hex: '#c77dff' },
  { name: 'Pink', hex: '#ff6eb4' },
  { name: 'Brown', hex: '#a0522d' },
  { name: 'Gray', hex: '#6b7280' },
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
        background: 'rgba(11,15,35,0.8)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="flex flex-wrap items-center gap-4 justify-between">

        {/* Color Palette */}
        <div className="flex items-center gap-3">
          {/* Currently selected display */}
          <div
            className="w-9 h-9 rounded-xl shrink-0 relative"
            style={{
              background: isEraser ? 'rgba(255,77,109,0.2)' : selectedColor,
              border: '2px solid rgba(255,255,255,0.15)',
              boxShadow: isEraser
                ? '0 0 12px rgba(255,77,109,0.4)'
                : `0 0 16px ${selectedColor}88, 0 2px 8px rgba(0,0,0,0.4)`,
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
                    ? '2px solid rgba(255,255,255,0.9)'
                    : '2px solid rgba(255,255,255,0.08)',
                  boxShadow: selectedColor === color.hex && !isEraser
                    ? `0 0 10px ${color.hex}aa`
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {selectedColor === color.hex && !isEraser && (
                  <motion.div
                    layoutId="color-ring"
                    className="absolute -inset-1 rounded-xl"
                    style={{ border: `2px solid ${color.hex}`, boxShadow: `0 0 8px ${color.hex}88` }}
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
            style={{ background: 'rgba(11,15,35,0.6)', border: '1px solid var(--border-subtle)' }}
          >
            {BRUSH_SIZES.map((size) => (
              <motion.button
                key={size.value}
                onClick={() => onBrushSizeChange(size.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="relative w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: brushSize === size.value ? 'rgba(99,120,255,0.25)' : 'transparent',
                  border: brushSize === size.value ? '1px solid rgba(99,120,255,0.4)' : '1px solid transparent',
                }}
                title={`Brush ${size.label} (${size.value}px)`}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: `${size.dotSize}px`,
                    height: `${size.dotSize}px`,
                    background: brushSize === size.value ? 'var(--brand-light)' : 'var(--text-muted)',
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
              background: isEraser
                ? 'rgba(255,77,109,0.2)'
                : 'rgba(11,15,35,0.6)',
              border: isEraser
                ? '1px solid rgba(255,77,109,0.4)'
                : '1px solid var(--border-subtle)',
              color: isEraser ? 'var(--red)' : 'var(--text-secondary)',
              boxShadow: isEraser ? '0 0 12px rgba(255,77,109,0.2)' : 'none',
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
              background: 'rgba(11,15,35,0.6)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
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
              background: gestureMode
                ? 'rgba(0,229,160,0.15)'
                : 'rgba(11,15,35,0.6)',
              border: gestureMode
                ? '1px solid rgba(0,229,160,0.35)'
                : '1px solid var(--border-subtle)',
              color: gestureMode ? 'var(--green)' : 'var(--text-secondary)',
              boxShadow: gestureMode ? '0 0 12px var(--green-glow)' : 'none',
            }}
            title="Toggle Gesture Drawing"
          >
            ✋ <span className="hidden sm:inline">Gesture</span>
            {gestureMode && (
              <span
                className="w-1.5 h-1.5 rounded-full ml-1 animate-pulse"
                style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green-glow)' }}
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
