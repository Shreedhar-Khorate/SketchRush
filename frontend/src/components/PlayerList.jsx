import { motion, AnimatePresence } from 'framer-motion'

const RANK_ICONS  = ['👑', '🥈', '🥉']
const RANK_COLORS = ['#ffd166', '#c0c0c0', '#cd7f32']

export default function PlayerList({ players = [], currentPlayerId = null, hostId = null }) {
  const safePlayers = Array.isArray(players) ? players.filter(Boolean) : []
  const sorted = [...safePlayers].sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
  const maxScore = sorted[0]?.score || 1

  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: '20px', overflow: 'hidden',
        background: 'var(--surface)',
        border: '3px solid var(--line)',
        boxShadow: '5px 5px 0 var(--shadow)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px', flexShrink: 0,
        borderBottom: '2.5px solid var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--surface)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '15px' }}>👥</span>
          <span style={{
            fontSize: '15px', fontWeight: 700,
            color: 'var(--text)', fontFamily: 'var(--font-display)',
          }}>
            Players
          </span>
        </div>
        <span className="badge badge-brand">{players.length}/8</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: 0 }}>
        <AnimatePresence>
          {sorted.map((player, index) => {
            const isMe       = player.id === currentPlayerId
            const isHost     = hostId && player.id === hostId
            const isTop      = index === 0 && player.score > 0
            const scoreRatio = player.score / maxScore

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
                style={{
                  position: 'relative',
                  borderRadius: '14px',
                  overflow: 'hidden',
                  background: player.is_drawing
                    ? 'var(--lime)'
                    : isMe
                    ? 'var(--peach)'
                    : 'var(--surface-2)',
                  border: '2px solid var(--line)',
                  boxShadow: '2.5px 2.5px 0 var(--shadow)',
                }}
              >
                {/* Score bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  height: '3px',
                  width: `${scoreRatio * 100}%`,
                  background: 'var(--line)',
                  opacity: 0.5,
                  transition: 'width 0.7s ease',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  {/* Rank */}
                  <span style={{
                    width: '20px', textAlign: 'center', flexShrink: 0,
                    fontSize: index < 3 ? '16px' : '12px',
                    fontWeight: 800,
                    color: index < 3 ? 'var(--text)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-display)',
                  }}>
                    {index < 3 ? RANK_ICONS[index] : `#${index+1}`}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    position: 'relative', width: '38px', height: '38px',
                    borderRadius: '10px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                    background: 'var(--surface)',
                    border: '2px solid var(--line)',
                    boxShadow: '1.5px 1.5px 0 var(--shadow)',
                  }}>
                    {player.avatar || '🙂'}
                    {player.is_drawing && (
                      <motion.div
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '18px', height: '18px', borderRadius: '50%',
                          background: 'var(--yellow)',
                          border: '1.5px solid var(--line)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px',
                          boxShadow: '1px 1px 0 var(--shadow)',
                        }}
                      >✏</motion.div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 700,
                        color: 'var(--text)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {player.name || 'Player'}
                      </span>
                      {isHost && (
                        <span
                          style={{
                            fontSize: '10px', padding: '1px 6px',
                            background: 'var(--yellow)', color: '#141414',
                            border: '1.5px solid var(--line)', borderRadius: '999px',
                            fontWeight: 700,
                          }}
                        >
                          👑 host
                        </span>
                      )}
                      {isMe && (
                        <span
                          style={{
                            fontSize: '10px', padding: '1px 6px',
                            background: 'var(--sky)', color: '#141414',
                            border: '1.5px solid var(--line)', borderRadius: '999px',
                            fontWeight: 700,
                          }}
                        >
                          you
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-display)' }}>
                      <span style={{ color: isTop ? 'var(--orange)' : 'var(--text)' }}>
                        {(player.score ?? 0).toLocaleString()}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}> pts</span>
                    </span>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {players.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px', marginTop: '16px', fontWeight: 500 }}>
            Waiting for players to join…
          </div>
        )}
      </div>
    </div>
  )
}
