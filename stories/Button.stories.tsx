import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Button from '../components/ui/Button'
import { ArrowRight, Download, Plus, Trash2 } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '다양한 스타일과 크기를 지원하는 버튼 컴포넌트입니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger'],
      description: '버튼 스타일 변형',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '버튼 크기',
    },
    isLoading: {
      control: 'boolean',
      description: '로딩 상태',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
    fullWidth: {
      control: 'boolean',
      description: '전체 너비 사용',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 버튼
export const Default: Story = {
  args: {
    children: '버튼',
  },
}

// Primary 버튼
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '예약하기',
  },
}

// Secondary 버튼
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '취소',
  },
}

// Outline 버튼
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '자세히 보기',
  },
}

// Ghost 버튼
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '더보기',
  },
}

// Danger 버튼
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '삭제',
  },
}

// 크기 변형
export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
}

// 아이콘 포함
export const WithIcons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Button leftIcon={<Plus className="w-4 h-4" />}>새 항목 추가</Button>
      <Button rightIcon={<ArrowRight className="w-4 h-4" />}>다음 단계</Button>
      <Button leftIcon={<Download className="w-4 h-4" />} variant="outline">
        다운로드
      </Button>
      <Button leftIcon={<Trash2 className="w-4 h-4" />} variant="danger">
        삭제하기
      </Button>
    </div>
  ),
}

// 로딩 상태
export const Loading: Story = {
  args: {
    isLoading: true,
    children: '처리 중...',
  },
}

// 비활성화 상태
export const Disabled: Story = {
  args: {
    disabled: true,
    children: '비활성화됨',
  },
}

// 전체 너비
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: '전체 너비 버튼',
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

// 모든 변형 미리보기
export const AllVariants: Story = {
  render: () => (
    <div className="grid gap-4">
      <div className="flex items-center gap-4">
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="primary" disabled>Primary</Button>
        <Button variant="secondary" disabled>Secondary</Button>
        <Button variant="outline" disabled>Outline</Button>
        <Button variant="ghost" disabled>Ghost</Button>
        <Button variant="danger" disabled>Danger</Button>
      </div>
    </div>
  ),
}
