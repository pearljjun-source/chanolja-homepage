// 지점 홈페이지 테마 설정
// 차놀자 시그니처 색상 #3CBFDC (청록색/하늘색) 기반
export type ThemeType = 'sky' | 'coral' | 'violet'

export interface ThemeColors {
  primary: string
  primaryHover: string
  primaryLight: string
  primaryBg: string
  accent: string
  gradient: string
  name: string
}

export const themes: Record<ThemeType, ThemeColors> = {
  // 차놀자 기본 테마 - 하늘색/청록색
  sky: {
    primary: '#3CBFDC',        // 차놀자 시그니처
    primaryHover: '#2BA3BE',
    primaryLight: '#E0F7FA',
    primaryBg: 'bg-cyan-500',
    accent: '#B2EBF2',
    gradient: 'from-cyan-500 to-sky-500',
    name: '스카이 (기본)',
  },
  // 코랄/오렌지 계열 - 따뜻한 느낌 (한톤 낮춤)
  coral: {
    primary: '#FB923C',        // orange-400
    primaryHover: '#F97316',   // orange-500
    primaryLight: '#FFF7ED',   // orange-50
    primaryBg: 'bg-orange-400',
    accent: '#FED7AA',         // orange-200
    gradient: 'from-orange-400 to-amber-400',
    name: '코랄',
  },
  // 바이올렛/보라 계열 - 고급스러운 느낌 (한톤 낮춤)
  violet: {
    primary: '#A78BFA',        // violet-400
    primaryHover: '#8B5CF6',   // violet-500
    primaryLight: '#F5F3FF',   // violet-50
    primaryBg: 'bg-violet-400',
    accent: '#DDD6FE',         // violet-200
    gradient: 'from-violet-400 to-purple-400',
    name: '바이올렛',
  },
}

// 테마별 Tailwind 클래스
export const themeClasses: Record<ThemeType, {
  bg: string
  bgHover: string
  bgLight: string
  text: string
  border: string
  ring: string
  accentBg: string
}> = {
  sky: {
    bg: 'bg-cyan-500',
    bgHover: 'hover:bg-cyan-600',
    bgLight: 'bg-cyan-50',
    text: 'text-cyan-500',
    border: 'border-cyan-500',
    ring: 'ring-cyan-500',
    accentBg: 'bg-sky-200',
  },
  coral: {
    bg: 'bg-orange-400',
    bgHover: 'hover:bg-orange-500',
    bgLight: 'bg-orange-50',
    text: 'text-orange-400',
    border: 'border-orange-400',
    ring: 'ring-orange-400',
    accentBg: 'bg-amber-200',
  },
  violet: {
    bg: 'bg-violet-400',
    bgHover: 'hover:bg-violet-500',
    bgLight: 'bg-violet-50',
    text: 'text-violet-400',
    border: 'border-violet-400',
    ring: 'ring-violet-400',
    accentBg: 'bg-purple-200',
  },
}

export const getTheme = (themeName?: string | null): ThemeType => {
  if (themeName && themeName in themes) {
    return themeName as ThemeType
  }
  return 'sky' // 차놀자 기본 테마
}

// 테마 목록 (선택용)
export const themeList = Object.entries(themes).map(([key, value]) => ({
  id: key as ThemeType,
  name: value.name,
  primary: value.primary,
}))
