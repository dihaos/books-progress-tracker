/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', '"Plus Jakarta Sans"', 'Inter', 'serif'],
        serif: ['"Fraunces"', 'Georgia', 'serif']
      },
      colors: {
        ink: {
          50: '#f8f5ef',
          100: '#f1ebde',
          200: '#e0d6c1',
          300: '#c3b596',
          400: '#9a8c6e',
          500: '#6c6149',
          600: '#4d4534',
          700: '#332e23',
          800: '#1f1c15',
          900: '#13110c'
        },
        sand: {
          50: '#fbf8f1',
          100: '#f5ecd9',
          200: '#ebdcb8',
          300: '#dcc28a',
          400: '#c7a35c',
          500: '#ad8540',
          600: '#8a6730',
          700: '#6d5025',
          800: '#503a1b',
          900: '#332512'
        },
        cocoa: {
          50: '#f6efe6',
          100: '#e9dcc4',
          200: '#d3b994',
          300: '#b8945f',
          400: '#9a7440',
          500: '#7b5a30',
          600: '#5e4525',
          700: '#42311b',
          800: '#291e10',
          900: '#180f06'
        }
      },
      boxShadow: {
        soft: '0 1px 2px 0 rgb(31 28 21 / 0.05), 0 8px 24px -12px rgb(31 28 21 / 0.10)',
        glow: '0 0 0 1px rgb(173 133 64 / 0.20), 0 14px 38px -12px rgb(173 133 64 / 0.40)',
        card: '0 1px 0 0 rgb(31 28 21 / 0.04), 0 1px 3px 0 rgb(31 28 21 / 0.06), 0 12px 36px -16px rgb(31 28 21 / 0.14)'
      },
      backgroundImage: {
        'paper':
          'repeating-linear-gradient(45deg, rgba(173,133,64,0.04) 0 1px, transparent 1px 8px), radial-gradient(60% 80% at 50% 0%, rgba(173,133,64,0.12), transparent 60%)',
        'grid-light':
          'radial-gradient(circle at 1px 1px, rgba(50,40,20,0.07) 1px, transparent 0)',
        'grid-dark':
          'radial-gradient(circle at 1px 1px, rgba(255,235,200,0.06) 1px, transparent 0)',
        'library':
          'radial-gradient(60% 80% at 20% 10%, rgba(173,133,64,0.22), transparent 60%), radial-gradient(50% 70% at 90% 0%, rgba(212,183,131,0.22), transparent 60%), radial-gradient(60% 80% at 50% 110%, rgba(155,114,68,0.18), transparent 60%)'
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out both',
        'slide-up': 'slideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'pulse-soft': 'pulseSoft 2.4s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s linear infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' }
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }
  },
  plugins: []
}
