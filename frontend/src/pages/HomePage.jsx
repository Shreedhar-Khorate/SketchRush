import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FeedbackModal from '../components/FeedbackModal'
import { loadProfile, saveProfile } from '../lib/profileCookie'
import './HomePage.css'

const AVATARS = [
  { label: 'Fox', emoji: '🦊' },
  { label: 'Cat', emoji: '🐱' },
  { label: 'Dragon', emoji: '🐉' },
  { label: 'Robot', emoji: '🤖' },
  { label: 'Alien', emoji: '👽' },
  { label: 'Wizard', emoji: '🧙' },
  { label: 'Ninja', emoji: '🥷' },
  { label: 'Rocket', emoji: '🚀' },
  { label: 'Unicorn', emoji: '🦄' },
  { label: 'Ghost', emoji: '👻' },
  { label: 'Skull', emoji: '💀' },
  { label: 'Fire', emoji: '🔥' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const howtoRef = useRef(null)

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
    // Default to Cat (matching the HTML landing page design)
    return AVATARS[1]
  })

  const [joinMode, setJoinMode] = useState('quick') // 'quick' | 'private'
  const [roomCode, setRoomCode] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('how') // 'how' | 'about'
  const [showFeedback, setShowFeedback] = useState(false)

  // ── Theme State (light / dark) ───────────────────────────────────────────
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('sr-theme')
      if (saved === 'light' || saved === 'dark') return saved
    } catch {}
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem('sr-theme', theme)
    } catch {}
  }, [theme])

  useEffect(() => {
    if (!window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e) => {
      try {
        const saved = localStorage.getItem('sr-theme')
        if (!saved) {
          setTheme(e.matches ? 'dark' : 'light')
        }
      } catch {}
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'))
  }

  // ── Persist profile cookie reactively (debounced 400 ms) ─────────────────
  useEffect(() => {
    if (!playerName.trim()) return
    const id = setTimeout(() => {
      saveProfile({ name: playerName.trim(), avatarEmoji: selectedAvatar.emoji })
    }, 400)
    return () => clearTimeout(id)
  }, [playerName, selectedAvatar])

  // ── Start / Join Room Handler ─────────────────────────────────────────────
  const handleStart = async () => {
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setError('Please enter your player name first')
      return
    }

    let code = roomCode.trim()
    if (joinMode === 'quick') {
      code = Math.random().toString(36).substring(2, 7).toUpperCase()
    } else if (!code) {
      // In private mode, if code is empty, generate a fresh room code
      code = Math.random().toString(36).substring(2, 7).toUpperCase()
    } else {
      code = code.toUpperCase()
    }

    // Persist profile
    saveProfile({ name: trimmedName, avatarEmoji: selectedAvatar.emoji })

    // Dispatch custom event for interoperability
    const detail = {
      name: trimmedName,
      avatar: selectedAvatar.label,
      avatarEmoji: selectedAvatar.emoji,
      mode: joinMode,
      roomCode: code,
    }
    document.dispatchEvent(new CustomEvent('sketchrush:start', { detail }))
    if (typeof window.onSketchRushStart === 'function') {
      window.onSketchRushStart(detail)
    }

    setIsLoading(true)
    await new Promise(r => setTimeout(r, 450))
    navigate(`/game/${code}`, {
      state: {
        playerName: trimmedName,
        avatar: selectedAvatar.emoji,
      },
    })
  }

  const handleNavToTab = (tabKey) => {
    setActiveTab(tabKey)
    if (howtoRef.current) {
      howtoRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const isNameReady = playerName.trim().length > 0

  return (
    <div className="sr-landing" data-theme={theme}>
      <div className="page">

        {/* ── Header / Topbar ── */}
        <header className="topbar">
          <a
            className="logo"
            href="#"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            aria-label="SketchRush home"
          >
            <span className="logo-mark" aria-hidden="true">✏️</span>
            <span>SketchRush</span>
          </a>

          <nav className="topnav" aria-label="Main">
            <button
              type="button"
              onClick={() => handleNavToTab('how')}
            >
              How to Play
            </button>
            <button
              type="button"
              onClick={() => handleNavToTab('about')}
            >
              About SketchRush
            </button>
          </nav>

          <button
            type="button"
            className="theme"
            id="themeBtn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span id="themeIcon" aria-hidden="true">
              {theme === 'dark' ? '☀️' : '🌙'}
            </span>
          </button>
        </header>

        {/* ── Background Doodles ── */}
        <svg
          className="doodle"
          style={{ left: '2%', top: '90px', width: '46px' }}
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <path
            d="M20 3l4.6 12.4L38 20l-13.4 4.6L20 38l-4.6-13.4L2 20l13.4-4.6z"
            fill="#ffe500"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="doodle hide-sm"
          style={{ left: '44%', top: '30px', width: '70px' }}
          viewBox="0 0 70 24"
          aria-hidden="true"
        >
          <path
            d="M3 18l9-12 9 12 9-12 9 12 9-12 9 12 9-12"
            fill="none"
            stroke="#ff7a1a"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="doodle hide-sm"
          style={{ right: '1%', top: '44px', width: '54px' }}
          viewBox="0 0 50 50"
          aria-hidden="true"
        >
          <circle cx="25" cy="25" r="18" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="25" cy="25" r="6" fill="#c9f03a" stroke="currentColor" strokeWidth="3" />
        </svg>

        <svg
          className="doodle hide-sm"
          style={{ left: '1%', bottom: '150px', width: '80px' }}
          viewBox="0 0 90 60"
          aria-hidden="true"
        >
          <path
            d="M5 45C20 10 55 5 78 28"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M62 26l17 3-6 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="doodle"
          style={{ right: '3%', bottom: '210px', width: '38px' }}
          viewBox="0 0 40 40"
          aria-hidden="true"
        >
          <path
            d="M20 3l4.6 12.4L38 20l-13.4 4.6L20 38l-4.6-13.4L2 20l13.4-4.6z"
            fill="#ffd2bf"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>

        <svg
          className="doodle hide-sm"
          style={{ left: '47%', bottom: '70px', width: '64px' }}
          viewBox="0 0 64 64"
          aria-hidden="true"
        >
          <path
            d="M32 32m0 0c0-4 4-6 7-4s3 8-2 10-12-1-12-10 9-15 19-13 16 14 11 24"
            fill="none"
            stroke="#ff7a1a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </svg>

        {/* ── Main Layout ── */}
        <main className="layout">

          {/* Left Column: Brand Hero */}
          <section className="brand">
            <h1>SketchRush</h1>
            <p className="tagline">
              Draw fast.{' '}
              <span>
                Guess faster.
                <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true">
                  <path
                    d="M2 8c12-8 20 4 32-2s20 4 32-2 20 4 32-2 20 4 32-2 20 4 32-2"
                    fill="none"
                    stroke="#ff7a1a"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </p>

            <ul className="chips">
              <li className="chip" style={{ '--c': 'var(--peach)', '--r': '-2deg' }}>
                <span aria-hidden="true">🎨</span> Draw &amp; Guess
              </li>
              <li className="chip" style={{ '--c': 'var(--sky)', '--r': '1.5deg' }}>
                <span aria-hidden="true">🧠</span> Gesture AI
              </li>
              <li className="chip" style={{ '--c': 'var(--yellow)', '--r': '-1deg' }}>
                <span aria-hidden="true">⚡</span> Real-time
              </li>
              <li className="chip" style={{ '--c': 'var(--lime)', '--r': '2deg' }}>
                <span aria-hidden="true">🏆</span> Leaderboard
              </li>
            </ul>

            <div className="sketch-wrap" aria-hidden="true">
              <div className="sketch">
                <div className="sketch-bar">
                  <i style={{ '--c': '#ff7a1a' }} />
                  <i style={{ '--c': '#ffe500' }} />
                  <i style={{ '--c': '#c9f03a' }} />
                </div>
                <svg className="art" viewBox="0 0 300 220">
                  <path
                    className="fill"
                    d="M80 70l12-42 38 24 40 0 38-24 12 42c8 18 8 42-4 62-14 22-40 34-72 34s-58-12-72-34c-12-20-12-44-4-62z"
                  />
                  <path className="stroke" pathLength={1} style={{ '--d': '.3s' }} d="M112 108v10" />
                  <path className="stroke" pathLength={1} style={{ '--d': '.5s' }} d="M188 108v10" />
                  <path className="stroke" pathLength={1} style={{ '--d': '.7s' }} d="M138 134l12 8 12-8" />
                  <path className="stroke" pathLength={1} style={{ '--d': '.9s' }} d="M150 142v8" />
                  <path className="stroke" pathLength={1} style={{ '--d': '1.1s' }} d="M60 128l38 6M60 152l38-8" />
                  <path className="stroke" pathLength={1} style={{ '--d': '1.3s' }} d="M240 128l-38 6M240 152l-38-8" />
                  <path className="stroke" pathLength={1} style={{ '--d': '1.5s' }} d="M30 30c10-14 22 8 32-6M244 190c10-14 22 8 32-6" />
                </svg>
              </div>
              <svg
                style={{
                  position: 'absolute',
                  right: '-26px',
                  bottom: '-26px',
                  width: '64px',
                  transform: 'rotate(12deg)',
                }}
                viewBox="0 0 60 60"
              >
                <path
                  d="M8 52l4-14 30-30 10 10-30 30z"
                  fill="#ffe500"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
                <path d="M12 38l10 10" stroke="currentColor" strokeWidth="3.5" />
                <path
                  d="M8 52l4-14 10 10z"
                  fill="#ffd2bf"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </section>

          {/* Right Column: Cards */}
          <div className="stack">

            {/* Setup Card */}
            <section className="card setup" aria-label="Player setup">

              {/* Name Field */}
              <div className="field-head">
                <label className="label" htmlFor="name">Your Name</label>
                <span
                  className={`ready ${isNameReady ? '' : 'warn'}`}
                  id="ready"
                  role="status"
                >
                  {isNameReady ? 'Ready to play' : 'Enter a name'}
                </span>
              </div>

              <div className="name-box">
                <span className="name-avatar" id="nameAvatar" aria-hidden="true">
                  {selectedAvatar.emoji}
                </span>
                <input
                  id="name"
                  type="text"
                  maxLength={16}
                  value={playerName}
                  onChange={(e) => {
                    setPlayerName(e.target.value)
                    setError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                  autoComplete="nickname"
                  spellCheck={false}
                  placeholder="Enter your name"
                />
                <span className="count" id="count">
                  {playerName.length}/16
                </span>
              </div>

              {/* Avatar Selector */}
              <div className="section-gap">
                <div className="field-head">
                  <span className="label" id="avatarLabel">Choose Avatar</span>
                  <span className="current">
                    <span id="curEm" aria-hidden="true">{selectedAvatar.emoji}</span>{' '}
                    <span id="curName">{selectedAvatar.label}</span>
                  </span>
                </div>

                <div className="avatars" id="avatars" role="radiogroup" aria-labelledby="avatarLabel">
                  {AVATARS.map((avatar) => {
                    const isSelected = selectedAvatar.label === avatar.label
                    return (
                      <button
                        key={avatar.label}
                        type="button"
                        className="avatar"
                        role="radio"
                        aria-checked={isSelected}
                        aria-label={avatar.label}
                        onClick={() => setSelectedAvatar(avatar)}
                      >
                        <span className="em" aria-hidden="true">{avatar.emoji}</span>
                        <span className="nm">{avatar.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Room Mode Selector */}
              <div className="section-gap">
                <div className="field-head">
                  <span className="label" id="modeLabel">Room Mode</span>
                </div>

                <div className="modes" role="radiogroup" aria-labelledby="modeLabel">
                  <button
                    type="button"
                    className="mode"
                    role="radio"
                    aria-checked={joinMode === 'quick'}
                    onClick={() => {
                      setJoinMode('quick')
                      setRoomCode('')
                      setError('')
                    }}
                  >
                    <span className="ic" aria-hidden="true">⚡</span>
                    <span>
                      <b>Quick Play</b>
                      <small>Join active lobbies automatically</small>
                    </span>
                  </button>

                  <button
                    type="button"
                    className="mode"
                    role="radio"
                    aria-checked={joinMode === 'private'}
                    onClick={() => {
                      setJoinMode('private')
                      setError('')
                    }}
                  >
                    <span className="ic" aria-hidden="true">🔒</span>
                    <span>
                      <b>Private Room</b>
                      <small>Create/join lobby using a code</small>
                    </span>
                  </button>
                </div>

                <div className={`code-row ${joinMode === 'private' ? 'show' : ''}`} id="codeRow">
                  <input
                    id="code"
                    type="text"
                    maxLength={8}
                    value={roomCode}
                    onChange={(e) => {
                      setRoomCode(e.target.value.toUpperCase())
                      setError('')
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                    placeholder="Room code (leave empty to create one)"
                    aria-label="Room code"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>

                <p className="note">
                  <span aria-hidden="true">🎲</span>{' '}
                  {joinMode === 'quick'
                    ? 'A random, optimized room code will be generated for your session.'
                    : 'Leave empty to generate a new room code, or enter a friend’s code to join.'}
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="error-box-neobrutal" role="alert">
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Start Playing CTA */}
              <button
                type="button"
                className="start"
                id="start"
                onClick={handleStart}
                disabled={isLoading}
              >
                <span aria-hidden="true">{isLoading ? '⚡' : '🎯'}</span>{' '}
                {isLoading
                  ? 'Joining room…'
                  : joinMode === 'quick'
                  ? 'Start Playing'
                  : roomCode.trim()
                  ? 'Join Room'
                  : 'Create Room'}
              </button>
            </section>

            {/* How to Play & About Card */}
            <section className="card howto" id="howto" ref={howtoRef} aria-label="How to play and about">
              <div className="tabs" role="tablist">
                <button
                  type="button"
                  className="tab"
                  role="tab"
                  id="t-how"
                  aria-selected={activeTab === 'how'}
                  aria-controls="p-how"
                  onClick={() => setActiveTab('how')}
                >
                  <span aria-hidden="true">🎮</span> How to Play
                </button>
                <button
                  type="button"
                  className="tab"
                  role="tab"
                  id="t-about"
                  aria-selected={activeTab === 'about'}
                  aria-controls="p-about"
                  tabIndex={activeTab === 'about' ? 0 : -1}
                  onClick={() => setActiveTab('about')}
                >
                  <span aria-hidden="true">✨</span> About SketchRush
                </button>
              </div>

              <div className="panel" id="p-how" role="tabpanel" aria-labelledby="t-how" hidden={activeTab !== 'how'}>
                <ol className="steps">
                  <li>
                    <span className="n">1</span>
                    <p>Enter your <b>Player Name</b> and pick an <b>Avatar</b> character.</p>
                  </li>
                  <li>
                    <span className="n">2</span>
                    <p>Select <b>Quick Play</b> to auto-join a lobby, or create a <b>Private Room</b> for friends.</p>
                  </li>
                  <li>
                    <span className="n">3</span>
                    <p>Draw the word shown on the canvas as fast as possible before the timer runs out!</p>
                  </li>
                  <li>
                    <span className="n">4</span>
                    <p>Guess other players' drawings in real-time. Faster correct guesses score higher points!</p>
                  </li>
                </ol>
              </div>

              <div
                className="panel about"
                id="p-about"
                role="tabpanel"
                aria-labelledby="t-about"
                hidden={activeTab !== 'about'}
              >
                <p>SketchRush is a real-time draw-and-guess game. Race the timer to sketch the word you're given, while everyone else guesses live.</p>
                <p>Gesture AI recognises your drawing as you go, and the leaderboard ranks the fastest guessers.</p>
              </div>
            </section>
          </div>
        </main>

        {/* ── Footer ── */}
        <footer>
          <p>© 2026 SketchRush<span className="sep">·</span>All Rights Reserved<span className="sep">·</span></p>
          <p>
            Created by <strong>Shreedhar Khorate</strong>
            <span className="sep">·</span>
            <a
              href="https://github.com/Shreedhar-Khorate"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            <span className="sep">·</span>
            <a
              href="https://www.linkedin.com/in/shreedhar-khorate-83ba002a0"
              target="_blank"
              rel="noopener noreferrer"
            >
              LinkedIn
            </a>
            <span className="sep">·</span>
            <button
              type="button"
              className="footer-feedback-btn"
              onClick={() => setShowFeedback(true)}
            >
              Feedback
            </button>
          </p>
        </footer>
      </div>

      {/* ── Retain existing Feedback Modal ── */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  )
}