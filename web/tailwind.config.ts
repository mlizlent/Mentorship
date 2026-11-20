import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#1F1535',
        primary: {
          50: '#F3EEFF',
          100: '#E9E3FF',
          200: '#D4C7FF',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#5B21B6',
          800: '#4C1D95',
          900: '#3B0764',
        },
        neutral: {
          50: '#F9F9FB',
          100: '#F2F2F4',
          200: '#E4E4E7',
          300: '#D4D4D8',
          400: '#A1A1AA',
          500: '#71717A',
          600: '#52525B',
          700: '#3F3F46',
          800: '#27272A',
          900: '#18181B',
        },
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.25rem',
        full: '9999px',
      },
      spacing: {
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}

export default config
