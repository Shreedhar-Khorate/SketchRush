import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

import GameHeader      from '../components/GameHeader'
import DrawingToolbar  from '../components/DrawingToolbar'
import DrawingCanvas   from '../components/DrawingCanvas'
import PlayerList      from '../components/PlayerList'
import ChatPanel       from '../components/ChatPanel'
import GestureOverlay  from '../components/GestureOverlay'

import { useSocket }   from '../hooks/useSocket'
import FeedbackModal from '../components/FeedbackModal'

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
      background: 'rgba(20,20,20,0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--line)',
          borderRadius: '20px',
          boxShadow: '8px 8px 0 var(--shadow)',
          padding: '36px 32px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--yellow)', border: '2px solid var(--line)',
          boxShadow: '2px 2px 0 var(--shadow)',
          borderRadius: '999px', padding: '6px 14px',
          fontSize: '12px', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.04em', marginBottom: '14px',
        }}>
          🎯 Your Turn to Draw!
        </div>
        <h1 style={{
          fontSize: '26px', fontWeight: 800, marginBottom: '8px',
          color: 'var(--text)', fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
        }}>
          Choose a Word
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
          Pick a secret word to sketch on the canvas
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '8px' }}>
          {choices.map((word, idx) => (
            <motion.button
              key={word}
              onClick={() => onSelect(word)}
              whileHover={{ scale: 1.04, translateY: -2 }}
              whileTap={{ scale: 0.96 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.08 }}
              style={{
                padding: '16px 18px',
                borderRadius: '14px',
                background: 'var(--surface-2)',
                border: '2px solid var(--line)',
                boxShadow: '3px 3px 0 var(--shadow)',
                color: 'var(--text)',
                fontWeight: 800,
                fontSize: '16px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontFamily: 'var(--font-heading)',
                transition: 'background 0.15s ease, transform 0.1s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--yellow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
              }}
            >
              {word}
            </motion.button>
          ))}
        </div>
        <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginTop: '16px' }}>
          One of these is extra tricky! 😈
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
      background: 'rgba(20,20,20,0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--line)',
          borderRadius: '20px',
          boxShadow: '8px 8px 0 var(--shadow)',
          padding: '32px 36px',
          minWidth: '320px', maxWidth: '440px',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>⏱️</div>
        <h2 style={{
          fontSize: '26px', fontWeight: 800, marginBottom: '6px',
          color: 'var(--text)', fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
        }}>
          Round Over!
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '15px', fontWeight: 600, marginBottom: '20px' }}>
          The word was{' '}
          <span style={{
            fontWeight: 800, color: 'var(--text)',
            background: 'var(--yellow)', padding: '2px 8px',
            borderRadius: '6px', border: '1.5px solid var(--line)',
            boxShadow: '1.5px 1.5px 0 var(--shadow)',
            fontFamily: 'var(--font-heading)',
          }}>
            "{result.word}"
          </span>
        </p>
        {result.leaderboard?.slice(0, 5).map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '8px 12px', borderRadius: '12px',
            background: i === 0 ? 'var(--yellow)' : 'var(--surface-2)',
            border: '2px solid var(--line)',
            boxShadow: i === 0 ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
            marginBottom: '8px',
          }}>
            <span style={{ width: '24px', fontSize: i === 0 ? '18px' : '13px', fontWeight: 800 }}>
              {['👑','🥈','🥉'][i] || `#${i+1}`}
            </span>
            <span style={{ fontSize: '20px' }}>{p.avatar}</span>
            <span style={{ flex: 1, fontSize: '14px', fontWeight: 800, textAlign: 'left', color: 'var(--text)' }}>{p.name}</span>
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)' }}>
              {p.score} pts
            </span>
          </div>
        ))}
        <p style={{ marginTop: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)' }}>
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
      background: 'rgba(20,20,20,0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--line)',
          borderRadius: '20px',
          boxShadow: '8px 8px 0 var(--shadow)',
          padding: '36px 32px',
          maxWidth: '480px',
          width: '100%',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'var(--yellow)', border: '2px solid var(--line)',
          boxShadow: '2px 2px 0 var(--shadow)',
          borderRadius: '999px', padding: '6px 14px',
          fontSize: '12px', fontWeight: 800, textTransform: 'uppercase',
          letterSpacing: '0.04em', marginBottom: '14px',
        }}>
          🎮 Game Settings
        </div>
        <h1 style={{
          fontSize: '26px', fontWeight: 800, marginBottom: '8px',
          color: 'var(--text)', fontFamily: 'var(--font-heading)',
          letterSpacing: '-0.02em',
        }}>
          How Many Rounds?
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: 600, marginBottom: '24px' }}>
          Select the total number of rounds to play in this match
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '12px' }}>
          {[1, 2, 3, 4, 5].map((num) => (
            <motion.button
              key={num}
              onClick={() => setSelectedRounds(num)}
              whileHover={{ scale: 1.06, translateY: -2 }}
              whileTap={{ scale: 0.94 }}
              style={{
                padding: '14px 10px',
                borderRadius: '12px',
                background: selectedRounds === num ? 'var(--yellow)' : 'var(--surface-2)',
                border: '2px solid var(--line)',
                boxShadow: selectedRounds === num ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
                color: 'var(--text)',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
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
              whileHover={{ scale: 1.06, translateY: -2 }}
              whileTap={{ scale: 0.94 }}
              style={{
                padding: '14px 10px',
                borderRadius: '12px',
                background: selectedRounds === num ? 'var(--yellow)' : 'var(--surface-2)',
                border: '2px solid var(--line)',
                boxShadow: selectedRounds === num ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
                color: 'var(--text)',
                fontWeight: 800,
                fontSize: '18px',
                fontFamily: 'var(--font-heading)',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
            >
              {num}
            </motion.button>
          ))}
        </div>

        <motion.button
          onClick={() => onConfirmRounds(selectedRounds)}
          whileHover={{ scale: 1.03, translateY: -2 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary"
          style={{ width: '100%', padding: '16px', fontSize: '16px', borderRadius: '14px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}
        >
          Confirm {selectedRounds} Round{selectedRounds !== 1 ? 's' : ''}
        </motion.button>
      </motion.div>
    </div>
  )
}

// ── Game End Overlay ──────────────────────────────────────────────────────────
function GameEndModal({ result, isHost, onPlayAgain, onBackToLobby, onShowFeedback }) {
  if (!result) return null
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: 'rgba(20,20,20,0.65)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: 'var(--surface)',
          border: '3px solid var(--line)',
          borderRadius: '20px',
          boxShadow: '8px 8px 0 var(--shadow)',
          padding: '36px 36px',
          minWidth: '340px', maxWidth: '480px',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
          style={{ fontSize: '56px', marginBottom: '8px' }}
        >🏆</motion.div>
        <h2 style={{
          fontSize: '28px', fontWeight: 800, color: 'var(--text)',
          fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em',
          marginBottom: '6px',
        }}>
          Game Over!
        </h2>
        {result.winner && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'var(--yellow)', border: '2px solid var(--line)',
            boxShadow: '2px 2px 0 var(--shadow)', borderRadius: '999px',
            padding: '6px 16px', marginBottom: '20px',
            fontSize: '14px', fontWeight: 800, color: 'var(--text)',
          }}>
            🎉 <span>{result.winner.name}</span> wins with {result.winner.score} pts!
          </div>
        )}
        {result.leaderboard?.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 14px', borderRadius: '12px',
            background: i === 0 ? 'var(--yellow)' : 'var(--surface-2)',
            border: '2px solid var(--line)',
            boxShadow: i === 0 ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
            marginBottom: '8px',
          }}>
            <span style={{ width: '24px', fontSize: i === 0 ? '20px' : '13px', fontWeight: 800 }}>
              {['👑','🥈','🥉'][i] || `#${i+1}`}
            </span>
            <span style={{ fontSize: '20px' }}>{p.avatar}</span>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 800, textAlign: 'left', color: 'var(--text)' }}>{p.name}</span>
            <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
              {p.score} pts
            </span>
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: isHost ? '1fr 1fr' : '1fr', gap: '12px', marginTop: '24px' }}>
          {isHost && (
            <motion.button
              onClick={onPlayAgain}
              whileHover={{ scale: 1.03, translateY: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: '12px', fontSize: '15px', fontWeight: 800, borderRadius: '12px',
                background: 'var(--surface-2)', border: '2.5px solid var(--line)',
                boxShadow: '3px 3px 0 var(--shadow)',
                color: 'var(--text)', cursor: 'pointer',
                fontFamily: 'var(--font-heading)',
              }}
            >
              🔄 Play Again
            </motion.button>
          )}
          <motion.button
            onClick={onBackToLobby}
            whileHover={{ scale: 1.03, translateY: -2 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary"
            style={{ padding: '12px', fontSize: '15px', borderRadius: '12px', fontFamily: 'var(--font-heading)', fontWeight: 800 }}
          >
            🚀 Back to Lobby
          </motion.button>
        </div>

        <motion.button
          onClick={onShowFeedback}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '10px',
            fontSize: '13px',
            fontWeight: 700,
            borderRadius: '12px',
            background: 'var(--surface-2)',
            border: '2px solid var(--line)',
            boxShadow: '2px 2px 0 var(--shadow)',
            color: 'var(--text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: 'var(--font-heading)',
          }}
        >
          💬 Share Feedback
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
  const [selectedColor,   setSelectedColor]   = useState('#0D1117')
  const [brushSize,       setBrushSize]       = useState(5)
  const [isEraser,        setIsEraser]        = useState(false)
  const [clearSignal,     setClearSignal]     = useState(0)
  const [gestureMode,     setGestureMode]     = useState(false)
  const [showGesture,     setShowGesture]     = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [selectedRounds,  setSelectedRounds]  = useState(null)  // Track if host selected rounds
  const [mobileSidebarTab, setMobileSidebarTab] = useState('chat') // 'players' | 'chat'
  const [showFeedback, setShowFeedback] = useState(false)

  // ── Socket ───────────────────────────────────────────────────────────────
  const {
    connected, playerId, isHost, hostId,
    players, messages, gameState,
    round, maxRounds, drawerName, drawerAvatar,
    currentDrawerId, currentWord, wordHint, wordChoices,
    timeLeft, roundResult, gameResult, roundCountdown,
    isDrawing, hasGuessedCorrectly,
    onRemoteDraw, onRemoteClear,
    sendDraw, sendClear,
    sendGuess, sendMessage,
    startGame, startGameWithRounds, restartGame, selectWord,
  } = useSocket({ roomCode: roomId, playerName, avatar: playerAvatar })

  const hostPlayer = players.find((p) => p && p.id === hostId)
  const hostName = hostPlayer?.name || ''
  const hostAvatar = hostPlayer?.avatar || '👑'

  // ── Debug logging for game state ───────────────────────────────────────────
  useEffect(() => {
    console.log('[GamePage] Game state changed to:', gameState, '| Drawer:', currentDrawerId, '| isDrawing:', isDrawing)
  }, [gameState, currentDrawerId, isDrawing])

  // ── Gesture draw: draws LOCALLY on this canvas + broadcasts to server ──────
  // onRemoteDraw.current is set by DrawingCanvas to its own _applyRemoteDraw
  // which handles normalised coords (0-1) exactly like remote socket strokes.
  const handleGestureDraw = useCallback((data) => {
    if (onRemoteDraw.current) onRemoteDraw.current(data)  // paint locally
    sendDraw(data)                                         // broadcast to others
  }, [onRemoteDraw, sendDraw])

  // ── Gesture mode toggle ───────────────────────────────────────────────────
  const handleToggleGesture = (on) => {
    setGestureMode(on)
    setShowGesture(on)
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
    // If we're in game_end, immediately restart with the chosen rounds
    if (gameState === 'game_end') {
      restartGame(rounds)
    }
  }

  const handleStartGame = () => {
    if (!selectedRounds) return
    startGameWithRounds(selectedRounds)
  }

  const handlePlayAgain = () => {
    // Reset selectedRounds so the host must pick again before restarting
    setSelectedRounds(null)
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
    }
  }, [isDrawing, gestureMode])

  // Also stop on round_end / game_end game states
  useEffect(() => {
    if ((gameState === 'round_end' || gameState === 'game_end') && gestureMode) {
      setGestureMode(false)
      setShowGesture(false)
    }
  }, [gameState, gestureMode])

  if (!playerName) return null

  return (
    <div style={{
      background: 'var(--bg)',
      backgroundImage: 'radial-gradient(var(--dot, rgba(20,20,20,0.13)) 1.4px, transparent 1.4px)',
      backgroundSize: '26px 26px',
      color: 'var(--text)',
      width: '100vw', height: '100vh',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
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
          <div style={{ width: '276px', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            {/* Players — fixed height cap with own internal scroll */}
            <div style={{ flexShrink: 0, height: '220px', minHeight: 0 }}>
              <PlayerList players={players} currentPlayerId={playerId} hostId={hostId} />
            </div>
            {/* Visible neo-brutalist divider */}
            <div style={{
              height: '2px', flexShrink: 0,
              margin: '8px 4px',
              background: 'var(--line)',
              opacity: 0.2,
            }} />
            {/* Chat — fills all remaining space */}
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
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            position: 'fixed', bottom: '24px', right: '24px',
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--yellow)',
            border: '3px solid var(--line)',
            boxShadow: '4px 4px 0 var(--shadow)',
            color: 'var(--text)', fontSize: '24px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 30, cursor: 'pointer',
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
                background: 'rgba(20,20,20,0.65)',
                backdropFilter: 'blur(3px)',
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
                borderTop: '3px solid var(--line)',
                borderRadius: '20px 20px 0 0',
                boxShadow: '0 -8px 24px rgba(20,20,20,0.15)',
                display: 'flex', flexDirection: 'column',
                fontFamily: 'var(--font-body)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
                <div style={{ width: '40px', height: '5px', borderRadius: '99px', background: 'var(--line)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 16px 8px' }}>
                <span style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)', fontFamily: 'var(--font-heading)' }}>Players & Chat</span>
                <button onClick={() => setMobileDrawerOpen(false)} style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--surface-2)', border: '2px solid var(--line)',
                  boxShadow: '2px 2px 0 var(--shadow)',
                  color: 'var(--text)', fontSize: '13px', fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>✕</button>
              </div>
              {/* Mobile tab toggle — Players | Chat */}
              <div style={{ display: 'flex', borderBottom: '2px solid var(--line)', flexShrink: 0, margin: '0 12px', gap: '8px' }}>
                {[
                  { id: 'players', label: `👥 Players (${players.length})` },
                  { id: 'chat',    label: '💬 Chat & Guess' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setMobileSidebarTab(tab.id)}
                    style={{
                      flex: 1, padding: '10px 14px',
                      fontSize: '14px', fontWeight: 800,
                      fontFamily: 'var(--font-heading)',
                      background: mobileSidebarTab === tab.id ? 'var(--yellow)' : 'var(--surface-2)',
                      border: '2px solid var(--line)',
                      borderBottom: mobileSidebarTab === tab.id ? '2px solid var(--yellow)' : '2px solid var(--line)',
                      borderRadius: '10px 10px 0 0',
                      color: 'var(--text)',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      marginBottom: '-2px',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Active panel */}
              <div style={{ flex: 1, minHeight: 0, padding: '8px 12px 16px', overflow: 'hidden' }}>
                {mobileSidebarTab === 'players' ? (
                  <PlayerList players={players} currentPlayerId={playerId} hostId={hostId} />
                ) : (
                  <ChatPanel
                    messages={messages}
                    playerName={playerName}
                    onSend={handleSendMessage}
                    isDrawing={isDrawing}
                    isInputLocked={hasGuessedCorrectly}
                  />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Select rounds modal — host must select before starting or restarting */}
      {(gameState === 'waiting' || gameState === 'game_end') && isHost && selectedRounds === null && (
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

      {/* Gesture overlay — client-side MediaPipe, no server webcam needed */}
      <GestureOverlay
        active={gestureMode}
        onDraw={handleGestureDraw}
        onClear={handleClear}
        onClose={() => handleToggleGesture(false)}
        color={selectedColor}
        brushSize={brushSize}
        isEraser={isEraser}
      />

      {/* Game end modal */}
      <GameEndModal result={gameResult} isHost={isHost} onPlayAgain={handlePlayAgain} onBackToLobby={handleBackToLobby} onShowFeedback={() => setShowFeedback(true)} />

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />
    </div>
  )
}
