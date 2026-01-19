/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: '#000000',
          text: '#00ff00', 
          accent: '#00dc82',
          muted: '#6b7280',
          border: '#333333',
        }
      }
    },
  },
  plugins: [],
}
