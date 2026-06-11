/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
      },
      colors: {
        brand: {
          navy: '#0F1B2D',
          orange: '#F97316',
          green: '#22C55E',
          red: '#EF4444',
          yellow: '#EAB308',
          card: '#1E293B',
          border: '#334155',
          textPrimary: '#F8FAFC',
          textSecondary: '#94A3B8'
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-border': 'flashBorder 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        flashBorder: {
          '0%, 100%': { borderColor: '#EF4444', boxShadow: '0 0 10px #EF4444' },
          '50%': { borderColor: 'transparent', boxShadow: 'none' },
        }
      }
    },
  },
  plugins: [],
}
