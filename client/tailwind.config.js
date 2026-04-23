/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0B1219",
        surface: "#121A23",
        emergency: "#8E1111",
        alert: "#FF3B30",
        live: "#79D4FF",
        safe: "#4DDA98",
        warn: "#FFB222",
        text: "#F3F7FB",
        muted: "#9CA9B7",
        border: "rgba(193,212,231,0.16)"
      },
      fontFamily: {
        grotesk: ["Rajdhani", "sans-serif"],
        sans: ["Rajdhani", "sans-serif"],
        heading: ["Saira Semi Condensed", "sans-serif"],
        body: ["Rajdhani", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"]
      },
      boxShadow: {
        glow: "0 0 60px rgba(0, 212, 255, 0.22)",
        danger: "0 0 40px rgba(255, 69, 0, 0.35)"
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};
