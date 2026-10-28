import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPanel({
  messages = [],
  playerName = 'Player',
  onSend = null,
  isDrawing = false,
  isInputLocked = false,
}) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (!text) return
    if (onSend) onSend(text)
    setInput('')
    inputRef.current?.focus()
  }, [input, onSend])

  return (
    <div className="w-full h-full flex flex-col bg-white border-[2.5px] border-[#171717] shadow-[4px_4px_0px_#171717] rounded-[4px] overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#FFF8E7] border-b-[2px] border-[#171717] px-3.5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="font-black text-xs uppercase tracking-wide">
            {isDrawing ? 'CHAT STREAM' : 'CHAT & GUESS'}
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[#171717] px-2 py-0.5">
          <span className="w-2 h-2 rounded-full bg-[#B7F56A] border border-black animate-pulse" />
          <span className="text-[10px] font-black uppercase text-[#171717]">SYNCED</span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 flex flex-col gap-1.5 min-h-0 bg-[#FFFDF7]">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              {msg.type === 'system' ? (
                <div className="flex justify-center my-0.5">
                  <span className="px-2 py-0.5 bg-[#DCCBFF] border border-[#171717] shadow-[1.5px_1.5px_0px_#171717] text-[10px] font-black uppercase text-[#171717]">
                    📢 {msg.content}
                  </span>
                </div>
              ) : msg.type === 'correct' ? (
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  className="p-2 sm:p-2.5 bg-[#B7F56A] border-2 border-[#171717] shadow-[2.5px_2.5px_0px_#171717] flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">{msg.avatar}</span>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-[#171717] uppercase">
                          {msg.player}
                        </span>
                        <span className="text-[9px] sm:text-[10px] font-black text-[#171717]/80 uppercase">
                          GUESSED IT!
                        </span>
                      </div>
                      {msg.content && (
                        <span className="font-mono font-black text-[11px] text-[#171717] uppercase">
                          &quot;{msg.content}&quot;
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="px-1.5 sm:px-2 py-0.5 bg-white border-2 border-[#171717] font-mono font-black text-xs text-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex-shrink-0">
                    +{msg.points} PTS
                  </span>
                </motion.div>
              ) : (
                <div className="p-1.5 bg-white border border-[#171717] shadow-[1.5px_1.5px_0px_#171717] flex items-start gap-1.5 sm:gap-2">
                  <span className="text-sm flex-shrink-0 mt-0.5">{msg.avatar || '💬'}</span>
                  <div className="min-w-0 text-xs">
                    <span className="font-black text-[#171717] uppercase mr-1">
                      {msg.player}:
                    </span>
                    <span className="text-[#333333] font-medium break-words">
                      {msg.content}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input / Control Footer */}
      <div className="bg-white border-t-2 border-[#171717] p-2.5 sm:p-3 flex-shrink-0">
        {isDrawing ? (
          <div className="p-2 bg-[#FFF8E7] border border-[#171717] text-center text-[11px] sm:text-xs font-black uppercase text-[#6B7280]">
            ✏️ You are drawing — other players are guessing!
          </div>
        ) : isInputLocked ? (
          <div className="p-2 bg-[#B7F56A] border-2 border-[#171717] text-center text-[11px] sm:text-xs font-black uppercase text-[#171717]">
            ✅ Correct guess! Chat locked until next round.
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your guess here..."
              className="flex-1 px-3 py-2 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-semibold text-xs text-[#171717] outline-none focus:shadow-[2.5px_2.5px_0px_#171717]"
              disabled={isInputLocked}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isInputLocked || !input.trim()}
              className="px-3.5 py-2 bg-[#FFD84D] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-black text-xs uppercase hover:bg-[#FFE066] active:translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex-shrink-0"
            >
              GUESS
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
