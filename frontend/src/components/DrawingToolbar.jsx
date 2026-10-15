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
        background: 'var(--surface)',
        borderBottom: '3px solid var(--line)',
        boxShadow: '0 4px 0 var(--shadow, rgba(20,20,20,0.06))',
      }}
    >
      <div className="flex flex-wrap items-center gap-4 justify-between">

        {/* Color Palette */}
        <div className="flex items-center gap-3">
          {/* Currently selected display */}
          <div
            className="w-9 h-9 rounded-xl shrink-0 relative"
            style={{
              background: isEraser ? 'var(--peach)' : selectedColor,
              border: '2.5px solid var(--line)',
              boxShadow: '2px 2px 0 var(--shadow)',
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
                    ? '2.5px solid var(--line)'
                    : '2px solid var(--line)',
                  boxShadow: selectedColor === color.hex && !isEraser
                    ? '2px 2px 0 var(--shadow)'
                    : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {selectedColor === color.hex && !isEraser && (
                  <motion.div
                    layoutId="color-ring"
                    className="absolute -inset-1 rounded-xl"
                    style={{ border: `2px solid var(--line)` }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px hidden lg:block" style={{ background: 'var(--line)' }} />

        {/* Brush Sizes */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold hidden sm:block" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            SIZE
          </span>
          <div
            className="flex items-center gap-1 p-1 rounded-xl"
            style={{
              background: 'var(--surface-2)',
              border: '2px solid var(--line)',
              boxShadow: '2px 2px 0 var(--shadow)',
            }}
          >
            {BRUSH_SIZES.map((size) => (
              <motion.button
                key={size.value}
                onClick={() => onBrushSizeChange(size.value)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="relative w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: brushSize === size.value ? 'var(--yellow)' : 'transparent',
                  border: brushSize === size.value ? '2px solid var(--line)' : '2px solid transparent',
                  boxShadow: brushSize === size.value ? '1.5px 1.5px 0 var(--shadow)' : 'none',
                }}
                title={`Brush ${size.label} (${size.value}px)`}
              >
                <div
                  className="rounded-full"
                  style={{
                    width: `${size.dotSize}px`,
                    height: `${size.dotSize}px`,
                    background: brushSize === size.value ? 'var(--line)' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                />
              </motion.button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px hidden lg:block" style={{ background: 'var(--line)' }} />

        {/* Tools (Pencil, Grid, Hand) */}
        <div
          className="flex items-center gap-2 sm:gap-2.5 shrink-0 ml-auto lg:ml-0"
          role="toolbar"
          aria-label="Drawing tools"
        >
          {/* Pencil Tool */}
          <motion.button
            key="tool-pencil"
            onClick={() => onToggleEraser(!isEraser)}
            whileHover={{ scale: 1.06, y: -2, boxShadow: '4px 4px 0 var(--shadow)' }}
            whileTap={{ scale: 0.94, y: 1, boxShadow: '1px 1px 0 var(--shadow)' }}
            className="relative flex items-center justify-center rounded-xl transition-all select-none"
            style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              background: (!isEraser && !gestureMode) ? 'var(--yellow)' : isEraser ? 'var(--peach)' : 'var(--surface-2)',
              border: '2.5px solid var(--line)',
              boxShadow: (!isEraser && !gestureMode) || isEraser ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            title={isEraser ? 'Eraser' : 'Pencil'}
            aria-label="Pencil"
            data-tool="pencil"
            data-testid="pencil-tool"
          >
            <span
              style={{ fontSize: '26px', lineHeight: 1 }}
              role="img"
              aria-label={isEraser ? 'Eraser' : 'Pencil'}
            >
              {isEraser ? '🧹' : '✏️'}
            </span>
            <span className="sr-only">Pencil</span>
            {!isEraser && !gestureMode && (
              <span
                className="absolute bottom-1 right-1 w-2 h-2 rounded-full"
                style={{ background: 'var(--line)' }}
                title="Active"
              />
            )}
          </motion.button>

          {/* Grid Tool */}
          <motion.button
            key="tool-grid"
            onClick={onClear}
            whileHover={{ scale: 1.06, y: -2, boxShadow: '4px 4px 0 var(--shadow)' }}
            whileTap={{ scale: 0.94, y: 1, boxShadow: '1px 1px 0 var(--shadow)' }}
            className="relative flex items-center justify-center rounded-xl transition-all select-none"
            style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              background: 'var(--surface-2)',
              border: '2.5px solid var(--line)',
              boxShadow: '2px 2px 0 var(--shadow)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            title="Grid"
            aria-label="Grid"
            data-tool="grid"
            data-testid="grid-tool"
          >
            <svg
              width="26"
              height="26"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <path d="M3 9h18" />
              <path d="M3 15h18" />
              <path d="M9 3v18" />
              <path d="M15 3v18" />
            </svg>
            <span className="sr-only">Grid</span>
          </motion.button>

          {/* Hand Tool (Gesture Mode) */}
          <motion.button
            key="tool-hand"
            onClick={() => onToggleGesture(!gestureMode)}
            whileHover={{ scale: 1.06, y: -2, boxShadow: '4px 4px 0 var(--shadow)' }}
            whileTap={{ scale: 0.94, y: 1, boxShadow: '1px 1px 0 var(--shadow)' }}
            className="relative flex items-center justify-center rounded-xl transition-all select-none"
            style={{
              width: '48px',
              height: '48px',
              minWidth: '48px',
              minHeight: '48px',
              background: gestureMode ? 'var(--yellow)' : 'var(--surface-2)',
              border: '2.5px solid var(--line)',
              boxShadow: gestureMode ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
              color: 'var(--text)',
              cursor: 'pointer',
            }}
            title="Hand"
            aria-label="Hand"
            data-tool="hand"
            data-testid="hand-tool"
          >
            <span
              style={{ fontSize: '26px', lineHeight: 1 }}
              role="img"
              aria-label="Hand"
            >
              ✋
            </span>
            <span className="sr-only">Hand</span>
            {gestureMode && (
              <span
                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full animate-pulse"
                style={{ background: 'var(--green)', border: '1.5px solid var(--line)' }}
                title="Active"
              />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
