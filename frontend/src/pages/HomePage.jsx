import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import anime from 'animejs'

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

const ORBS = [
  { id: 'ember', size: '500px', color: 'rgba(249,115,22,0.42)', blur: '90px', opacity: 0.7, position: { top: '-15%', left: '-10%' } },
  { id: 'aqua',  size: '460px', color: 'rgba(56,189,248,0.36)', blur: '95px', opacity: 0.65, position: { top: '5%', right: '-8%' } },
  { id: 'lime',  size: '400px', color: 'rgba(34,197,94,0.3)',   blur: '85px', opacity: 0.5, position: { bottom: '-20%', left: '20%' } },
  { id: 'sun',   size: '300px', color: 'rgba(251,191,36,0.3)',  blur: '75px', opacity: 0.55, position: { bottom: '8%', right: '16%' } },
]

const FLOATERS = [
  { id: 'spark',  emoji: '✨', size: '20px', opacity: 0.6, position: { top: '13%', left: '10%' } },
  { id: 'bolt',   emoji: '⚡', size: '24px', opacity: 0.7, position: { top: '18%', right: '14%' } },
  { id: 'pencil', emoji: '✏️', size: '22px', opacity: 0.6, position: { top: '55%', left: '5%' } },
  { id: 'brush',  emoji: '🖌️', size: '22px', opacity: 0.6, position: { top: '60%', right: '6%' } },
  { id: 'target', emoji: '🎯', size: '20px', opacity: 0.55, position: { bottom: '20%', left: '16%' } },
  { id: 'puzzle', emoji: '🧩', size: '20px', opacity: 0.5, position: { bottom: '14%', right: '18%' } },
]

const wrapVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

