import { render, screen } from '@testing-library/react'
import Header from '@/components/common/Header'

describe('Header Component', () => {
  it('renders the logo', () => {
    render(<Header />)
    const logo = screen.getByAltText('차놀자 로고')
    expect(logo).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Header />)

    // Desktop navigation (hidden on mobile)
    expect(screen.getAllByText('회사소개')).toBeTruthy()
    expect(screen.getAllByText('렌트카창업')).toBeTruthy()
    expect(screen.getAllByText('뉴스룸')).toBeTruthy()
    expect(screen.getAllByText('지점현황')).toBeTruthy()
  })

  it('renders phone number link', () => {
    render(<Header />)
    const phoneLinks = screen.getAllByRole('link', { name: /041-522-7000/i })
    expect(phoneLinks.length).toBeGreaterThan(0)
  })

  it('renders 창업 문의 button', () => {
    render(<Header />)
    const ctaButton = screen.getByRole('link', { name: '창업 문의' })
    expect(ctaButton).toBeInTheDocument()
    expect(ctaButton).toHaveAttribute('href', '/startup#inquiry')
  })

  it('renders mobile bottom navigation with all items', () => {
    render(<Header />)

    // Mobile navigation includes '홈'
    const homeLinks = screen.getAllByText('홈')
    expect(homeLinks.length).toBeGreaterThan(0)
  })

  it('has correct link hrefs', () => {
    render(<Header />)

    // Check that links have correct hrefs
    const aboutLinks = screen.getAllByRole('link', { name: '회사소개' })
    expect(aboutLinks[0]).toHaveAttribute('href', '/about')

    const startupLinks = screen.getAllByRole('link', { name: '렌트카창업' })
    expect(startupLinks[0]).toHaveAttribute('href', '/startup')

    const newsLinks = screen.getAllByRole('link', { name: '뉴스룸' })
    expect(newsLinks[0]).toHaveAttribute('href', '/news')

    const branchLinks = screen.getAllByRole('link', { name: '지점현황' })
    expect(branchLinks[0]).toHaveAttribute('href', '/branches')
  })

  it('has phone call link with tel: protocol', () => {
    render(<Header />)
    const phoneLinks = screen.getAllByRole('link', { name: /041-522-7000/i })
    const phoneLink = phoneLinks.find(link => link.getAttribute('href')?.startsWith('tel:'))
    expect(phoneLink).toHaveAttribute('href', 'tel:041-522-7000')
  })
})
