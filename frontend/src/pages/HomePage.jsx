import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const AVATARS = ['🦊', '🐱', '🐉', '🤖', '👽', '🧙', '🥷', '🚀', '🦄', '👻', '💀', '🔥']

export default function HomePage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [joinMode, setJoinMode] = useState('quick') // 'quick' or 'private'
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = () => {
    if (!playerName.trim()) {
      setError('Please enter your name')
      return
    }

    let code = roomCode
    if (joinMode === 'quick') {
      code = Math.random().toString(36).substring(2, 7).toUpperCase()
    } else if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    } else {
      code = roomCode.toUpperCase()
    }

    navigate(`/game/${code}`, {
      state: {
        playerName: playerName.trim(),
        avatar: selectedAvatar,
      },
    })
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {/* Logo & Tagline */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold neon-text-blue mb-2">⚡ SketchRush</h1>
          <p className="text-muted-foreground italic">"Draw Fast. Guess Faster."</p>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-8 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium mb-2">Your Name</label>
            <input
              type="text"
              maxLength="16"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value)
                setError('')
              }}
              placeholder="Enter your name"
              className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">{playerName.length}/16</p>
          </div>

          {/* Avatar Picker */}
          <div>
            <label className="block text-sm font-medium mb-3">Select Avatar</label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((avatar, index) => (
                <motion.button
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`text-2xl p-3 rounded-lg transition-all ${
                    selectedAvatar === avatar
                      ? 'bg-primary neon-glow-blue ring-2 ring-primary'
                      : 'bg-card border border-border hover:bg-muted'
                  }`}
                >
                  {avatar}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="bg-card/50 rounded-lg p-4 text-center border border-border">
            <p className="text-xs text-muted-foreground mb-2">Preview</p>
            <div className="text-3xl mb-2">{selectedAvatar}</div>
            <p className="text-foreground font-medium">{playerName || 'Your Name'}</p>
          </div>

          {/* Join Mode Tabs */}
          <div className="space-y-4">
            <div className="flex gap-2 border-b border-border">
              <button
                onClick={() => {
                  setJoinMode('quick')
                  setRoomCode('')
                  setError('')
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-all ${
                  joinMode === 'quick'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Quick Play
              </button>
              <button
                onClick={() => {
                  setJoinMode('private')
                  setError('')
                }}
                className={`flex-1 py-2 px-3 text-sm font-medium transition-all ${
                  joinMode === 'private'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Private Room
              </button>
            </div>

            {joinMode === 'private' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <input
                  type="text"
                  maxLength="5"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  placeholder="Enter room code"
                  className="w-full px-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-center tracking-widest"
                />
              </motion.div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive text-destructive text-sm"
            >
              {error}
            </motion.div>
          )}

          {/* Join Button */}
          <motion.button
            onClick={handleJoin}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 px-4 rounded-lg bg-primary text-sm font-medium text-white hover:bg-blue-600 transition-colors neon-glow-blue"
          >
            {joinMode === 'quick' ? 'Start Game' : 'Join Room'}
          </motion.button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2026 SketchRush. Draw. Guess. Win.
        </p>
      </motion.div>
    </div>
  )
}
