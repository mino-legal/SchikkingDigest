/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Accent ink — Mino burgundy (hsl(321 100% 21%))
          // Replaces the original #2081C3 SaaS blue so links, badges,
          // labels, active states, and the refresh button align with
          // the Mino strip + footer that frame the page.
          blue:       '#6B0049',
          terracotta: '#A63D33',
          darkred:    '#73241D',
          olive:      '#C0BDA5',
          darkgray:   '#262626',
          lightgray:  '#D9D9D9',
          bg:         '#F3F4F6',
          'bg-soft':  '#F5F5F5',
          'bg-gray':  '#F9FAFB',
          // Soft accent surface — Mino light blue (hsl(221 100% 93%))
          // The companion to brand.blue: disclaimer card, sort pill,
          // rechtspraak badge background. Same value used in the strip.
          'bg-blue':  '#DCE7FF',
          'bg-red':   '#FDF3F2',
          white:      '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        brand: '12px',
      },
      boxShadow: {
        brand:        '3px 4px 12px rgba(0,0,0,0.12)',
        'brand-hover':'4px 6px 16px rgba(0,0,0,0.16)',
        soft:         '0 1px 2px rgba(0,0,0,0.05)',
      },
      transitionTimingFunction: {
        'brand-out': 'cubic-bezier(0.16,1,0.3,1)',
      },
      keyframes: {
        fadeIn:            { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideInFromBottom: { '0%': { opacity: '0', transform: 'translateY(1rem)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-in':   'slideInFromBottom 0.3s ease-out',
      },
    },
  },
  plugins: [],
};
