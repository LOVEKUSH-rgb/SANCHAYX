/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sanchay: {
          navy: {
            950: '#060B19',
            900: '#0B132B',
            850: '#111C3A',
            800: '#1C2541',
            700: '#2A365B',
          },
          emerald: {
            800: '#065F46',
            700: '#047857',
            600: '#059669',
            500: '#10B981',
            100: '#D1FAE5',
            50: '#ECFDF5',
          },
          gold: {
            700: '#B45309',
            600: '#D97706',
            500: '#F59E0B',
            100: '#FEF3C7',
            50: '#FFFBEB',
          },
          ivory: '#FAF9F5',
          beige: '#F8F6F0',
          paper: '#FAFAFC',
          card: '#FFFFFF',
          light: '#FAF9F5',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Noto Serif Devanagari"', '"Noto Serif Bengali"', '"Noto Serif Telugu"', 'Georgia', 'Cambria', 'serif'],
        display: ['"Playfair Display"', '"Noto Serif Devanagari"', '"Noto Serif Bengali"', '"Noto Serif Telugu"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', '"Noto Sans Telugu"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px -2px rgba(6, 11, 25, 0.05), 0 2px 6px -1px rgba(6, 11, 25, 0.03)',
        'card-hover': '0 20px 45px -10px rgba(6, 11, 25, 0.12), 0 6px 16px -4px rgba(6, 11, 25, 0.06)',
        'floating': '0 30px 60px -12px rgba(6, 11, 25, 0.22), 0 0 40px rgba(5, 150, 105, 0.08)',
        'gold-glow': '0 0 25px rgba(217, 119, 6, 0.3)',
        'emerald-glow': '0 0 25px rgba(5, 150, 105, 0.35)',
        'editorial': '0 25px 60px -15px rgba(6, 11, 25, 0.16)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-subtle': 'pulseSubtle 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
  },
  plugins: [],
}
