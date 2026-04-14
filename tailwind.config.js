/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        surface: {
          0: '#030712',
          1: '#0a0f1e',
          2: '#0f172a',
          3: '#1e293b',
        },
        purple: {
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7c3aed',
        },
        violet: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-glow': 'linear-gradient(135deg, #7c3aed, #4f46e5)',
        'gradient-purple-blue': 'linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)',
      },
      boxShadow: {
        'glow-sm': '0 0 12px rgba(139, 92, 246, 0.2)',
        'glow': '0 0 24px rgba(139, 92, 246, 0.25)',
        'glow-lg': '0 0 48px rgba(139, 92, 246, 0.3)',
        'card': '0 4px 24px rgba(0,0,0,0.4), 0 1px 0 rgba(255,255,255,0.04) inset',
        'card-hover': '0 8px 40px rgba(0,0,0,0.5), 0 0 30px rgba(139,92,246,0.12)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
