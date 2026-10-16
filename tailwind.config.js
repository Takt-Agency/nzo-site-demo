/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Brand — navy
        primary: {
          DEFAULT: '#174171',
          50: '#eef3fa',
          100: '#d4e1f0',
          200: '#a9c3e2',
          300: '#7ea5d3',
          400: '#5387c5',
          500: '#2a6db5',
          600: '#225891',
          700: '#174171',
          800: '#112f53',
          900: '#0a1d33',
        },
        // Brand — green (CTA)
        accent: {
          DEFAULT: '#8cc44b',
          50: '#f3f9e9',
          100: '#e1f0c5',
          200: '#c4e189',
          300: '#a7d160',
          400: '#8cc44b',
          500: '#71a634',
          600: '#588227',
          700: '#425e1d',
          800: '#2c3e14',
          900: '#16200a',
        },
        // Brand — blue
        secondary: {
          DEFAULT: '#2ba5de',
          50: '#e6f3fb',
          100: '#c0e1f5',
          200: '#95cdee',
          300: '#68b8e6',
          400: '#44ade1',
          500: '#2ba5de',
          600: '#1e8bbf',
          700: '#146d97',
          800: '#0b4c6b',
          900: '#052b3d',
        },
        // Brand — cyan (light highlight)
        tertiary: {
          DEFAULT: '#3bc1de',
          50: '#ebf8fc',
          100: '#caedf6',
          200: '#97deef',
          300: '#65cee7',
          400: '#3bc1de',
          500: '#21a3bf',
          600: '#19819a',
          700: '#115f72',
          800: '#0a3e4a',
          900: '#051f25',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Anton', 'Impact', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1.25rem',
          sm: '2rem',
          md: '3rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
        screens: {
          sm: '640px',
          md: '768px',
          lg: '1024px',
          xl: '1280px',
          '2xl': '1440px',
        },
      },
    },
  },
  plugins: [],
}
