/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        appleBlue: '#007AFF', // iOS blue
        appleGray: '#F2F2F7',
        appleDark: '#1C1C1E',
      }
    },
  },
  plugins: [],
}
