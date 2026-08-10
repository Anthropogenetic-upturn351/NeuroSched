/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        carbonBase: "#111111",
        carbonCard: "#1B1B1B",
        carbonBorder: "#333333",
        moltenOrange: "#FF5A00",
        platinumWhite: "#EAEAEA",
        steelMuted: "#888888",
        solarGold: "#FFD600",
        emeraldGreen: "#10B981"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      }
    },
  },
  plugins: [],
}
