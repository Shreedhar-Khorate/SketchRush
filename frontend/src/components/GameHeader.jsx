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
  gameState   = 'waiting',
  onStartGame = null,
}) {
  const totalTime  = 60
  const isCritical = timeLeft <= 10
  const isWarning  = timeLeft <= 20
  const progress   = (timeLeft / totalTime) * 100

  const timerColor = isCritical ? 'var(--red)'    : isWarning ? 'var(--orange)'    : 'var(--green)'
  const timerGlow  = isCritical ? 'var(--red-glow)': isWarning ? 'var(--orange-glow)': 'var(--green-glow)'

  return (
    <header
      style={{
        background: 'rgba(11,15,35,0.92)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 20,
        flexShrink: 0,
      }}
    >
      {/* Timer progress bar */}
      <div style={{ height: '3px', background: 'var(--bg-elevated)' }}>
        <motion.div
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${timerColor}cc, ${timerColor})`,
            boxShadow: `0 0 8px ${timerGlow}`,
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
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 800,
            fontSize: '17px',
            background: 'linear-gradient(135deg, #8fa0ff, #6378ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            display: 'none',
          }}
            className="sm:block"
          >SketchRush</span>
          <span
            style={{
              width: '7px', height: '7px', borderRadius: '50%',
              background: connected ? 'var(--green)' : 'var(--red)',
              boxShadow: connected ? '0 0 6px var(--green-glow)' : '0 0 6px var(--red-glow)',
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
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Waiting for players…
              </span>
              {isHost && (
                <motion.button
                  onClick={onStartGame}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn-primary"
                  style={{ padding: '6px 20px', fontSize: '13px', borderRadius: '999px' }}
                >
                  🚀 Start Game
                </motion.button>
              )}
            </div>
          ) : gameState === 'round_end' || gameState === 'game_end' ? (
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--orange)' }}>
              {gameState === 'game_end' ? '🏆 Game Over!' : '⏱️ Round Over!'}
            </span>
          ) : (
            <>
              {/* Round indicator dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Round {round}/{maxRounds}
                </span>
                <div style={{ display: 'flex', gap: '3px' }}>
                  {Array.from({ length: maxRounds }).map((_, i) => (
                    <div key={i} style={{
                      height: '4px',
                      width: i < round ? '18px' : '7px',
                      borderRadius: '99px',
                      background: i < round ? 'var(--brand)' : 'var(--bg-elevated)',
                      boxShadow: i < round ? '0 0 4px var(--brand-glow)' : 'none',
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
                      fontFamily: "'Space Grotesk', monospace",
                      fontWeight: 800,
                      fontSize: '18px',
                      color: 'var(--text-primary)',
                      textShadow: '0 0 20px var(--brand-glow)',
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
                        borderBottom: '2.5px solid var(--brand)',
                        textAlign: 'center',
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: '22px',
                        color: 'var(--text-primary)',
                        fontFamily: "'Space Grotesk', monospace",
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
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {drawerAvatar} <span style={{ color: 'var(--brand-light)' }}>{drawerName}</span> is drawing
                </span>
              )}
            </>
          )}
        </div>

        {/* Right: room code + players + timer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Room code */}
          <div style={{
            display: 'none',
            alignItems: 'center', gap: '4px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          }} className="md:flex">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#</span>
            <code style={{
              fontFamily: "'Space Grotesk', monospace",
              fontWeight: 700, fontSize: '13px',
              color: 'var(--brand-light)',
              letterSpacing: '0.15em',
            }}>{roomCode}</code>
          </div>

          {/* Player count */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: '5px 10px', borderRadius: '8px',
            background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
          }}>
            <span style={{ fontSize: '13px' }}>👥</span>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
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
                background: `rgba(${isCritical ? '255,77,109' : isWarning ? '255,140,66' : '0,229,160'},0.12)`,
                border: `1.5px solid ${timerColor}55`,
                boxShadow: `0 0 10px ${timerGlow}`,
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
                  fontFamily: "'Space Grotesk', monospace",
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
