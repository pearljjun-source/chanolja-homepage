import { render, screen } from '@testing-library/react'
import Footer from '@/components/common/Footer'
import { HQ } from '@/lib/constants/company'

describe('Footer Component', () => {
  it('renders the logo', () => {
    render(<Footer />)
    const logo = screen.getByAltText('차놀자 로고')
    expect(logo).toBeInTheDocument()
  })

  it('renders company description', () => {
    render(<Footer />)
    expect(screen.getByText(new RegExp(HQ.experience))).toBeInTheDocument()
    expect(screen.getByText(new RegExp(HQ.branchCount))).toBeInTheDocument()
  })

  it('renders GROW TOGETHER slogan', () => {
    render(<Footer />)
    expect(screen.getByText(HQ.slogan)).toBeInTheDocument()
    expect(screen.getByText(HQ.sloganKo)).toBeInTheDocument()
  })

  it('renders quick links section', () => {
    render(<Footer />)
    expect(screen.getByText('바로가기')).toBeInTheDocument()

    const aboutLink = screen.getByRole('link', { name: '회사소개' })
    expect(aboutLink).toHaveAttribute('href', '/about')

    const startupLink = screen.getByRole('link', { name: '렌트카창업' })
    expect(startupLink).toHaveAttribute('href', '/startup')

    const newsLink = screen.getByRole('link', { name: '뉴스룸' })
    expect(newsLink).toHaveAttribute('href', '/news')

    const branchesLink = screen.getByRole('link', { name: '지점현황' })
    expect(branchesLink).toHaveAttribute('href', '/branches')
  })

  it('renders contact information', () => {
    render(<Footer />)
    expect(screen.getByText('연락처')).toBeInTheDocument()
    expect(screen.getByText('대표전화')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: HQ.phone })).toBeInTheDocument()
    expect(screen.getByText('운영시간')).toBeInTheDocument()
    expect(screen.getByText(HQ.operatingHours)).toBeInTheDocument()
    expect(screen.getByText('본사 위치')).toBeInTheDocument()
    expect(screen.getByText(HQ.address)).toBeInTheDocument()
  })

  it('renders social media links', () => {
    render(<Footer />)
    expect(screen.getByText('공식 채널')).toBeInTheDocument()

    const cafeLink = screen.getByRole('link', { name: /카페/ })
    expect(cafeLink).toHaveAttribute('href', 'https://cafe.naver.com/chanolja')
    expect(cafeLink).toHaveAttribute('target', '_blank')
    expect(cafeLink).toHaveAttribute('rel', 'noopener noreferrer')

    const youtubeLink = screen.getByRole('link', { name: /유튜브/ })
    expect(youtubeLink).toHaveAttribute('href', 'https://www.youtube.com/channel/UCjBtbct7aCsJ4fo0S4g5bRQ')

    const instaLink = screen.getByRole('link', { name: /인스타/ })
    expect(instaLink).toHaveAttribute('href', 'https://www.instagram.com/chanolja.official/')

    const blogLink = screen.getByRole('link', { name: /블로그/ })
    expect(blogLink).toHaveAttribute('href', 'https://blog.naver.com/chanolja_official_')
  })

  it('renders company legal information', () => {
    render(<Footer />)
    expect(screen.getByText(HQ.companyName)).toBeInTheDocument()
    expect(screen.getByText(`대표 ${HQ.ceo}`)).toBeInTheDocument()
    expect(screen.getByText(`사업자등록번호: ${HQ.businessNumber}`)).toBeInTheDocument()
  })

  it('renders copyright with current year', () => {
    render(<Footer />)
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(`© ${currentYear} ${HQ.brandNameEn}`)).toBeInTheDocument()
  })

  it('renders admin link', () => {
    render(<Footer />)
    const adminLink = screen.getByRole('link', { name: '관리자' })
    expect(adminLink).toHaveAttribute('href', '/login')
  })

  it('phone link has tel: protocol', () => {
    render(<Footer />)
    const phoneLink = screen.getByRole('link', { name: HQ.phone })
    expect(phoneLink).toHaveAttribute('href', `tel:${HQ.phone}`)
  })
})
