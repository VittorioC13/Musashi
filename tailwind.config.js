/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'predbot-purple': '#8B5CF6',
        'predbot-dark': '#1F2937',
      },
    },
  },
  plugins: [],
}
