import { themes, themeClasses, getTheme, themeList, ThemeType } from '@/lib/themes'

describe('themes configuration', () => {
  describe('theme definitions', () => {
    it('should have all three themes defined', () => {
      expect(themes).toHaveProperty('sky')
      expect(themes).toHaveProperty('coral')
      expect(themes).toHaveProperty('violet')
    })

    it('sky theme should have correct primary color', () => {
      expect(themes.sky.primary).toBe('#3CBFDC')
      expect(themes.sky.name).toBe('스카이 (기본)')
    })

    it('coral theme should have correct primary color', () => {
      expect(themes.coral.primary).toBe('#FB923C')
      expect(themes.coral.name).toBe('코랄')
    })

    it('violet theme should have correct primary color', () => {
      expect(themes.violet.primary).toBe('#A78BFA')
      expect(themes.violet.name).toBe('바이올렛')
    })

    it('each theme should have all required properties', () => {
      const requiredProperties = [
        'primary',
        'primaryHover',
        'primaryLight',
        'primaryBg',
        'accent',
        'gradient',
        'name',
      ]

      Object.values(themes).forEach((theme) => {
        requiredProperties.forEach((prop) => {
          expect(theme).toHaveProperty(prop)
        })
      })
    })
  })

  describe('themeClasses', () => {
    it('should have Tailwind classes for all themes', () => {
      const themeTypes: ThemeType[] = ['sky', 'coral', 'violet']

      themeTypes.forEach((themeName) => {
        expect(themeClasses[themeName]).toHaveProperty('bg')
        expect(themeClasses[themeName]).toHaveProperty('bgHover')
        expect(themeClasses[themeName]).toHaveProperty('bgLight')
        expect(themeClasses[themeName]).toHaveProperty('text')
        expect(themeClasses[themeName]).toHaveProperty('border')
        expect(themeClasses[themeName]).toHaveProperty('ring')
        expect(themeClasses[themeName]).toHaveProperty('accentBg')
      })
    })

    it('sky theme should have cyan Tailwind classes', () => {
      expect(themeClasses.sky.bg).toBe('bg-cyan-500')
      expect(themeClasses.sky.text).toBe('text-cyan-500')
    })

    it('coral theme should have orange Tailwind classes', () => {
      expect(themeClasses.coral.bg).toBe('bg-orange-400')
      expect(themeClasses.coral.text).toBe('text-orange-400')
    })

    it('violet theme should have violet Tailwind classes', () => {
      expect(themeClasses.violet.bg).toBe('bg-violet-400')
      expect(themeClasses.violet.text).toBe('text-violet-400')
    })
  })

  describe('getTheme', () => {
    it('should return sky as default theme when no argument', () => {
      expect(getTheme()).toBe('sky')
    })

    it('should return sky as default theme for null', () => {
      expect(getTheme(null)).toBe('sky')
    })

    it('should return sky as default theme for undefined', () => {
      expect(getTheme(undefined)).toBe('sky')
    })

    it('should return sky as default theme for invalid theme name', () => {
      expect(getTheme('invalid-theme')).toBe('sky')
      expect(getTheme('blue')).toBe('sky')
      expect(getTheme('')).toBe('sky')
    })

    it('should return the correct theme when valid theme name is provided', () => {
      expect(getTheme('sky')).toBe('sky')
      expect(getTheme('coral')).toBe('coral')
      expect(getTheme('violet')).toBe('violet')
    })
  })

  describe('themeList', () => {
    it('should contain all three themes', () => {
      expect(themeList).toHaveLength(3)
    })

    it('should have correct structure for each theme', () => {
      themeList.forEach((theme) => {
        expect(theme).toHaveProperty('id')
        expect(theme).toHaveProperty('name')
        expect(theme).toHaveProperty('primary')
      })
    })

    it('should include sky theme in the list', () => {
      const skyTheme = themeList.find((t) => t.id === 'sky')
      expect(skyTheme).toBeDefined()
      expect(skyTheme?.name).toBe('스카이 (기본)')
      expect(skyTheme?.primary).toBe('#3CBFDC')
    })

    it('should include coral theme in the list', () => {
      const coralTheme = themeList.find((t) => t.id === 'coral')
      expect(coralTheme).toBeDefined()
      expect(coralTheme?.name).toBe('코랄')
    })

    it('should include violet theme in the list', () => {
      const violetTheme = themeList.find((t) => t.id === 'violet')
      expect(violetTheme).toBeDefined()
      expect(violetTheme?.name).toBe('바이올렛')
    })
  })
})
