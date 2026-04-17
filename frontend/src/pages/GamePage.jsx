import { useState, useEffect, useRef } from 'react'
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

// ── Word Choice Modal ─────────────────────────────────────────────────────────
function WordChoiceModal({ choices, onSelect }) {
  if (!choices || choices.length === 0) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(13,17,23,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
          🎯 Choose a Word
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
          Select which word you want to draw
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '4px' }}>
          {choices.map((word, idx) => (
            <motion.button
              key={word}
              onClick={() => onSelect(word)}
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              style={{
                padding: '16px 20px',
                borderRadius: '12px',
                background: 'var(--surface-raised)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'var(--amber-bg)'
                e.target.style.borderColor = 'var(--amber)'
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'var(--surface-raised)'
                e.target.style.borderColor = 'var(--border)'
              }}
            >
              {word}
            </motion.button>
          ))}
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-faint)', marginTop: '16px' }}>
          One of these is very hard! 😈
        </p>
      </motion.div>
    </div>
  )
}

// ── Round End Overlay ─────────────────────────────────────────────────────────
function RoundEndModal({ result, countdown, onDismiss }) {
  if (!result) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(13,17,23,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '32px 36px',
          minWidth: '320px', maxWidth: '440px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>⏱️</div>
        <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px', color: 'var(--text)' }}>
          Round Over!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
          The word was{' '}
          <span style={{ fontWeight: 700, color: 'var(--amber)', fontFamily: "'Fira Code', monospace" }}>
            "{result.word}"
          </span>
        </p>
        {result.leaderboard?.slice(0, 5).map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 10px', borderRadius: '10px',
            background: i === 0 ? 'var(--amber-bg)' : 'var(--surface-raised)',
            border: i === 0 ? '1px solid rgba(240,165,0,0.3)' : '1px solid var(--border-subtle)',
            marginBottom: '6px',
          }}>
            <span style={{ width: '22px', fontSize: i === 0 ? '18px' : '12px', color: ['#ffd166','#c0c0c0','#cd7f32'][i] || 'var(--text-muted)' }}>
              {['👑','🥈','🥉'][i] || `#${i+1}`}
            </span>
            <span style={{ fontSize: '18px' }}>{p.avatar}</span>
            <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, textAlign: 'left', color: 'var(--text)' }}>{p.name}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--amber)' }}>
              {p.score} pts
            </span>
          </div>
        ))}
        <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-faint)' }}>
          {countdown ? (
            <motion.span
              key={countdown}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              Next round in {countdown} second{countdown !== 1 ? 's' : ''}...
            </motion.span>
          ) : (
            'Next round starting…'
          )}
        </p>
      </motion.div>
    </div>
  )
}

