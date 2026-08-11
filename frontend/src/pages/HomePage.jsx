import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import anime from 'animejs'
import FeedbackModal from '../components/FeedbackModal'
import { loadProfile, saveProfile } from '../lib/profileCookie'

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
  { id: 'aqua', size: '460px', color: 'rgba(56,189,248,0.36)', blur: '95px', opacity: 0.65, position: { top: '5%', right: '-8%' } },
  { id: 'lime', size: '400px', color: 'rgba(34,197,94,0.3)', blur: '85px', opacity: 0.5, position: { bottom: '-20%', left: '20%' } },
  { id: 'sun', size: '300px', color: 'rgba(251,191,36,0.3)', blur: '75px', opacity: 0.55, position: { bottom: '8%', right: '16%' } },
]

const FLOATERS = [
  { id: 'spark', emoji: '✨', size: '20px', opacity: 0.6, position: { top: '13%', left: '10%' }, factor: 15 },
  { id: 'bolt', emoji: '⚡', size: '24px', opacity: 0.7, position: { top: '18%', right: '14%' }, factor: -20 },
  { id: 'pencil', emoji: '✏️', size: '22px', opacity: 0.6, position: { top: '55%', left: '5%' }, factor: 25 },
  { id: 'brush', emoji: '🖌️', size: '22px', opacity: 0.6, position: { top: '60%', right: '6%' }, factor: -15 },
  { id: 'target', emoji: '🎯', size: '20px', opacity: 0.55, position: { bottom: '20%', left: '16%' }, factor: 30 },
  { id: 'puzzle', emoji: '🧩', size: '20px', opacity: 0.5, position: { bottom: '14%', right: '18%' }, factor: -25 },
]

const wrapVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 100, damping: 15 } },
}

const gridVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.04
    }
  }
}

const avatarVariants = {
  hidden: { opacity: 0, scale: 0.6, y: 15 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 260,
      damping: 18
    }
  }
}

