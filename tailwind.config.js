/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  // NOTE: Update this to include the paths to all of your component files.
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        oil: {
          light: '#FFFBEB', // amber-50
          DEFAULT: '#F59E0B', // amber-500
          dark: '#B45309', // amber-700
          deep: '#78350F', // amber-900
        },
        brand: {
          primary: '#F59E0B',
          dark: '#1E293B',
          accent: '#10B981',
        }
      },
    },
  },
  plugins: [],
}
