import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3CBFDC',
          50: '#E8F7FB',
          100: '#D1EFF7',
          200: '#A3DFEF',
          300: '#75CFE7',
          400: '#47BFDF',
          500: '#3CBFDC',
          600: '#2BA3BE',
          700: '#1F7A8F',
          800: '#145160',
          900: '#0A2930',
        },
        dark: {
          DEFAULT: '#1A1A2E',
          50: '#4A4A6A',
          100: '#3A3A5A',
          200: '#2A2A4A',
          300: '#1A1A2E',
          400: '#151525',
          500: '#10101C',
        },
      },
      fontFamily: {
        sans: ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
