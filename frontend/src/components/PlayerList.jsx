import { motion, AnimatePresence } from 'framer-motion'

const RANK_ICONS  = ['👑', '🥈', '🥉']
const RANK_COLORS = ['#ffd166', '#c0c0c0', '#cd7f32']

export default function PlayerList({ players = [], currentPlayerId = null }) {
  const safePlayers = Array.isArray(players) ? players.filter(Boolean) : []
  const sorted = [...safePlayers].sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0))
  const maxScore = sorted[0]?.score || 1

  return (
    <div
      style={{
        width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
        borderRadius: '16px', overflow: 'hidden',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px', flexShrink: 0,
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '14px' }}>👥</span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Players</span>
        </div>
        <span className="badge badge-brand">{players.length}/8</span>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: 0 }}>
        <AnimatePresence>
          {sorted.map((player, index) => {
            const isMe       = player.id === currentPlayerId
            const isTop      = index === 0 && player.score > 0
            const scoreRatio = player.score / maxScore

            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{  opacity: 0, x: -12 }}
                transition={{ duration: 0.35, ease: [0.22,1,0.36,1], delay: index * 0.05 }}
                style={{
                  position: 'relative',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: player.is_drawing
                    ? 'var(--blue-bg)'
                    : isMe
                    ? 'rgba(47,129,247,0.06)'
                    : 'var(--surface-raised)',
                  border: player.is_drawing
                    ? '1px solid rgba(47,129,247,0.5)'
                    : isMe
                    ? '1px solid rgba(47,129,247,0.2)'
                    : '1px solid var(--border-subtle)',
                }}
              >
                {/* Score bar */}
                <div style={{
                  position: 'absolute', bottom: 0, left: 0,
                  height: '2px',
                  width: `${scoreRatio * 100}%`,
                  background: isTop
                    ? 'var(--amber)'
                    : 'var(--amber)',
                  opacity: 0.7,
                  transition: 'width 0.7s ease',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px' }}>
                  {/* Rank */}
                  <span style={{
                    width: '20px', textAlign: 'center', flexShrink: 0,
                    fontSize: index < 3 ? '16px' : '11px',
                    fontWeight: 800,
                    color: RANK_COLORS[index] || 'var(--text-muted)',
                  }}>
                    {index < 3 ? RANK_ICONS[index] : `#${index+1}`}
                  </span>

                  {/* Avatar */}
                  <div style={{
                    position: 'relative', width: '36px', height: '36px',
                    borderRadius: '10px', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px',
                    background: 'var(--surface)',
                    border: player.is_drawing
                      ? '1.5px solid rgba(47,129,247,0.6)'
                      : '1.5px solid var(--border)',
                  }}>
                    {player.avatar || '🙂'}
                    {player.is_drawing && (
                      <motion.div
                        animate={{ scale: [1, 1.25, 1] }}
                        transition={{ repeat: Infinity, duration: 1 }}
                        style={{
                          position: 'absolute', top: '-6px', right: '-6px',
                          width: '16px', height: '16px', borderRadius: '50%',
                          background: 'var(--blue)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '9px',
                        }}
                      >✏</motion.div>
                    )}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {player.name || 'Player'}
                      </span>
                      {isMe && (
                        <span className="badge badge-brand" style={{ fontSize: '9px', padding: '1px 5px' }}>you</span>
                      )}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>
                      <span style={{ color: isTop ? 'var(--amber)' : 'var(--amber)' }}>
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
          <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px', marginTop: '16px' }}>
            Waiting for players to join…
          </div>
        )}
      </div>
    </div>
  )
}
