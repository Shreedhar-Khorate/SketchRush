import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import GameHeader      from '../components/GameHeader'
import DrawingToolbar  from '../components/DrawingToolbar'
import DrawingCanvas   from '../components/DrawingCanvas'
import PlayerList      from '../components/PlayerList'
import ChatPanel       from '../components/ChatPanel'
import GestureOverlay  from '../components/GestureOverlay'

import { useSocket }   from '../hooks/useSocket'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isDesktop
}

// ── Round End Overlay ─────────────────────────────────────────────────────────
function RoundEndModal({ result, onDismiss }) {
  if (!result) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(6,9,24,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'rgba(17,22,40,0.95)',
          border: '1px solid var(--border-muted)',
          borderRadius: '24px',
          padding: '32px 36px',
          minWidth: '320px', maxWidth: '440px',
          boxShadow: '0 0 60px rgba(99,120,255,0.2)',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏱️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '4px', color: 'var(--text-primary)' }}>
          Round Over!
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
          The word was{' '}
          <span style={{ fontWeight: 800, color: 'var(--brand-light)', fontFamily: "'Space Grotesk', monospace" }}>
            "{result.word}"
          </span>
        </p>
        {result.leaderboard?.slice(0, 5).map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '10px',
            background: i === 0 ? 'rgba(255,209,102,0.08)' : 'rgba(22,28,53,0.5)',
            border: i === 0 ? '1px solid rgba(255,209,102,0.2)' : '1px solid var(--border-subtle)',
            marginBottom: '6px',
          }}>
            <span style={{ width: '22px', fontSize: i === 0 ? '18px' : '12px', color: ['#ffd166','#c0c0c0','#cd7f32'][i] || 'var(--text-muted)' }}>
              {['👑','🥈','🥉'][i] || `#${i+1}`}
            </span>
            <span style={{ fontSize: '18px' }}>{p.avatar}</span>
            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, textAlign: 'left', color: 'var(--text-primary)' }}>{p.name}</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: i === 0 ? '#ffd166' : 'var(--brand-light)' }}>
              {p.score} pts
            </span>
          </div>
        ))}
        <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
          Next round starting…
        </p>
      </motion.div>
    </div>
  )
}

// ── Game End Overlay ──────────────────────────────────────────────────────────
function GameEndModal({ result, onPlayAgain }) {
  if (!result) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(6,9,24,0.82)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'rgba(17,22,40,0.97)',
          border: '1px solid rgba(255,209,102,0.25)',
          borderRadius: '28px', padding: '36px 40px',
          minWidth: '340px', maxWidth: '480px',
          boxShadow: '0 0 80px rgba(255,209,102,0.12), 0 24px 48px rgba(0,0,0,0.6)',
          textAlign: 'center',
        }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          style={{ fontSize: '56px', marginBottom: '12px' }}
        >🏆</motion.div>
        <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#ffd166', marginBottom: '6px' }}>
          Game Over!
        </h2>
        {result.winner && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '20px' }}>
            🎉 <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{result.winner.name}</span> wins with{' '}
            <span style={{ color: '#ffd166', fontWeight: 800 }}>{result.winner.score} pts</span>
          </p>
        )}
        {result.leaderboard?.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px',
            background: i === 0 ? 'rgba(255,209,102,0.1)' : 'rgba(22,28,53,0.5)',
            border: i === 0 ? '1px solid rgba(255,209,102,0.25)' : '1px solid var(--border-subtle)',
            marginBottom: '8px',
          }}>
            <span style={{ width: '24px', fontSize: i === 0 ? '20px' : '13px', color: ['#ffd166','#c0c0c0','#cd7f32'][i] || 'var(--text-muted)' }}>
              {['👑','🥈','🥉'][i] || `#${i+1}`}
            </span>
            <span style={{ fontSize: '20px' }}>{p.avatar}</span>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 700, textAlign: 'left', color: 'var(--text-primary)' }}>{p.name}</span>
            <span style={{ fontSize: '15px', fontWeight: 900, color: i === 0 ? '#ffd166' : 'var(--brand-light)' }}>
              {p.score} pts
            </span>
          </div>
        ))}
        <motion.button
          onClick={onPlayAgain}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          style={{ marginTop: '20px', width: '100%', padding: '14px', fontSize: '15px', borderRadius: '12px' }}
        >
          🔄 Play Again
        </motion.button>
      </motion.div>
    </div>
  )
}

