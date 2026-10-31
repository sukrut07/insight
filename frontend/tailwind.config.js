/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFCF7',
          100: '#F8F6EF', // Primary background
          200: '#F1EEDB',
          300: '#E7E2C7',
        },
        charcoal: {
          DEFAULT: '#242424', // Primary dark foreground / borders
          900: '#1A1A1A',
          800: '#242424',
          700: '#3D3D3D',
          600: '#545454',
          500: '#77736E',
          400: '#A39E98',
        },
        pastel: {
          mint: '#CDEFD4',
          lavender: '#E8DDFB',
          blue: '#C8E9F7',
          pink: '#F8CFD0',
          yellow: '#F9E9B7',
        },
        accent: {
          purple: '#7C3AED',
          magenta: '#EC4899',
          orange: '#F97316',
          teal: '#0D9488',
        }
      },
      boxShadow: {
        'hard-xs': '2px 2px 0px #242424',
        'hard-sm': '3px 3px 0px #242424',
        'hard': '5px 5px 0px #242424',
        'hard-lg': '8px 8px 0px #242424',
        'hard-xl': '12px 12px 0px #242424',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'monospace'],
      },
      borderWidth: {
        '2': '2px',
        '3': '3px',
      }
    },
  },
  plugins: [],
}
