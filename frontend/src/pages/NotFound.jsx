import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 text-center relative bg-[#FFF8E7]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white border-[3px] border-[#171717] shadow-[6px_6px_0px_#171717] sm:shadow-[8px_8px_0px_#171717] p-6 sm:p-8 flex flex-col items-center gap-4 sm:gap-5"
      >
        <div className="flex items-center gap-2">
          <span className="neo-badge neo-badge-coral text-xs">ERROR 404</span>
          <span className="neo-badge neo-badge-lavender text-xs">BLANK CANVAS</span>
        </div>

        <div className="text-6xl animate-bounce">
          🎨
        </div>

        <div>
          <h1
            className="text-7xl font-black tracking-tight uppercase"
            style={{ fontFamily: "'Archivo Black', sans-serif" }}
          >
            404
          </h1>
          <h2 className="text-lg font-black uppercase mt-1 text-[#171717]">
            CANVAS DOES NOT EXIST!
          </h2>
          <p className="text-xs font-semibold text-[#454545] mt-2 leading-relaxed">
            This room code or link vanished into thin air. Return to the main lobby and join an active match!
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="neo-btn neo-btn-primary w-full"
        >
          🏠 RETURN TO LOBBY
        </button>
      </motion.div>
    </div>
  )
}
