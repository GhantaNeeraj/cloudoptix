/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: "#080c16",       // Deep background dark blue
          card: "#0f1626",       // Rich card blue-gray
          border: "#1f2a45",     // Border outlines
          input: "#141e30",      // Inputs
          text: "#94a3b8",       // Soft body text
          title: "#f8fafc",      // Bright white headings
          cyan: "#06b6d4",       // Primary optimization color
          blue: "#3b82f6",       // Secondary metrics color
          violet: "#8b5cf6",     // Forecast and trend highlights
          success: "#10b981",    // Savings/Excellent indicator
          warning: "#f59e0b",    // Underutilization/Needs attention indicator
          danger: "#ef4444"      // Anomaly/Critical budget overrun indicator
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"]
      }
    },
  },
  plugins: [],
}
