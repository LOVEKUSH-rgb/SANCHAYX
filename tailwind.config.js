/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Approved Premium Light-Theme Design Tokens
        bg: {
          main: '#F8FAF8',
        },
        surface: {
          card: '#FFFFFF',
          secondary: '#FAFAFC',
        },
        forest: {
          DEFAULT: '#176B50',
          hover: '#125540',
          50: '#E7F1EB',
          100: '#D5E4DC',
          600: '#176B50',
          700: '#125540',
        },
        sage: {
          DEFAULT: '#E7F1EB',
          border: '#D5E4DC',
          50: '#F4F8F5',
          100: '#E7F1EB',
          200: '#D5E4DC',
        },
        primary: {
          DEFAULT: '#202B26',
          text: '#202B26',
        },
        secondary: {
          DEFAULT: '#66736C',
          text: '#66736C',
        },
        subtle: {
          border: '#E7ECE8',
        },
        warning: {
          bg: '#FFFBEB',
          border: '#FDE68A',
          text: '#92400E',
        },
        success: {
          bg: '#ECFDF5',
          text: '#065F46',
        },

        // Sanchay System Colors (Extended with new design tokens & preserved for backwards compatibility)
        sanchay: {
          // Direct aliases for new premium tokens
          forest: '#176B50',
          'forest-hover': '#125540',
          sage: '#E7F1EB',
          'sage-border': '#D5E4DC',
          text: '#202B26',
          'text-secondary': '#66736C',
          border: '#E7ECE8',
          'bg-main': '#F8FAF8',
          'surface-card': '#FFFFFF',
          'surface-secondary': '#FAFAFC',

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
        sans: ['"Plus Jakarta Sans"', 'Inter', '"Noto Sans Devanagari"', '"Noto Sans Bengali"', '"Noto Sans Telugu"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'fintech-sm': '0.5rem',    // 8px
        'fintech': '0.75rem',       // 12px
        'fintech-lg': '1rem',        // 16px
        'fintech-xl': '1.5rem',      // 24px
      },
      boxShadow: {
        'card': '0 2px 12px -2px rgba(32, 43, 38, 0.06), 0 1px 3px 0 rgba(32, 43, 38, 0.04)',
        'card-hover': '0 8px 24px -4px rgba(32, 43, 38, 0.10), 0 2px 6px -1px rgba(32, 43, 38, 0.04)',
        'floating': '0 12px 32px -4px rgba(32, 43, 38, 0.12), 0 4px 12px -2px rgba(32, 43, 38, 0.06)',
        'gold-glow': '0 0 25px rgba(217, 119, 6, 0.2)',
        'emerald-glow': '0 0 25px rgba(23, 107, 80, 0.2)',
        'editorial': '0 20px 48px -12px rgba(32, 43, 38, 0.10)',
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
