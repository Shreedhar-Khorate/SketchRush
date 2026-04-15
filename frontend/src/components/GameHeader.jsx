import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function GameHeader({ roomCode = 'XXXXX', playerCount = 4, maxPlayers = 8 }) {
  const [timeLeft, setTimeLeft] = useState(60)
  const [isTimeWarning, setIsTimeWarning] = useState(false)
  const [isTimeCritical, setIsTimeCritical] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 60 // Reset for demo
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    setIsTimeWarning(timeLeft <= 20)
    setIsTimeCritical(timeLeft <= 10)
  }, [timeLeft])

  const getTimerColor = () => {
    if (isTimeCritical) return 'text-destructive'
    if (isTimeWarning) return 'text-accent'
    return 'text-secondary'
  }

  return (
    <div className="w-full glass-panel p-4 border-b border-border">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold neon-text-blue">⚡ SketchRush</h1>
        </div>

        {/* Center Info */}
        <div className="flex items-center gap-6">
          {/* Room Code */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">#</span>
            <code className="text-lg font-mono font-bold text-primary neon-glow-blue">
              {roomCode}
            </code>
          </div>

          {/* Player Count */}
          <div className="flex items-center gap-2 text-muted-foreground">
            <span>👥</span>
            <span className="text-sm">
              {playerCount}/{maxPlayers}
            </span>
          </div>
        </div>

        {/* Timer */}
        <motion.div
          animate={isTimeCritical ? { scale: [1, 1.1, 1] } : {}}
          transition={{ repeat: Infinity, duration: 0.5 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border ${getTimerColor()}`}
        >
          <span>⏱️</span>
          <span className="text-lg font-bold">{timeLeft}s</span>
        </motion.div>
      </div>
    </div>
  )
}
