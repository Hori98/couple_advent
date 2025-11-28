/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        christmas: {
          red: "#e11d48",
          green: "#16a34a",
          gold: "#f59e0b",
          night: "#0f172a"
        }
      }
    }
  },
  plugins: []
};

