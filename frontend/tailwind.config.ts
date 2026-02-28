import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      padding: {
        safe: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)",
        "safe-t": "env(safe-area-inset-top)",
        "safe-b": "env(safe-area-inset-bottom)",
        "safe-l": "env(safe-area-inset-left)",
        "safe-r": "env(safe-area-inset-right)",
      },
      colors: {
        ink: {
          950: "#0B1220",
          900: "#101A2D",
          700: "#2B3A55",
        },
        sand: {
          50: "#FBFAF7",
          100: "#F5F1E8",
          200: "#ECE4D6",
        },
        teal: {
          500: "#0EA5A6",
          600: "#0B8A8B",
        },
        rose: {
          500: "#F43F5E",
        },
        shazam: {
          bg: "#0a0a0a",
          surface: "#141414",
          muted: "#737373",
          white: "#ffffff",
        },
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(11, 18, 32, 0.10)",
        ring: "0 0 0 6px rgba(14, 165, 166, 0.15)",
        "shazam-btn": "0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px -12px rgba(0,0,0,0.5)",
        "shazam-glow": "0 0 0 0 rgba(244, 63, 94, 0.4)",
        "shazam-glow-mid": "0 0 0 32px rgba(244, 63, 94, 0)",
      },
      keyframes: {
        highlight: {
          "0%": { backgroundColor: "rgba(14,165,166,0.28)" },
          "100%": { backgroundColor: "rgba(14,165,166,0)" },
        },
        "record-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.04)", opacity: "0.92" },
        },
        "record-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(244, 63, 94, 0.35)" },
          "50%": { boxShadow: "0 0 0 28px rgba(244, 63, 94, 0)" },
        },
        "idle-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
      },
      animation: {
        highlight: "highlight 1000ms ease-out forwards",
        "record-pulse": "record-pulse 1.4s ease-in-out infinite",
        "record-glow": "record-glow 1.6s ease-in-out infinite",
        "idle-breathe": "idle-breathe 3s ease-in-out infinite",
      },
      transitionDuration: {
        350: "350ms",
      },
    },
  },
  plugins: [],
};

export default config;

