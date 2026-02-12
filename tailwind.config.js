/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Musashi Colors (Cloud Dancer - soft blue-gray)
        'musashi-blue': '#A8C5DD',
        'musashi-blue-light': '#C4D9E8',
        'musashi-blue-dark': '#8BAFC9',
        'musashi-dark': '#2C3E50',

        // Category Colors (OKX-inspired)
        'category': {
          politics: '#1D9BF0',
          crypto: '#F59E0B',
          economics: '#10B981',
          sports: '#EF4444',
          technology: '#1D9BF0',
          entertainment: '#EC4899',
          climate: '#14B8A6',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0, 0, 0, 0.04)',
        'soft-md': '0 2px 6px rgba(0, 0, 0, 0.06)',
        'soft-lg': '0 4px 12px rgba(0, 0, 0, 0.08)',
        'glow-blue': '0 0 0 1px rgba(168, 197, 221, 0.2)',
        'glow-blue-lg': '0 0 0 2px rgba(168, 197, 221, 0.25)',
      },
      animation: {
        'spring': 'springBounce 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-slide-up': 'fadeSlideUp 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        'pulse-subtle': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
