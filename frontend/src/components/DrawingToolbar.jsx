const COLORS = [
  { name: 'Pitch Black', hex: '#171717' },
  { name: 'Pure White', hex: '#FFFFFF' },
  { name: 'Slate Gray', hex: '#6B7280' },
  { name: 'Hot Coral', hex: '#FF6B6B' },
  { name: 'Punchy Orange', hex: '#FF9F43' },
  { name: 'Vibrant Yellow', hex: '#FFD84D' },
  { name: 'Bright Green', hex: '#B7F56A' },
  { name: 'Emerald', hex: '#10B981' },
  { name: 'Electric Blue', hex: '#7BA7FF' },
  { name: 'Deep Indigo', hex: '#4F46E5' },
  { name: 'Pale Lavender', hex: '#DCCBFF' },
  { name: 'Neon Pink', hex: '#FF76D8' },
]

const BRUSH_SIZES = [
  { label: 'XS', value: 2, dot: 4 },
  { label: 'S',  value: 5, dot: 7 },
  { label: 'M',  value: 10, dot: 11 },
  { label: 'L',  value: 18, dot: 16 },
]

export default function DrawingToolbar({
  selectedColor = '#171717',
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
    <div className="w-full bg-white border-b-[2.5px] border-[#171717] px-3 sm:px-6 py-2.5 shadow-[0_2px_0px_rgba(23,23,23,0.06)] flex-shrink-0">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-3 sm:gap-5 overflow-x-auto">
      
      {/* ── Left: Color Palette Swatches ── */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        
        {/* Active swatch preview */}
        <div
          className="w-7 h-7 sm:w-8 sm:h-8 border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center flex-shrink-0"
          style={{ background: isEraser ? '#FFFFFF' : selectedColor }}
          title={isEraser ? 'Eraser Active' : `Color: ${selectedColor}`}
        >
          {isEraser && <span className="text-xs">🧹</span>}
        </div>

        {/* Swatch row */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {COLORS.map((c) => {
            const isSelected = selectedColor === c.hex && !isEraser
            return (
              <button
                key={c.hex}
                type="button"
                onClick={() => { onColorChange(c.hex); onToggleEraser(false) }}
                title={c.name}
                className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#171717] transition-all cursor-pointer relative flex-shrink-0"
                style={{
                  backgroundColor: c.hex,
                  transform: isSelected ? 'scale(1.15) translateY(-2px)' : 'none',
                  boxShadow: isSelected ? '2px 2px 0px #171717' : 'none',
                  zIndex: isSelected ? 2 : 1,
                }}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] sm:text-[10px]" style={{ color: c.hex === '#171717' || c.hex === '#4F46E5' ? '#FFFFFF' : '#171717' }}>
                    ●
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Middle: Brush Sizes ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <span className="text-[10px] sm:text-[11px] font-black uppercase text-[#6B7280] hidden md:inline">SIZE:</span>
        <div className="flex items-center gap-0.5 sm:gap-1 bg-[#FFF8E7] p-0.5 sm:p-1 border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717]">
          {BRUSH_SIZES.map((b) => {
            const isActive = brushSize === b.value
            return (
              <button
                key={b.value}
                type="button"
                onClick={() => onBrushSizeChange(b.value)}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center font-mono font-black text-xs border border-transparent transition-all cursor-pointer ${
                  isActive ? 'bg-[#FFD84D] border-[#171717] shadow-[1px_1px_0px_#171717]' : 'hover:bg-white'
                }`}
                title={`Brush Size ${b.label} (${b.value}px)`}
              >
                <span
                  className="rounded-full bg-[#171717] inline-block"
                  style={{ width: `${b.dot}px`, height: `${b.dot}px` }}
                />
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Right: Tool Action Buttons ── */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        
        {/* Eraser Toggle */}
        <button
          type="button"
          onClick={() => onToggleEraser(!isEraser)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-[#171717] font-black text-xs uppercase flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            isEraser
              ? 'bg-[#FF6B6B] text-white shadow-[1.5px_1.5px_0px_#171717] translate-x-0.5 translate-y-0.5'
              : 'bg-white hover:bg-[#FFF3D4] shadow-[2.5px_2.5px_0px_#171717] hover:-translate-y-0.5'
          }`}
        >
          <span>🧹</span>
          <span className="hidden sm:inline">ERASER</span>
        </button>

        {/* Clear Canvas */}
        <button
          type="button"
          onClick={onClear}
          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-white border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] font-black text-xs uppercase flex items-center gap-1 sm:gap-1.5 hover:bg-[#FFE5E5] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
          title="Clear canvas (wipe board)"
        >
          <span>🗑️</span>
          <span className="hidden sm:inline">CLEAR</span>
        </button>

        {/* Gesture Mode Air Canvas Toggle */}
        <button
          type="button"
          onClick={() => onToggleGesture(!gestureMode)}
          className={`px-2 sm:px-3 py-1 sm:py-1.5 border-2 border-[#171717] font-black text-xs uppercase flex items-center gap-1 sm:gap-1.5 transition-all cursor-pointer ${
            gestureMode
              ? 'bg-[#B7F56A] text-[#171717] shadow-[1.5px_1.5px_0px_#171717] translate-x-0.5 translate-y-0.5'
              : 'bg-white hover:bg-[#B7F56A]/20 shadow-[2.5px_2.5px_0px_#171717] hover:-translate-y-0.5'
          }`}
          title="Toggle AI Air Canvas webcam tracking"
        >
          <span>✋</span>
          <span className="hidden sm:inline">AIR CANVAS</span>
          {gestureMode && <span className="w-2 h-2 rounded-full bg-[#171717] animate-pulse ml-0.5" />}
        </button>

      </div>
    </div>
  </div>
  )
}

