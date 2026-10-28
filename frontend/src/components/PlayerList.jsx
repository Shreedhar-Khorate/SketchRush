import { motion, AnimatePresence } from 'framer-motion'

const RANK_BADGES = [
  { rank: '1ST', icon: '👑', color: '#FFD84D' },
  { rank: '2ND', icon: '🥈', color: '#FFFFFF' },
  { rank: '3RD', icon: '🥉', color: '#FF9F43' },
]

export default function PlayerList({ players = [], currentPlayerId = null, hostId = null }) {
  const safePlayers = Array.isArray(players) ? players.filter(Boolean) : []
  const sorted = [...safePlayers].sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
  const maxScore = sorted[0]?.score || 1

  return (
    <div className="w-full h-full flex flex-col bg-white border-[2.5px] border-[#171717] shadow-[4px_4px_0px_#171717] rounded-[4px] overflow-hidden">
      
      {/* Header */}
      <div className="bg-[#FFF8E7] border-b-[2px] border-[#171717] px-3.5 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">👥</span>
          <span className="font-black text-xs uppercase tracking-wide">LEADERBOARD</span>
        </div>
        <span className="neo-badge neo-badge-white text-[10px] py-0.5">
          {players.length}/8 PLAYERS
        </span>
      </div>

      {/* Player List Items */}
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2 min-h-0 bg-[#FFFDF7]">
        <AnimatePresence>
          {sorted.map((player, index) => {
            const isMe   = player.id === currentPlayerId
            const isHost = hostId && player.id === hostId
            const rankMeta = RANK_BADGES[index]
            const scoreRatio = Math.max(player.score / maxScore, 0.05)

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className={`relative border-2 border-[#171717] p-2 sm:p-2.5 flex items-center gap-2.5 sm:gap-3 transition-all overflow-hidden ${
                  player.is_drawing
                    ? 'bg-[#7BA7FF]/25 shadow-[3px_3px_0px_#171717]'
                    : isMe
                    ? 'bg-[#FFD84D]/35 shadow-[2px_2px_0px_#171717]'
                    : 'bg-white shadow-[2px_2px_0px_#171717]'
                }`}
              >
                {/* Score Progress Bar Fill on bottom edge */}
                <div
                  className="absolute bottom-0 left-0 h-1 bg-[#171717] opacity-80"
                  style={{ width: `${scoreRatio * 100}%` }}
                />

                {/* Rank Pill */}
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0 border-2 border-[#171717] shadow-[1px_1px_0px_#171717] flex items-center justify-center font-black text-xs"
                  style={{ backgroundColor: rankMeta ? rankMeta.color : '#FFFFFF' }}
                  title={`Rank #${index + 1}`}
                >
                  {rankMeta ? rankMeta.icon : `#${index + 1}`}
                </div>

                {/* Avatar */}
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded bg-white border-2 border-[#171717] shadow-[1px_1px_0px_#171717] flex items-center justify-center text-lg sm:text-xl flex-shrink-0 relative">
                  <span>{player.avatar || '🦊'}</span>
                  {player.is_drawing && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#7BA7FF] border border-black flex items-center justify-center text-[8px] text-white font-black animate-bounce">
                      ✏️
                    </span>
                  )}
                </div>

                {/* Player Name and Badges */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
                    <span className="font-black text-xs truncate max-w-[90px] sm:max-w-[130px] text-[#171717]">
                      {player.name || 'Player'}
                    </span>
                    {isMe && (
                      <span className="px-1 py-0.2 bg-[#FFD84D] border border-black text-[8px] sm:text-[9px] font-black uppercase">
                        YOU
                      </span>
                    )}
                    {isHost && (
                      <span className="px-1 py-0.2 bg-white border border-black text-[8px] sm:text-[9px] font-black uppercase text-[#6B7280]">
                        HOST
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-[#6B7280] font-semibold">
                    {player.is_drawing ? 'Drawing now' : 'Guessing'}
                  </span>
                </div>

                {/* Score Pill */}
                <div className="px-1.5 sm:px-2 py-0.5 bg-[#FFF8E7] border-2 border-[#171717] font-mono font-black text-xs text-[#171717] flex-shrink-0">
                  {player.score ?? 0} <span className="text-[8px] sm:text-[9px] font-sans font-bold text-[#6B7280]">PTS</span>
                </div>

              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

    </div>
  )
}
