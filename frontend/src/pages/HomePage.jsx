import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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

const BADGES = [
  { text: 'MULTIPLAYER ⚡', color: 'var(--yellow)', rotate: '-2deg' },
  { text: 'AIR CANVAS AI ✋', color: 'var(--green)', rotate: '2.5deg' },
  { text: 'REAL-TIME SYNC 🎯', color: 'var(--blue)', rotate: '-1.5deg' },
  { text: 'UP TO 8 PLAYERS 🏆', color: 'var(--coral)', rotate: '3deg' },
]

export default function HomePage() {
  const navigate = useNavigate()

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
  useEffect(() => {
    if (!playerName.trim()) return
    const id = setTimeout(() => {
      saveProfile({ name: playerName.trim(), avatarEmoji: selectedAvatar.emoji })
    }, 400)
    return () => clearTimeout(id)
  }, [playerName, selectedAvatar])

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setError('PLEASE ENTER YOUR PLAYER NAME!')
      return
    }
    let code = roomCode
    if (joinMode === 'quick') {
      code = Math.random().toString(36).substring(2, 7).toUpperCase()
    } else if (!roomCode.trim()) {
      setError('PLEASE ENTER A 5-LETTER ROOM CODE!')
      return
    } else {
      code = roomCode.toUpperCase()
    }

    saveProfile({ name: playerName.trim(), avatarEmoji: selectedAvatar.emoji })
    setIsLoading(true)
    await new Promise(r => setTimeout(r, 450))
    navigate(`/game/${code}`, { state: { playerName: playerName.trim(), avatar: selectedAvatar.emoji } })
  }

  return (
    <div className="home-root flex flex-col min-h-screen">

      {/* ── Top Neo-Brutalist Navbar ───────────────────────────────────────── */}
      <nav className="neo-nav">
        <div className="neo-nav-inner">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="neo-nav-icon">
              <span>✏️</span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="neo-nav-title text-lg sm:text-2xl">SketchRush</span>
              <span className="neo-badge neo-badge-coral text-[9px] sm:text-[10px] py-0.5 px-1.5 hidden sm:inline">v2.0</span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <span className="neo-nav-tagline">DRAW FAST. GUESS FASTER.</span>
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#171717]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B7F56A] border border-black animate-pulse" />
              <span className="text-xs font-black uppercase">LIVE MULTIPLAYER</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className="neo-btn neo-btn-sm neo-btn-white"
              title="Share Feedback"
            >
              💬 <span className="hidden sm:inline">Feedback</span>
            </button>
            <a
              href="https://github.com/Shreedhar-Khorate/SketchRush"
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn neo-btn-sm neo-btn-yellow"
              title="GitHub Repository"
            >
              ⭐ <span className="hidden sm:inline">GitHub</span>
            </a>
          </div>
        </div>
      </nav>

      {/* ── Main Content Area ──────────────────────────────────────────────── */}
      <main className="page-container py-6 sm:py-10 flex flex-col gap-8 sm:gap-12">

        {/* ── Hero & Terminal Grid ─────────────────────────────────────────── */}
        <div className="hero-layout-grid">
          
          {/* Left Column: Bold Typography & Arcade Preview ──────────────────── */}
          <div className="flex flex-col gap-6">
            
            {/* Top Badge Strip */}
            <div className="flex flex-wrap items-center gap-2">
              {BADGES.map((b, i) => (
                <div
                  key={i}
                  className="neo-badge"
                  style={{
                    backgroundColor: b.color,
                    transform: `rotate(${b.rotate})`,
                    color: b.color === 'var(--coral)' ? '#FFFFFF' : '#171717',
                  }}
                >
                  {b.text}
                </div>
              ))}
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-[0.98]" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
                DRAW FAST. <br />
                <span className="bg-[#FFD84D] px-3.5 py-1 border-[3px] border-[#171717] shadow-[5px_5px_0px_#171717] inline-block mt-2">
                  GUESS FASTER.
                </span>
              </h1>
              <p className="text-base sm:text-lg font-medium text-[#454545] mt-4 leading-relaxed max-w-xl">
                Your friends draw the chaos. You guess the masterpiece. Jump into instant multiplayer lobbies with ultra-smooth drawing and AI-powered air canvas hand gestures!
              </p>
            </div>

            {/* Playful Arcade Artboard Preview Card */}
            <div className="neo-card p-4 sm:p-5 bg-white relative overflow-hidden">
              {/* Card top banner */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#171717]">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FF6B6B] border border-black" />
                  <span className="w-3 h-3 rounded-full bg-[#FFD84D] border border-black" />
                  <span className="w-3 h-3 rounded-full bg-[#B7F56A] border border-black" />
                  <span className="text-xs font-black uppercase ml-1">MATCH IN PROGRESS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="neo-badge neo-badge-coral text-[10px] py-0.5">⏱ 45s</span>
                  <span className="neo-badge neo-badge-lavender text-[10px] py-0.5">ROUND 2/5</span>
                </div>
              </div>

              {/* Mini canvas doodle illustration */}
              <div className="preview-canvas-box">
                <svg className="preview-canvas-svg" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Cat doodle */}
                  <circle cx="150" cy="80" r="35" stroke="#171717" strokeWidth="3.5" fill="#FFEAA7" />
                  {/* Ears */}
                  <polygon points="125,55 115,25 140,48" stroke="#171717" strokeWidth="3.5" fill="#FF7675" />
                  <polygon points="175,55 185,25 160,48" stroke="#171717" strokeWidth="3.5" fill="#FF7675" />
                  {/* Eyes */}
                  <circle cx="138" cy="75" r="4" fill="#171717" />
                  <circle cx="162" cy="75" r="4" fill="#171717" />
                  {/* Nose & Mouth */}
                  <polygon points="150,83 146,88 154,88" fill="#FF6B6B" stroke="#171717" strokeWidth="1" />
                  <path d="M146,88 Q150,94 154,88" stroke="#171717" strokeWidth="2.5" fill="none" />
                  {/* Whiskers */}
                  <line x1="115" y1="80" x2="132" y2="82" stroke="#171717" strokeWidth="2.5" />
                  <line x1="115" y1="88" x2="132" y2="86" stroke="#171717" strokeWidth="2.5" />
                  <line x1="168" y1="82" x2="185" y2="80" stroke="#171717" strokeWidth="2.5" />
                  <line x1="168" y1="86" x2="185" y2="88" stroke="#171717" strokeWidth="2.5" />
                  {/* Floating brush stroke */}
                  <path d="M40,110 Q90,30 200,35" stroke="#7BA7FF" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 6" />
                  <text x="20" y="30" fontFamily="Space Grotesk" fontWeight="900" fontSize="11" fill="#171717">🎨 🦊 SpeedDraw is drawing...</text>
                </svg>

                {/* Floating stickers on canvas */}
                <div className="absolute top-2 right-2 neo-badge neo-badge-green text-[10px] transform rotate-3 whitespace-nowrap">
                  ✅ GUESSED: CAT! (+150 PTS)
                </div>

                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-white border-2 border-black px-2 py-0.5 shadow-[2px_2px_0px_#171717] whitespace-nowrap">
                  <span className="text-xs">✋</span>
                  <span className="text-[10px] font-black uppercase">AIR CANVAS AI</span>
                </div>
              </div>

              {/* Mini player strip under doodle */}
              <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t-2 border-[#171717]">
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FFD84D] border border-black text-xs font-black uppercase">
                  <span>👑 Alex: 420 pts</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-black text-xs font-black uppercase">
                  <span>🥈 Maya: 380 pts</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#FF9F43]/30 border border-black text-xs font-black uppercase">
                  <span>🥉 Leo: 290 pts</span>
                </div>
              </div>
            </div>

            {/* Feature Callout Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="p-3 bg-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-center flex flex-col items-center justify-center gap-0.5">
                <div className="text-xl sm:text-2xl mb-0.5">🎨</div>
                <div className="text-xs font-black uppercase text-[#171717]">Canvas Sync</div>
                <div className="text-[10px] text-[#6B7280] font-bold">&lt;50ms latency</div>
              </div>

              <div className="p-3 bg-[#DCCBFF] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-center flex flex-col items-center justify-center gap-0.5">
                <div className="text-xl sm:text-2xl mb-0.5">✋</div>
                <div className="text-xs font-black uppercase text-[#171717]">Air Gesture</div>
                <div className="text-[10px] text-[#454545] font-bold">MediaPipe AI</div>
              </div>

              <div className="p-3 bg-[#B7F56A] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-center flex flex-col items-center justify-center gap-0.5">
                <div className="text-xl sm:text-2xl mb-0.5">⚡</div>
                <div className="text-xs font-black uppercase text-[#171717]">Live Chat</div>
                <div className="text-[10px] text-[#454545] font-bold">Instant detection</div>
              </div>

              <div className="p-3 bg-[#FF6B6B] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] text-center text-white flex flex-col items-center justify-center gap-0.5">
                <div className="text-xl sm:text-2xl mb-0.5">🏆</div>
                <div className="text-xs font-black uppercase">Scoreboard</div>
                <div className="text-[10px] text-white/90 font-bold">Dynamic points</div>
              </div>
            </div>

          </div>

          {/* Right Column: Tactile Arcade Game Terminal Card ───────────────── */}
          <div className="w-full">
            <div className="home-card">
              
              {/* Terminal Title Bar */}
              <div className="bg-[#FFD84D] border-b-[3px] border-[#171717] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-full bg-[#FF6B6B] border-2 border-black inline-block" />
                  <span className="w-3.5 h-3.5 rounded-full bg-white border-2 border-black inline-block" />
                  <span className="w-3.5 h-3.5 rounded-full bg-[#B7F56A] border-2 border-black inline-block" />
                  <span className="font-black text-xs uppercase tracking-wider ml-1">GAME ENTRY TERMINAL</span>
                </div>
                <span className="neo-badge neo-badge-white text-[10px] py-0.5">READY</span>
              </div>

              {/* Form Content */}
              <div className="p-4 sm:p-6 lg:p-7 flex flex-col gap-4 sm:gap-6">

                {/* Section 1: Player Name */}
                <div className="home-section">
                  <div className="home-label-container">
                    <label className="home-label">1. ENTER YOUR CODENAME</label>
                    <span className="text-[11px] font-bold text-[#454545] uppercase">
                      {playerName.length}/16 CHARS
                    </span>
                  </div>

                  <div className="name-input-wrapper">
                    <div className="name-input-avatar-badge" title={selectedAvatar.label}>
                      <span>{selectedAvatar.emoji}</span>
                    </div>
                    <input
                      type="text"
                      maxLength={16}
                      value={playerName}
                      onChange={e => { setPlayerName(e.target.value); setError('') }}
                      onKeyDown={e => e.key === 'Enter' && handleJoin()}
                      placeholder="e.g. MasterSkid, SpeedSketch..."
                      className="name-input-field"
                    />
                    <span className="name-input-char-counter">
                      {selectedAvatar.label}
                    </span>
                  </div>
                </div>

                <div className="home-divider" />

                {/* Section 2: Avatar Selection */}
                <div className="home-section">
                  <div className="home-label-container">
                    <label className="home-label">2. CHOOSE YOUR AVATAR</label>
                    <span className="neo-badge neo-badge-lavender text-[10px]">
                      {selectedAvatar.emoji} {selectedAvatar.label}
                    </span>
                  </div>

                  <div className="avatar-grid">
                    {AVATARS.map(avatar => {
                      const isSelected = selectedAvatar.emoji === avatar.emoji
                      return (
                        <button
                          key={avatar.emoji}
                          type="button"
                          onClick={() => setSelectedAvatar(avatar)}
                          className={`avatar-card ${isSelected ? 'active' : ''}`}
                          title={avatar.label}
                        >
                          <span className="avatar-emoji">{avatar.emoji}</span>
                          <span className="avatar-label">{avatar.label}</span>
                          {isSelected && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#B7F56A] border-2 border-[#171717] rounded-full flex items-center justify-center text-[9px] font-black">
                              ✓
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="home-divider" />

                {/* Section 3: Room Mode */}
                <div className="home-section">
                  <div className="home-label-container">
                    <label className="home-label">3. SELECT ROOM MODE</label>
                  </div>

                  <div className="room-options-grid">
                    <button
                      type="button"
                      onClick={() => { setJoinMode('quick'); setRoomCode(''); setError('') }}
                      className={`room-option-card ${joinMode === 'quick' ? 'active' : ''}`}
                    >
                      <div className="room-option-icon">⚡</div>
                      <div className="room-option-meta">
                        <span className="room-option-title">Quick Play</span>
                        <span className="room-option-desc">Auto-generate room</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setJoinMode('private'); setError('') }}
                      className={`room-option-card ${joinMode === 'private' ? 'active' : ''}`}
                    >
                      <div className="room-option-icon">🔒</div>
                      <div className="room-option-meta">
                        <span className="room-option-title">Private Room</span>
                        <span className="room-option-desc">Join via code</span>
                      </div>
                    </button>
                  </div>

                  <AnimatePresence mode="wait">
                    {joinMode === 'quick' ? (
                      <motion.div
                        key="quick"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="quick-play-box"
                      >
                        <span className="text-base">🎲</span>
                        <span>A fresh high-speed lobby will be created automatically.</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="private"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="flex flex-col gap-1.5"
                      >
                        <input
                          type="text"
                          maxLength={5}
                          value={roomCode}
                          onChange={e => { setRoomCode(e.target.value.toUpperCase()); setError('') }}
                          onKeyDown={e => e.key === 'Enter' && handleJoin()}
                          placeholder="ENTER 5-DIGIT CODE"
                          className="room-code-input"
                        />
                        <span className="text-[11px] text-[#6B7280] font-bold text-center">
                          Ask your room host for the 5-character code
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error Banner */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="error-box"
                    >
                      <span className="text-xl">⚠️</span>
                      <p className="text-xs font-black text-[#FF0033] uppercase">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit Action Button */}
                <motion.button
                  type="button"
                  onClick={handleJoin}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className="neo-btn neo-btn-lg neo-btn-primary w-full"
                  style={{
                    backgroundColor: joinMode === 'quick' ? 'var(--yellow)' : 'var(--coral)',
                    color: joinMode === 'quick' ? 'var(--ink)' : '#FFFFFF',
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin inline-block">⚡</span>
                      CONNECTING TO LOBBY...
                    </span>
                  ) : joinMode === 'quick' ? (
                    <span className="flex items-center gap-2 text-base font-black">
                      🎯 START PLAYING NOW
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-base font-black">
                      🚀 JOIN PRIVATE ROOM
                    </span>
                  )}
                </motion.button>

              </div>
            </div>
          </div>

        </div>

        {/* ── Interactive How-to-Play & Gesture AI Guide Section ───────────── */}
        <div className="neo-card p-4 sm:p-7 lg:p-8 bg-white mt-2 sm:mt-4">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-3 sm:gap-4 border-b-[2.5px] border-[#171717]">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xl sm:text-2xl">📖</span>
              <div>
                <h2 className="text-lg sm:text-xl font-black uppercase">Game Manual & AI Controls</h2>
                <p className="text-[11px] sm:text-xs text-[#454545] font-semibold">Everything you need to dominate the leaderboard</p>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => setInfoTab('how-to-play')}
                className={`info-tab-btn text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3 ${infoTab === 'how-to-play' ? 'active' : ''}`}
              >
                🎮 How to Play
              </button>
              <button
                type="button"
                onClick={() => setInfoTab('gestures')}
                className={`info-tab-btn text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3 ${infoTab === 'gestures' ? 'active' : ''}`}
              >
                ✋ Air Canvas Gestures
              </button>
              <button
                type="button"
                onClick={() => setInfoTab('about')}
                className={`info-tab-btn text-[11px] sm:text-xs py-1.5 px-2.5 sm:px-3 ${infoTab === 'about' ? 'active' : ''}`}
              >
                ⚡ Architecture
              </button>
            </div>
          </div>

          <div className="pt-6">
            <AnimatePresence mode="wait">
              {infoTab === 'how-to-play' && (
                <motion.div
                  key="how-to"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <div className="p-4 bg-[#FFD84D]/30 border-2 border-[#171717] shadow-[3px_3px_0px_#171717]">
                    <div className="w-8 h-8 rounded bg-[#FFD84D] border-2 border-[#171717] flex items-center justify-center font-black text-sm mb-2">
                      01
                    </div>
                    <h3 className="font-black text-sm uppercase mb-1">Pick Identity</h3>
                    <p className="text-xs text-[#454545] font-medium leading-relaxed">
                      Choose your player codename and character avatar. Your profile is automatically saved for future matches.
                    </p>
                  </div>

                  <div className="p-4 bg-[#FF6B6B]/20 border-2 border-[#171717] shadow-[3px_3px_0px_#171717]">
                    <div className="w-8 h-8 rounded bg-[#FF6B6B] text-white border-2 border-[#171717] flex items-center justify-center font-black text-sm mb-2">
                      02
                    </div>
                    <h3 className="font-black text-sm uppercase mb-1">Room Setup</h3>
                    <p className="text-xs text-[#454545] font-medium leading-relaxed">
                      Launch Quick Play for fast entry, or generate a private room code to challenge up to 8 friends in a custom match.
                    </p>
                  </div>

                  <div className="p-4 bg-[#7BA7FF]/20 border-2 border-[#171717] shadow-[3px_3px_0px_#171717]">
                    <div className="w-8 h-8 rounded bg-[#7BA7FF] border-2 border-[#171717] flex items-center justify-center font-black text-sm mb-2">
                      03
                    </div>
                    <h3 className="font-black text-sm uppercase mb-1">Draw The Word</h3>
                    <p className="text-xs text-[#454545] font-medium leading-relaxed">
                      When it is your turn, select one of three secret words. Sketch with mouse or switch on the AI Air Canvas webcam mode!
                    </p>
                  </div>

                  <div className="p-4 bg-[#B7F56A]/30 border-2 border-[#171717] shadow-[3px_3px_0px_#171717]">
                    <div className="w-8 h-8 rounded bg-[#B7F56A] border-2 border-[#171717] flex items-center justify-center font-black text-sm mb-2">
                      04
                    </div>
                    <h3 className="font-black text-sm uppercase mb-1">Guess & Win</h3>
                    <p className="text-xs text-[#454545] font-medium leading-relaxed">
                      Type your guesses into the chat panel. Correct guesses automatically reward points based on remaining turn time!
                    </p>
                  </div>
                </motion.div>
              )}

              {infoTab === 'gestures' && (
                <motion.div
                  key="gestures"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <div className="p-4 bg-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex flex-col items-center text-center">
                    <span className="text-4xl mb-2">☝️</span>
                    <span className="neo-badge neo-badge-green text-xs mb-1.5">DRAW MODE</span>
                    <h4 className="font-black text-sm uppercase">Index Finger Up</h4>
                    <p className="text-xs text-[#454545] mt-1">Raises index finger only to paint strokes onto the canvas.</p>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex flex-col items-center text-center">
                    <span className="text-4xl mb-2">✌️</span>
                    <span className="neo-badge neo-badge-blue text-xs mb-1.5">HOVER / MOVE</span>
                    <h4 className="font-black text-sm uppercase">Two Fingers Up</h4>
                    <p className="text-xs text-[#454545] mt-1">Raises index and middle finger to relocate pointer without painting.</p>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex flex-col items-center text-center">
                    <span className="text-4xl mb-2">🤏</span>
                    <span className="neo-badge neo-badge-coral text-xs mb-1.5">ERASER MODE</span>
                    <h4 className="font-black text-sm uppercase">Thumb & Index Pinch</h4>
                    <p className="text-xs text-[#454545] mt-1">Pinch thumb and index together to erase unwanted strokes.</p>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex flex-col items-center text-center">
                    <span className="text-4xl mb-2">✊</span>
                    <span className="neo-badge neo-badge-white text-xs mb-1.5">CLEAR BOARD</span>
                    <h4 className="font-black text-sm uppercase">Closed Fist (Hold)</h4>
                    <p className="text-xs text-[#454545] mt-1">Make a fist for 400ms to instantly wipe and reset the canvas.</p>
                  </div>
                </motion.div>
              )}

              {infoTab === 'about' && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="p-5 bg-[#DCCBFF]/30 border-2 border-[#171717] shadow-[3px_3px_0px_#171717] flex flex-col gap-3 text-xs leading-relaxed font-medium text-[#171717]"
                >
                  <p>
                    <strong>SketchRush</strong> is a modern neo-brutalist real-time multiplayer drawing and guessing game built with <strong>React 19, Vite, Socket.IO, FastAPI</strong>, and client-side <strong>Google MediaPipe Tasks Vision</strong>.
                  </p>
                  <p>
                    Drawing strokes are normalized and synchronized between connected clients with sub-50ms latency. The Air Canvas mode runs entirely inside the player&apos;s browser using WebAssembly hand landmark detection, ensuring zero server video processing overhead and complete privacy.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

      </main>

      {/* ── Neo-Brutalist Footer ───────────────────────────────────────────── */}
      <footer className="w-full bg-white border-t-[3px] border-[#171717] py-6 mt-8 sm:mt-12">
        <div className="page-container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold text-[#454545]">
          <div className="flex items-center gap-2">
            <span className="font-black text-sm text-[#171717]">SKETCHRUSH</span>
            <span>·</span>
            <span>DRAW FAST. GUESS FASTER.</span>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 flex-wrap justify-center">
            <span>Created by <strong className="text-[#171717]">Shreedhar Khorate</strong></span>
            <span className="footer-dot" />
            <a href="https://github.com/Shreedhar-Khorate/SketchRush" target="_blank" rel="noopener noreferrer" className="footer-link">
              GitHub Repository
            </a>
            <span className="footer-dot" />
            <a href="https://www.linkedin.com/in/shreedhar-khorate-83ba002a0" target="_blank" rel="noopener noreferrer" className="footer-link">
              LinkedIn
            </a>
            <span className="footer-dot" />
            <button
              type="button"
              onClick={() => setShowFeedback(true)}
              className="footer-link cursor-pointer bg-transparent border-0 p-0"
            >
              💬 Share Feedback
            </button>
          </div>
        </div>
      </footer>

      {/* Feedback Modal */}
      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

    </div>
  )
}