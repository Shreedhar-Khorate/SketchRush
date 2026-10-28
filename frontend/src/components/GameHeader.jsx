import { useState } from 'react'
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
  const [copied, setCopied] = useState(false)
  const isCritical = timeLeft <= 10
  const isWarning  = timeLeft <= 20

  const handleCopyCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <header className="game-header w-full bg-white border-b-[3px] border-[#171717] px-3 sm:px-6 py-2 sm:py-2.5 shadow-[0_4px_0px_rgba(23,23,23,0.06)]">
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-1.5 sm:gap-2">
        {/* ── Main Navigation & Status ── */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-2 sm:gap-3">
        
        {/* Top line on mobile / Left group on desktop */}
        <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-2 sm:gap-3 flex-shrink-0">
          
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#FFD84D] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center text-sm sm:text-base flex-shrink-0">
              ✏️
            </div>
            <span className="font-black text-sm sm:text-base uppercase tracking-tight hidden sm:inline" style={{ fontFamily: "'Archivo Black', sans-serif" }}>
              SketchRush
            </span>

            {/* Room Code Badge with Copy button */}
            <div className="flex items-center bg-[#FFF8E7] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] px-2 sm:px-2.5 py-1">
              <span className="text-[10px] font-black uppercase text-[#6B7280] mr-1.5 hidden sm:inline">ROOM</span>
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-[#171717]">{roomCode}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                title="Copy room code"
                className="ml-1.5 sm:ml-2 px-1.5 py-0.5 bg-white border border-[#171717] text-[9px] sm:text-[10px] font-black uppercase hover:bg-[#FFD84D] active:translate-y-0.5 transition-all cursor-pointer"
              >
                {copied ? '✓ COPIED' : '📋 COPY'}
              </button>
            </div>

            {/* Connection status */}
            <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <span className={`w-2 h-2 rounded-full border border-black ${connected ? 'bg-[#B7F56A]' : 'bg-[#FF6B6B]'}`} />
              <span className="text-[10px] font-black uppercase">{connected ? 'ONLINE' : 'CONNECTING'}</span>
            </div>
          </div>

          {/* On mobile, show round, players & timer in top row right */}
          <div className="flex md:hidden items-center gap-1.5 flex-shrink-0">
            {round > 0 && (
              <div className="flex items-center px-2 py-0.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] text-[10px] font-mono font-black">
                R{round}/{maxRounds}
              </div>
            )}
            <div className="flex items-center px-2 py-0.5 bg-white border-2 border-[#171717] shadow-[1.5px_1.5px_0px_#171717] text-[10px] font-mono font-black">
              👥{playerCount}
            </div>
            {gameState === 'drawing' && (
              <div className={`game-timer-box text-xs py-0.5 px-2 ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}>
                <span>⏱</span>
                <span>{timeLeft}s</span>
              </div>
            )}
            {gameState === 'waiting' && isHost && (
              <button
                type="button"
                onClick={onStartGame}
                disabled={!selectedRounds}
                className="neo-btn neo-btn-sm neo-btn-primary text-[10px] py-1 px-2.5"
              >
                START
              </button>
            )}
          </div>

        </div>

        {/* Center: Dynamic Game Centerpiece (Word Hint / Status) */}
        <div className="w-full md:flex-1 flex items-center justify-center min-w-0 px-1 sm:px-2 py-0.5">
          <AnimatePresence mode="wait">
            {gameState === 'waiting' ? (
              <motion.div
                key="waiting"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-[#DCCBFF] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] px-3 sm:px-4 py-1 sm:py-1.5"
              >
                <span className="text-xs sm:text-sm">⏳</span>
                <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wide">
                  Lobby · Waiting for {isHost ? 'you to start' : 'host to start'}
                </span>
              </motion.div>
            ) : gameState === 'choosing_word' ? (
              <motion.div
                key="choosing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 bg-[#7BA7FF] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] px-3 sm:px-4 py-1 sm:py-1.5 text-white"
              >
                <span className="animate-spin text-xs sm:text-sm">✏️</span>
                <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase tracking-wide">
                  {isDrawing ? 'YOU ARE CHOOSING A WORD...' : `${drawerName.toUpperCase()} IS CHOOSING A WORD...`}
                </span>
              </motion.div>
            ) : isDrawing && currentWord ? (
              <motion.div
                key="drawer-word"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-2 bg-[#B7F56A] border-2 border-[#171717] shadow-[3px_3px_0px_#171717] px-3 sm:px-4 py-1 sm:py-1.5"
              >
                <span className="text-[10px] sm:text-xs font-black uppercase text-[#171717] tracking-wider">YOUR SECRET WORD:</span>
                <span className="font-mono font-black text-sm sm:text-base md:text-lg tracking-wider text-[#171717] uppercase bg-white px-2 py-0.5 border border-[#171717]">
                  {currentWord}
                </span>
              </motion.div>
            ) : gameState === 'drawing' ? (
              <motion.div
                key="hint-blanks"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center"
              >
                {(wordHint || '').split(' ').map((ch, i) => (
                  <div
                    key={i}
                    className="w-5 h-7 sm:w-7 sm:h-9 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex items-center justify-center font-mono font-black text-xs sm:text-base text-[#171717] uppercase"
                  >
                    {ch !== '_' ? ch : ''}
                  </div>
                ))}
              </motion.div>
            ) : gameState === 'round_end' ? (
              <motion.div
                key="round-end"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-[#FFD84D] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] px-3 sm:px-4 py-1 sm:py-1.5"
              >
                <span className="text-xs sm:text-sm">⏱️</span>
                <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase">ROUND COMPLETE!</span>
              </motion.div>
            ) : (
              <motion.div
                key="game-over"
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 bg-[#FF6B6B] text-white border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] px-3 sm:px-4 py-1 sm:py-1.5"
              >
                <span className="text-xs sm:text-sm">🏆</span>
                <span className="text-[11px] sm:text-xs md:text-sm font-black uppercase">MATCH FINISHED!</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right on Desktop: Round Info, Timer & Host Controls */}
        <div className="hidden md:flex items-center gap-2 sm:gap-3 flex-shrink-0">
          
          {/* Round Counter */}
          {round > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
              <span className="text-[10px] font-black uppercase text-[#6B7280]">ROUND</span>
              <span className="font-mono font-black text-xs text-[#171717]">{round}/{maxRounds}</span>
            </div>
          )}

          {/* Player Count */}
          <div className="flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717]">
            <span className="text-xs">👥</span>
            <span className="font-mono font-black text-xs text-[#171717]">{playerCount}/{maxPlayers}</span>
          </div>

          {/* Timer Display */}
          {gameState === 'drawing' && (
            <div
              className={`game-timer-box ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}
            >
              <span>⏱</span>
              <span className="tracking-tighter">{timeLeft}s</span>
            </div>
          )}

          {/* Host Start Button (in Lobby) */}
          {gameState === 'waiting' && isHost && (
            <button
              type="button"
              onClick={onStartGame}
              disabled={!selectedRounds}
              className="neo-btn neo-btn-sm neo-btn-primary"
              style={{
                backgroundColor: 'var(--yellow)',
                padding: '6px 14px',
              }}
            >
              🚀 START GAME
            </button>
          )}

        </div>

      </div>

      {/* ── Sub-bar: Active Drawer / Host meta line during game ── */}
      <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#454545] pt-1 border-t border-[#171717]/15">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {drawerName && (gameState === 'drawing' || gameState === 'choosing_word') && (
            <div className="flex items-center gap-1.5">
              <span>{drawerAvatar}</span>
              <span className="font-black text-[#171717] uppercase truncate max-w-[120px] sm:max-w-none">{drawerName}</span>
              <span className="text-[9px] sm:text-[10px] bg-[#7BA7FF] text-white px-1.5 py-0.2 border border-black uppercase">
                {gameState === 'choosing_word' ? 'CHOOSING' : 'DRAWING'}
              </span>
            </div>
          )}
          {gameState === 'waiting' && (
            <span className="truncate max-w-[200px] sm:max-w-none">
              HOST: <strong className="text-[#171717] uppercase">{hostAvatar} {hostName}</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {isHost && gameState === 'waiting' && (
            <span className="text-[9px] sm:text-[10px] bg-[#FFD84D] px-1.5 sm:px-2 py-0.5 border border-black uppercase font-black">
              {selectedRounds ? `${selectedRounds} ROUNDS` : 'SELECT ROUNDS'}
            </span>
          )}
          <span className="font-mono text-[9px] sm:text-[10px] text-[#6B7280] hidden sm:inline">
            SKETCHRUSH
          </span>
        </div>
      </div>
    </div>
  </header>
  )
}
