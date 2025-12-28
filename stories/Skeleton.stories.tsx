import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  Skeleton,
  TextSkeleton,
  AvatarSkeleton,
  CardSkeleton,
  VehicleCardSkeleton,
  NewsCardSkeleton,
  ListItemSkeleton,
  TableSkeleton,
  FormSkeleton,
  StatCardSkeleton,
  PageHeaderSkeleton,
  PageLoadingSkeleton,
} from '../components/ui/Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '데이터 로딩 중 표시되는 스켈레톤 UI 컴포넌트입니다. 사용자에게 곧 내용이 표시될 것임을 알려줍니다.',
      },
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 스켈레톤
export const Default: Story = {
  render: () => (
    <div className="w-80 space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  ),
}

// 텍스트 스켈레톤
export const Text: Story = {
  render: () => (
    <div className="w-80">
      <TextSkeleton lines={4} />
    </div>
  ),
}

// 아바타 스켈레톤
export const Avatar: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <AvatarSkeleton size="sm" />
      <AvatarSkeleton size="md" />
      <AvatarSkeleton size="lg" />
    </div>
  ),
}

// 카드 스켈레톤
export const Card: Story = {
  render: () => (
    <div className="w-72">
      <CardSkeleton />
    </div>
  ),
}

// 차량 카드 스켈레톤
export const VehicleCard: Story = {
  render: () => (
    <div className="w-72">
      <VehicleCardSkeleton />
    </div>
  ),
}

// 뉴스 카드 스켈레톤
export const NewsCard: Story = {
  render: () => (
    <div className="w-80">
      <NewsCardSkeleton />
    </div>
  ),
}

// 리스트 아이템 스켈레톤
export const ListItem: Story = {
  render: () => (
    <div className="w-96 space-y-2">
      <ListItemSkeleton />
      <ListItemSkeleton />
      <ListItemSkeleton />
    </div>
  ),
}

// 테이블 스켈레톤
export const Table: Story = {
  render: () => (
    <div className="w-[600px]">
      <TableSkeleton rows={5} columns={4} />
    </div>
  ),
}

// 폼 스켈레톤
export const Form: Story = {
  render: () => (
    <div className="w-80">
      <FormSkeleton fields={4} />
    </div>
  ),
}

// 통계 카드 스켈레톤
export const StatCard: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[600px]">
      <StatCardSkeleton />
      <StatCardSkeleton />
      <StatCardSkeleton />
    </div>
  ),
}

// 페이지 헤더 스켈레톤
export const PageHeader: Story = {
  render: () => (
    <div className="w-96">
      <PageHeaderSkeleton />
    </div>
  ),
}

// 전체 페이지 로딩 스켈레톤
export const PageLoading: Story = {
  render: () => (
    <div className="w-[400px] h-[300px]">
      <PageLoadingSkeleton />
    </div>
  ),
}

// 차량 목록 로딩 예시
export const VehicleListLoading: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 w-[900px]">
      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
      <VehicleCardSkeleton />
    </div>
  ),
  parameters: {
    layout: 'padded',
  },
}

// 대시보드 로딩 예시
export const DashboardLoading: Story = {
  render: () => (
    <div className="w-[800px] space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-4 gap-4">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <TableSkeleton rows={5} columns={5} />
    </div>
  ),
  parameters: {
    layout: 'padded',
    backgrounds: { default: 'slate' },
  },
}
