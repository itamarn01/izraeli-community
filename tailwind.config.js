/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary palette — exact hex codes from brand spec
        ink: {
          DEFAULT: '#3A3A3A',
          50: '#f5f5f4',
          100: '#e7e7e6',
          200: '#c4c4c3',
          300: '#a1a1a0',
          400: '#7e7e7d',
          500: '#5b5b5a',
          600: '#3A3A3A',
          700: '#2d2d2d',
          800: '#1f1f1f',
          900: '#121212',
        },
        accent: {
          DEFAULT: '#CB8333',
          50: '#fbf3e8',
          100: '#f5dfbf',
          200: '#eec591',
          300: '#e3a85b',
          400: '#d69544',
          500: '#CB8333',
          600: '#a76a26',
          700: '#82531c',
          800: '#5d3b13',
          900: '#3b250b',
        },
        muted: {
          DEFAULT: '#9BAD94',
          50: '#f3f5f1',
          100: '#dde3d7',
          200: '#c4cebc',
          300: '#aab9a0',
          400: '#9BAD94',
          500: '#7f9577',
          600: '#647a5c',
          700: '#4d5d47',
          800: '#384234',
          900: '#252b22',
        },
        olive: {
          DEFAULT: '#AFC072',
          50: '#f4f6e8',
          100: '#e5ebca',
          200: '#d2dca5',
          300: '#bfcc83',
          400: '#AFC072',
          500: '#94a85a',
          600: '#778947',
          700: '#5a6936',
          800: '#404a26',
          900: '#272d17',
        },
        canvas: '#FAFAF7', // page background
        surface: '#FFFFFF', // cards
      },
      fontFamily: {
        sans: ['Rubik', 'Alef', 'system-ui', 'sans-serif'],
        display: ['"Rubik Dirt"', 'Rubik', 'serif'],
        body: ['Alef', 'Rubik', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(58,58,58,0.06), 0 4px 16px rgba(58,58,58,0.06)',
        soft: '0 2px 8px rgba(58,58,58,0.08)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        floatY: 'floatY 3s ease-in-out infinite',
        fadeUp: 'fadeUp 0.4s ease-out both',
      },
    },
  },
  plugins: [],
};
