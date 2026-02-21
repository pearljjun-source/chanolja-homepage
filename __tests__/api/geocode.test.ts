/**
 * @jest-environment node
 */

describe('Geocode API', () => {
  let mockFetch: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    jest.resetModules()
    // Set environment variable for tests
    process.env.KAKAO_REST_API_KEY = 'test-api-key'
    // Setup mock fetch
    mockFetch = jest.fn()
    global.fetch = mockFetch
  })

  afterEach(() => {
    delete process.env.KAKAO_REST_API_KEY
    jest.restoreAllMocks()
  })

  describe('POST /api/geocode', () => {
    it('should return coordinates for valid address', async () => {
      // Rate limit's Redis call consumes one fetch mock
      mockFetch.mockResolvedValueOnce({})
      // Geocode API call
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          documents: [{ x: '127.0276', y: '37.4979' }],
        }),
      })

      const { POST } = await import('@/app/api/geocode/route')

      const request = new Request('http://localhost:3000/api/geocode', {
        method: 'POST',
        body: JSON.stringify({ address: '서울시 강남구' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data.lat).toBe(37.4979)
      expect(json.data.lng).toBe(127.0276)
    })

    it('should return error when address is missing', async () => {
      const { POST } = await import('@/app/api/geocode/route')

      const request = new Request('http://localhost:3000/api/geocode', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('주소가 필요합니다')
      expect(response.status).toBe(400)
    })

    it('should return error when API key is not set', async () => {
      delete process.env.KAKAO_REST_API_KEY

      jest.resetModules()
      const { POST } = await import('@/app/api/geocode/route')

      const request = new Request('http://localhost:3000/api/geocode', {
        method: 'POST',
        body: JSON.stringify({ address: '서울시 강남구' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('카카오 API 키가 설정되지 않았습니다')
      expect(response.status).toBe(500)
    })

    it('should try normalized address when original fails', async () => {
      // Rate limit's Redis call consumes one fetch mock
      mockFetch.mockResolvedValueOnce({})
      // First call with original address returns empty
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({ documents: [] }),
      })
      // Second call with normalized address returns result
      mockFetch.mockResolvedValueOnce({
        json: () => Promise.resolve({
          documents: [{ x: '127.0', y: '37.5' }],
        }),
      })

      jest.resetModules()
      process.env.KAKAO_REST_API_KEY = 'test-api-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/geocode/route')

      const request = new Request('http://localhost:3000/api/geocode', {
        method: 'POST',
        body: JSON.stringify({ address: '서울시 강남구 테헤란로 123, 5층' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data.lat).toBe(37.5)
      expect(json.data.lng).toBe(127.0)
    })

    it('should return null coordinates when no results found at all', async () => {
      // All calls return empty
      mockFetch.mockResolvedValue({
        json: () => Promise.resolve({ documents: [] }),
      })

      jest.resetModules()
      process.env.KAKAO_REST_API_KEY = 'test-api-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/geocode/route')

      const request = new Request('http://localhost:3000/api/geocode', {
        method: 'POST',
        body: JSON.stringify({ address: '존재하지않는주소' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data.lat).toBeNull()
      expect(json.data.lng).toBeNull()
    })

    it('should handle fetch errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      jest.resetModules()
      process.env.KAKAO_REST_API_KEY = 'test-api-key'
      global.fetch = mockFetch

      const { POST } = await import('@/app/api/geocode/route')

      const request = new Request('http://localhost:3000/api/geocode', {
        method: 'POST',
        body: JSON.stringify({ address: '서울시 강남구' }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('좌표 변환 중 오류가 발생했습니다')
      expect(response.status).toBe(500)
    })
  })
})
