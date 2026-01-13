/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dynamic colors using CSS variables (supports dark mode)
        paper: {
          white: 'var(--color-paper-white)',
          light: 'var(--color-paper-light)',
          mid: 'var(--color-paper-mid)',
        },
        ink: {
          black: 'var(--color-ink-black)',
          dark: 'var(--color-ink-dark)',
          mid: 'var(--color-ink-mid)',
          light: 'var(--color-ink-light)',
        },
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
        nav: 'var(--nav-safe-height)', // TabBar height + safe area
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
        'bounce-gentle': 'bounceGentle 1s ease-in-out infinite',
        'count-up': 'countUp 0.6s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'draw-line': 'drawLine 1s ease-out forwards',
        'fill-donut': 'fillDonut 1s ease-out forwards',
        'step-highlight': 'stepHighlight 0.5s ease-out forwards',
        'spotlight': 'spotlight 0.2s ease-out forwards',
        // Escalator scroll animations
        'slide-in-up': 'slideInUp 0.25s ease-out forwards',
        'slide-out-up': 'slideOutUp 0.25s ease-out forwards',
        'slide-in-down': 'slideInDown 0.25s ease-out forwards',
        'slide-out-down': 'slideOutDown 0.25s ease-out forwards',
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
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        countUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        drawLine: {
          '0%': { strokeDashoffset: '100' },
          '100%': { strokeDashoffset: '0' },
        },
        fillDonut: {
          '0%': { strokeDasharray: '0 100' },
          '100%': { strokeDasharray: 'var(--fill-amount, 75) 100' },
        },
        stepHighlight: {
          '0%': { transform: 'scale(1)', opacity: '0.5' },
          '50%': { transform: 'scale(1.1)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        spotlight: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        // Escalator scroll keyframes
        slideInUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutUp: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOutDown: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
