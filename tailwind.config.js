/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    screens: {
      'xs': '480px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Dynamic via CSS variables (set by theme)
        bg: {
          primary: "var(--bg-primary)",
          secondary: "var(--bg-secondary)",
          tertiary: "var(--bg-tertiary)",
          card: "var(--bg-card)",
        },
        border: {
          DEFAULT: "var(--border-color)",
        },
        text: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        accent: {
          primary: "var(--accent-primary)",
          secondary: "var(--accent-secondary)",
          tertiary: "var(--accent-tertiary)",
          clinic: "var(--accent-clinic)",
          success: "var(--accent-success)",
          warning: "var(--accent-warning)",
          danger: "var(--accent-danger)",
        },
      },
      fontFamily: {
        sans: ["Outfit", "system-ui", "-apple-system", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "var(--radius)",
        sm: "var(--radius-sm)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        DEFAULT: "var(--shadow)",
        "glow-pink": "var(--glow-pink)",
        "glow-cyan": "var(--glow-cyan)",
        "glow-orange": "var(--glow-orange)",
      },
      animation: {
        "pulse-ring": "pulse-ring 2s ease-out infinite",
        spin: "spin 0.8s linear infinite",
        "slide-up": "slide-up 0.3s ease-out",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "translate(-50%, -50%) scale(0.5)", opacity: "1" },
          "100%": { transform: "translate(-50%, -50%) scale(2)", opacity: "0" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
