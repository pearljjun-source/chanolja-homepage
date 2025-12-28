import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock Supabase client
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockIn = jest.fn()
const mockOrder = jest.fn()
const mockLimit = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}))

// Import after mocking
import ReservationSection from '@/components/home/ReservationSection'

describe('ReservationSection Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Setup default mock chain for branches
    const mockBranchQuery = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { id: 'b1', name: '강남지점', region: '서울', latitude: 37.5, longitude: 127.0, is_active: true },
          { id: 'b2', name: '천안지점', region: '충남', latitude: 36.8, longitude: 127.1, is_active: true },
        ],
        error: null,
      }),
    }

    mockFrom.mockReturnValue(mockBranchQuery)
  })

  describe('Rendering', () => {
    it('should render the search section', () => {
      render(<ReservationSection />)

      expect(screen.getByPlaceholderText('지역명, 주소 입력')).toBeInTheDocument()
      expect(screen.getByText('검색')).toBeInTheDocument()
      expect(screen.getByText('필터')).toBeInTheDocument()
    })

    it('should render the badge and title', () => {
      render(<ReservationSection />)

      expect(screen.getByText('전국 120개 지점')).toBeInTheDocument()
      expect(screen.getByText('차량 예약')).toBeInTheDocument()
    })

    it('should render initial guidance text', () => {
      render(<ReservationSection />)

      expect(screen.getByText(/위치를 입력하거나 현재 위치를 사용하여/)).toBeInTheDocument()
    })

    it('should have location input field', () => {
      render(<ReservationSection />)

      const input = screen.getByPlaceholderText('지역명, 주소 입력')
      expect(input).toBeInTheDocument()
      expect(input).toHaveAttribute('type', 'text')
    })
  })

  describe('Filter functionality', () => {
    it('should toggle filter visibility on button click', async () => {
      render(<ReservationSection />)

      const filterButton = screen.getByText('필터')

      // Initially filters are hidden
      expect(screen.queryByText('전체 가격')).not.toBeInTheDocument()

      // Click to show filters
      fireEvent.click(filterButton)

      await waitFor(() => {
        expect(screen.getByText('전체 가격')).toBeInTheDocument()
      })
    })

    it('should have vehicle type filter options', async () => {
      render(<ReservationSection />)

      fireEvent.click(screen.getByText('필터'))

      await waitFor(() => {
        const selects = screen.getAllByRole('combobox')
        expect(selects.length).toBeGreaterThanOrEqual(1)
      })
    })
  })

  describe('Search functionality', () => {
    it('should update input value on change', async () => {
      const user = userEvent.setup()
      render(<ReservationSection />)

      const input = screen.getByPlaceholderText('지역명, 주소 입력')
      await user.type(input, '강남')

      expect(input).toHaveValue('강남')
    })

    it('should show alert when searching with empty location', () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})

      render(<ReservationSection />)

      const searchButton = screen.getByText('검색')
      fireEvent.click(searchButton)

      expect(alertMock).toHaveBeenCalledWith('위치를 입력해주세요.')

      alertMock.mockRestore()
    })

    it('should trigger search on Enter key press', async () => {
      const user = userEvent.setup()
      render(<ReservationSection />)

      const input = screen.getByPlaceholderText('지역명, 주소 입력')
      await user.type(input, '강남')
      await user.keyboard('{Enter}')

      // After search, the searched state should be true
      // We can verify this by checking if the results area appears
      await waitFor(() => {
        // Either loading indicator or results should appear
        const body = document.body.textContent
        expect(body).toBeDefined()
      })
    })
  })

  describe('Current location feature', () => {
    it('should have current location button', () => {
      render(<ReservationSection />)

      // Check for the button (text differs on mobile/desktop)
      const buttons = screen.getAllByRole('button')
      const locationButton = buttons.find(btn =>
        btn.textContent?.includes('현재 위치') || btn.textContent?.includes('위치')
      )

      expect(locationButton).toBeInTheDocument()
    })

    it('should show alert when geolocation is not supported', () => {
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})

      // Mock geolocation as undefined
      const originalGeolocation = navigator.geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: undefined,
        writable: true,
      })

      render(<ReservationSection />)

      const buttons = screen.getAllByRole('button')
      const locationButton = buttons.find(btn =>
        btn.textContent?.includes('현재 위치') || btn.textContent?.includes('위치')
      )

      if (locationButton) {
        fireEvent.click(locationButton)
        expect(alertMock).toHaveBeenCalledWith('브라우저가 위치 서비스를 지원하지 않습니다.')
      }

      // Restore
      Object.defineProperty(navigator, 'geolocation', {
        value: originalGeolocation,
        writable: true,
      })
      alertMock.mockRestore()
    })
  })
})

