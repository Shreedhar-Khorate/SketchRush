import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth < 480 : false)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 480)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function QuestionCard({ label, rating, onChange, required = false, isMobile }) {
  const [hovered, setHovered] = useState(null)
  
  // Custom reaction emojis for each rating level
  const emojis = ['😠', '😟', '😐', '🙂', '😍']
  const ratingText = ['Bad', 'Poor', 'Average', 'Good', 'Excellent']

  const activeStar = hovered !== null ? hovered : rating

  return (
    <div style={{
      background: 'var(--surface-2)',
      border: '2px solid var(--line)',
      borderRadius: '14px',
      padding: isMobile ? '14px' : '18px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.2s ease',
      boxShadow: rating > 0 ? '3px 3px 0 var(--shadow)' : '2px 2px 0 var(--shadow)',
      borderLeft: rating > 0 ? '5px solid var(--line)' : '2px solid var(--line)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
        <span style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
          {label} {required && <span style={{ color: 'var(--amber)', fontSize: '12px' }}>*</span>}
        </span>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: isMobile ? '8px' : '10px',
        marginTop: '4px',
      }}>
        {/* Star row */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {Array.from({ length: 5 }).map((_, i) => {
            const starVal = i + 1
            const isFilled = activeStar >= starVal && rating !== 0
            
            return (
              <motion.div
                key={i}
                whileHover={{ scale: 1.25 }}
                whileTap={{ scale: 0.88 }}
                onMouseEnter={() => setHovered(starVal)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onChange(starVal)}
                style={{ cursor: 'pointer' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isFilled ? 'var(--amber)' : 'none'}
                  stroke={isFilled ? 'var(--amber)' : 'var(--text-muted)'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    width: isMobile ? '24px' : '28px',
                    height: isMobile ? '24px' : '28px',
                    transition: 'fill 0.15s, stroke 0.15s',
                    filter: isFilled ? 'drop-shadow(0 0 6px rgba(240,165,0,0.45))' : 'none',
                  }}
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </motion.div>
            )
          })}
        </div>

        {/* Dynamic reaction emoji display */}
        <AnimatePresence mode="wait">
          {activeStar > 0 && rating !== 0 ? (
            <motion.div
              key={activeStar}
              initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.6, rotate: 20, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginLeft: isMobile ? '0' : '8px',
                padding: '2px 8px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
              }}
            >
              <span style={{ fontSize: '13px' }}>{emojis[activeStar - 1]}</span>
              <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--amber)' }}>
                {ratingText[activeStar - 1]}
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default function FeedbackModal({ isOpen, onClose }) {
  const isMobile = useIsMobile()
  const [step, setStep] = useState(1)
  const [overallRating, setOverallRating] = useState(0)
  const [uiRating, setUiRating] = useState(0)
  const [gestureRating, setGestureRating] = useState(0)
  const [syncRating, setSyncRating] = useState(0)
  const [comments, setComments] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  if (!isOpen) return null

  const handleReset = () => {
    setStep(1)
    setOverallRating(0)
    setUiRating(0)
    setGestureRating(0)
    setSyncRating(0)
    setComments('')
    setErrorMsg('')
    setSuccess(false)
    setSubmitting(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  // Reactive state to disable "Next" / "Submit" button
  const isNextDisabled = step === 1
    ? (overallRating === 0 || uiRating === 0)
    : step === 2
    ? (gestureRating === 0 || syncRating === 0)
    : false

  const handleNext = () => {
    if (!isNextDisabled) {
      setStep(prev => Math.min(prev + 1, 3))
    }
  }

  const handleBack = () => {
    setErrorMsg('')
    setStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (isNextDisabled) return

    setSubmitting(true)
    setErrorMsg('')

    try {
      const response = await fetch('https://formspree.io/f/meebnkrj', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          "Game Fun Rating": `${overallRating} / 5`,
          "Game Visuals Rating": `${uiRating} / 5`,
          "Gesture Drawing Rating": `${gestureRating} / 5`,
          "Connection Smoothness Rating": `${syncRating} / 5`,
          "Written Comments": comments.trim() || 'No written comments',
        }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const data = await response.json()
        if (data && data.errors) {
          setErrorMsg(data.errors.map(err => err.message).join(', '))
        } else {
          setErrorMsg('Oops! I couldn\'t send your feedback. Please try again.')
        }
      }
    } catch (err) {
      console.error('[FeedbackModal] Error submitting to Formspree:', err)
      setErrorMsg('Network error. Please check your connection and try again!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(20,20,20,0.65)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: isMobile ? '12px' : '20px',
        backdropFilter: 'blur(3px)',
        WebkitBackdropFilter: 'blur(3px)',
      }}>
        {/* Backdrop closer click */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1 }} onClick={handleClose} />

        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'var(--surface)',
            border: '3px solid var(--line)',
            borderRadius: '20px',
            padding: isMobile ? '20px' : '32px',
            maxWidth: '480px',
            width: '100%',
            position: 'relative',
            zIndex: 2,
            boxShadow: '8px 8px 0 var(--shadow)',
            maxHeight: '92vh',
            overflowY: 'auto',
            fontFamily: 'var(--font-body)',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '24px', paddingRight: '24px', position: 'relative' }}>
            <h2 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, margin: 0, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'var(--font-heading)' }}>
              ⚡ Share Your Thoughts
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, marginTop: '6px', marginBottom: 0, lineHeight: 1.5 }}>
              All ratings are required. Help make SketchRush even better!
            </p>

            {/* Close button */}
            <button
              onClick={handleClose}
              title="Close window"
              style={{
                position: 'absolute',
                top: isMobile ? '-4px' : '-10px',
                right: isMobile ? '-12px' : '-10px',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '2px solid var(--line)',
                boxShadow: '2px 2px 0 var(--shadow)',
                color: 'var(--text)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--yellow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--surface-2)'
              }}
            >
              ✕
            </button>
          </div>

          {!success ? (
            <div>
              {/* Clean, slim progress line instead of 1-2-3 nodes */}
              <div style={{ height: '3px', background: 'rgba(255,255,255,0.06)', borderRadius: '99px', marginBottom: '24px', overflow: 'hidden' }}>
                <motion.div
                  initial={{ width: '33.3%' }}
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.25 }}
                  style={{ height: '100%', background: 'var(--amber)', borderRadius: '99px' }}
                />
              </div>

              {/* Wizard Content */}
              <div style={{ minHeight: isMobile ? '220px' : '260px', marginBottom: '24px' }}>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                      <QuestionCard
                        label="Did you find the game fun and exciting to play?"
                        rating={overallRating}
                        onChange={setOverallRating}
                        required
                        isMobile={isMobile}
                      />
                      <QuestionCard
                        label="Was the game interface easy to understand, navigate, and look at?"
                        rating={uiRating}
                        onChange={setUiRating}
                        required
                        isMobile={isMobile}
                      />
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                      <QuestionCard
                        label="If you tried drawing in the air with your camera (hand gestures), how well did it track your finger movements?"
                        rating={gestureRating}
                        onChange={setGestureRating}
                        required
                        isMobile={isMobile}
                      />
                      <QuestionCard
                        label="Did drawings and text chat show up smoothly and without delay?"
                        rating={syncRating}
                        onChange={setSyncRating}
                        required
                        isMobile={isMobile}
                      />
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ x: 20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -20, opacity: 0 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                      style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
                    >
                      <div style={{
                        background: 'var(--surface-raised)',
                        border: '1px solid var(--border)',
                        borderRadius: '14px',
                        padding: isMobile ? '14px' : '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        textAlign: 'left',
                      }}>
                        <label htmlFor="comments-textarea" style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.4 }}>
                          Any ideas, suggestions, or bugs you'd like me to know about?
                        </label>
                        <textarea
                          id="comments-textarea"
                          value={comments}
                          onChange={(e) => setComments(e.target.value)}
                          placeholder="Tell us what you liked, what frustrated you, or any suggestions you have..."
                          rows={isMobile ? 4 : 6}
                          style={{
                            width: '100%',
                            background: 'rgba(6,9,24,0.4)',
                            border: '1px solid var(--border)',
                            borderRadius: '10px',
                            padding: '12px',
                            color: 'var(--text)',
                            fontSize: '13px',
                            lineHeight: 1.5,
                            resize: 'none',
                            outline: 'none',
                            fontFamily: 'inherit',
                            transition: 'border-color 0.18s ease',
                          }}
                          onFocus={(e) => e.target.style.borderColor = 'var(--amber)'}
                          onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Error messages */}
              <AnimatePresence>
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    style={{
                      padding: '10px 14px', borderRadius: '12px',
                      background: 'var(--red-bg)', border: '1px solid rgba(248,81,73,0.3)',
                      color: 'var(--red)', fontSize: '12px', textAlign: 'left',
                      display: 'flex', alignItems: 'center', gap: '8px',
                      marginBottom: '20px',
                    }}
                  >
                    <span>⚠️</span>
                    <span style={{ fontWeight: 600 }}>{errorMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation controls */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={step === 1 ? handleClose : handleBack}
                  style={{
                    flex: 1,
                    padding: '10px 16px', borderRadius: '12px',
                    background: 'var(--surface-raised)', border: '1px solid var(--border)',
                    color: 'var(--text-muted)', fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => e.target.style.color = 'var(--text)'}
                  onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}
                >
                  {step === 1 ? 'Close' : '← Back'}
                </button>

                <button
                  type={step === 3 ? 'submit' : 'button'}
                  onClick={step === 3 ? handleSubmit : handleNext}
                  disabled={isNextDisabled || submitting}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    margin: 0,
                    width: 'auto',
                    opacity: (isNextDisabled || submitting) ? 0.35 : 1,
                    cursor: (isNextDisabled || submitting) ? 'not-allowed' : 'pointer',
                    boxShadow: (isNextDisabled) ? 'none' : '0 4px 14px rgba(249,115,22,0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {step === 3 ? (submitting ? 'Sending...' : 'Submit 🚀') : 'Next →'}
                </button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', padding: '32px 12px 12px', gap: '20px',
              }}
            >
              <div style={{
                width: '72px', height: '72px', borderRadius: '50%',
                background: 'var(--green-bg)', border: '2px solid var(--green)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '32px', color: 'var(--green)',
                boxShadow: '0 0 20px rgba(34,197,94,0.2)',
              }}>
                ✓
              </div>
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)', marginBottom: '8px' }}>
                  Awesome, Thank You!
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
                  I received your feedback! Your thoughts will directly help make SketchRush better for everyone.
                </p>
              </div>
              <div style={{ width: '100%' }}>
                <button
                  onClick={handleClose}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px 28px',
                    fontSize: '13px',
                    borderRadius: '12px',
                    marginTop: '8px',
                  }}
                >
                  Return to Game
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
