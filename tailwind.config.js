/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Dynamic via CSS variables (set by theme)
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
          card: 'var(--bg-card)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          primary: 'var(--accent-primary)',
          secondary: 'var(--accent-secondary)',
          tertiary: 'var(--accent-tertiary)',
          clinic: 'var(--accent-clinic)',
          success: 'var(--accent-success)',
          warning: 'var(--accent-warning)',
          danger: 'var(--accent-danger)',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        DEFAULT: 'var(--shadow)',
        'glow-pink': 'var(--glow-pink)',
        'glow-cyan': 'var(--glow-cyan)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s ease-out infinite',
        'spin': 'spin 0.8s linear infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'translate(-50%, -50%) scale(0.5)', opacity: '1' },
          '100%': { transform: 'translate(-50%, -50%) scale(2)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}

