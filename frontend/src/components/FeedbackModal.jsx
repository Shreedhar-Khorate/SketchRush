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

function QuestionCard({ label, rating, onChange, required = false }) {
  const [hovered, setHovered] = useState(null)
  const emojis = ['😠', '😟', '😐', '🙂', '😍']
  const ratingText = ['Bad', 'Poor', 'Average', 'Good', 'Excellent']
  const activeStar = hovered !== null ? hovered : rating

  return (
    <div className={`p-4 bg-white border-2 border-[#171717] flex flex-col gap-3 transition-all ${
      rating > 0 ? 'shadow-[4px_4px_0px_#171717] bg-[#FFF8E7]' : 'shadow-[2px_2px_0px_#171717]'
    }`}>
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs sm:text-sm font-black uppercase text-[#171717] leading-snug">
          {label} {required && <span className="text-[#FF6B6B]">*</span>}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {/* Star row */}
        <div className="flex gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => {
            const starVal = i + 1
            const isFilled = activeStar >= starVal && rating !== 0

            return (
              <motion.button
                key={i}
                type="button"
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onMouseEnter={() => setHovered(starVal)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onChange(starVal)}
                className="cursor-pointer bg-transparent border-none p-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill={isFilled ? '#FFD84D' : '#FFFFFF'}
                  stroke="#171717"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-7 h-7 sm:w-8 sm:h-8 transition-colors drop-shadow-[1px_1px_0px_#171717]"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </motion.button>
            )
          })}
        </div>

        {/* Dynamic reaction indicator */}
        {activeStar > 0 && rating !== 0 && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white border border-[#171717] shadow-[1px_1px_0px_#171717]">
            <span className="text-base">{emojis[activeStar - 1]}</span>
            <span className="text-[11px] font-black uppercase text-[#171717]">
              {ratingText[activeStar - 1]}
            </span>
          </div>
        )}
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

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setOverallRating(0)
      setUiRating(0)
      setGestureRating(0)
      setSyncRating(0)
      setComments('')
      setSubmitting(false)
      setSuccess(false)
      setErrorMsg('')
    }
  }, [isOpen])

  if (!isOpen) return null

  const handleNext = () => {
    setErrorMsg('')
    if (step === 1 && (overallRating === 0 || uiRating === 0)) {
      setErrorMsg('Please select a rating for both questions!')
      return
    }
    if (step === 2 && (gestureRating === 0 || syncRating === 0)) {
      setErrorMsg('Please select a rating for both questions!')
      return
    }
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setErrorMsg('')
    setStep(s => s - 1)
  }

  const handleClose = () => {
    onClose?.()
  }

  const handleSubmit = async () => {
    setErrorMsg('')
    setSubmitting(true)

    try {
      const payload = {
        overallRating,
        uiRating,
        gestureRating,
        syncRating,
        comments: comments.trim() || 'No additional comments provided.',
        submittedAt: new Date().toISOString(),
      }

      const res = await fetch('https://formspree.io/f/mqaeveqe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        setErrorMsg('Submission failed. Please try again.')
      }
    } catch {
      setErrorMsg('Network error. Please try again!')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
        
        {/* Backdrop click */}
        <div className="absolute inset-0" onClick={handleClose} />

        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm sm:max-w-lg max-h-[92dvh] overflow-y-auto bg-white border-[3px] border-[#171717] shadow-[6px_6px_0px_#171717] sm:shadow-[8px_8px_0px_#171717] relative z-10 flex flex-col"
        >
          {/* Header */}
          <div className="bg-[#FFD84D] border-b-[2.5px] border-[#171717] px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl">💬</span>
              <h2 className="font-black text-xs sm:text-base uppercase text-[#171717]">
                FEEDBACK & SUGGESTIONS
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="w-7 h-7 bg-white border-2 border-[#171717] shadow-[2px_2px_0px_#171717] font-black text-xs flex items-center justify-center cursor-pointer hover:bg-[#FF6B6B] hover:text-white transition-all"
            >
              ✕
            </button>
          </div>

          <div className="p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
            {!success ? (
              <>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-white border-2 border-[#171717] overflow-hidden">
                  <div
                    className="h-full bg-[#B7F56A] border-r-2 border-[#171717] transition-all duration-300"
                    style={{ width: `${(step / 3) * 100}%` }}
                  />
                </div>

                <div className="text-[11px] font-black uppercase text-[#6B7280]">
                  STEP {step} OF 3
                </div>

                {/* Steps Content */}
                <div className="min-h-[220px]">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col gap-3"
                      >
                        <QuestionCard
                          label="1. How fun and engaging was the multiplayer drawing?"
                          rating={overallRating}
                          onChange={setOverallRating}
                          required
                          isMobile={isMobile}
                        />
                        <QuestionCard
                          label="2. Was the Neo-Brutalist interface clean and easy to navigate?"
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
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col gap-3"
                      >
                        <QuestionCard
                          label="3. How accurate was the Air Canvas webcam gesture drawing?"
                          rating={gestureRating}
                          onChange={setGestureRating}
                          required
                          isMobile={isMobile}
                        />
                        <QuestionCard
                          label="4. Were drawings and guesses synchronized with zero lag?"
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
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="flex flex-col gap-3"
                      >
                        <div className="p-4 bg-[#FFF8E7] border-2 border-[#171717] shadow-[2px_2px_0px_#171717] flex flex-col gap-2">
                          <label className="text-xs font-black uppercase text-[#171717]">
                            Any ideas, bug reports, or feature requests?
                          </label>
                          <textarea
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            placeholder="Tell us what you loved, what could be faster, or ideas for new game modes..."
                            rows={4}
                            className="w-full p-3 bg-white border-2 border-[#171717] font-medium text-xs text-[#171717] outline-none shadow-[2px_2px_0px_#171717] resize-none"
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                  <div className="p-2.5 bg-[#FFE5E5] border-2 border-[#171717] text-xs font-black text-[#FF0033] uppercase flex items-center gap-2">
                    <span>⚠️</span>
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Controls */}
                <div className="flex gap-3 pt-3 border-t-2 border-[#171717]">
                  <button
                    type="button"
                    onClick={step === 1 ? handleClose : handleBack}
                    className="flex-1 neo-btn neo-btn-sm neo-btn-white"
                  >
                    {step === 1 ? 'CANCEL' : '← BACK'}
                  </button>
                  <button
                    type="button"
                    onClick={step === 3 ? handleSubmit : handleNext}
                    disabled={submitting}
                    className="flex-1 neo-btn neo-btn-sm neo-btn-primary"
                  >
                    {submitting ? 'SENDING...' : step === 3 ? 'SUBMIT FEEDBACK 🚀' : 'NEXT STEP →'}
                  </button>
                </div>
              </>
            ) : (
              /* Success confirmation */
              <div className="p-6 bg-[#B7F56A] border-2 border-[#171717] shadow-[4px_4px_0px_#171717] flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 bg-white border-2 border-[#171717] flex items-center justify-center text-2xl font-black">
                  ✓
                </div>
                <h3 className="font-black text-lg uppercase text-[#171717]">
                  FEEDBACK RECEIVED!
                </h3>
                <p className="text-xs font-bold text-[#171717] max-w-sm">
                  Thank you for helping make SketchRush faster, smoother, and more fun!
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="neo-btn neo-btn-sm neo-btn-white mt-2"
                >
                  RETURN TO GAME
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
