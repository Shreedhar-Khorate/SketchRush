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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating orbs */}
      <motion.div
        className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(99,120,255,0.12) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/6 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(199,125,255,0.1) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Logo Section */}
        <motion.div variants={itemVariants} className="text-center mb-8">
          <motion.div
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 relative"
            style={{
              background: 'linear-gradient(135deg, rgba(99,120,255,0.2) 0%, rgba(199,125,255,0.2) 100%)',
              border: '1px solid rgba(99,120,255,0.35)',
            }}
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-4xl">⚡</span>
            <motion.div
              className="absolute inset-0 rounded-2xl"
              style={{ border: '1px solid rgba(99,120,255,0.4)' }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>

          <h1
            className="text-5xl font-black tracking-tight mb-2"
            style={{
              fontFamily: "'Space Grotesk', 'Inter', sans-serif",
              background: 'linear-gradient(135deg, #8fa0ff 0%, #6378ff 40%, #c77dff 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: 'none',
            }}
          >
            SketchRush
          </h1>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Draw Fast.{' '}
            <span style={{ color: 'var(--green)', textShadow: '0 0 12px var(--green-glow)' }}>
              Guess Faster.
            </span>
          </p>

          {/* Feature pills */}
          <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
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
          className="glass-heavy p-6 space-y-5"
          style={{ borderRadius: 'var(--radius-xl)' }}
        >
          {/* Name Input */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-2"
              style={{ color: 'var(--text-secondary)' }}
            >
              Your Name
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
                style={{ color: playerName.length > 12 ? 'var(--orange)' : 'var(--text-muted)' }}
              >
                {playerName.length}/16
              </span>
            </div>
          </div>

          {/* Avatar Picker */}
          <div>
            <label
              className="block text-xs font-semibold uppercase tracking-widest mb-3"
              style={{ color: 'var(--text-secondary)' }}
            >
              Choose Avatar
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map((avatar) => (
                <motion.button
                  key={avatar.emoji}
                  onClick={() => setSelectedAvatar(avatar)}
                  whileHover={{ scale: 1.12, y: -2 }}
                  whileTap={{ scale: 0.92 }}
                  title={avatar.label}
                  className="relative aspect-square rounded-xl text-2xl flex items-center justify-center transition-all"
                  style={{
                    background:
                      selectedAvatar.emoji === avatar.emoji
                        ? 'linear-gradient(135deg, rgba(99,120,255,0.3), rgba(199,125,255,0.2))'
                        : 'rgba(22, 28, 53, 0.6)',
                    border:
                      selectedAvatar.emoji === avatar.emoji
                        ? '1.5px solid rgba(99,120,255,0.6)'
                        : '1.5px solid rgba(99,120,255,0.1)',
                    boxShadow:
                      selectedAvatar.emoji === avatar.emoji
                        ? '0 0 16px rgba(99,120,255,0.3), 0 0 4px rgba(99,120,255,0.2) inset'
                        : 'none',
                  }}
                >
                  {avatar.emoji}
                  {selectedAvatar.emoji === avatar.emoji && (
                    <motion.div
                      layoutId="avatar-ring"
                      className="absolute inset-0 rounded-xl"
                      style={{ border: '2px solid rgba(99,120,255,0.8)' }}
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
              background: 'rgba(11,15,35,0.5)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <motion.div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(99,120,255,0.25), rgba(199,125,255,0.15))',
                border: '1.5px solid rgba(99,120,255,0.3)',
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
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Playing as {selectedAvatar.label}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: 'var(--green)', boxShadow: '0 0 6px var(--green-glow)' }}
                />
                <span className="text-xs" style={{ color: 'var(--green)' }}>Ready to play</span>
              </div>
            </div>
          </motion.div>

          {/* Join Mode Tabs */}
          <div>
            <div
              className="flex rounded-xl p-1 gap-1 mb-4"
              style={{ background: 'rgba(11,15,35,0.6)', border: '1px solid var(--border-subtle)' }}
            >
              {['quick', 'private'].map((mode) => (
                <motion.button
                  key={mode}
                  onClick={() => { setJoinMode(mode); setRoomCode(''); setError('') }}
                  className="flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all relative"
                  style={{
                    color: joinMode === mode ? 'var(--text-primary)' : 'var(--text-muted)',
                  }}
                >
                  {joinMode === mode && (
                    <motion.div
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-lg"
                      style={{
                        background: 'linear-gradient(135deg, rgba(99,120,255,0.3), rgba(199,125,255,0.2))',
                        border: '1px solid rgba(99,120,255,0.3)',
                      }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">
                    {mode === 'quick' ? '⚡ Quick Play' : '🔒 Private Room'}
                  </span>
                </motion.button>
              ))}
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
                    background: 'rgba(99,120,255,0.06)',
                    border: '1px dashed rgba(99,120,255,0.2)',
                  }}
                >
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
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
                      fontFamily: "'Space Grotesk', monospace",
                      fontWeight: 700,
                      fontSize: '20px',
                      letterSpacing: '0.3em',
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
                  background: 'rgba(255,77,109,0.1)',
                  border: '1px solid rgba(255,77,109,0.25)',
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
