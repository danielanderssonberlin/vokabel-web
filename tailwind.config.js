/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#41A8BF",
        "primary-light": "#B0D1D9",
        background: "#f8fafc",
        surface: "#ffffff",
        "text-main": "#1e293b",
        "text-secondary": "#64748b",
        "text-muted": "#94a3b8",
        border: "#e2e8f0",
        "border-light": "#f1f5f9",
        success: "#26A653",
        "success-light": "#dcfce7",
        error: "#ef4444",
        "error-light": "#fee2e2",
      }
    },
  },
  plugins: [],
}