export default function HomePage() {
  const navigate = useNavigate()
  const orbRefs = useRef([])
  const floaterRefs = useRef([])
  const sketchRefs = useRef([])
  // ── Restore profile from cookie (auto-fill name + avatar) ─────────────────
  const [playerName, setPlayerName] = useState(() => {
    const saved = loadProfile()
    return saved?.name || ''
  })
  const [selectedAvatar, setSelectedAvatar] = useState(() => {
    const saved = loadProfile()
    if (saved?.avatarEmoji) {
      const match = AVATARS.find(a => a.emoji === saved.avatarEmoji)
      if (match) return match
    }
    return AVATARS[0]
  })
  const [joinMode, setJoinMode] = useState('quick')
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [infoTab, setInfoTab] = useState('how-to-play')
  const [showFeedback, setShowFeedback] = useState(false)

  // ── Persist profile cookie reactively (debounced 400 ms) ─────────────────
  // Saves as soon as the user types their name or picks an avatar,
  // so the cookie is always up-to-date even if they close the tab before joining.
  useEffect(() => {
    if (!playerName.trim()) return   // don’t overwrite a valid cookie with blank
    const id = setTimeout(() => {
      saveProfile({ name: playerName.trim(), avatarEmoji: selectedAvatar.emoji })
    }, 400)
    return () => clearTimeout(id)
  }, [playerName, selectedAvatar])

  // Typewriter tagline
  const taglineFullText = "Draw fast. Guess faster."
  const [taglineText, setTaglineText] = useState('')
  const [showCursor, setShowCursor] = useState(true)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTaglineText(taglineFullText.slice(0, i + 1))
      i++
      if (i >= taglineFullText.length) {
        clearInterval(interval)
      }
    }, 60)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      setShowCursor(prev => !prev)
    }, 530)
    return () => clearInterval(timer)
  }, [])

  // Parallax mouse position
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const handleMouseMove = useCallback((e) => {
    const x = (e.clientX / window.innerWidth) - 0.5
    const y = (e.clientY / window.innerHeight) - 0.5
    setMousePos({ x, y })
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const orbs = orbRefs.current.filter(Boolean)
    const floaters = floaterRefs.current.filter(Boolean)
    const sketchLines = sketchRefs.current.filter(Boolean)
    if (!orbs.length) return

    const orbCfg = [
      { x: [-28, 55], y: [-18, 45], scale: [1, 1.1], dur: 18000 },
      { x: [38, -48], y: [28, -38], scale: [1.04, 0.96], dur: 20000 },
      { x: [-18, 38], y: [45, -28], scale: [1, 1.08], dur: 22000 },
      { x: [18, -28], y: [-36, 28], scale: [1.02, 0.98], dur: 17000 },
    ]

    const oa = orbs.map((t, i) => {
      const c = orbCfg[i % orbCfg.length]
      return anime({ targets: t, translateX: c.x, translateY: c.y, scale: c.scale, easing: 'easeInOutSine', duration: c.dur, direction: 'alternate', loop: true, delay: i * 200 })
    })

    const fa = floaters.map((t, i) =>
      anime({ targets: t, translateY: [0, -16], translateX: [0, i % 2 === 0 ? 12 : -12], rotate: [0, i % 2 === 0 ? 5 : -5], easing: 'easeInOutSine', duration: 11000 + i * 900, direction: 'alternate', loop: true, delay: i * 160 })
    )

    const sa = anime({
      targets: sketchLines,
      strokeDashoffset: [anime.setDashoffset, 0],
      easing: 'easeInOutCubic',
      duration: 3500,
      delay: (t, i) => i * 450,
      loop: false
    })

    return () => {
      oa.forEach(a => a.pause())
      fa.forEach(a => a.pause())
      sa.pause()
      anime.remove(orbs)
      anime.remove(floaters)
      anime.remove(sketchLines)
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
    // Persist profile so name + avatar are auto-filled on next visit
    saveProfile({ name: playerName.trim(), avatarEmoji: selectedAvatar.emoji })
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 600))
    navigate(`/game/${code}`, { state: { playerName: playerName.trim(), avatar: selectedAvatar.emoji } })
  }

  return (
    <div className="home-root min-h-screen w-full relative overflow-y-auto overflow-x-hidden">

      {/* Background */}
      <div className="home-bg" aria-hidden="true">
        <div className="home-gradient" />
        <div className="home-grid" />

        {/* Glowing Sketch Lines (Self-drawing) */}
        <div 
          className="home-sketch-container"
          style={{
            transform: `translate(${mousePos.x * 35}px, ${mousePos.y * 35}px)`,
            transition: 'transform 0.5s cubic-bezier(0.1, 0.8, 0.2, 1)'
          }}
        >
          <svg className="home-sketch-lines" viewBox="0 0 1000 1000" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              ref={el => { sketchRefs.current[0] = el }}
              d="M -100,200 C 200,100 300,500 500,400 C 700,300 800,700 1100,600"
              stroke="url(#sketch-grad-1)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.38"
            />
            <path
              ref={el => { sketchRefs.current[1] = el }}
              d="M 1100,150 C 800,250 700,50 400,200 C 100,350 -50,150 -100,300"
              stroke="url(#sketch-grad-2)"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.28"
            />
            <path
              ref={el => { sketchRefs.current[2] = el }}
              d="M 150,900 C 300,800 450,950 600,850 C 750,750 850,900 1050,800"
              stroke="url(#sketch-grad-3)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.32"
            />
            
            <defs>
              <linearGradient id="sketch-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22c55e" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="sketch-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a371f7" stopOpacity="0.7" />
              </linearGradient>
              <linearGradient id="sketch-grad-3" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#22c55e" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#fb923c" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.7" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Particle Rain Background */}
        <div className="particle-rain">
          {Array.from({ length: 24 }).map((_, idx) => {
            const x = `${(idx * 7.7 + 5) % 96}%`
            const delay = `${(idx * 0.45).toFixed(2)}s`
            const duration = `${(8 + (idx % 3) * 3)}s`
            const size = `${(2 + (idx % 2) * 2)}px`
            const opacity = (0.25 + (idx % 3) * 0.2).toFixed(2)
            const colorMap = ['rgba(249, 115, 22, 0.6)', 'rgba(56, 189, 248, 0.5)', 'rgba(34, 197, 94, 0.45)']
            const color = colorMap[idx % 3]

            return (
              <div
                key={idx}
                className="particle"
                style={{
                  '--x': x,
                  '--delay': delay,
                  '--duration': duration,
                  '--size': size,
                  '--opacity': opacity,
                  '--color': color
                }}
              />
            )
          })}
        </div>

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
              <div
                style={{
                  transform: `translate(${mousePos.x * f.factor}px, ${mousePos.y * f.factor}px)`,
                  transition: 'transform 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)'
                }}
              >
                {f.emoji}
              </div>
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


            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-2 title-gradient"
              style={{ letterSpacing: '-0.02em' }}>
              SketchRush
            </h1>
            <p className="text-sm font-medium min-h-[20px]" style={{ color: 'var(--text-muted)' }}>
              {taglineText.slice(0, 11)}
              {taglineText.length > 11 && (
                <span style={{ color: 'var(--amber)' }}>{taglineText.slice(11)}</span>
              )}
              <span className={`inline-block w-1.5 h-3.5 ml-0.5 ${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity`} style={{ background: 'var(--amber)', verticalAlign: 'middle' }} />
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
          <motion.div variants={itemVariants} className="home-card p-7 sm:p-9 flex flex-col gap-7">

            {/* Name */}
            <div className="home-section">
              <div className="home-label-container">
                <label className="home-label">Your Name</label>
                <div className="flex items-center gap-1.5" style={{ color: 'var(--green)' }}>
                  <span className="status-dot-container">
                    <span className="status-dot" style={{ background: 'var(--green)' }} />
                  </span>
                  <span className="status-dot-text">Ready to play</span>
                </div>
              </div>
              <div style={{ position: 'relative' }}>
                <div className="name-input-avatar-badge">
                  <motion.span 
                    key={selectedAvatar.emoji}
                    initial={{ scale: 0.7, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 15 }}
                    style={{ display: 'inline-block' }}
                  >
                    {selectedAvatar.emoji}
                  </motion.span>
                </div>
                <input
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={e => { setPlayerName(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  placeholder="Enter your player name"
                  className="name-input-field"
                />
                <span className="name-input-char-counter">
                  {playerName.length}/16
                </span>
              </div>
            </div>

            <div className="home-divider" />

            {/* Avatar picker */}
            <div className="home-section">
              <div className="home-label-container">
                <label className="home-label">Choose Avatar</label>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {selectedAvatar.emoji} {selectedAvatar.label}
                </span>
              </div>
              <motion.div variants={gridVariants} className="avatar-grid">
                {AVATARS.map(avatar => (
                  <motion.button
                    key={avatar.emoji}
                    variants={avatarVariants}
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
              </motion.div>
            </div>

            <div className="home-divider" />

            {/* Join mode */}
            <div className="home-section">
              <div className="home-label-container">
                <label className="home-label">Room Mode</label>
              </div>
              <div className="room-options-grid">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setJoinMode('quick'); setRoomCode(''); setError('') }}
                  className={`room-option-card ${joinMode === 'quick' ? 'active' : ''}`}
                >
                  <div className="room-option-icon">⚡</div>
                  <div className="room-option-meta">
                    <span className="room-option-title">Quick Play</span>
                    <span className="room-option-desc">Join active lobbies automatically</span>
                  </div>
                  {joinMode === 'quick' && (
                    <motion.div layoutId="room-glow" className="room-option-active-border" />
                  )}
                </motion.button>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02, y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setJoinMode('private'); setError('') }}
                  className={`room-option-card ${joinMode === 'private' ? 'active' : ''}`}
                >
                  <div className="room-option-icon">🔒</div>
                  <div className="room-option-meta">
                    <span className="room-option-title">Private Room</span>
                    <span className="room-option-desc">Create/join lobby using a code</span>
                  </div>
                  {joinMode === 'private' && (
                    <motion.div layoutId="room-glow" className="room-option-active-border" />
                  )}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                {joinMode === 'quick' ? (
                  <motion.div key="quick"
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="quick-play-box">
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      🎲 A random, optimized room code will be generated for your session.
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
                      placeholder="ENTER CODE (E.G. A1B2C)"
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
            <div className="btn-primary-container">
              {!isLoading && <div className="btn-glow-ring" />}
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
            </div>
          </motion.div>

          {/* ── Info Card (About & How to Play) ── */}
          <motion.div variants={itemVariants} className="home-info-card p-5 flex flex-col gap-4">
            <div className="flex pb-2 gap-2" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <button
                type="button"
                onClick={() => setInfoTab('how-to-play')}
                className={`info-tab-btn ${infoTab === 'how-to-play' ? 'active' : ''}`}
              >
                🎮 How to Play
                {infoTab === 'how-to-play' && (
                  <motion.div layoutId="info-tab-glow" className="info-tab-glow-bar" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setInfoTab('about')}
                className={`info-tab-btn ${infoTab === 'about' ? 'active' : ''}`}
              >
                ✨ About SketchRush
                {infoTab === 'about' && (
                  <motion.div layoutId="info-tab-glow" className="info-tab-glow-bar" />
                )}
              </button>
            </div>
            
            <AnimatePresence mode="wait">
              {infoTab === 'how-to-play' ? (
                <motion.div
                  key="how-to"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2.5"
                >
                  <div className="info-step">
                    <div className="info-step-num">1</div>
                    <p className="info-step-text">
                      Enter your <strong>Player Name</strong> and pick an <strong>Avatar</strong> character.
                    </p>
                  </div>
                  <div className="info-step">
                    <div className="info-step-num">2</div>
                    <p className="info-step-text">
                      Select <strong>Quick Play</strong> to auto-join a lobby, or create a <strong>Private Room</strong> for friends.
                    </p>
                  </div>
                  <div className="info-step">
                    <div className="info-step-num">3</div>
                    <p className="info-step-text">
                      Draw the word shown on the canvas as fast as possible before the timer runs out!
                    </p>
                  </div>
                  <div className="info-step">
                    <div className="info-step-num">4</div>
                    <p className="info-step-text">
                      Guess other players' drawings in real-time. Faster correct guesses score higher points!
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-2.5 text-[12px] leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <p>
                    <strong>SketchRush</strong> is a real-time multiplayer drawing and guessing game designed for high-speed creative competition.
                  </p>
                  <p>
                    Featuring sub-second WebSocket sync and high-performance interactive drawing canvases, it connects players seamlessly across desktop and mobile devices.
                  </p>
                  <p>
                    Draw with speed, guess with precision, and dominate the scoreboard in a competitive race against the clock!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Footer & Credits */}
          <motion.div variants={itemVariants} className="home-footer text-center pb-2 flex flex-col items-center gap-2">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
              © {new Date().getFullYear()} SketchRush ·All Rights Reserved·
            </p>
            <div className="flex items-center justify-center gap-3 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
              <span>Created by <strong style={{ color: 'var(--text)' }}>Shreedhar Khorate</strong></span>
              <span className="footer-dot" />
              <a
                href="https://github.com/Shreedhar-Khorate"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
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
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>LinkedIn</span>
              </a>
              <span className="footer-dot" />
              <button
                type="button"
                onClick={() => setShowFeedback(true)}
                className="footer-link"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  fontFamily: 'inherit',
                  fontSize: 'inherit',
                  color: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                 <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" style={{ display: 'inline-block' }}>
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span> Feedback </span>
              </button>
            </div>
          </motion.div>

        </motion.div>
      </div>

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  )
}