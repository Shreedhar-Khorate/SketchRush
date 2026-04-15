import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import GameHeader from '../components/GameHeader'
import DrawingToolbar from '../components/DrawingToolbar'
import DrawingCanvas from '../components/DrawingCanvas'
import PlayerList from '../components/PlayerList'
import ChatPanel from '../components/ChatPanel'

export default function GamePage() {
  const { roomId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  
  const playerName = location.state?.playerName || 'Player'
  const playerAvatar = location.state?.avatar || '🦊'

  const [selectedColor, setSelectedColor] = useState('#3B82F6')
  const [brushSize, setBrushSize] = useState(5)
  const [isEraser, setIsEraser] = useState(false)
  const [gestureMode, setGestureMode] = useState(false)
  const [clearSignal, setClearSignal] = useState(0)
  const [showSidebar, setShowSidebar] = useState(window.innerWidth > 1024)

  // Fallback to home if no player state
  if (!location.state?.playerName) {
    setTimeout(() => navigate('/'), 100)
    return null
  }

  const handleClear = () => {
    setClearSignal((prev) => prev + 1)
  }

  const handleToggleEraser = (state) => {
    setIsEraser(state)
    if (state) setSelectedColor('#FFFFFF') // Eraser uses white
  }

  return (
    <div className="min-h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <GameHeader roomCode={roomId} playerCount={4} maxPlayers={8} />

      {/* Toolbar */}
      <DrawingToolbar
        selectedColor={selectedColor}
        onColorChange={setSelectedColor}
        brushSize={brushSize}
        onBrushSizeChange={setBrushSize}
        isEraser={isEraser}
        onToggleEraser={handleToggleEraser}
        onClear={handleClear}
        gestureMode={gestureMode}
        onToggleGesture={setGestureMode}
      />

      {/* Main Content */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Canvas (Left) */}
        <div className="flex-1 min-w-0 flex flex-col">
          <DrawingCanvas
            color={selectedColor}
            brushSize={brushSize}
            isEraser={isEraser}
            clearSignal={clearSignal}
          />
        </div>

        {/* Sidebar (Right) - Hidden on mobile */}
        {showSidebar && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-72 flex flex-col gap-4"
          >
            {/* Player List */}
            <div className="flex-1 min-h-0">
              <PlayerList currentPlayer={playerName} currentAvatar={playerAvatar} />
            </div>

            {/* Chat Panel */}
            <div className="flex-1 min-h-0">
              <ChatPanel playerName={playerName} />
            </div>
          </motion.div>
        )}

        {/* Mobile Sidebar Toggle Button */}
        {!showSidebar && (
          <motion.button
            onClick={() => setShowSidebar(true)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-primary text-white shadow-lg neon-glow-blue flex items-center justify-center"
          >
            👥
          </motion.button>
        )}
      </div>

      {/* Mobile Sidebar Overlay */}
      {showSidebar && window.innerWidth < 1024 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowSidebar(false)}
          className="fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Mobile Sidebar Sheet */}
      {showSidebar && window.innerWidth < 1024 && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="fixed bottom-0 left-0 right-0 h-2/3 glass-panel rounded-t-2xl p-4 z-50 flex flex-col gap-4"
        >
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-bold">Players & Chat</h2>
            <button
              onClick={() => setShowSidebar(false)}
              className="text-2xl hover:text-primary transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
            <div className="min-h-0">
              <PlayerList currentPlayer={playerName} currentAvatar={playerAvatar} />
            </div>
            <div className="min-h-0">
              <ChatPanel playerName={playerName} />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
