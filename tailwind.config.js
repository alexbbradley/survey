/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');
module.exports = {
  content: [
    './src/**/*.{js,ts}',
    './*.php',
    './surveys/**/*.php',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        // ── App chrome ──────────────────────────────────────────────
        // Edit these to retheme the entire app
        surface: {
          bg:     '#1a1a1a',   // page background
          card:   '#222222',   // headers, modal boxes, cards
          raised: '#2a2a2a',   // section rows, dropdowns
          hover:  '#2e2e2e',   // hover states
          border: '#383838',   // dividers / borders
          strong: '#484848',   // stronger borders
        },
        text: {
          primary: '#fffbf5',
          muted:   '#909090',
        },
      green: '#70BFA1',
      greenlight: '#8DCCB4',
      red: '#FF6D3B',
      yellow: '#F3C15F',
      blue: '#4285F4',
      black: '#1a1a1a',
      pink: '#F5DADA',
      cream: '#F5EDE2',
        // ── Task bar colour palette ─────────────────────────────────
        // These are used as INLINE styles in JS, not as Tailwind classes.
        // Update both here AND in the PALETTE array in src/app.js.
        brand: {
          'green-dark':   '#2d6a4f',
          'green-light':  '#74c69d',
          'red-dark':     '#b52b2b',
          'red-light':    '#f4a0a0',
          'yellow-dark':  '#b5820b',
          'yellow-light': '#f4d060',
          'blue-dark':    '#1d4e89',
          'blue-light':   '#90c3f9',
          'pink-dark':    '#883060',
          'pink-light':   '#f4a0c8',
        },
      },
    },
  },
  plugins: [],
};
