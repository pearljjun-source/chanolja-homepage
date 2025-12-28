import { SPLIT_RATIO, BANK_CODES } from '@/lib/payments/types'

describe('Payment types and constants', () => {
  describe('SPLIT_RATIO', () => {
    it('should have branch ratio of 90%', () => {
      expect(SPLIT_RATIO.BRANCH).toBe(90)
    })

    it('should have HQ ratio of 10%', () => {
      expect(SPLIT_RATIO.HQ).toBe(10)
    })

    it('branch and HQ ratios should sum to 100%', () => {
      expect(SPLIT_RATIO.BRANCH + SPLIT_RATIO.HQ).toBe(100)
    })
  })

  describe('BANK_CODES', () => {
    it('should have mappings for major Korean banks', () => {
      expect(BANK_CODES['국민']).toBe('KOOKMIN')
      expect(BANK_CODES['신한']).toBe('SHINHAN')
      expect(BANK_CODES['우리']).toBe('WOORI')
      expect(BANK_CODES['하나']).toBe('HANA')
    })

    it('should have mapping for 농협', () => {
      expect(BANK_CODES['농협']).toBe('NONGHYUP')
    })

    it('should have mapping for 기업은행', () => {
      expect(BANK_CODES['기업']).toBe('IBK')
    })

    it('should have mappings for internet banks', () => {
      expect(BANK_CODES['카카오뱅크']).toBe('KAKAOBANK')
      expect(BANK_CODES['케이뱅크']).toBe('KBANK')
      expect(BANK_CODES['토스뱅크']).toBe('TOSSBANK')
    })

    it('should have mappings for regional banks', () => {
      expect(BANK_CODES['경남']).toBe('KYONGNAMBANK')
      expect(BANK_CODES['광주']).toBe('GWANGJUBANK')
      expect(BANK_CODES['대구']).toBe('DAEGUBANK')
      expect(BANK_CODES['부산']).toBe('BUSANBANK')
      expect(BANK_CODES['전북']).toBe('JEONBUKBANK')
      expect(BANK_CODES['제주']).toBe('JEJUBANK')
    })

    it('should have mappings for special banks', () => {
      expect(BANK_CODES['산업']).toBe('KDB')
      expect(BANK_CODES['수협']).toBe('SUHYUP')
      expect(BANK_CODES['우체국']).toBe('POST')
    })

    it('should have mappings for credit unions', () => {
      expect(BANK_CODES['새마을']).toBe('SAEMAUL')
      expect(BANK_CODES['신협']).toBe('SHINHYUP')
    })

    it('should have mapping for foreign banks', () => {
      expect(BANK_CODES['씨티']).toBe('CITI')
      expect(BANK_CODES['SC제일']).toBe('SC')
    })

    it('should have total of 22 bank mappings', () => {
      expect(Object.keys(BANK_CODES)).toHaveLength(22)
    })
  })

  describe('Payment calculation helpers', () => {
    it('should calculate correct split amounts for 100,000 won', () => {
      const totalAmount = 100000
      const branchAmount = Math.floor((totalAmount * SPLIT_RATIO.BRANCH) / 100)
      const hqAmount = totalAmount - branchAmount

      expect(branchAmount).toBe(90000)
      expect(hqAmount).toBe(10000)
    })

    it('should calculate correct split amounts for 55,000 won', () => {
      const totalAmount = 55000
      const branchAmount = Math.floor((totalAmount * SPLIT_RATIO.BRANCH) / 100)
      const hqAmount = totalAmount - branchAmount

      expect(branchAmount).toBe(49500)
      expect(hqAmount).toBe(5500)
    })

    it('should handle odd amounts correctly', () => {
      const totalAmount = 33333
      const branchAmount = Math.floor((totalAmount * SPLIT_RATIO.BRANCH) / 100)
      const hqAmount = totalAmount - branchAmount

      expect(branchAmount).toBe(29999)
      expect(hqAmount).toBe(3334)
      expect(branchAmount + hqAmount).toBe(totalAmount)
    })
  })
})
