import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // 테마 색상 클래스들 (400, 500 레벨 모두 포함)
    'bg-cyan-500', 'bg-cyan-50', 'text-cyan-500', 'border-cyan-500', 'hover:bg-cyan-600', 'bg-sky-200',
    'bg-orange-400', 'bg-orange-500', 'bg-orange-50', 'text-orange-400', 'text-orange-500', 'border-orange-400', 'border-orange-500', 'hover:bg-orange-500', 'hover:bg-orange-600', 'bg-amber-200',
    'bg-violet-400', 'bg-violet-500', 'bg-violet-50', 'text-violet-400', 'text-violet-500', 'border-violet-400', 'border-violet-500', 'hover:bg-violet-500', 'hover:bg-violet-600', 'bg-purple-200',
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