// ── Select Rounds Modal ───────────────────────────────────────────────────────
function SelectRoundsModal({ isHost, initialRounds = 3, onConfirmRounds }) {
  const [selectedRounds, setSelectedRounds] = useState(initialRounds)
  
  if (!isHost) return null
  
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 70,
      background: 'rgba(13,17,23,0.9)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '500px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '12px', color: 'var(--text)' }}>
          🎮 How Many Rounds?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>
          Select the number of rounds to play in this game
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '24px' }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <motion.button
              key={num}
              onClick={() => setSelectedRounds(num)}
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 12px',
                borderRadius: '12px',
                background: selectedRounds === num ? 'var(--amber-bg)' : 'var(--surface-raised)',
                border: selectedRounds === num ? '2px solid var(--amber)' : '1px solid var(--border)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {num}
            </motion.button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '28px' }}>
          {[6, 7, 8, 9, 10].map((num) => (
            <motion.button
              key={num}
              onClick={() => setSelectedRounds(num)}
              whileHover={{ scale: 1.05, translateY: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '16px 12px',
                borderRadius: '12px',
                background: selectedRounds === num ? 'var(--amber-bg)' : 'var(--surface-raised)',
                border: selectedRounds === num ? '2px solid var(--amber)' : '1px solid var(--border)',
                color: 'var(--text)',
                fontWeight: 600,
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {num}
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={() => onConfirmRounds(selectedRounds)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          style={{ width: '100%', padding: '14px', fontSize: '14px', borderRadius: '12px', fontWeight: 600 }}
        >
          Confirm {selectedRounds} Round{selectedRounds !== 1 ? 's' : ''}
        </motion.button>
      </motion.div>
    </div>
  )
}

// ── Game End Overlay ──────────────────────────────────────────────────────────
function GameEndModal({ result, isHost, onPlayAgain, onBackToLobby }) {
  if (!result) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(13,17,23,0.82)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px', padding: '36px 40px',
          minWidth: '340px', maxWidth: '480px',
          textAlign: 'center',
        }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          style={{ fontSize: '56px', marginBottom: '12px' }}
        >🏆</motion.div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--amber)', marginBottom: '6px' }}>
          Game Over!
        </h2>
        {result.winner && (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            🎉 <span style={{ fontWeight: 700, color: 'var(--text)' }}>{result.winner.name}</span> wins with{' '}
            <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{result.winner.score} pts</span>
          </p>
        )}
        {result.leaderboard?.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px',
            background: i === 0 ? 'var(--amber-bg)' : 'var(--surface-raised)',
            border: i === 0 ? '1px solid rgba(240,165,0,0.3)' : '1px solid var(--border-subtle)',
            marginBottom: '8px',
          }}>
            <span style={{ width: '24px', fontSize: i === 0 ? '20px' : '13px', color: ['#ffd166','#c0c0c0','#cd7f32'][i] || 'var(--text-muted)' }}>
              {['👑','🥈','🥉'][i] || `#${i+1}`}
            </span>
            <span style={{ fontSize: '20px' }}>{p.avatar}</span>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 700, textAlign: 'left', color: 'var(--text)' }}>{p.name}</span>
            <span style={{ fontSize: '15px', fontWeight: 700, color: i === 0 ? 'var(--amber)' : 'var(--amber)' }}>
              {p.score} pts
            </span>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: isHost ? '1fr 1fr' : '1fr', gap: '12px', marginTop: '24px' }}>
          {isHost && (
            <motion.button
              onClick={onPlayAgain}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px', fontSize: '14px', fontWeight: 700, borderRadius: '12px',
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                color: 'var(--text)', cursor: 'pointer',
              }}
            >
              🔄 Play Again
            </motion.button>
          )}
          <motion.button
            onClick={onBackToLobby}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ padding: '12px', fontSize: '14px', borderRadius: '12px' }}
          >
            🚀 Back to Lobby
          </motion.button>
        </div>
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
  const [selectedColor,   setSelectedColor]   = useState('#0D1117')
  const [brushSize,       setBrushSize]       = useState(5)
  const [isEraser,        setIsEraser]        = useState(false)
  const [clearSignal,     setClearSignal]     = useState(0)
  const [gestureMode,     setGestureMode]     = useState(false)
  const [showGesture,     setShowGesture]     = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [selectedRounds,  setSelectedRounds]  = useState(null)  // Track if host selected rounds

  // ── Socket ───────────────────────────────────────────────────────────────
  const {
    connected, playerId, isHost, hostId,
    players, messages, gameState,
    round, maxRounds, drawerName, drawerAvatar,
    currentDrawerId, currentWord, wordHint, wordChoices,
    timeLeft, roundResult, gameResult, roundCountdown,
    isDrawing, hasGuessedCorrectly,
    gestureDetected, gestureActive,
    onRemoteDraw, onRemoteClear,
    sendDraw, sendClear,
    sendGuess, sendMessage,
    startGame, startGameWithRounds, restartGame,
    startGesture, stopGesture, syncGestureParams, selectWord,
  } = useSocket({ roomCode: roomId, playerName, avatar: playerAvatar })

  const hostPlayer = players.find((p) => p && p.id === hostId)
  const hostName = hostPlayer?.name || ''
  const hostAvatar = hostPlayer?.avatar || '👑'

  // ── Debug logging for game state ───────────────────────────────────────────
  useEffect(() => {
    console.log('[GamePage] Game state changed to:', gameState, '| Drawer:', currentDrawerId, '| isDrawing:', isDrawing)
  }, [gameState, currentDrawerId, isDrawing])

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

  const handleConfirmRounds = (rounds) => {
    setSelectedRounds(rounds)
  }

  const handleStartGame = () => {
    if (!selectedRounds) return
    startGameWithRounds(selectedRounds)
  }

  const handlePlayAgain = () => {
    setSelectedRounds(null)
    restartGame(maxRounds)  // Use the same maxRounds as the previous game
  }

  const handleBackToLobby = () => {
    navigate('/')
  }

  const handleSendMessage = (text) => {
    if (hasGuessedCorrectly) return
    // If game is running, treat as guess; otherwise plain message
    if (gameState === 'drawing' && !isDrawing) {
      sendGuess(text)
    } else {
      sendMessage(text)
    }
  }

  // Stop gesture mode when round ends or when we're no longer the drawer
  useEffect(() => {
    if (!isDrawing && gestureMode) {
      setGestureMode(false)
      setShowGesture(false)
      stopGesture()
    }
  }, [isDrawing, gestureMode, stopGesture])

  // Also stop on round_end / game_end game states
  useEffect(() => {
    if ((gameState === 'round_end' || gameState === 'game_end') && gestureMode) {
      setGestureMode(false)
      setShowGesture(false)
      stopGesture()
    }
  }, [gameState, gestureMode, stopGesture])

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
        hostName={hostName}
        hostAvatar={hostAvatar}
        gameState={gameState}
        onStartGame={handleStartGame}
        selectedRounds={selectedRounds}
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
        </div>

        {/* Desktop sidebar */}
        {isDesktop && (
          <div style={{ width: '276px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div style={{ flex: '0 0 42%', minHeight: 0 }}>
              <PlayerList players={players} currentPlayerId={playerId} hostId={hostId} />
            </div>
            <div style={{ flex: '1 1 0', minHeight: 0 }}>
              <ChatPanel
                messages={messages}
                playerName={playerName}
                onSend={handleSendMessage}
                isDrawing={isDrawing}
                isInputLocked={hasGuessedCorrectly}
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
            background: 'var(--amber)',
            color: 'var(--bg)', fontSize: '22px',
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
                background: 'rgba(0,0,0,0.6)',
              }}
            />
            <motion.div
              key="drawer"
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
              style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
                height: '70vh',
                background: 'var(--surface)',
                borderTop: '1px solid var(--border)',
                borderRadius: '16px 16px 0 0',
                display: 'flex', flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: '36px', height: '4px', borderRadius: '99px', background: 'var(--border)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)' }}>Players & Chat</span>
                <button onClick={() => setMobileDrawerOpen(false)} style={{
                  width: '30px', height: '30px', borderRadius: '8px',
                  background: 'var(--surface-raised)', border: '1px solid var(--border)',
                  color: 'var(--text-muted)', fontSize: '14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: '0 12px 16px', minHeight: 0, overflow: 'hidden' }}>
                <PlayerList players={players} currentPlayerId={playerId} hostId={hostId} />
                <ChatPanel
                  messages={messages}
                  playerName={playerName}
                  onSend={handleSendMessage}
                  isDrawing={isDrawing}
                  isInputLocked={hasGuessedCorrectly}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Select rounds modal (only for host in waiting state) */}
      {gameState === 'waiting' && isHost && selectedRounds === null && (
        <SelectRoundsModal isHost={isHost} onConfirmRounds={handleConfirmRounds} />
      )}

      {/* Word choice modal (only for drawer when choosing word) */}
      {isDrawing && wordChoices && gameState === 'choosing_word' && (
        <WordChoiceModal choices={wordChoices} onSelect={selectWord} />
      )}

      {/* Round end modal — show during round_end state */}
      {gameState === 'round_end' && roundResult && (
        <RoundEndModal result={roundResult} countdown={roundCountdown} onDismiss={() => {}} />
      )}

      {/* Gesture overlay — fixed position, covers entire viewport */}
      <GestureOverlay
        active={gestureMode && gestureActive}
        gesture={gestureDetected}
        onClose={() => handleToggleGesture(false)}
      />

      {/* Game end modal */}
      <GameEndModal result={gameResult} isHost={isHost} onPlayAgain={handlePlayAgain} onBackToLobby={handleBackToLobby} />
    </div>
  )
}
