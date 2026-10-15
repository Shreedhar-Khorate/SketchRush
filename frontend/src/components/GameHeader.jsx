import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GameHeader({
  roomCode   = 'XXXXX',
  playerCount = 1,
  maxPlayers  = 8,
  wordHint    = '',
  currentWord = null,     // only set for the drawer
  round       = 1,
  maxRounds   = 5,
  drawerName  = '',
  drawerAvatar = '🎨',
  timeLeft    = 60,
  isDrawing   = false,
  connected   = false,
  isHost      = false,
  hostName    = '',
  hostAvatar  = '👑',
  gameState   = 'waiting',
  onStartGame = null,
  selectedRounds = null,
}) {
  const totalTime  = 60
  const isCritical = timeLeft <= 10
  const isWarning  = timeLeft <= 20
  const progress   = (timeLeft / totalTime) * 100
  const timerColor = isCritical ? 'var(--red)' : isWarning ? 'var(--amber-warn)' : 'var(--amber)'
  const isActiveGame = gameState === 'drawing' || gameState === 'choosing_word' ||
                       gameState === 'round_end' || gameState === 'game_end'

  return (
    <header
      style={{
        background: 'var(--surface)',
        borderBottom: '3px solid var(--line)',
        boxShadow: '0 4px 0 var(--shadow, rgba(20,20,20,0.06))',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Timer progress bar */}
      <div style={{ height: '5px', background: 'var(--surface-2)' }}>
        <motion.div
          style={{ height: '100%', background: timerColor }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.95, ease: 'linear' }}
        />
      </div>

      {/* ── Row 1 (Primary): Logo | Word/Status (center, largest) | Timer ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: '10px' }}>

        {/* Left: Logo + connection dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              width: '34px',
              height: '34px',
              display: 'grid',
              placeItems: 'center',
              background: 'var(--yellow)',
              border: '2.5px solid var(--line)',
              borderRadius: '10px',
              fontSize: '1.1rem',
              transform: 'rotate(-6deg)',
              boxShadow: '2px 2px 0 var(--shadow)',
            }}
          >
            ✏️
          </span>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: '1.25rem',
              color: 'var(--text)',
              display: 'none',
              letterSpacing: '-0.02em',
            }}
            className="sm:block"
          >
            SketchRush
          </span>
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: connected ? 'var(--green)' : 'var(--red)',
              border: '1.5px solid var(--line)',
              display: 'inline-block',
            }}
            title={connected ? 'Connected' : 'Disconnected'}
          />
        </div>

        {/* Center: Word hint — most prominent element during play */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
          <AnimatePresence mode="wait">
            {gameState === 'waiting' ? (
              <motion.span
                key="waiting-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: 'var(--yellow)',
                  color: '#141414',
                  border: '2px solid var(--line)',
                  borderRadius: '999px',
                  boxShadow: '2px 2px 0 var(--shadow)',
                  padding: '4px 18px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                🎮 Lobby
              </motion.span>
            ) : gameState === 'round_end' ? (
              <motion.span
                key="round-end-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: 'var(--peach)',
                  color: '#141414',
                  border: '2px solid var(--line)',
                  borderRadius: '999px',
                  boxShadow: '2px 2px 0 var(--shadow)',
                  padding: '4px 18px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                ⏱️ Round Over!
              </motion.span>
            ) : gameState === 'game_end' ? (
              <motion.span
                key="game-end-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{
                  background: 'var(--yellow)',
                  color: '#141414',
                  border: '2px solid var(--line)',
                  borderRadius: '999px',
                  boxShadow: '2px 2px 0 var(--shadow)',
                  padding: '4px 18px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                🏆 Game Over!
              </motion.span>
            ) : gameState === 'choosing_word' ? (
              <motion.span
                key="choosing-label"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{
                  background: 'var(--sky)',
                  color: '#141414',
                  border: '2px solid var(--line)',
                  borderRadius: '999px',
                  boxShadow: '2px 2px 0 var(--shadow)',
                  padding: '4px 18px',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '14px',
                }}
              >
                ✏️ Choosing word…
              </motion.span>
            ) : isDrawing && currentWord ? (
              <motion.div
                key="drawer-word"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  background: 'var(--lime)',
                  color: '#141414',
                  border: '2.5px solid var(--line)',
                  borderRadius: '12px',
                  boxShadow: '2.5px 2.5px 0 var(--shadow)',
                  padding: '4px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span style={{
                  fontSize: '11px', fontWeight: 800, color: '#141414',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  fontFamily: 'var(--font-display)',
                }}>DRAW:</span>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700, fontSize: '18px',
                  color: '#141414', letterSpacing: '0.04em',
                }}>{currentWord}</span>
              </motion.div>
            ) : (
              <motion.div
                key="hint-blanks"
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  display: 'flex', gap: '4px', flexWrap: 'wrap',
                  justifyContent: 'center', minWidth: '120px',
                }}
              >
                {(wordHint || '').split(' ').map((ch, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    width: '18px', height: '24px',
                    borderBottom: '3px solid var(--line)',
                    textAlign: 'center', fontSize: '15px',
                    fontWeight: 700, lineHeight: '22px',
                    color: 'var(--text)',
                    fontFamily: 'var(--font-display), monospace',
                    margin: '0 1px',
                  }}>
                    {ch !== '_' ? ch : ''}
                  </span>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right: Timer — reserved width so Row 1 never shifts */}
        <div style={{ flexShrink: 0, width: '80px', display: 'flex', justifyContent: 'flex-end' }}>
          <AnimatePresence>
            {gameState === 'drawing' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={isCritical ? { scale: [1, 1.1, 1] } : { opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={isCritical ? { repeat: Infinity, duration: 0.5 } : { duration: 0.2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  padding: '4px 10px', borderRadius: '12px',
                  background: isCritical ? 'var(--peach)' : 'var(--yellow)',
                  border: '2.5px solid var(--line)',
                  boxShadow: '2.5px 2.5px 0 var(--shadow)',
                  color: '#141414',
                }}
              >
                <span style={{ fontSize: '13px' }}>⏱</span>
                <motion.span
                  key={timeLeft}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: '15px', fontWeight: 800,
                    color: '#141414',
                    fontFamily: 'var(--font-display), monospace',
                    minWidth: '2ch', textAlign: 'center',
                  }}
                >{timeLeft}</motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Row 2 (Meta): Room · Players · Round · Drawer info · Host controls ── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 16px 8px', gap: '8px',
        flexWrap: 'wrap',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {/* Room code */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 10px', borderRadius: '8px',
          background: 'var(--surface-2)', border: '2px solid var(--line)',
          boxShadow: '2px 2px 0 var(--shadow)',
        }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>#</span>
          <code style={{
            fontFamily: "'Fira Code', monospace",
            fontWeight: 700, fontSize: '12px',
            color: 'var(--text)', letterSpacing: '0.12em',
          }}>{roomCode}</code>
        </div>

        {/* Player count */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          padding: '3px 10px', borderRadius: '8px',
          background: 'var(--surface-2)', border: '2px solid var(--line)',
          boxShadow: '2px 2px 0 var(--shadow)',
        }}>
          <span style={{ fontSize: '12px' }}>👥</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text)' }}>
            {playerCount}/{maxPlayers}
          </span>
        </div>

        {/* Round indicator dots — only during active game */}
        {isActiveGame && round > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 10px', borderRadius: '8px',
            background: 'var(--surface-2)', border: '2px solid var(--line)',
            boxShadow: '2px 2px 0 var(--shadow)',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              R{round}/{maxRounds}
            </span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {Array.from({ length: maxRounds }).map((_, i) => (
                <div key={i} style={{
                  height: '6px',
                  width: i < round ? '12px' : '6px',
                  borderRadius: '99px',
                  border: '1px solid var(--line)',
                  background: i < round ? 'var(--orange)' : 'var(--surface)',
                  transition: 'all 0.4s ease',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Drawer info */}
        {drawerName && (gameState === 'drawing' || gameState === 'choosing_word') && (
          <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 600 }}>
            {drawerAvatar}{' '}
            <strong style={{ color: 'var(--orange)' }}>{drawerName}</strong>
            {gameState === 'choosing_word' ? ' is choosing' : ' is drawing'}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Non-host: show who will start */}
        {gameState === 'waiting' && !isHost && hostName && (
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
            {hostAvatar} {hostName} will start
          </span>
        )}

        {/* Host: round count + start button */}
        {gameState === 'waiting' && isHost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              {selectedRounds ? `${selectedRounds} rounds` : 'Select rounds first'}
            </span>
            <motion.button
              onClick={onStartGame}
              whileHover={{ scale: selectedRounds ? 1.05 : 1, y: selectedRounds ? -1 : 0 }}
              whileTap={{ scale: selectedRounds ? 0.96 : 1 }}
              style={{
                background: 'var(--yellow)',
                color: '#141414',
                border: '2.5px solid var(--line)',
                boxShadow: selectedRounds ? '3px 3px 0 var(--shadow)' : 'none',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '13px',
                padding: '6px 18px',
                borderRadius: '999px',
                opacity: selectedRounds ? 1 : 0.5,
                cursor: selectedRounds ? 'pointer' : 'not-allowed',
                width: 'auto',
                transition: 'all 0.12s ease',
              }}
              disabled={!selectedRounds}
            >
              🚀 Start
            </motion.button>
          </div>
        )}
      </div>
    </header>
  )
}
