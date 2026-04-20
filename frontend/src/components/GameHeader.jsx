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
          style={{
            height: '100%',
            background: timerColor,
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.95, ease: 'linear' }}
        />
      </div>

      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', gap: '12px' }}>

        {/* Left: Logo + connection dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span style={{ fontSize: '20px' }}>⚡</span>
          <span style={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 700,
            fontSize: '17px',
            color: 'var(--text)',
            display: 'none',
          }}
            className="sm:block"
          >SketchRush</span>
          <span
            style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: connected ? 'var(--green)' : 'var(--red)',
              display: 'inline-block',
            }}
            title={connected ? 'Connected' : 'Disconnected'}
          />
        </div>

        {/* Center: game info */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>

          {gameState === 'waiting' ? (
            /* Lobby / waiting state */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Waiting for players…
              </span>
              {!isHost && hostName && (
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>
                  {hostAvatar} {hostName} (host) will select rounds &amp; start
                </span>
              )}
              {isHost && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>
                    {selectedRounds ? `Rounds: ${selectedRounds}` : 'Select rounds to start'}
                  </span>
                  <motion.button
                    onClick={onStartGame}
                    whileHover={{ scale: selectedRounds ? 1.05 : 1 }}
                    whileTap={{ scale: selectedRounds ? 0.96 : 1 }}
                    className="btn-primary"
                    style={{
                      padding: '6px 20px',
                      fontSize: '13px',
                      borderRadius: '999px',
                      opacity: selectedRounds ? 1 : 0.5,
                      cursor: selectedRounds ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!selectedRounds}
                  >
                    🚀 Start Game
                  </motion.button>
                </div>
              )}
            </div>
          ) : gameState === 'round_end' || gameState === 'game_end' ? (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--amber-warn)' }}>
              {gameState === 'game_end' ? '🏆 Game Over!' : '⏱️ Round Over!'}
            </span>
          ) : gameState === 'choosing_word' ? (
            /* Drawer is picking a word */
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>
                Round {round}/{maxRounds}
              </span>
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                style={{ fontSize: '13px', fontWeight: 700, color: 'var(--blue)' }}
              >
                {drawerAvatar} {drawerName} is choosing a word…
              </motion.span>
            </div>
          ) : (
            <>
              {/* Round indicator dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600 }}>
                  Round {round}/{maxRounds}
                </span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: maxRounds }).map((_, i) => (
                    <div key={i} style={{
                      height: '4px',
                      width: i < round ? '18px' : '7px',
                      borderRadius: '99px',
                      background: i < round ? 'var(--amber)' : 'var(--border-subtle)',
                      transition: 'all 0.4s ease',
                    }} />
                  ))}
                </div>
              </div>

              {/* Word hint or "your word" */}
              <AnimatePresence mode="wait">
                {isDrawing && currentWord ? (
                  <motion.div
                    key="drawer-word"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      color: 'var(--green)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}>Draw:</span>
                    <span style={{
                      fontFamily: "'Fira Code', monospace",
                      fontWeight: 800,
                      fontSize: '18px',
                      color: 'var(--text)',
                      letterSpacing: '0.05em',
                    }}>{currentWord}</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="hint"
                    initial={{ y: 4, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}
                  >
                    {(wordHint || '').split(' ').map((ch, i) => (
                      <span key={i} style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '24px',
                        borderBottom: '2px solid var(--amber)',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: '22px',
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

              {/* Drawer info */}
              {drawerName && (
                <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                  {drawerAvatar} <span style={{ color: 'var(--blue)' }}>{drawerName}</span> is drawing
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: room code + players + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Host */}
          {hostName && (
            <div style={{
              display: 'none',
              alignItems: 'center', gap: '6px',
              padding: '5px 10px', borderRadius: '8px',
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
            }} className="lg:flex">
              <span style={{ fontSize: '13px' }}>{hostAvatar}</span>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                Host: <span style={{ color: 'var(--text)' }}>{hostName}</span>
              </span>
            </div>
          )}
          {/* Room code */}
          <div style={{
            display: 'flex',
            alignItems: 'center', gap: '4px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#</span>
            <code style={{
              fontFamily: "'Fira Code', monospace",
              fontWeight: 700, fontSize: '13px',
              color: 'var(--amber)',
              letterSpacing: '0.15em',
            }}>{roomCode}</code>
          </div>

          {/* Player count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: '13px' }}>👥</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
              {playerCount}/{maxPlayers}
            </span>
          </div>

          {/* Timer */}
          {gameState === 'drawing' && (
            <motion.div
              animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 0.5 }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '5px 12px', borderRadius: '10px',
                background: isCritical ? 'var(--red-bg)' : isWarning ? 'rgba(210,153,34,0.1)' : 'var(--amber-bg)',
                border: `1px solid ${timerColor}`,
              }}
            >
              <span style={{ fontSize: '13px' }}>⏱</span>
              <motion.span
                key={timeLeft}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  fontSize: '15px', fontWeight: 900,
                  color: timerColor,
                  fontFamily: "'Fira Code', monospace",
                  minWidth: '2ch', textAlign: 'center',
                  tabularNums: true,
                }}
              >{timeLeft}</motion.span>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  )
}
