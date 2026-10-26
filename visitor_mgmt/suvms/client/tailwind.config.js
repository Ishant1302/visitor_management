/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // University Warm Terracotta / Coral Palette (inspired by BML Munjal University architecture & Logbook logo)
        primary: {
          50:  '#fff7f5',
          100: '#ffede8',
          200: '#ffd9cf',
          300: '#ffbaa8',
          400: '#f98b72',
          500: '#ee6548',
          600: '#dc4928',
          700: '#b9391d',
          800: '#96311b',
          900: '#7c2c1b',
          950: '#431208',
        },
        // University Teal Palette (matching Logbook Hugo "Get It" button & campus glass atrium)
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
      },
    },
  },
  plugins: [],
};
