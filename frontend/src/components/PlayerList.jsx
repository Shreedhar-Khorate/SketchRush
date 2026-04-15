import { motion } from 'framer-motion'

const MOCK_PLAYERS = [
  { id: 1, name: 'You', avatar: '🦊', score: 450, isCurrentPlayer: true, isDrawing: false },
  { id: 2, name: 'Alice', avatar: '🐱', score: 380, isCurrentPlayer: false, isDrawing: true },
  { id: 3, name: 'Bob', avatar: '🐉', score: 320, isCurrentPlayer: false, isDrawing: false },
  { id: 4, name: 'Carlos', avatar: '🤖', score: 280, isCurrentPlayer: false, isDrawing: false },
]

export default function PlayerList({ currentPlayer = 'You', currentAvatar = '🦊' }) {
  const sortedPlayers = [...MOCK_PLAYERS].sort((a, b) => b.score - a.score)

  return (
    <div className="w-full h-full glass-panel p-4 flex flex-col gap-3 overflow-y-auto">
      <h2 className="text-sm font-bold text-foreground mb-2">Players</h2>

      {sortedPlayers.map((player, index) => (
        <motion.div
          key={player.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
            player.isDrawing
              ? 'bg-primary/20 border border-primary neon-glow-blue'
              : player.isCurrentPlayer
              ? 'bg-card border border-border'
              : 'bg-card/50 border border-border'
          }`}
        >
          {/* Avatar */}
          <div className="text-2xl">{player.avatar}</div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {player.name}
              {player.isCurrentPlayer && (
                <span className="text-xs text-muted-foreground ml-1">(you)</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{player.score} pts</p>
          </div>

          {/* Badges */}
          <div className="flex gap-2 items-center">
            {index === 0 && <span className="text-lg">👑</span>}
            {player.isDrawing && (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-lg"
              >
                ✏️
              </motion.span>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
