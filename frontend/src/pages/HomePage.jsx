import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

const AVATARS = [
  { emoji: '🦊', label: 'Fox' },
  { emoji: '🐱', label: 'Cat' },
  { emoji: '🐉', label: 'Dragon' },
  { emoji: '🤖', label: 'Robot' },
  { emoji: '👽', label: 'Alien' },
  { emoji: '🧙', label: 'Wizard' },
  { emoji: '🥷', label: 'Ninja' },
  { emoji: '🚀', label: 'Rocket' },
  { emoji: '🦄', label: 'Unicorn' },
  { emoji: '👻', label: 'Ghost' },
  { emoji: '💀', label: 'Skull' },
  { emoji: '🔥', label: 'Fire' },
]

const FEATURES = [
  { icon: '🎨', text: 'Draw & Guess' },
  { icon: '✋', text: 'Gesture AI' },
  { icon: '⚡', text: 'Real-time' },
  { icon: '🏆', text: 'Leaderboard' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

export default function HomePage() {
  const navigate = useNavigate()
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [joinMode, setJoinMode] = useState('quick')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('Please enter your name first')
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

    setIsLoading(true)
    await new Promise((r) => setTimeout(r, 600))

    navigate(`/game/${code}`, {
      state: { playerName: playerName.trim(), avatar: selectedAvatar.emoji },
    })
  }

  return (
    <div className="min-h-screen w-full flex items-start sm:items-center justify-center px-4 py-10 relative">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[520px] relative z-10"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl mb-3 sm:mb-4 relative"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-3xl sm:text-4xl">⚡</span>
          </motion.div>

          <h1
            className="text-3xl sm:text-4xl font-bold tracking-tight mb-2"
            style={{ color: 'var(--text)' }}
          >
            SketchRush
          </h1>
          <p className="text-[13px] sm:text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
            Draw Fast.{" "}
            <span style={{ color: 'var(--amber)' }}>
              Guess Faster.
            </span>
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2.5 mt-5 flex-wrap">
            {FEATURES.map((f) => (
              <span key={f.text} className="badge badge-brand">
                {f.icon} {f.text}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          variants={itemVariants}
          className="glass p-6 sm:p-8 space-y-6"
          style={{ borderRadius: 'var(--radius-lg)' }}
        >
          {/* Name Input */}
          <div>
            <label
              className="block text-xs font-semibold mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              Your name
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🎮</span>
              <input
                type="text"
                maxLength={16}
                value={playerName}
                onChange={(e) => { setPlayerName(e.target.value); setError('') }}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                placeholder="Enter your player name"
                style={{ paddingLeft: '36px', paddingRight: '48px' }}
              />
              <span
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold tabular-nums"
                style={{ color: playerName.length > 12 ? 'var(--amber-warn)' : 'var(--text-faint)' }}
              >
                {playerName.length}/16
              </span>
            </div>
          </div>

          {/* Avatar Picker */}
          <div>
            <label
              className="block text-xs font-semibold mb-3"
              style={{ color: 'var(--text-muted)' }}
            >
              Choose avatar
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
              {AVATARS.map((avatar) => (
                <motion.button
                  key={avatar.emoji}
                  onClick={() => setSelectedAvatar(avatar)}
                  whileHover={{ scale: 1.06, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  title={avatar.label}
                  className="relative aspect-square rounded-xl text-2xl flex items-center justify-center transition-all"
                  style={{
                    background: 'var(--surface-raised)',
                    border:
                      selectedAvatar.emoji === avatar.emoji
                        ? '2px solid var(--amber)'
                        : '1px solid var(--border)',
                  }}
                >
                  {avatar.emoji}
                  {selectedAvatar.emoji === avatar.emoji && (
                    <motion.div
                      layoutId="avatar-ring"
                      className="absolute inset-0 rounded-xl"
                      style={{ border: '2px solid var(--amber)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <motion.div
            layout
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{
              background: 'var(--surface-raised)',
              border: '1px solid var(--border)',
            }}
          >
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
              }}
              key={selectedAvatar.emoji}
              initial={{ scale: 0.8, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {selectedAvatar.emoji}
            </motion.div>
            <div className="min-w-0">
              <p className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                {playerName || 'Your Name'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Playing as {selectedAvatar.label}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--green)' }}
                />
                <span className="text-xs" style={{ color: 'var(--green)' }}>Ready to play</span>
              </div>
            </div>
          </motion.div>

          {/* Join Mode Tabs */}
          <div>
            <div
              className="flex mb-4 p-1 rounded-xl"
              style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}
            >
              {['quick', 'private'].map((mode) => {
                const active = joinMode === mode
                return (
                  <motion.button
                    key={mode}
                    onClick={() => { setJoinMode(mode); setRoomCode(''); setError('') }}
                    className="flex-1 py-2 px-3 text-sm font-semibold transition-all rounded-lg"
                    style={{
                      background: active ? 'var(--surface)' : 'transparent',
                      border: active ? '1px solid var(--border)' : '1px solid transparent',
                      color: active ? 'var(--text)' : 'var(--text-muted)',
                    }}
                  >
                    {mode === 'quick' ? '⚡ Quick Play' : '🔒 Private Room'}
                  </motion.button>
                )
              })}
            </div>

            <AnimatePresence mode="wait">
              {joinMode === 'quick' ? (
                <motion.div
                  key="quick"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-xl p-4 text-center"
                  style={{
                    background: 'var(--surface-raised)',
                    border: '1px dashed var(--border)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    🎲 A random room will be created for you
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="private"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <input
                    type="text"
                    maxLength={5}
                    value={roomCode}
                    onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                    placeholder="ENTER CODE"
                    style={{
                      fontFamily: "'Fira Code', monospace",
                      fontWeight: 700,
                      fontSize: '18px',
                      letterSpacing: '0.2em',
                      textAlign: 'center',
                      textTransform: 'uppercase',
                    }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-xl p-3 flex items-center gap-2"
                style={{
                  background: 'var(--red-bg)',
                  border: '1px solid rgba(248,81,73,0.4)',
                }}
              >
                <span>⚠️</span>
                <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Join Button */}
          <motion.button
            onClick={handleJoin}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.97 }}
            disabled={isLoading}
            className="btn-primary w-full py-4 text-base relative overflow-hidden"
            style={{ borderRadius: 'var(--radius-md)' }}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                    className="text-lg"
                  >
                    ⚡
                  </motion.span>
                  Joining Room...
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <span>{joinMode === 'quick' ? '🎯 Start Playing' : '🚀 Join Room'}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-xs mt-6"
          style={{ color: 'var(--text-muted)' }}
        >
          🎨 SketchRush v1.0 · Real-time Multiplayer Drawing Game
        </motion.p>
      </motion.div>
    </div>
  )
}
