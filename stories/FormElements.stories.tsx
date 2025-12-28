import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  TextareaInput,
  SelectInput,
  CheckboxInput,
  DateInput,
  TimeInput,
  PhoneInput,
} from '../components/ui/FormInput'

// Textarea 스토리
export const Textarea: StoryObj<typeof TextareaInput> = {
  render: () => (
    <div className="w-80 space-y-4">
      <TextareaInput
        label="요청사항"
        placeholder="요청사항을 입력해주세요"
        rows={4}
      />
      <TextareaInput
        label="상세 설명"
        placeholder="상세 설명을 입력해주세요"
        helperText="최대 500자까지 입력 가능합니다"
        rows={4}
      />
      <TextareaInput
        label="에러 상태"
        value="너무 짧은 내용"
        error="최소 20자 이상 입력해주세요"
        rows={4}
      />
    </div>
  ),
}

// Select 스토리
export const Select: StoryObj<typeof SelectInput> = {
  render: () => (
    <div className="w-80 space-y-4">
      <SelectInput
        label="차량 유형"
        placeholder="선택하세요"
        options={[
          { value: 'sedan', label: '세단' },
          { value: 'suv', label: 'SUV' },
          { value: 'van', label: '밴' },
          { value: 'truck', label: '트럭' },
        ]}
      />
      <SelectInput
        label="지역"
        required
        placeholder="지역을 선택하세요"
        options={[
          { value: 'seoul', label: '서울' },
          { value: 'busan', label: '부산' },
          { value: 'daegu', label: '대구' },
          { value: 'incheon', label: '인천' },
        ]}
      />
      <SelectInput
        label="에러 상태"
        error="필수 선택 항목입니다"
        placeholder="선택하세요"
        options={[
          { value: 'option1', label: '옵션 1' },
          { value: 'option2', label: '옵션 2' },
        ]}
      />
    </div>
  ),
}

// Checkbox 스토리
export const Checkbox: StoryObj<typeof CheckboxInput> = {
  render: () => (
    <div className="w-80 space-y-4">
      <CheckboxInput label="이용약관에 동의합니다" />
      <CheckboxInput label="개인정보 처리방침에 동의합니다 (필수)" />
      <CheckboxInput label="마케팅 정보 수신에 동의합니다 (선택)" />
      <CheckboxInput label="비활성화된 체크박스" disabled />
      <CheckboxInput label="에러 상태" error="필수 항목에 동의해주세요" />
    </div>
  ),
}

// Date & Time 스토리
export const DateAndTime: StoryObj<typeof DateInput> = {
  render: () => (
    <div className="w-80 space-y-4">
      <DateInput label="대여 시작일" required />
      <DateInput label="반납일" required />
      <TimeInput label="픽업 시간" />
      <TimeInput label="반납 시간" />
    </div>
  ),
}

// Phone 스토리
export const Phone: StoryObj<typeof PhoneInput> = {
  render: () => (
    <div className="w-80 space-y-4">
      <PhoneInput label="연락처" required />
      <PhoneInput
        label="비상 연락처"
        helperText="긴급 상황 시 연락 가능한 번호"
      />
      <PhoneInput label="에러 상태" error="올바른 전화번호 형식이 아닙니다" />
    </div>
  ),
}

// 전체 폼 예시
export const CompleteForm: StoryObj = {
  render: () => (
    <div className="w-96 p-6 bg-white rounded-xl shadow-lg space-y-4">
      <h3 className="text-lg font-bold text-slate-800 mb-4">예약 정보 입력</h3>
      <div className="grid grid-cols-2 gap-4">
        <DateInput label="대여일" required />
        <TimeInput label="시간" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <DateInput label="반납일" required />
        <TimeInput label="시간" />
      </div>
      <SelectInput
        label="차량 유형"
        required
        placeholder="선택하세요"
        options={[
          { value: 'sedan', label: '세단' },
          { value: 'suv', label: 'SUV' },
          { value: 'van', label: '밴' },
        ]}
      />
      <PhoneInput label="연락처" required />
      <TextareaInput label="요청사항" placeholder="요청사항을 입력해주세요" rows={3} />
      <CheckboxInput label="이용약관에 동의합니다" />
    </div>
  ),
  parameters: {
    layout: 'centered',
    backgrounds: { default: 'slate' },
  },
}

const meta: Meta = {
  title: 'UI/Form/FormElements',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '폼에서 사용되는 다양한 입력 컴포넌트들입니다.',
      },
    },
  },
}

export default meta
