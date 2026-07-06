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
        // Customer-facing theme — هوية منيو "طلة بحر SeaView"
        // ورق كريمي + كحلي بحري + أزرق فاتح + ذهبي لإطارات الأسعار
        primary: '#16324f',
        surface: '#f7f2e8',
        'surface-2': '#f1eadc',
        accent: '#1d3a5e',
        'accent-dark': '#12293f',
        sea: '#5b9bd5',
        'sea-light': '#a9c6dd',
        gold: '#b9974b',
        text: '#1b2a3a',
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
