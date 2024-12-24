/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFD700', // Bright yellow
          dark: '#FFC000',    // Darker yellow
          light: '#FFE44D'    // Lighter yellow
        },
        secondary: {
          DEFAULT: '#1A1A1A', // Dark gray/black
          light: '#2D2D2D',   // Lighter black
          dark: '#000000'     // Pure black
        }
      }
    },
  },
  plugins: [],
}
