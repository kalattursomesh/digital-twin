/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0e7ff',
          100: '#c7d2fe',
          500: '#6366f1', // Electric Indigo
          600: '#4f46e5',
          900: '#312e81',
        },
        dark: {
          950: '#05070c', // Obsidian Background
          900: '#0a0f19', // Obsidian Card Background
          800: '#121824', // Buttons / Highlights
          700: '#1e293b', // Borders
          600: '#334155',
          500: '#475569',
          400: '#64748b',
          300: '#94a3b8',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