// ── Main GamePage ─────────────────────────────────────────────────────────────
export default function GamePage() {
  const { roomId }   = useParams()
  const location     = useLocation()
  const navigate     = useNavigate()
  const isDesktop    = useIsDesktop()

  const playerName   = location.state?.playerName
  const playerAvatar = location.state?.avatar || '🦊'

  // Redirect if no player state
  useEffect(() => {
    if (!playerName) navigate('/')
  }, [playerName, navigate])

  // ── Drawing tool state ───────────────────────────────────────────────────
  const [selectedColor,   setSelectedColor]   = useState('#1a1a2e')
  const [brushSize,       setBrushSize]       = useState(5)
  const [isEraser,        setIsEraser]        = useState(false)
  const [clearSignal,     setClearSignal]     = useState(0)
  const [gestureMode,     setGestureMode]     = useState(false)
  const [showGesture,     setShowGesture]     = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  // ── Socket ───────────────────────────────────────────────────────────────
  const {
    connected, playerId, isHost,
    players, messages, gameState,
    round, maxRounds, drawerName, drawerAvatar,
    currentDrawerId, currentWord, wordHint,
    timeLeft, roundResult, gameResult,
    isDrawing,
    gestureDetected, gestureActive,
    onRemoteDraw, onRemoteClear,
    sendDraw, sendClear,
    sendGuess, sendMessage,
    startGame,
    startGesture, stopGesture, syncGestureParams,
  } = useSocket({ roomCode: roomId, playerName, avatar: playerAvatar })

  // ── Sync gesture params whenever toolbar changes ──────────────────────────
  useEffect(() => {
    if (gestureMode) syncGestureParams(selectedColor, brushSize, isEraser)
  }, [gestureMode, selectedColor, brushSize, isEraser, syncGestureParams])

  // ── Gesture mode toggle ───────────────────────────────────────────────────
  const handleToggleGesture = (on) => {
    setGestureMode(on)
    if (on) {
      setShowGesture(true)
      startGesture(selectedColor, brushSize, isEraser)
    } else {
      setShowGesture(false)
      stopGesture()
    }
  }

  const handleClear = () => {
    setClearSignal(p => p + 1)
    sendClear()
  }

  const handleToggleEraser = (state) => {
    setIsEraser(state)
  }

  const handleSendMessage = (text) => {
    // If game is running, treat as guess; otherwise plain message
    if (gameState === 'drawing' && !isDrawing) {
      sendGuess(text)
    } else {
      sendMessage(text)
    }
  }

  if (!playerName) return null

  return (
    <div style={{
      background: 'var(--bg-deep)',
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <GameHeader
        roomCode={roomId}
        playerCount={players.length}
        maxPlayers={8}
        wordHint={wordHint}
        currentWord={currentWord}
        round={round}
        maxRounds={maxRounds}
        drawerName={drawerName}
        drawerAvatar={drawerAvatar}
        timeLeft={timeLeft}
        isDrawing={isDrawing}
        connected={connected}
        isHost={isHost}
        gameState={gameState}
        onStartGame={startGame}
      />

      {/* Toolbar — only show for the drawer */}
      {isDrawing && (
        <DrawingToolbar
          selectedColor={selectedColor}
          onColorChange={setSelectedColor}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          isEraser={isEraser}
          onToggleEraser={handleToggleEraser}
          onClear={handleClear}
          gestureMode={gestureMode}
          onToggleGesture={handleToggleGesture}
        />
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: '12px', gap: '12px', minHeight: 0 }}>

        {/* Canvas */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <DrawingCanvas
            color={selectedColor}
            brushSize={brushSize}
            isEraser={isEraser}
            clearSignal={clearSignal}
            isDrawing={isDrawing}
            onDraw={sendDraw}
            onClearCanvas={sendClear}
            onRemoteDraw={onRemoteDraw}
            onRemoteClear={onRemoteClear}
          />

          {/* Gesture overlay (absolute, centered on canvas) */}
          {showGesture && (
            <GestureOverlay
              active={gestureActive}
              gesture={gestureDetected}
              onClose={() => { setShowGesture(false); handleToggleGesture(false) }}
            />
          )}
        </div>

        {/* Desktop sidebar */}
        {isDesktop && (
          <div style={{ width: '276px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div style={{ flex: '0 0 42%', minHeight: 0 }}>
              <PlayerList players={players} currentPlayerId={playerId} />
            </div>
            <div style={{ flex: '1 1 0', minHeight: 0 }}>
              <ChatPanel
                messages={messages}
                playerName={playerName}
                onSend={handleSendMessage}
                isDrawing={isDrawing}
              />
            </div>
          </div>
        )}
      </div>

      {/* Mobile FAB */}
      {!isDesktop && (
        <motion.button
          onClick={() => setMobileDrawerOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--brand), var(--brand-dark))',
            boxShadow: '0 8px 24px var(--brand-glow)',
            color: '#fff', fontSize: '22px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 30, border: 'none', cursor: 'pointer',
          }}
        >👥</motion.button>
      )}

      {/* Mobile bottom drawer */}
      <AnimatePresence>
        {mobileDrawerOpen && !isDesktop && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 40,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
              }}
            />
            <motion.div
              key="drawer"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                height: '70vh',
                background: 'rgba(11,15,35,0.97)',
                backdropFilter: 'blur(24px)',
                borderTop: '1px solid var(--border-muted)',
                borderRadius: '24px 24px 0 0',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border-muted)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Players & Chat</span>
                <button onClick={() => setMobileDrawerOpen(false)} style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 12px 16px', minHeight: 0, overflow: 'hidden' }}>
                <PlayerList players={players} currentPlayerId={playerId} />
                <ChatPanel messages={messages} playerName={playerName} onSend={handleSendMessage} isDrawing={isDrawing} />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Round end modal */}
      <RoundEndModal result={roundResult} onDismiss={() => {}} />

      {/* Game end modal */}
      <GameEndModal result={gameResult} onPlayAgain={() => navigate('/')} />
    </div>
  )
}
