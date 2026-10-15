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
  const [isDesktop, setIsDesktop] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true)
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white border-[3px] border-[#171717] shadow-[6px_6px_0px_#171717] sm:shadow-[8px_8px_0px_#171717] p-4 sm:p-6 text-center flex flex-col gap-3.5 sm:gap-5"
      >
        <div className="bg-[#FFD84D] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] py-2 px-3 sm:px-4">
          <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-[#171717]">
            🎯 CHOOSE YOUR WORD
          </h2>
        </div>

        <p className="text-[11px] sm:text-xs font-bold text-[#454545] uppercase">
          Pick which secret word you want to sketch on the canvas!
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
          {choices.map((word) => (
            <motion.button
              key={word}
              onClick={() => onSelect(word)}
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.96 }}
              className="p-2.5 sm:p-3 bg-[#FFF8E7] hover:bg-[#B7F56A] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] font-black text-xs sm:text-sm uppercase tracking-wide transition-all cursor-pointer"
            >
              {word}
            </motion.button>
          ))}
        </div>

        <span className="text-[10px] sm:text-[11px] text-[#6B7280] font-bold">
          One of these will challenge your drawing speed! ⚡
        </span>
      </motion.div>
    </div>
  )
}

// ── Round End Overlay ─────────────────────────────────────────────────────────
function RoundEndModal({ result, countdown }) {
  if (!result) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white border-[3px] border-[#171717] shadow-[6px_6px_0px_#171717] sm:shadow-[8px_8px_0px_#171717] p-4 sm:p-6 text-center flex flex-col gap-3 sm:gap-4"
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-2xl sm:text-3xl">⏱️</span>
          <h2 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-[#171717]">
            ROUND OVER!
          </h2>
        </div>

        <div className="p-2.5 sm:p-3 bg-[#FFF8E7] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717]">
          <span className="text-[10px] sm:text-xs font-black uppercase text-[#6B7280] block mb-1">THE SECRET WORD WAS</span>
          <span className="font-mono font-black text-xl sm:text-2xl uppercase tracking-wider text-[#171717] bg-[#FFD84D] px-3 py-1 border border-black inline-block">
            {result.word}
          </span>
        </div>

        {/* Mini Leaderboard podium */}
        <div className="flex flex-col gap-1.5 text-left">
          <span className="text-[10px] sm:text-xs font-black uppercase text-[#171717] mb-0.5">TOP PLAYERS THIS MATCH:</span>
          {result.leaderboard?.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className={`p-2 border-2 border-[#171717] flex items-center justify-between text-xs font-black ${
                i === 0 ? 'bg-[#FFD84D] shadow-[2px_2px_0px_#171717]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{['👑', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                <span>{p.avatar}</span>
                <span className="uppercase">{p.name}</span>
              </div>
              <span className="font-mono">{p.score} PTS</span>
            </div>
          ))}
        </div>

        <div className="p-2 bg-[#DCCBFF] border-2 border-[#171717] text-xs font-black uppercase text-[#171717]">
          {countdown ? `NEXT ROUND IN ${countdown}S...` : 'STARTING NEXT ROUND...'}
        </div>
      </motion.div>
    </div>
  )
}

// ── Select Rounds Modal ───────────────────────────────────────────────────────
function SelectRoundsModal({ isHost, initialRounds = 3, onConfirmRounds }) {
  const [selectedRounds, setSelectedRounds] = useState(initialRounds)
  if (!isHost) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white border-[3px] border-[#171717] shadow-[6px_6px_0px_#171717] sm:shadow-[8px_8px_0px_#171717] p-4 sm:p-6 text-center flex flex-col gap-4 sm:gap-5"
      >
        <div className="bg-[#FFD84D] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] py-2 px-3 sm:px-4">
          <h2 className="font-black text-lg sm:text-xl uppercase tracking-tight text-[#171717]">
            🎮 SELECT MATCH ROUNDS
          </h2>
        </div>

        <p className="text-[11px] sm:text-xs font-bold text-[#454545] uppercase">
          As the host, choose how many rounds this game will last:
        </p>

        <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setSelectedRounds(num)}
              className={`p-2 sm:p-2.5 font-mono font-black text-xs sm:text-sm border-2 border-[#171717] transition-all cursor-pointer ${
                selectedRounds === num
                  ? 'bg-[#FFD84D] shadow-[2.5px_2.5px_0px_#171717] scale-105'
                  : 'bg-white hover:bg-[#FFF8E7]'
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => onConfirmRounds(selectedRounds)}
          className="neo-btn neo-btn-primary w-full"
        >
          CONFIRM {selectedRounds} ROUNDS 🚀
        </button>
      </motion.div>
    </div>
  )
}

// ── Game End Overlay ──────────────────────────────────────────────────────────
function GameEndModal({ result, isHost, onPlayAgain, onBackToLobby, onShowFeedback }) {
  if (!result) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm sm:max-w-md max-h-[92dvh] overflow-y-auto bg-white border-[3px] border-[#171717] shadow-[8px_8px_0px_#171717] sm:shadow-[10px_10px_0px_#171717] p-4 sm:p-6 text-center flex flex-col gap-3.5 sm:gap-4"
      >
        <div className="text-3xl sm:text-4xl animate-bounce">🏆</div>
        
        <h2 className="font-black text-xl sm:text-2xl uppercase tracking-tight text-[#171717]">
          GAME OVER!
        </h2>

        {result.winner && (
          <div className="p-2.5 sm:p-3 bg-[#B7F56A] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl">{result.winner.avatar}</span>
            <span className="font-black text-xs sm:text-base uppercase text-[#171717]">
              {result.winner.name} WINS! ({result.winner.score} PTS)
            </span>
          </div>
        )}

        <div className="flex flex-col gap-1.5 text-left max-h-48 overflow-y-auto">
          {result.leaderboard?.map((p, i) => (
            <div
              key={p.id}
              className={`p-2 border-2 border-[#171717] flex items-center justify-between text-xs font-black ${
                i === 0 ? 'bg-[#FFD84D]' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{['👑', '🥈', '🥉'][i] || `#${i + 1}`}</span>
                <span>{p.avatar}</span>
                <span className="uppercase">{p.name}</span>
              </div>
              <span className="font-mono">{p.score} PTS</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 sm:mt-2">
          {isHost && (
            <button
              type="button"
              onClick={onPlayAgain}
              className="neo-btn neo-btn-sm neo-btn-white w-full"
            >
              🔄 PLAY AGAIN
            </button>
          )}
          <button
            type="button"
            onClick={onBackToLobby}
            className="neo-btn neo-btn-sm neo-btn-primary w-full"
          >
            🏠 HOME LOBBY
          </button>
        </div>

        <button
          type="button"
          onClick={onShowFeedback}
          className="text-xs font-bold text-[#6B7280] hover:text-[#171717] underline cursor-pointer mt-1"
        >
          💬 Share Your Game Feedback
        </button>
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

  useEffect(() => {
    if (!playerName) navigate('/')
  }, [playerName, navigate])

  // Drawing tool state
  const [selectedColor, setSelectedColor] = useState('#171717')
  const [brushSize, setBrushSize] = useState(5)
  const [isEraser, setIsEraser] = useState(false)
  const [clearSignal, setClearSignal] = useState(0)
  const [gestureMode, setGestureMode] = useState(false)
  const [selectedRounds, setSelectedRounds] = useState(null)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)
  const [mobileSidebarTab, setMobileSidebarTab] = useState('chat')
  const [showFeedback, setShowFeedback] = useState(false)

  // Socket
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

  const handleGestureDraw = useCallback((data) => {
    if (onRemoteDraw.current) onRemoteDraw.current(data)
    sendDraw(data)
  }, [onRemoteDraw, sendDraw])

  const handleToggleGesture = (on) => {
    setGestureMode(on)
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
    if (gameState === 'game_end') {
      restartGame(rounds)
    }
  }

  const handleStartGame = () => {
    if (!selectedRounds) return
    startGameWithRounds(selectedRounds)
  }

  const handlePlayAgain = () => {
    setSelectedRounds(null)
  }

  const handleBackToLobby = () => {
    navigate('/')
  }

  const handleSendMessage = (text) => {
    if (hasGuessedCorrectly) return
    if (gameState === 'drawing' && !isDrawing) {
      sendGuess(text)
    } else {
      sendMessage(text)
    }
  }

  useEffect(() => {
    if (!isDrawing && gestureMode) {
      setGestureMode(false)
    }
  }, [isDrawing, gestureMode])

  useEffect(() => {
    if ((gameState === 'round_end' || gameState === 'game_end') && gestureMode) {
      setGestureMode(false)
    }
  }, [gameState, gestureMode])

  if (!playerName) return null

  return (
    <div className="game-viewport">
      
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

      {/* Toolbar for the Drawer */}
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

      {/* Main Workspace */}
      <div className="flex-1 w-full max-w-[1600px] mx-auto flex overflow-hidden p-2 sm:p-3.5 gap-2 sm:gap-3.5 min-h-0">
        
        {/* Drawing Board Area */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col relative">
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

        {/* Desktop Sidebar (Players + Chat) */}
        {isDesktop && (
          <div className="w-[300px] lg:w-[330px] flex-shrink-0 flex flex-col gap-2.5 sm:gap-3 min-h-0 pb-1.5">
            {/* Player Leaderboard (Top half) */}
            <div className="flex-shrink-0 h-[210px] lg:h-[230px] min-h-0">
              <PlayerList players={players} currentPlayerId={playerId} hostId={hostId} />
            </div>

            {/* Chat & Guess Stream (Bottom half) */}
            <div className="flex-1 min-h-0">
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

      {/* Mobile Floating Action Button */}
      {!isDesktop && (
        <button
          type="button"
          onClick={() => setMobileDrawerOpen(true)}
          className="fixed bottom-4 right-4 z-40 w-13 h-13 sm:w-14 sm:h-14 bg-[#FFD84D] border-[2.5px] border-[#171717] shadow-[3.5px_3.5px_0px_#171717] flex items-center justify-center text-2xl active:translate-y-1 transition-all cursor-pointer"
          title="Open Chat & Players"
        >
          💬
        </button>
      )}

      {/* Mobile Drawer (Players & Chat toggle) */}
      <AnimatePresence>
        {mobileDrawerOpen && !isDesktop && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/60"
            />
            <motion.div
              key="drawer"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 z-50 h-[80vh] max-h-[82vh] bg-white border-t-[3px] border-[#171717] flex flex-col shadow-[0_-6px_0px_rgba(23,23,23,0.15)] pb-safe"
            >
              <div className="p-2.5 sm:p-3 bg-[#FFF8E7] border-b-2 border-[#171717] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarTab('chat')}
                    className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase border-2 border-[#171717] ${
                      mobileSidebarTab === 'chat' ? 'bg-[#FFD84D] shadow-[2px_2px_0px_#171717]' : 'bg-white'
                    }`}
                  >
                    💬 CHAT & GUESS
                  </button>
                  <button
                    type="button"
                    onClick={() => setMobileSidebarTab('players')}
                    className={`px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black uppercase border-2 border-[#171717] ${
                      mobileSidebarTab === 'players' ? 'bg-[#FFD84D] shadow-[2px_2px_0px_#171717]' : 'bg-white'
                    }`}
                  >
                    👥 PLAYERS ({players.length})
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  className="w-7 h-7 sm:w-8 sm:h-8 bg-white border-2 border-[#171717] font-black text-xs sm:text-sm flex items-center justify-center cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 p-2.5 pb-4 min-h-0 overflow-hidden">
                {mobileSidebarTab === 'chat' ? (
                  <ChatPanel
                    messages={messages}
                    playerName={playerName}
                    onSend={handleSendMessage}
                    isDrawing={isDrawing}
                    isInputLocked={hasGuessedCorrectly}
                  />
                ) : (
                  <PlayerList players={players} currentPlayerId={playerId} hostId={hostId} />
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Select Rounds Modal (Host) */}
      {(gameState === 'waiting' || gameState === 'game_end') && isHost && selectedRounds === null && (
        <SelectRoundsModal isHost={isHost} onConfirmRounds={handleConfirmRounds} />
      )}

      {/* Word Choice Modal (Drawer) */}
      {isDrawing && wordChoices && gameState === 'choosing_word' && (
        <WordChoiceModal choices={wordChoices} onSelect={selectWord} />
      )}

      {/* Round End Modal */}
      {gameState === 'round_end' && roundResult && (
        <RoundEndModal result={roundResult} countdown={roundCountdown} />
      )}

      {/* Air Canvas Gesture Overlay */}
      <GestureOverlay
        active={gestureMode}
        onDraw={handleGestureDraw}
        onClear={handleClear}
        onClose={() => handleToggleGesture(false)}
        color={selectedColor}
        brushSize={brushSize}
        isEraser={isEraser}
      />

      {/* Game End Modal */}
      <GameEndModal
        result={gameResult}
        isHost={isHost}
        onPlayAgain={handlePlayAgain}
        onBackToLobby={handleBackToLobby}
        onShowFeedback={() => setShowFeedback(true)}
      />

      <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

    </div>
  )
}
