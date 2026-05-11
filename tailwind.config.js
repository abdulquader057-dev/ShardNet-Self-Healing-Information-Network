/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
    "./main.js" // Added in case you have logic in your entry file
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0c',
        surface: '#16161a',
        primary: '#3b82f6',
        secondary: '#10b981',
        accent: '#8b5cf6',
        danger: '#ef4444',
        // Adding 'warning' for incomplete shard states
        warning: '#f59e0b', 
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan 2s linear infinite', // Useful for your QR UI
      },
      keyframes: {
        scan: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(10px)' },
        }
      }
    },
  },
  plugins: [],
}