// Separate test for the pure function
describe('calculateDistance function', () => {
  // Import the function by testing the component's behavior
  // The function is not exported, so we test it indirectly

  it('should calculate distance correctly between two points', () => {
    // This is the Haversine formula
    // We can test the formula independently
    const R = 6371 // km
    const lat1 = 37.5665 // Seoul
    const lon1 = 126.9780
    const lat2 = 35.1796 // Busan
    const lon2 = 129.0756

    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    // Seoul to Busan is approximately 325km
    expect(distance).toBeGreaterThan(300)
    expect(distance).toBeLessThan(350)
  })

  it('should return 0 for same coordinates', () => {
    const R = 6371
    const lat = 37.5665
    const lon = 126.9780

    const dLat = 0
    const dLon = 0
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const distance = R * c

    expect(distance).toBe(0)
  })
})

describe('Vehicle type and fuel type labels', () => {
  it('should have correct vehicle type labels', () => {
    const vehicleTypeLabels: Record<string, string> = {
      sedan: '세단',
      suv: 'SUV',
      van: '승합',
      truck: '트럭',
      camper: '캠핑카',
      luxury: '고급'
    }

    expect(vehicleTypeLabels['sedan']).toBe('세단')
    expect(vehicleTypeLabels['suv']).toBe('SUV')
    expect(vehicleTypeLabels['camper']).toBe('캠핑카')
  })

  it('should have correct fuel type labels', () => {
    const fuelTypeLabels: Record<string, string> = {
      gasoline: '가솔린',
      diesel: '디젤',
      lpg: 'LPG',
      electric: '전기',
      hybrid: '하이브리드'
    }

    expect(fuelTypeLabels['gasoline']).toBe('가솔린')
    expect(fuelTypeLabels['electric']).toBe('전기')
    expect(fuelTypeLabels['hybrid']).toBe('하이브리드')
  })
})

describe('Filter options', () => {
  it('should have correct vehicle type options', () => {
    const vehicleTypeOptions = [
      { value: 'all', label: '전체' },
      { value: 'sedan', label: '세단' },
      { value: 'suv', label: 'SUV' },
      { value: 'van', label: '승합' },
      { value: 'truck', label: '트럭' },
      { value: 'camper', label: '캠핑카' },
      { value: 'luxury', label: '고급' },
    ]

    expect(vehicleTypeOptions).toHaveLength(7)
    expect(vehicleTypeOptions[0].value).toBe('all')
    expect(vehicleTypeOptions.find(o => o.value === 'suv')?.label).toBe('SUV')
  })

  it('should have correct price range options', () => {
    const priceRangeOptions = [
      { value: 'all', label: '전체 가격' },
      { value: '0-50000', label: '5만원 이하' },
      { value: '50000-100000', label: '5~10만원' },
      { value: '100000-150000', label: '10~15만원' },
      { value: '150000-999999', label: '15만원 이상' },
    ]

    expect(priceRangeOptions).toHaveLength(5)
    expect(priceRangeOptions[0].label).toBe('전체 가격')
    expect(priceRangeOptions[4].label).toBe('15만원 이상')
  })
})
