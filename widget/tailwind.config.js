/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'pulse-slow': 'pulse 2s infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      keyframes: {
        slideInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        slideInRight: {
          '0%': {
            opacity: '0',
            transform: 'translateX(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateX(0)',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      zIndex: {
        '999999': '999999',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '112': '28rem',
        '128': '32rem',
      },
      maxWidth: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
      boxShadow: {
        'widget': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        'button': '0 8px 25px rgba(0, 0, 0, 0.15)',
        'button-hover': '0 12px 35px rgba(0, 0, 0, 0.2)',
      },
    },
  },
  plugins: [
    // Custom plugin for widget-specific utilities
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.widget-shadow': {
          boxShadow: theme('boxShadow.widget'),
        },
        '.button-shadow': {
          boxShadow: theme('boxShadow.button'),
        },
        '.button-shadow-hover': {
          boxShadow: theme('boxShadow.button-hover'),
        },
        '.widget-transition': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.widget-z-index': {
          zIndex: theme('zIndex.999999'),
        },
      };
      
      addUtilities(newUtilities);
    },
  ],
  // Dark mode configuration
  darkMode: 'class',
  // Prefix for widget isolation (optional)
  // prefix: 'widget-',
  // Important to override other styles
  important: '.widget-container',
  // Disable preflight to avoid conflicts
  corePlugins: {
    preflight: false,
  },
};
