import { render, screen } from '@testing-library/react'

// Hero3DScene은 @react-three/fiber Canvas를 사용하며 jsdom에 ResizeObserver가 없어 모킹 필요
jest.mock('@/components/home/Hero3DScene', () => ({
  __esModule: true,
  default: () => <div data-testid="hero-3d-scene" />,
}))

import HeroSection from '@/components/home/HeroSection'

describe('HeroSection Component', () => {
  it('renders the main headline', () => {
    render(<HeroSection />)
    expect(screen.getByText('GROW')).toBeInTheDocument()
    expect(screen.getByText('TOGETHER')).toBeInTheDocument()
  })

  it('renders the since badge', () => {
    render(<HeroSection />)
    expect(screen.getByText('Since 1998 - 27년의 신뢰')).toBeInTheDocument()
  })

  it('renders the tagline', () => {
    render(<HeroSection />)
    expect(screen.getByText(/우리 모두가/)).toBeInTheDocument()
    expect(screen.getByText('함께')).toBeInTheDocument()
    expect(screen.getByText(/성장합니다/)).toBeInTheDocument()
  })

  it('renders the proof statement text', () => {
    render(<HeroSection />)
    expect(screen.getByText(/27년,/)).toBeInTheDocument()
    expect(screen.getAllByText(/120개 지점/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders CTA buttons with correct links', () => {
    render(<HeroSection />)

    const startupButton = screen.getByRole('link', { name: /창업 시작하기/ })
    expect(startupButton).toBeInTheDocument()
    expect(startupButton).toHaveAttribute('href', '/startup')

    const aboutButton = screen.getByRole('link', { name: /회사 소개/ })
    expect(aboutButton).toBeInTheDocument()
    expect(aboutButton).toHaveAttribute('href', '/about')
  })

  it('renders statistics in mobile view', () => {
    render(<HeroSection />)

    // Check for mobile stats (multiple instances due to both mobile and desktop)
    const yearStats = screen.getAllByText('27')
    expect(yearStats.length).toBeGreaterThanOrEqual(1)

    const branchStats = screen.getAllByText('120+')
    expect(branchStats.length).toBeGreaterThanOrEqual(1)

    const vehicleStats = screen.getAllByText('1200+')
    expect(vehicleStats.length).toBeGreaterThanOrEqual(1)

    const camperStats = screen.getAllByText('230+')
    expect(camperStats.length).toBeGreaterThanOrEqual(1)
  })

  it('renders statistics labels', () => {
    render(<HeroSection />)

    expect(screen.getAllByText('년 업력').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/전국 지점/).length).toBeGreaterThanOrEqual(1)
  })

  it('renders the #1 badge on desktop', () => {
    render(<HeroSection />)
    expect(screen.getByText('#1')).toBeInTheDocument()
  })

  it('renders the proof statement', () => {
    render(<HeroSection />)
    expect(screen.getByText(/27년,/)).toBeInTheDocument()
    // Use getAllByText since "120개 지점" appears multiple times
    expect(screen.getAllByText(/120개 지점/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText(/증명합니다/)).toBeInTheDocument()
  })
})
