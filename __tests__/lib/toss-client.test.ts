/**
 * @jest-environment node
 */

import { calculateSplitAmounts } from '@/lib/payments/toss-client'
import { SPLIT_RATIO } from '@/lib/payments/types'

describe('Toss Client', () => {
  describe('calculateSplitAmounts', () => {
    it('should calculate correct split for 100,000 won', () => {
      const result = calculateSplitAmounts(100000)

      expect(result.branchAmount).toBe(90000)
      expect(result.hqAmount).toBe(10000)
      expect(result.branchRatio).toBe(SPLIT_RATIO.BRANCH)
      expect(result.hqRatio).toBe(SPLIT_RATIO.HQ)
    })

    it('should calculate correct split for 55,000 won', () => {
      const result = calculateSplitAmounts(55000)

      expect(result.hqAmount).toBe(5500)
      expect(result.branchAmount).toBe(49500)
      expect(result.branchAmount + result.hqAmount).toBe(55000)
    })

    it('should handle odd amounts with rounding', () => {
      const result = calculateSplitAmounts(33333)

      // HQ gets 10% rounded: Math.round(33333 * 0.1) = 3333
      expect(result.hqAmount).toBe(3333)
      // Branch gets the rest: 33333 - 3333 = 30000
      expect(result.branchAmount).toBe(30000)
      // Total should equal original
      expect(result.branchAmount + result.hqAmount).toBe(33333)
    })

    it('should handle small amounts', () => {
      const result = calculateSplitAmounts(100)

      expect(result.hqAmount).toBe(10)
      expect(result.branchAmount).toBe(90)
    })

    it('should handle zero amount', () => {
      const result = calculateSplitAmounts(0)

      expect(result.hqAmount).toBe(0)
      expect(result.branchAmount).toBe(0)
    })

    it('should handle large amounts', () => {
      const result = calculateSplitAmounts(10000000) // 1천만원

      expect(result.hqAmount).toBe(1000000)
      expect(result.branchAmount).toBe(9000000)
    })

    it('should always return correct ratios', () => {
      const amounts = [1000, 5000, 12345, 99999, 500000]

      amounts.forEach((amount) => {
        const result = calculateSplitAmounts(amount)
        expect(result.branchRatio).toBe(90)
        expect(result.hqRatio).toBe(10)
      })
    })

    it('should ensure branch + hq equals total for various amounts', () => {
      const testAmounts = [1, 10, 100, 1000, 12345, 99999, 100000, 1000000]

      testAmounts.forEach((amount) => {
        const result = calculateSplitAmounts(amount)
        expect(result.branchAmount + result.hqAmount).toBe(amount)
      })
    })
  })
})
