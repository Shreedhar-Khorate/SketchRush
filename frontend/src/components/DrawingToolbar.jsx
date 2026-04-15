import { motion } from 'framer-motion'

const COLORS = [
  { name: 'Red', hex: '#EF4444' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Yellow', hex: '#EAB308' },
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
]

const BRUSH_SIZES = [
  { label: 'XS', value: 2 },
  { label: 'S', value: 5 },
  { label: 'M', value: 10 },
  { label: 'L', value: 18 },
]

export default function DrawingToolbar({
  selectedColor = '#3B82F6',
  onColorChange = () => {},
  brushSize = 5,
  onBrushSizeChange = () => {},
  isEraser = false,
  onToggleEraser = () => {},
  onClear = () => {},
  gestureMode = false,
  onToggleGesture = () => {},
}) {
  return (
    <div className="w-full glass-panel p-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Color Palette */}
        <div className="flex gap-2">
          <span className="text-xs font-medium text-muted-foreground self-center">Color:</span>
          <div className="flex gap-2">
            {COLORS.map((color) => (
              <motion.button
                key={color.hex}
                onClick={() => {
                  onColorChange(color.hex)
                  onToggleEraser ? onToggleEraser(false) : ''
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  selectedColor === color.hex ? 'ring-2 ring-offset-2 ring-primary' : 'border-border'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Brush Sizes */}
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-muted-foreground">Size:</span>
          <div className="flex gap-2">
            {BRUSH_SIZES.map((size) => (
              <motion.button
                key={size.value}
                onClick={() => onBrushSizeChange(size.value)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  brushSize === size.value
                    ? 'bg-primary text-white'
                    : 'bg-card border border-border text-foreground hover:bg-muted'
                }`}
              >
                {size.label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tools */}
        <div className="flex gap-2">
          <motion.button
            onClick={() => onToggleEraser(!isEraser)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              isEraser
                ? 'bg-destructive text-white'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
            title="Eraser"
          >
            🧹 Eraser
          </motion.button>

          <motion.button
            onClick={onClear}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-3 py-1 rounded-lg text-xs font-medium bg-card border border-border text-foreground hover:bg-muted transition-all"
            title="Clear Canvas"
          >
            🗑️ Clear
          </motion.button>

          <motion.button
            onClick={() => onToggleGesture(!gestureMode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
              gestureMode
                ? 'bg-secondary text-white'
                : 'bg-card border border-border text-foreground hover:bg-muted'
            }`}
            title="Toggle Gesture Mode"
          >
            ✋ Gesture
          </motion.button>
        </div>
      </div>
    </div>
  )
}
