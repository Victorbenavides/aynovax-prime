/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aynovax: {
          dark: '#0f172a',      // Slate 900
          panel: '#1e293b',     // Slate 800
          accent: '#3b82f6',    // Blue 500
          success: '#10b981',   // Emerald 500
          warning: '#f59e0b',   // Amber 500
          danger: '#ef4444',    // Red 500
          text: '#f8fafc',      // Slate 50
          muted: '#94a3b8'      // Slate 400
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}