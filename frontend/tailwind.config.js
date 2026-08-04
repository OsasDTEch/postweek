/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        display: ["Newsreader", "Georgia", "serif"],
        sans: ["Geist", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
        // Platform-native stacks for preview cards
        linkedin: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        x: ["system-ui", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      colors: {
        // Canvas
        canvas: {
          DEFAULT: "#F7F7F5",
          dark: "#0D0F13",
        },
        // Surface
        surface: {
          DEFAULT: "#FFFFFF",
          dark: "#15181E",
        },
        // Ink (text)
        ink: {
          DEFAULT: "#16181D",
          secondary: "#6B7280",
          muted: "#9CA3AF",
          dark: "#F1F3F6",
          "dark-secondary": "#9AA3B0",
        },
        // Cobalt — primary actions only
        cobalt: {
          50:  "#EFF3FF",
          100: "#DDE6FF",
          200: "#C0CFFF",
          300: "#93AEFF",
          400: "#6085FF",
          500: "#2E5BFF",
          600: "#1A44F5",
          700: "#1232E0",
          800: "#152AB5",
          900: "#162A8F",
        },
        // Highlighter — AI marker, used sparingly
        highlighter: {
          DEFAULT: "#FFE977",
          dark: "#B7A94A",
        },
        // Editor red
        editorred: "#E5484D",
      },
      fontSize: {
        // Mono sizes for counters/timestamps
        "mono-xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.02em" }],
        "mono-sm": ["0.75rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
      },
      animation: {
        "stamp-in":  "stamp-in 0.28s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "card-rise": "card-rise 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "fade-in":   "fade-in 0.15s ease-out forwards",
        "blink":     "blink 1s step-end infinite",
      },
      keyframes: {
        "stamp-in": {
          "0%":   { opacity: "0", transform: "rotate(-12deg) scale(0.65)" },
          "100%": { opacity: "1", transform: "rotate(-8deg) scale(1)" },
        },
        "card-rise": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};
