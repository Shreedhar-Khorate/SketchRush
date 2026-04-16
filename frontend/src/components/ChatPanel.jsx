import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ChatPanel({ messages = [], playerName = 'Player', onSend = null, isDrawing = false }) {
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
      borderRadius: '16px', overflow: 'hidden',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    }}>
      {/* Header */}
      <div style={{
        padding: '10px 14px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>💬</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isDrawing ? 'Chat' : 'Chat & Guess'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--green)',
            display: 'inline-block',
            animation: 'pulse 2s infinite',
          }} />
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--green)' }}>Live</span>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '5px', minHeight: 0 }}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {msg.type === 'system' ? (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '3px 0' }}>
                  <span style={{
                    fontSize: '11px', padding: '3px 10px', borderRadius: '99px',
                    background: 'var(--amber-bg)',
                    border: '1px solid rgba(240,165,0,0.3)',
                    color: 'var(--amber)',
                  }}>{msg.content}</span>
                </div>
              ) : msg.type === 'correct' ? (
                <motion.div
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.3 }}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: '7px',
                    padding: '8px 10px', borderRadius: '10px',
                    background: 'var(--green-bg)',
                    border: '1px solid rgba(63,185,80,0.3)',
                  }}
                >
                  <span style={{ fontSize: '16px', flexShrink: 0 }}>{msg.avatar}</span>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--green)' }}>
                        ✅ {msg.player}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>guessed correctly!</span>
                      <span className="badge badge-green" style={{ fontSize: '10px', padding: '1px 6px' }}>
                        +{msg.points} pts
                      </span>
                    </div>
                    <p style={{ fontSize: '11px', color: 'var(--green)', marginTop: '2px' }}>
                      "{msg.content}"
                    </p>
                  </div>
                </motion.div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <span style={{ fontSize: '15px', flexShrink: 0, marginTop: '1px' }}>
                    {msg.avatar || '💬'}
                  </span>
                  <p style={{ fontSize: '12px', lineHeight: '1.4', margin: 0 }}>
                    <span style={{ fontWeight: 700, color: 'var(--blue)' }}>
                      {msg.player}:
                    </span>
                    {' '}
                    <span style={{ color: 'var(--text-secondary)' }}>{msg.content}</span>
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
        borderTop: '1px solid var(--border)',
      }}>
        {isDrawing ? (
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
            ✏️ You are drawing — others are guessing
          </p>
        ) : (
          <>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your guess…"
                style={{ fontSize: '13px', padding: '9px 12px', borderRadius: '10px', flex: 1 }}
              />
              <motion.button
                onClick={handleSend}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                disabled={!input.trim()}
                style={{
                  flexShrink: 0,
                  width: '38px', height: '38px',
                  borderRadius: '10px',
                  background: input.trim() ? 'var(--amber)' : 'var(--surface-raised)',
                  border: input.trim() ? '1px solid var(--amber)' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: input.trim() ? 'var(--bg)' : 'var(--text-muted)',
                  cursor: input.trim() ? 'pointer' : 'not-allowed',
                  opacity: input.trim() ? 1 : 0.4,
                  fontSize: '16px',
                }}
              >
                ↑
              </motion.button>
            </div>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '5px', marginBottom: 0 }}>
              Enter to send your guess
            </p>
          </>
        )}
      </div>
    </div>
  )
}
