/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FFD700', // Bright yellow (matches Illovo)
          dark: '#FFC000',    // Darker yellow
          light: '#FFE44D'    // Lighter yellow
        },
        secondary: {
          DEFAULT: '#1A1A1A', // Dark gray sidebar (matches Illovo)
          light: '#2D2D2D',   // Card backgrounds (matches Illovo)
          dark: '#0A0A0A'     // Main background (matches Illovo - very dark)
        },
        accent: {
          green: '#10B981',   // Branch identifier green (matches Illovo)
          orange: '#F97316',  // Firebase/warning orange (matches Illovo)
          purple: '#A855F7'   // Action buttons purple
        }
      }
    },
  },
  plugins: [],
}
