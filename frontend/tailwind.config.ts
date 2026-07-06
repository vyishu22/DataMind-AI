import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F8E8FF',
          100: '#F1D4FF',
          200: '#E8B4FF',
          300: '#D88AFF',
          400: '#C95EFF',
          500: '#A800FF',
          600: '#8B00D6',
          700: '#6F00AD',
          800: '#540084',
          900: '#32004D',
        },
        accent: {
          pink:    '#FF2D7A',
          magenta: '#D81B60',
          violet:  '#A855F7',
          purple:  '#7C3AED',
        },
        surface: {
          950: '#08040F',
          900: '#100018',
          800: '#180025',
          700: '#220033',
          600: '#2D0045',
          500: '#3B005A',
          400: '#4A0070',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow-sm':  '0 0 12px rgba(168,0,255,0.25)',
        'glow':     '0 0 24px rgba(168,0,255,0.35)',
        'glow-lg':  '0 0 40px rgba(168,0,255,0.45)',
        'glow-pink':'0 0 20px rgba(255,45,122,0.3)',
        'glass':    '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      animation: {
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':     'fadeIn 0.35s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'glow-pulse':  'glowPulse 2.5s ease-in-out infinite alternate',
        'float':       'float 4s ease-in-out infinite',
        'shine':       'shine 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                      to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        glowPulse: {
          from: { boxShadow: '0 0 10px rgba(168,0,255,0.3)' },
          to:   { boxShadow: '0 0 30px rgba(168,0,255,0.7), 0 0 60px rgba(255,45,122,0.2)' },
        },
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-8px)' },
        },
        shine: {
          from: { transform: 'translateX(-100%)' },
          to:   { transform: 'translateX(100%)' },
        },
      },
      backgroundImage: {
        'app-bg': `
          radial-gradient(circle at top left,  rgba(255,45,122,0.35),  transparent 30%),
          radial-gradient(circle at top,       rgba(168,0,255,0.45),   transparent 40%),
          radial-gradient(circle at bottom right, rgba(91,15,168,0.35),transparent 40%),
          linear-gradient(135deg,#08040F,#14001F,#210029)
        `,
        'btn-primary':  'linear-gradient(135deg,#7B2FF7,#F107A3)',
        'btn-hover':    'linear-gradient(135deg,#9040FF,#FF1DB5)',
        'card-shine':   'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)',
        'scrollbar-thumb': 'linear-gradient(to bottom,#A800FF,#FF2D7A)',
      },
    },
  },
  plugins: [],
} satisfies Config