export default function HomePage() {
  const navigate = useNavigate()
  const orbRefs = useRef([])
  const floaterRefs = useRef([])
  const [playerName, setPlayerName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])
  const [joinMode, setJoinMode] = useState('quick')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const orbs = orbRefs.current.filter(Boolean)
    const floaters = floaterRefs.current.filter(Boolean)
    if (!orbs.length) return

    const orbCfg = [
      { x: [-28, 55], y: [-18, 45], scale: [1, 1.1],    dur: 18000 },
      { x: [38, -48], y: [28, -38], scale: [1.04, 0.96], dur: 20000 },
      { x: [-18, 38], y: [45, -28], scale: [1, 1.08],    dur: 22000 },
      { x: [18, -28], y: [-36, 28], scale: [1.02, 0.98], dur: 17000 },
    ]

    const oa = orbs.map((t, i) => {
      const c = orbCfg[i % orbCfg.length]
      return anime({ targets: t, translateX: c.x, translateY: c.y, scale: c.scale, easing: 'easeInOutSine', duration: c.dur, direction: 'alternate', loop: true, delay: i * 200 })
    })

    const fa = floaters.map((t, i) =>
      anime({ targets: t, translateY: [0, -16], translateX: [0, i % 2 === 0 ? 12 : -12], rotate: [0, i % 2 === 0 ? 5 : -5], easing: 'easeInOutSine', duration: 11000 + i * 900, direction: 'alternate', loop: true, delay: i * 160 })
    )

    return () => {
      oa.forEach(a => a.pause())
      fa.forEach(a => a.pause())
      anime.remove(orbs)
      anime.remove(floaters)
    }
  }, [])

  const handleJoin = async () => {
    if (!playerName.trim()) { setError('Please enter your name first'); return }
    let code = roomCode
    if (joinMode === 'quick') {
      code = Math.random().toString(36).substring(2, 7).toUpperCase()
    } else if (!roomCode.trim()) {
      setError('Please enter a room code'); return
    } else {
      code = roomCode.toUpperCase()
    }
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    navigate(`/game/${code}`, { state: { playerName: playerName.trim(), avatar: selectedAvatar.emoji } })
  }

  return (
    <div className="home-root min-h-screen w-full relative overflow-hidden">

      {/* Background */}
      <div className="home-bg" aria-hidden="true">
        <div className="home-gradient" />
        <div className="home-grid" />
        <div className="home-orbs">
          {ORBS.map((orb, i) => (
            <div key={orb.id} ref={el => { orbRefs.current[i] = el }} className="home-orb"
              style={{ '--orb-size': orb.size, '--orb-color': orb.color, '--orb-blur': orb.blur, '--orb-opacity': orb.opacity, ...orb.position }} />
          ))}
        </div>
        <div className="home-floaters">
          {FLOATERS.map((f, i) => (
            <div key={f.id} ref={el => { floaterRefs.current[i] = el }} className="home-floater"
              style={{ fontSize: f.size, opacity: f.opacity, ...f.position }}>
              {f.emoji}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="home-content min-h-screen w-full flex items-start sm:items-center justify-center px-4 py-12 relative">
        <motion.div variants={wrapVariants} initial="hidden" animate="visible"
          className="w-full max-w-[480px] relative z-10 flex flex-col gap-5">

          {/* ── Logo ── */}
          <motion.div variants={itemVariants} className="text-center">
            

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}>
              SketchRush
            </h1>
            <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
              Draw fast.{' '}
              <span style={{ color: 'var(--amber)' }}>Guess faster.</span>
            </p>

            {/* Feature pills */}
            <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
              {FEATURES.map(f => (
                <span key={f.text} className="badge badge-brand" style={{ fontSize: '11px' }}>
                  {f.icon} {f.text}
                </span>
              ))}
            </div>
          </motion.div>

          {/* ── Main card ── */}
          <motion.div variants={itemVariants} className="home-card p-6 sm:p-7 flex flex-col gap-6">

            {/* Name */}
            <div className="home-section">
              <label className="home-label"> Your name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', pointerEvents: 'none' }}>🎮</span>
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={e => { setPlayerName(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your player name"
                  style={{ paddingLeft: '38px', paddingRight: '52px' }}
                />
                <span style={{
                  position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                  fontSize: '11px', fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                  color: playerName.length > 12 ? 'var(--amber)' : 'var(--text-faint)',
                  transition: 'color 0.15s'
                }}>
                  {playerName.length}/16
                </span>
              </div>
            </div>

            <div className="home-divider" />

            {/* Avatar picker */}
            <div className="home-section">
              <div className="flex items-center justify-between">
                <label className="home-label">Choose avatar</label>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 500 }}>
                  {selectedAvatar.emoji} {selectedAvatar.label}
                </span>
              </div>
              <div className="avatar-grid">
                {AVATARS.map(avatar => (
                  <motion.button
                    key={avatar.emoji}
                    onClick={() => setSelectedAvatar(avatar)}
                    whileTap={{ scale: 0.93 }}
                    title={avatar.label}
                    aria-pressed={selectedAvatar.emoji === avatar.emoji}
                    className="avatar-card"
                  >
                    <span className="avatar-emoji">{avatar.emoji}</span>
                    <span className="avatar-label">{avatar.label}</span>
                    {selectedAvatar.emoji === avatar.emoji && (
                      <motion.div
                        layoutId="avatar-ring"
                        className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ border: '2px solid rgba(249,115,22,0.85)', borderRadius: '14px' }}
                        transition={{ type: 'spring', stiffness: 450, damping: 28 }}
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="home-divider" />

            {/* Player preview */}
            <motion.div layout className="player-preview">
              <motion.div
                className="player-avatar-box"
                key={selectedAvatar.emoji}
                initial={{ scale: 0.75, rotate: -8 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 420, damping: 22 }}
              >
                {selectedAvatar.emoji}
              </motion.div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text)', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {playerName || 'Your Name'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginBottom: '6px' }}>
                  Playing as {selectedAvatar.label}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="status-dot" style={{ background: 'var(--green)' }} />
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green)' }}>Ready to play</span>
                </div>
              </div>
            </motion.div>

            <div className="home-divider" />

            {/* Join mode */}
            <div className="home-section">
              <label className="home-label">Room</label>
              <div className="mode-tabs">
                {['quick', 'private'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setJoinMode(mode); setRoomCode(''); setError('') }}
                    className={`mode-tab${joinMode === mode ? ' active' : ''}`}
                  >
                    {mode === 'quick' ? '⚡ Quick Play' : '🔒 Private Room'}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {joinMode === 'quick' ? (
                  <motion.div key="quick"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="quick-play-box">
                    <p style={{ fontSize: '13px', color: 'var(--text-faint)' }}>
                      🎲 A random room will be generated for you
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="private"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}>
                    <input
                      type="text"
                      maxLength={5}
                      value={roomCode}
                      onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      placeholder="A1B2C"
                      className="room-code-input"
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
                  className="error-box">
                  <span style={{ fontSize: '14px' }}>⚠️</span>
                  <p style={{ fontSize: '13px', color: 'var(--red)', fontWeight: 500 }}>{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA */}
            <motion.button
              onClick={handleJoin}
              whileHover={{ scale: isLoading ? 1 : 1.015, y: isLoading ? 0 : -2 }}
              whileTap={{ scale: isLoading ? 1 : 0.975 }}
              disabled={isLoading}
              className="btn-primary"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.span key="loading"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2">
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block', fontSize: '16px' }}>⚡</motion.span>
                    Joining room…
                  </motion.span>
                ) : (
                  <motion.span key="idle"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2">
                    {joinMode === 'quick' ? '🎯 Start Playing' : '🚀 Join Room'}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>

          {/* Footer & Credits */}
          <motion.div variants={itemVariants} className="home-footer text-center pb-2 flex flex-col items-center gap-2">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              © {new Date().getFullYear()} SketchRush ·All Rights Reserved·
            </p>
            <div className="flex items-center justify-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span>Created by <strong style={{ color: 'var(--text)' }}>Shreedhar Khorate</strong></span>
              <span className="footer-dot" />
              <a
                href="https://github.com/Shreedhar-Khorate"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
              <span className="footer-dot" />
              <a
                href="https://www.linkedin.com/in/shreedhar-khorate-83ba002a0"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            </div>
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}