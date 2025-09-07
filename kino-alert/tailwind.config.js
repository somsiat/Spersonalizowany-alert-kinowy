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
          DEFAULT: 'rgb(239 9 20)',
          dark: 'rgb(184 29 19)',
          light: 'rgb(244 6 18)',
        },
        secondary: {
          DEFAULT: 'rgb(0 113 235)',
          dark: 'rgb(0 91 181)',
          light: 'rgb(0 122 255)',
        },
        accent: {
          DEFAULT: 'rgb(0 212 170)',
          dark: 'rgb(0 184 148)',
          light: 'rgb(0 229 196)',
        },
        gray: {
          50: 'rgb(28 28 30)',
          100: 'rgb(44 44 46)',
          200: 'rgb(58 58 60)',
          300: 'rgb(72 72 74)',
          400: 'rgb(99 99 102)',
          500: 'rgb(142 142 147)',
          600: 'rgb(174 174 178)',
          700: 'rgb(199 199 204)',
          800: 'rgb(209 209 214)',
          900: 'rgb(242 242 247)',
        },
      },
      fontFamily: {
        sans: ['SF Pro Display', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-in': 'slideIn 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'pulse-logo': 'pulseLogo 2s ease-in-out infinite',
        'gradient-text': 'gradientShift 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseLogo: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
