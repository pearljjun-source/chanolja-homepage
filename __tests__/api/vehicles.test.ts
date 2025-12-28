/**
 * @jest-environment node
 */

// Mock Supabase
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockEq = jest.fn()
const mockOrder = jest.fn()
const mockRange = jest.fn()
const mockSingle = jest.fn()
const mockFrom = jest.fn()

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: mockFrom,
  })),
}))

// Setup chain mocking
beforeEach(() => {
  jest.clearAllMocks()

  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
  })

  mockSelect.mockReturnValue({
    eq: mockEq,
  })

  mockEq.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
  })

  mockOrder.mockReturnValue({
    range: mockRange,
  })

  mockRange.mockResolvedValue({
    data: [],
    error: null,
    count: 0,
  })

  mockInsert.mockReturnValue({
    select: jest.fn().mockReturnValue({
      single: mockSingle,
    }),
  })

  mockSingle.mockResolvedValue({
    data: { id: 'test-id' },
    error: null,
  })
})

describe('Vehicles API', () => {
  describe('GET /api/vehicles', () => {
    it('should return vehicles list with pagination', async () => {
      const mockVehicles = [
        { id: '1', name: 'K5', price_per_day: 50000 },
        { id: '2', name: 'Sonata', price_per_day: 55000 },
      ]

      mockRange.mockResolvedValue({
        data: mockVehicles,
        error: null,
        count: 2,
      })

      // Import after mocking
      const { GET } = await import('@/app/api/vehicles/route')

      const request = new Request('http://localhost:3000/api/vehicles?page=1&page_size=20')
      const response = await GET(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.data).toEqual(mockVehicles)
      expect(json.total).toBe(2)
      expect(json.page).toBe(1)
      expect(json.pageSize).toBe(20)
    })

    it('should filter by branch_id when provided', async () => {
      mockRange.mockResolvedValue({
        data: [],
        error: null,
        count: 0,
      })

      const { GET } = await import('@/app/api/vehicles/route')

      const request = new Request('http://localhost:3000/api/vehicles?branch_id=test-branch')
      await GET(request as any)

      expect(mockEq).toHaveBeenCalledWith('is_active', true)
    })

    it('should handle database errors', async () => {
      mockRange.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
        count: 0,
      })

      const { GET } = await import('@/app/api/vehicles/route')

      const request = new Request('http://localhost:3000/api/vehicles')
      const response = await GET(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Database error')
      expect(response.status).toBe(500)
    })
  })

  describe('POST /api/vehicles', () => {
    it('should create a new vehicle with required fields', async () => {
      const newVehicle = {
        branch_id: 'test-branch',
        name: 'Test Car',
        price_per_day: 50000,
      }

      mockSingle.mockResolvedValue({
        data: { id: 'new-vehicle-id', ...newVehicle },
        error: null,
      })

      const { POST } = await import('@/app/api/vehicles/route')

      const request = new Request('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(newVehicle),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(true)
      expect(json.message).toBe('차량이 등록되었습니다.')
    })

    it('should return error when required fields are missing', async () => {
      const { POST } = await import('@/app/api/vehicles/route')

      const request = new Request('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test Car' }), // missing branch_id and price_per_day
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('필수 필드가 누락되었습니다.')
      expect(response.status).toBe(400)
    })

    it('should handle database insert errors', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Insert failed' },
      })

      const { POST } = await import('@/app/api/vehicles/route')

      const request = new Request('http://localhost:3000/api/vehicles', {
        method: 'POST',
        body: JSON.stringify({
          branch_id: 'test-branch',
          name: 'Test Car',
          price_per_day: 50000,
        }),
      })

      const response = await POST(request as any)
      const json = await response.json()

      expect(json.success).toBe(false)
      expect(json.error).toBe('Insert failed')
      expect(response.status).toBe(500)
    })
  })
})
