'use client'

import { useEffect, useState, useRef } from 'react'
import { Building2, MapPin, Users, Car } from 'lucide-react'

const stats = [
  {
    icon: Building2,
    value: 27,
    suffix: '년',
    label: '자동차 업계 경력',
    description: '1998년부터 시작된 신뢰',
  },
  {
    icon: MapPin,
    value: 120,
    suffix: '+',
    label: '전국 지점 수',
    description: '전국 최대 렌트카 네트워크',
  },
  {
    icon: Users,
    value: 1200,
    suffix: '+',
    label: '자동차보유 대수',
    description: '전국 네트워크 총 보유 차량',
  },
  {
    icon: Car,
    value: 230,
    suffix: '+',
    label: '캠핑카 보유',
    description: '국내 최대 캠핑카 플랫폼',
  },
]

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const duration = 2000
    const steps = 60
    const increment = value / steps
    let current = 0

    const timer = setInterval(() => {
      current += increment
      if (current >= value) {
        setCount(value)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(timer)
  }, [isVisible, value])

  return (
    <div ref={ref} className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-primary">
      {count}
      <span className="text-xl sm:text-2xl lg:text-3xl">{suffix}</span>
    </div>
  )
}

export default function StatsSection() {
  return (
    <section className="py-12 lg:py-20 bg-gray-50">
      <div className="container-custom px-4">
        <div className="text-center mb-8 lg:mb-16">
          <h2 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-dark mb-3 lg:mb-4">
            <span className="text-primary">차놀자</span>가 걸어온 길
          </h2>
          <p className="text-sm lg:text-base text-gray-600 max-w-2xl mx-auto">
            자동차 판매 업계 출신 경력에 기초하여 빠르게 변화하는 자동차 시장에서
            <br className="hidden sm:block" />
            소비자의 다양한 필요에 맞는 상품을 개발하고 있습니다.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white rounded-xl lg:rounded-2xl p-4 lg:p-8 text-center shadow-md lg:shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 bg-primary/10 rounded-xl lg:rounded-2xl mb-3 lg:mb-6">
                <stat.icon className="w-6 h-6 lg:w-8 lg:h-8 text-primary" />
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              <p className="text-sm lg:text-lg font-semibold text-dark mt-1 lg:mt-2">{stat.label}</p>
              <p className="text-xs lg:text-sm text-gray-500 mt-1 hidden sm:block">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
