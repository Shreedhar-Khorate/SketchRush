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
        borderBottom: '1px solid var(--border)',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Timer progress bar */}
      <div style={{ height: '4px', background: 'var(--border-subtle)' }}>
        <motion.div
          style={{ height: '100%', background: timerColor }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.95, ease: 'linear' }}
        />
      </div>

      {/* ── Row 1 (Primary): Logo | Word/Status (center, largest) | Timer ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', gap: '8px' }}>

        {/* Left: Logo + connection dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '18px' }}>⚡</span>
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 700, fontSize: '15px',
              color: 'var(--text)', display: 'none',
            }}
            className="sm:block"
          >SketchRush</span>
          <span
            style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: connected ? 'var(--green)' : 'var(--red)',
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
                style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}
              >
                Lobby
              </motion.span>
            ) : gameState === 'round_end' ? (
              <motion.span
                key="round-end-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber-warn)' }}
              >
                ⏱️ Round Over!
              </motion.span>
            ) : gameState === 'game_end' ? (
              <motion.span
                key="game-end-label"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ fontSize: '14px', fontWeight: 700, color: 'var(--amber)' }}
              >
                🏆 Game Over!
              </motion.span>
            ) : gameState === 'choosing_word' ? (
              <motion.span
                key="choosing-label"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue)' }}
              >
                ✏️ Choosing word…
              </motion.span>
            ) : isDrawing && currentWord ? (
              <motion.div
                key="drawer-word"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: 'var(--green)',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                }}>Draw:</span>
                <span style={{
                  fontFamily: "'Fira Code', monospace",
                  fontWeight: 800, fontSize: '18px',
                  color: 'var(--text)', letterSpacing: '0.05em',
                }}>{currentWord}</span>
              </motion.div>
            ) : (
              <motion.div
                key="hint-blanks"
                initial={{ y: 4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                style={{
                  display: 'flex', gap: '3px', flexWrap: 'wrap',
                  justifyContent: 'center', minWidth: '120px',
                }}
              >
                {(wordHint || '').split(' ').map((ch, i) => (
                  <span key={i} style={{
                    display: 'inline-block',
                    width: '16px', height: '22px',
                    borderBottom: '2px solid var(--amber)',
                    textAlign: 'center', fontSize: '13px',
                    fontWeight: 700, lineHeight: '20px',
                    color: 'var(--text)',
                    fontFamily: "'Fira Code', monospace",
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
        <div style={{ flexShrink: 0, width: '72px', display: 'flex', justifyContent: 'flex-end' }}>
          <AnimatePresence>
            {gameState === 'drawing' && (
              <motion.div
                key="timer"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={isCritical ? { scale: [1, 1.1, 1] } : { opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={isCritical ? { repeat: Infinity, duration: 0.5 } : { duration: 0.2 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '4px',
                  padding: '4px 10px', borderRadius: '10px',
                  background: isCritical ? 'var(--red-bg)' : isWarning ? 'rgba(210,153,34,0.1)' : 'var(--amber-bg)',
                  border: `1px solid ${timerColor}`,
                }}
              >
                <span style={{ fontSize: '12px' }}>⏱</span>
                <motion.span
                  key={timeLeft}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    fontSize: '15px', fontWeight: 900,
                    color: timerColor,
                    fontFamily: "'Fira Code', monospace",
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
        padding: '0 16px 7px', gap: '6px',
        flexWrap: 'wrap',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        {/* Room code */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '3px 8px', borderRadius: '6px',
          background: 'var(--surface-raised)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>#</span>
          <code style={{
            fontFamily: "'Fira Code', monospace",
            fontWeight: 700, fontSize: '11px',
            color: 'var(--amber)', letterSpacing: '0.12em',
          }}>{roomCode}</code>
        </div>

        {/* Player count */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '3px',
          padding: '3px 8px', borderRadius: '6px',
          background: 'var(--surface-raised)', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '11px' }}>👥</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            {playerCount}/{maxPlayers}
          </span>
        </div>

        {/* Round indicator dots — only during active game */}
        {isActiveGame && round > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600 }}>
              R{round}/{maxRounds}
            </span>
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: maxRounds }).map((_, i) => (
                <div key={i} style={{
                  height: '3px',
                  width: i < round ? '12px' : '5px',
                  borderRadius: '99px',
                  background: i < round ? 'var(--amber)' : 'var(--border-subtle)',
                  transition: 'all 0.4s ease',
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Drawer info */}
        {drawerName && (gameState === 'drawing' || gameState === 'choosing_word') && (
          <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
            {drawerAvatar}{' '}
            <span style={{ color: 'var(--blue)' }}>{drawerName}</span>
            {gameState === 'choosing_word' ? ' is choosing' : ' is drawing'}
          </span>
        )}

        {/* Spacer */}
        <div style={{ flex: 1, minWidth: 0 }} />

        {/* Non-host: show who will start */}
        {gameState === 'waiting' && !isHost && hostName && (
          <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600 }}>
            {hostAvatar} {hostName} will start
          </span>
        )}

        {/* Host: round count + start button */}
        {gameState === 'waiting' && isHost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--text-faint)', fontWeight: 600 }}>
              {selectedRounds ? `${selectedRounds} rounds` : 'Select rounds first'}
            </span>
            <motion.button
              onClick={onStartGame}
              whileHover={{ scale: selectedRounds ? 1.05 : 1 }}
              whileTap={{ scale: selectedRounds ? 0.96 : 1 }}
              className="btn-primary"
              style={{
                padding: '4px 14px',
                fontSize: '12px',
                borderRadius: '999px',
                opacity: selectedRounds ? 1 : 0.5,
                cursor: selectedRounds ? 'pointer' : 'not-allowed',
                width: 'auto',
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
