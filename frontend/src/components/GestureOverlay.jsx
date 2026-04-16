/**
 * GestureOverlay — webcam + canvas MJPEG preview for air-canvas mode.
 *
 * Renders as a fixed overlay with a dark backdrop so the canvas behind
 * is properly obscured. Shows the live MJPEG stream from /gesture/feed.
 */
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

const GESTURE_LABELS = {
  draw:  { icon: '✏️', label: 'Drawing', color: 'var(--green)' },
  none:  { icon: '✋', label: 'Ready', color: 'var(--text-muted)' },
}

export default function GestureOverlay({ active = false, gesture = null, onClose = null }) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const imgRef = useRef(null)

  useEffect(() => {
    if (active) {
      setImageError(false)
      setIsLoading(true)
    }
  }, [active])

  // Cleanup MJPEG stream on unmount
  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current.src = ''
      }
    }
  }, [])

  // Stop stream immediately when deactivated
  useEffect(() => {
    if (!active && imgRef.current) {
      imgRef.current.src = ''
    }
  }, [active])

  const info = GESTURE_LABELS[gesture] || GESTURE_LABELS.none

  return (
    <AnimatePresence>
      {active && (
        <>
          {/* Gesture panel — docked corner (non-blocking) */}
          <motion.div
            key="gesture-overlay"
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'fixed',
              right: '16px',
              bottom: '16px',
              width: '360px',
              maxWidth: '90vw',
              zIndex: 32,
              borderRadius: '16px',
              overflow: 'hidden',
              background: 'rgba(6,9,24,0.97)',
              border: '1px solid rgba(99,120,255,0.35)',
              boxShadow: '0 0 30px rgba(99,120,255,0.2), 0 16px 28px rgba(0,0,0,0.6)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '10px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              background: 'rgba(11,15,35,0.7)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>✋</span>
                <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-primary)' }}>
                  Gesture Mode
                </span>
                <span style={{
                  width: '7px', height: '7px', borderRadius: '50%',
                  background: 'var(--green)',
                  boxShadow: '0 0 6px var(--green-glow)',
                  animation: 'pulse 1.5s infinite',
                  display: 'inline-block',
                }} />
              </div>

              {/* Current gesture badge */}
              <AnimatePresence mode="wait">
                {gesture && (
                  <motion.div
                    key={gesture}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px', borderRadius: '99px',
                      background: `${info.color}18`,
                      border: `1px solid ${info.color}44`,
                      fontSize: '12px', fontWeight: 700,
                      color: info.color,
                    }}
                  >
                    <span>{info.icon}</span>
                    <span>{info.label}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {onClose && (
                <button
                  onClick={onClose}
                  title="Stop gesture mode"
                  style={{
                    padding: '4px 10px', borderRadius: '8px',
                    background: 'rgba(255,77,109,0.15)',
                    border: '1px solid rgba(255,77,109,0.35)',
                    color: 'var(--red)',
                    display: 'flex', alignItems: 'center', gap: '5px',
                    fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'background 0.15s ease',
                  }}
                >
                  ✕ Stop
                </button>
              )}
            </div>

            {/* MJPEG webcam feed */}
            <div style={{ position: 'relative', width: '100%', background: '#000', minHeight: '180px' }}>
              {isLoading && !imageError && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(0,0,0,0.85)',
                  color: 'var(--text-muted)', fontSize: '13px',
                  textAlign: 'center', padding: '20px', zIndex: 2,
                }}>
                  <div>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                    <div>Initializing webcam...</div>
                    <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
                      Make sure your webcam is connected
                    </div>
                  </div>
                </div>
              )}

              {imageError && (
                <div style={{
                  width: '100%', minHeight: '240px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(255,77,109,0.08)',
                  color: 'var(--red)', fontSize: '13px',
                  textAlign: 'center', padding: '24px',
                }}>
                  <div>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>❌</div>
                    <div style={{ fontWeight: 700, marginBottom: '10px' }}>Webcam Not Available</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 2 }}>
                      ✓ Check if webcam is connected<br/>
                      ✓ Check browser camera permissions<br/>
                      ✓ Ensure backend is running on {BACKEND_URL}
                    </div>
                  </div>
                </div>
              )}

              <img
                ref={imgRef}
                src={active ? `${BACKEND_URL}/gesture/feed` : ''}
                alt="Gesture webcam feed"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false)
                  setImageError(true)
                  console.error('[GestureOverlay] Failed to load MJPEG feed from', `${BACKEND_URL}/gesture/feed`)
                }}
                style={{
                  width: '100%',
                  display: imageError ? 'none' : 'block',
                  maxHeight: '240px',
                  objectFit: 'contain',
                }}
              />

              {/* Labels on the feed */}
              {!imageError && !isLoading && (
                <div style={{
                  position: 'absolute', bottom: '10px', left: '10px',
                  display: 'flex', gap: '8px',
                }}>
                  <span className="badge badge-brand" style={{ opacity: 0.9 }}>📷 Webcam</span>
                  <span className="badge badge-green" style={{ opacity: 0.9 }}>🖼️ Canvas</span>
                </div>
              )}
            </div>

            {/* Gesture instructions */}
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid var(--border-subtle)',
              background: 'rgba(11,15,35,0.6)',
            }}>
              <div style={{
                fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)',
                marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Quick Guide
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {[
                  { icon: '☝️', label: 'Draw', color: 'var(--green)' },
                  { icon: '✌️', label: 'Pause', color: 'var(--brand-light)' },
                  { icon: '✊', label: 'Clear', color: 'var(--red)' },
                ].map((g) => (
                  <div key={g.label} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '6px 8px', borderRadius: '10px',
                    fontSize: '11px', fontWeight: 700,
                    background: 'rgba(11,15,35,0.7)',
                    border: '1px solid var(--border-subtle)',
                    color: g.color,
                  }}>
                    <span style={{ fontSize: '14px' }}>{g.icon}</span>
                    <span>{g.label}</span>
                  </div>
                ))}
                <div style={{
                  gridColumn: '1 / -1',
                  fontSize: '10px', color: 'var(--text-muted)',
                  textAlign: 'center', paddingTop: '4px',
                }}>
                  You can still use the toolbar while this panel is open.
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
