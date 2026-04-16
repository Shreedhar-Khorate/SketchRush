/**
 * GestureOverlay — webcam + canvas MJPEG preview for air-canvas mode.
 *
 * Shows when gestureMode is active. Displays the live MJPEG stream
 * from /gesture/feed (webcam left, painted canvas right).
 * Gesture label is shown on top.
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

  // Cleanup MJPEG stream when overlay is closed or unmounted
  useEffect(() => {
    return () => {
      if (imgRef.current) {
        imgRef.current.src = '' // Stop the MJPEG stream
      }
    }
  }, [])

  // Stop stream when active becomes false
  useEffect(() => {
    if (!active && imgRef.current) {
      imgRef.current.src = '' // Immediately stop the stream
    }
  }, [active])

  const info = GESTURE_LABELS[gesture] || GESTURE_LABELS.none

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="gesture-overlay"
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%', maxWidth: '720px',
            zIndex: 50,
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'rgba(6,9,24,0.92)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(99,120,255,0.35)',
            boxShadow: '0 0 60px rgba(99,120,255,0.2), 0 24px 48px rgba(0,0,0,0.6)',
          }}
        >
          {/* Header bar */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '18px' }}>✋</span>
              <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                Air Canvas Drawing
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
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', cursor: 'pointer',
                }}
              >✕</button>
            )}
          </div>

          {/* MJPEG stream */}
          <div style={{ position: 'relative', width: '100%', background: '#000' }}>
            {isLoading && !imageError && (
              <div
                style={{
                  width: '100%',
                  height: '360px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.6)',
                  color: 'var(--text-muted)',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '20px',
                }}
              >
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
              <div
                style={{
                  width: '100%',
                  height: '360px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(255,77,109,0.1)',
                  color: 'var(--red)',
                  fontSize: '13px',
                  textAlign: 'center',
                  padding: '20px',
                  borderTop: '1px solid rgba(255,77,109,0.3)',
                }}
              >
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>❌</div>
                  <div>Webcam Not Available</div>
                  <div style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>
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
                maxHeight: '360px',
                objectFit: 'contain',
              }}
            />

            {/* Overlay labels */}
            {!imageError && (
              <div style={{
                position: 'absolute', bottom: '10px', left: '10px',
                display: 'flex', gap: '8px',
              }}>
                <span className="badge badge-brand" style={{ opacity: 0.85 }}>📷 Webcam</span>
                <span className="badge badge-green" style={{ opacity: 0.85 }}>🖼️ Canvas</span>
              </div>
            )}
          </div>

          {/* Gesture reference */}
          <div style={{
            display: 'flex', gap: '6px', padding: '10px 14px',
            flexWrap: 'wrap',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            {Object.entries(GESTURE_LABELS).filter(([k]) => k !== 'none').map(([key, val]) => (
              <span
                key={key}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                  padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 600,
                  background: `${val.color}12`,
                  border: `1px solid ${val.color}30`,
                  color: val.color,
                }}
              >
                {val.icon} {val.label}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
