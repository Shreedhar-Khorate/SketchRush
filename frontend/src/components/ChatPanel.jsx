import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPanel({
  messages = [],
  playerName = 'Player',
  onSend = null,
  isDrawing = false,
  isInputLocked = false,
}) {
  const [input, setInput]     = useState('')
  const messagesEndRef        = useRef(null)
  const inputRef              = useRef(null)

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
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      borderRadius: '20px', overflow: 'hidden',
      background: 'var(--surface)',
      border: '3px solid var(--line)',
      boxShadow: '5px 5px 0 var(--shadow)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', flexShrink: 0,
        borderBottom: '2.5px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>💬</span>
          <span style={{
            fontSize: '15px', fontWeight: 700,
            color: 'var(--text)', fontFamily: 'var(--font-display)',
          }}>
            {isDrawing ? 'Chat' : 'Chat & Guess'}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: 'var(--lime)', border: '2px solid var(--line)',
          borderRadius: '999px', padding: '2px 8px',
          boxShadow: '2px 2px 0 var(--shadow)',
        }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--green)',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#141414' }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {msg.type === 'system' ? (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                  <span style={{
                    fontSize: '11px', padding: '4px 12px', borderRadius: '99px',
                    background: 'var(--surface-2)',
                    border: '2px solid var(--line)',
                    boxShadow: '2px 2px 0 var(--shadow)',
                    color: 'var(--text)',
                    fontWeight: 700,
                  }}>{msg.content}</span>
                </div>
              ) : msg.type === 'correct' ? (
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '8px',
                    padding: '8px 12px', borderRadius: '12px',
                    background: 'var(--lime)',
                    border: '2px solid var(--line)',
                    boxShadow: '3px 3px 0 var(--shadow)',
                    color: '#141414',
                  }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{msg.avatar}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#141414' }}>
                        ✅ {msg.player}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#141414' }}>guessed correctly!</span>
                      <span style={{
                        fontSize: '10px', padding: '1px 6px',
                        background: 'var(--yellow)', border: '1.5px solid var(--line)',
                        borderRadius: '999px', fontWeight: 800, color: '#141414',
                      }}>
                        +{msg.points} pts
                      </span>
                    </div>
                    {msg.content ? (
                      <p style={{ fontSize: '11px', fontWeight: 700, color: '#141414', marginTop: '2px' }}>
                        "{msg.content}"
                      </p>
                    ) : null}
                  </div>
                </motion.div>
              ) : (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: '8px',
                  padding: '4px 8px', borderRadius: '10px',
                  background: 'var(--surface-2)', border: '1.5px solid var(--line)',
                  boxShadow: '1.5px 1.5px 0 var(--shadow)',
                }}>
                  <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>
                    {msg.avatar || '💬'}
                  </span>
                  <p style={{ fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                    <span style={{ fontWeight: 800, color: 'var(--text)' }}>
                      {msg.player}:
                    </span>
                    {' '}
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{msg.content}</span>
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '10px 12px', flexShrink: 0,
        borderTop: '2.5px solid var(--line)',
        background: 'var(--surface)',
      }}>
        {isDrawing ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            ✏️ You are drawing — others are guessing
          </p>
        ) : isInputLocked ? (
          <p style={{ fontSize: '12px', color: 'var(--green)', textAlign: 'center', margin: 0, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
            ✅ You guessed the word — chat locked until next round
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your guess…"
                style={{
                  fontSize: '13px', padding: '9px 12px',
                  borderRadius: '12px', flex: 1,
                  background: 'var(--surface-2)',
                  border: '2px solid var(--line)',
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
                disabled={isInputLocked}
              />
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                disabled={isInputLocked || !input.trim()}
                style={{
                  flexShrink: 0,
                  width: '40px', height: '40px',
                  borderRadius: '12px',
                  background: !isInputLocked && input.trim() ? 'var(--yellow)' : 'var(--surface-2)',
                  border: '2px solid var(--line)',
                  boxShadow: !isInputLocked && input.trim() ? '2.5px 2.5px 0 var(--shadow)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#141414',
                  cursor: !isInputLocked && input.trim() ? 'pointer' : 'not-allowed',
                  opacity: !isInputLocked && input.trim() ? 1 : 0.5,
                  fontSize: '18px',
                  fontWeight: 900,
                }}
              >
                ↑
              </motion.button>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '5px', marginBottom: 0, fontWeight: 600 }}>
              Enter to send your guess
            </p>
          </>
        )}
      </div>
    </div>
  )
}
