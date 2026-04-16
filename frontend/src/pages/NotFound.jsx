import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center relative">

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 space-y-6"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, -3, 0] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          className="text-8xl"
        >
          🎨
        </motion.div>

        <div>
          <h1
            className="text-8xl font-black"
            style={{
              fontFamily: "'Inter', sans-serif",
              color: 'var(--text)',
            }}
          >
            404
          </h1>
          <p className="text-xl font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
            Page Not Found
          </p>
          <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
            Looks like this canvas is empty. Let's go back to where the fun is!
          </p>
        </div>

        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary px-8 py-3 text-base"
        >
          🏠 Back to Home
        </motion.button>
      </motion.div>
    </div>
  )
}
