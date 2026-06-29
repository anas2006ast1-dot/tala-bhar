/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      screens: {
        xs: '380px',
        sm: '481px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      colors: {
        // Customer-facing dark elegant theme
        primary: '#1a1a2e',
        surface: '#16213e',
        'surface-2': '#0f1d33',
        accent: '#e8b86d',
        'accent-dark': '#c89b4e',
        text: '#eaeaea',
      },
      fontFamily: {
        sans: ['Cairo', 'system-ui', 'sans-serif'],
        display: ['Amiri', 'Cairo', 'serif'],
      },
      animation: {
        'fade-slide': 'fadeSlide 0.5s ease-out forwards',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeSlide: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
