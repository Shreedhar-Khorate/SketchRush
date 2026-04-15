/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#060918',
        foreground: '#f0f4ff',
        card: '#111628',
        brand: {
          DEFAULT: '#6378ff',
          light: '#8fa0ff',
          dark: '#3a4fd4',
        },
        green: '#00e5a0',
        orange: '#ff8c42',
        red: '#ff4d6d',
        yellow: '#ffd166',
        purple: '#c77dff',
        cyan: '#00d4ff',
        muted: '#1a2140',
        'muted-fg': '#8892b0',
        border: 'rgba(99,120,255,0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        grotesk: ["'Space Grotesk'", 'sans-serif'],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      animation: {
        'float': 'float 3.5s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.22,1,0.36,1) forwards',
        'neon-pulse': 'neon-pulse 2s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'neon-pulse': {
          '0%,100%': { boxShadow: '0 0 10px rgba(99,120,255,0.4), 0 0 20px rgba(99,120,255,0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(99,120,255,0.6), 0 0 40px rgba(99,120,255,0.2)' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '12px',
        lg: '20px',
        xl: '32px',
      },
    },
  },
  plugins: [],
}