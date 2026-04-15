import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-background via-slate-900 to-slate-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold neon-text-blue mb-4">404</h1>
        <p className="text-2xl text-foreground mb-2">Page Not Found</p>
        <p className="text-muted-foreground mb-8">The page you're looking for doesn't exist.</p>
        
        <motion.button
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 rounded-lg bg-primary text-white font-medium hover:bg-blue-600 transition-colors neon-glow-blue"
        >
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  )
}
