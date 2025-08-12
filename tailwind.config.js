/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf8f6',
          100: '#f5f0ec',
          200: '#eaddd6',
          300: '#dcc5b8',
          400: '#caa691',
          500: '#b58a6f',
          600: '#a47760',
          700: '#8a6450',
          800: '#734c2d', // Primary color from design tokens
          900: '#5d3d24',
        },
        accent: {
          50: '#f4f9f5',
          100: '#e6f3e8',
          200: '#cee6d2',
          300: '#a7d1b0',
          400: '#8fbc94', // Accent color from design tokens
          500: '#6ba071',
          600: '#4f7d54',
          700: '#3f6443',
          800: '#345037',
          900: '#2c422f',
        },
        earth: {
          50: '#faf9f7',
          100: '#f4f1ed',
          200: '#e8e0d8',
          300: '#d8cbbf',
          400: '#c5b2a1',
          500: '#b39786',
          600: '#9e7f6b',
          700: '#856858',
          800: '#6e564a',
          900: '#5b473f',
        },
      },
      fontFamily: {
        serif: ['var(--font-jakarta)', 'ui-serif', 'serif'],
        sans: ['var(--font-noto)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        base: '16px', // Base font size from design tokens
      },
      spacing: {
        base: '16px', // Medium spacing from design tokens
      },
      borderRadius: {
        default: '12px', // Default border radius from design tokens
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
