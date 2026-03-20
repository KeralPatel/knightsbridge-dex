import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0B0F14',
          card: '#11161D',
        },
        border: {
          DEFAULT: '#1F2A37',
        },
        accent: {
          green: '#00FFA3',
          blue: '#3B82F6',
          red: '#EF4444',
        },
        text: {
          primary: '#E5E7EB',
          secondary: '#9CA3AF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tight: '-0.01em',
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '-0.01em' }],
        sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '-0.01em' }],
        base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '-0.01em' }],
        lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.01em' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.015em' }],
      },
      borderColor: {
        DEFAULT: '#1F2A37',
      },
      backgroundColor: {
        DEFAULT: '#0B0F14',
      },
      gridTemplateColumns: {
        '12': 'repeat(12, minmax(0, 1fr))',
      },
      width: {
        sidebar: '240px',
        'trading-panel': '320px',
      },
      maxWidth: {
        sidebar: '240px',
        'trading-panel': '320px',
      },
      minWidth: {
        sidebar: '240px',
        'trading-panel': '320px',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-in': 'slideIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
