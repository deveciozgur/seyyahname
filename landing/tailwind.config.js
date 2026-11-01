// Tailwind config for the landing page. The CSS is compiled into index.html by build-css.mjs
// (which scans a copy of the page without the compiled block), so the page ships as one file.
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        obsidian: '#0A0A0B',
        panel: '#111113',
        raised: '#161618',
        sunk: '#1C1C1F',
        line: 'rgba(255,255,255,0.08)',
        ink: { DEFAULT: '#EDEDEF', 2: '#A1A1AA', 3: '#8B8B94' },
        champagne: { DEFAULT: '#E8C07D', hover: '#D8AD68', soft: 'rgba(232,192,125,0.12)' },
        jade: { DEFAULT: '#4ADE80', soft: 'rgba(74,222,128,0.12)' },
        sky: { DEFAULT: '#7DD3FC', soft: 'rgba(125,211,252,0.12)' },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(232,192,125,0.35), 0 10px 40px -10px rgba(232,192,125,0.55)',
        panel: '0 30px 80px -30px rgba(0,0,0,0.8)',
      },
      maxWidth: { page: '1200px' },
    },
  },
};
