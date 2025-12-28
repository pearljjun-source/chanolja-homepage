import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { ToastProvider, useToast } from '../components/ui/Toast'
import Button from '../components/ui/Button'

// Toast 데모 컴포넌트
function ToastDemo() {
  const toast = useToast()

  return (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary" onClick={() => toast.success('성공!', '작업이 완료되었습니다.')}>
        Success Toast
      </Button>
      <Button variant="danger" onClick={() => toast.error('오류 발생', '작업을 완료할 수 없습니다.')}>
        Error Toast
      </Button>
      <Button variant="secondary" onClick={() => toast.warning('주의', '이 작업은 되돌릴 수 없습니다.')}>
        Warning Toast
      </Button>
      <Button variant="outline" onClick={() => toast.info('안내', '새로운 업데이트가 있습니다.')}>
        Info Toast
      </Button>
    </div>
  )
}

// 여러 토스트 데모
function MultipleToastDemo() {
  const toast = useToast()

  const showAllToasts = () => {
    toast.success('저장 완료', '변경사항이 저장되었습니다.')
    setTimeout(() => toast.info('동기화 중', '서버와 동기화하고 있습니다.'), 500)
    setTimeout(() => toast.warning('용량 부족', '저장 공간이 부족합니다.'), 1000)
    setTimeout(() => toast.error('연결 끊김', '네트워크 연결을 확인해주세요.'), 1500)
  }

  return (
    <Button onClick={showAllToasts}>모든 토스트 표시</Button>
  )
}

// 예약 시나리오 데모
function ReservationDemo() {
  const toast = useToast()

  const handleReservation = () => {
    toast.info('처리 중', '예약을 진행하고 있습니다...')
    setTimeout(() => {
      toast.success('예약 완료!', '예약이 성공적으로 완료되었습니다. 확인 메일을 보내드렸습니다.')
    }, 2000)
  }

  const handleError = () => {
    toast.error('예약 실패', '선택하신 날짜에 차량이 없습니다. 다른 날짜를 선택해주세요.')
  }

  return (
    <div className="flex gap-4">
      <Button variant="primary" onClick={handleReservation}>예약하기 (성공)</Button>
      <Button variant="outline" onClick={handleError}>예약하기 (실패)</Button>
    </div>
  )
}

const meta: Meta = {
  title: 'UI/Toast',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          '화면 구석에 잠깐 나타났다 사라지는 알림 메시지입니다. 예약 완료, 저장 성공, 에러 발생 등을 사용자에게 알릴 때 사용합니다.',
      },
    },
  },
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// 기본 토스트
export const Default: Story = {
  render: () => <ToastDemo />,
}

// 여러 토스트
export const Multiple: Story = {
  render: () => <MultipleToastDemo />,
}

// 예약 시나리오
export const ReservationScenario: Story = {
  render: () => <ReservationDemo />,
  parameters: {
    docs: {
      description: {
        story: '실제 예약 과정에서 사용되는 토스트 예시입니다.',
      },
    },
  },
}

// 토스트 타입별 미리보기
export const AllTypes: Story = {
  render: () => {
    const toast = useToast()

    return (
      <div className="space-y-4">
        <p className="text-sm text-slate-500 mb-4">
          각 버튼을 클릭하면 해당 타입의 토스트가 표시됩니다.
        </p>
        <div className="grid grid-cols-2 gap-4 w-80">
          <Button
            variant="primary"
            size="sm"
            fullWidth
            onClick={() => toast.success('성공', '작업이 완료되었습니다.')}
          >
            Success
          </Button>
          <Button
            variant="danger"
            size="sm"
            fullWidth
            onClick={() => toast.error('오류', '문제가 발생했습니다.')}
          >
            Error
          </Button>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => toast.warning('경고', '주의가 필요합니다.')}
          >
            Warning
          </Button>
          <Button
            variant="outline"
            size="sm"
            fullWidth
            onClick={() => toast.info('정보', '참고해주세요.')}
          >
            Info
          </Button>
        </div>
      </div>
    )
  },
}
