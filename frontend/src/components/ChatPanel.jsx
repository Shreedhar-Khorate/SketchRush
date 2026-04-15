import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

const MOCK_MESSAGES = [
  { id: 1, type: 'system', content: '🎯 Alice started drawing!' },
  { id: 2, type: 'guess', player: 'Bob', content: 'Correct! It was Cat!', isCorrect: true },
  { id: 3, type: 'message', player: 'Carlos', content: 'Great drawing!' },
  { id: 4, type: 'system', content: '🎯 Next round starting in 3 seconds...' },
]

export default function ChatPanel({ playerName = 'Player1' }) {
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return

    const newMessage = {
      id: messages.length + 1,
      type: 'message',
      player: playerName,
      content: input,
    }

    setMessages([...messages, newMessage])
    setInput('')
  }

  return (
    <div className="w-full h-full glass-panel p-4 flex flex-col gap-3">
      <h2 className="text-sm font-bold text-foreground">Chat</h2>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {messages.map((msg, index) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.type === 'system' ? (
              <div className="text-center py-2 px-2">
                <p className="text-xs neon-text-blue">{msg.content}</p>
              </div>
            ) : msg.type === 'guess' ? (
              <div className="px-2 py-1">
                <p className="text-xs">
                  <span className="font-medium text-primary">{msg.player}</span>
                  <span className="text-secondary ml-1">✅ {msg.content}</span>
                </p>
              </div>
            ) : (
              <div className="px-2 py-1">
                <p className="text-xs">
                  <span className="font-medium text-primary">{msg.player}:</span>
                  <span className="text-foreground ml-1">{msg.content}</span>
                </p>
              </div>
            )}
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 pt-2 border-t border-border">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type guess or message..."
          className="flex-1 px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <motion.button
          onClick={handleSend}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
        >
          Send
        </motion.button>
      </div>
    </div>
  )
}
