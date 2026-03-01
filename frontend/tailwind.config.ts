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
        ink: { 950: "#0B1220", 900: "#101A2D", 700: "#2B3A55" },
        sand: { 50: "#FBFAF7", 100: "#F5F1E8", 200: "#ECE4D6" },
        primary: {
          DEFAULT: "#7C40C6",
          light: "#9B6DD4",
          dark: "#5E2F9E",
        },
        "app-bg": "#181621",
        "app-surface": "#1E1C28",
      },
      fontFamily: {
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        quran: ["Amiri Quran", "serif"],
      },
      boxShadow: {
        soft: "0 10px 30px rgba(0,0,0,0.2)",
        "btn-soft": "0 0 0 1px rgba(255,255,255,0.08), 0 24px 48px -12px rgba(0,0,0,0.4)",
        "record-glow": "0 0 0 0 rgba(124, 64, 198, 0.35)",
        "record-glow-mid": "0 0 0 28px rgba(124, 64, 198, 0)",
      },
      keyframes: {
        highlight: {
          "0%": { backgroundColor: "rgba(124, 64, 198, 0.25)" },
          "100%": { backgroundColor: "rgba(124, 64, 198, 0)" },
        },
        "record-pulse": {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.03)", opacity: "0.95" },
        },
        "record-glow": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(124, 64, 198, 0.35)" },
          "50%": { boxShadow: "0 0 0 28px rgba(124, 64, 198, 0)" },
        },
        "idle-breathe": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.02)" },
        },
        "ring-expand": {
          "0%": { transform: "scale(1)", opacity: "0.5" },
          "50%": { transform: "scale(1.12)", opacity: "0.25" },
          "100%": { transform: "scale(1.2)", opacity: "0" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "15%": { transform: "translateX(-6px)" },
          "30%": { transform: "translateX(6px)" },
          "45%": { transform: "translateX(-4px)" },
          "60%": { transform: "translateX(4px)" },
          "75%": { transform: "translateX(-2px)" },
        },
        "dots-rotate": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        highlight: "highlight 1000ms ease-out forwards",
        "record-pulse": "record-pulse 1.4s ease-in-out infinite",
        "record-glow": "record-glow 1.6s ease-in-out infinite",
        "idle-breathe": "idle-breathe 3s ease-in-out infinite",
        "ring-expand": "ring-expand 1.8s ease-out infinite",
        shake: "shake 0.5s ease-in-out",
        "dots-rotate": "dots-rotate 1s linear infinite",
      },
      transitionDuration: {
        350: "350ms",
      },
    },
  },
  plugins: [],
};

export default config;

