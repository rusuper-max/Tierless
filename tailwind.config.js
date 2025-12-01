/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{ts,tsx,js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Override pure white/black with softer variants
        white: '#f8fafc',    // Slate 50 - soft white for light mode
        black: '#09090b',    // Zinc 950 - warm near-black for dark mode

        // Add aliases for when we actually need pure colors
        'true-white': '#ffffff',
        'true-black': '#000000',
      },
    },
  },
};
