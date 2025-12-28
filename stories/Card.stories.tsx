import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  VehicleCard,
  NewsCard,
  StatCard,
} from '../components/ui/Card'
import Button from '../components/ui/Button'
import { Car, TrendingUp, Users, Calendar } from 'lucide-react'

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '다양한 콘텐츠를 담을 수 있는 카드 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
      description: '카드 스타일 변형',
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
      description: '내부 여백',
    },
    hoverable: {
      control: 'boolean',
      description: '호버 효과 적용',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 카드
export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>카드 제목</CardTitle>
        <CardDescription>카드에 대한 간단한 설명입니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">
          여기에 카드의 주요 내용이 들어갑니다. 텍스트, 이미지, 또는 다른 컴포넌트를
          포함할 수 있습니다.
        </p>
      </CardContent>
      <CardFooter>
        <Button size="sm">자세히 보기</Button>
      </CardFooter>
    </Card>
  ),
}

// 변형들
export const Variants: Story = {
  render: () => (
    <div className="flex gap-4">
      <Card variant="default" className="w-64">
        <CardTitle>Default</CardTitle>
        <p className="text-sm text-slate-500 mt-2">기본 테두리 스타일</p>
      </Card>
      <Card variant="elevated" className="w-64">
        <CardTitle>Elevated</CardTitle>
        <p className="text-sm text-slate-500 mt-2">그림자 스타일</p>
      </Card>
      <Card variant="outlined" className="w-64">
        <CardTitle>Outlined</CardTitle>
        <p className="text-sm text-slate-500 mt-2">두꺼운 테두리 스타일</p>
      </Card>
    </div>
  ),
}

// 호버 효과
export const Hoverable: Story = {
  render: () => (
    <Card hoverable className="w-72">
      <CardHeader>
        <CardTitle>호버 가능한 카드</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">마우스를 올려보세요!</p>
      </CardContent>
    </Card>
  ),
}

// 차량 카드
export const Vehicle: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[900px]">
      <VehicleCard
        name="아반떼"
        brand="현대자동차"
        pricePerDay={50000}
        seats={5}
        fuelType="가솔린"
        isAvailable={true}
      />
      <VehicleCard
        name="그랜저"
        brand="현대자동차"
        pricePerDay={80000}
        seats={5}
        fuelType="가솔린"
        isAvailable={true}
      />
      <VehicleCard
        name="카니발"
        brand="기아자동차"
        pricePerDay={120000}
        seats={9}
        fuelType="디젤"
        isAvailable={false}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}

// 뉴스 카드
export const News: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[900px]">
      <NewsCard
        title="차놀자, 전국 120호점 돌파"
        category="소식"
        date="2024.01.15"
        excerpt="차놀자가 전국 120개 지점을 돌파하며 빠르게 성장하고 있습니다."
      />
      <NewsCard
        title="신규 캠핑카 라인업 출시"
        category="신차"
        date="2024.01.10"
        excerpt="새로운 캠핑카 라인업이 출시되었습니다. 가족 여행에 최적화된 모델입니다."
      />
      <NewsCard
        title="겨울철 차량 관리 팁"
        category="팁"
        date="2024.01.05"
        excerpt="추운 겨울, 차량을 안전하게 관리하는 방법을 알려드립니다."
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'slate' },
  },
}

// 통계 카드
export const Stats: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 w-[800px]">
      <StatCard
        title="총 예약"
        value="1,234"
        change="+12% 지난 달 대비"
        changeType="increase"
        icon={<Calendar className="w-5 h-5" />}
      />
      <StatCard
        title="이용 고객"
        value="856"
        change="+8% 지난 달 대비"
        changeType="increase"
        icon={<Users className="w-5 h-5" />}
      />
      <StatCard
        title="보유 차량"
        value="45"
        change="변동 없음"
        changeType="neutral"
        icon={<Car className="w-5 h-5" />}
      />
      <StatCard
        title="매출"
        value="₩12.5M"
        change="-3% 지난 달 대비"
        changeType="decrease"
        icon={<TrendingUp className="w-5 h-5" />}
      />
    </div>
  ),
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'slate' },
  },
}

// 전체 조합
export const CompleteExample: Story = {
  render: () => (
    <Card variant="elevated" className="w-96">
      <div className="aspect-video bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-xl -mx-4 -mt-4 mb-4 flex items-center justify-center">
        <Car className="w-16 h-16 text-primary/40" />
      </div>
      <CardHeader>
        <CardTitle>프리미엄 렌트 서비스</CardTitle>
        <CardDescription>
          고급 차량을 합리적인 가격에 이용하세요
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            24시간 고객 지원
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            무료 픽업 & 딜리버리
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-primary rounded-full" />
            완전 자차보험 포함
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button fullWidth>예약하기</Button>
        <Button variant="outline" fullWidth>
          자세히 보기
        </Button>
      </CardFooter>
    </Card>
  ),
}
