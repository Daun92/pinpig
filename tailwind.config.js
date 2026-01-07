/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Warm Mono Palette (Paper) - Light mode background
        paper: {
          white: 'var(--color-paper-white)',
          light: 'var(--color-paper-light)',
          mid: 'var(--color-paper-mid)',
        },
        // Warm Mono Palette (Ink) - Light mode foreground
        ink: {
          black: 'var(--color-ink-black)',
          dark: 'var(--color-ink-dark)',
          mid: 'var(--color-ink-mid)',
          light: 'var(--color-ink-light)',
        },
        // Semantic Colors
        semantic: {
          positive: 'var(--color-semantic-positive)',
          caution: 'var(--color-semantic-caution)',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
        mono: ['SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        hero: ['40px', { lineHeight: '1.2', fontWeight: '300' }],
        amount: ['20px', { lineHeight: '1.4', fontWeight: '400' }],
        title: ['18px', { lineHeight: '1.4', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.5', fontWeight: '400' }],
        sub: ['13px', { lineHeight: '1.4', fontWeight: '400' }],
        caption: ['11px', { lineHeight: '1.4', fontWeight: '400' }],
      },
      spacing: {
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'slide-down': 'slideDown 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
