import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import {
  TextInput,
  TextareaInput,
  SelectInput,
  CheckboxInput,
  DateInput,
  TimeInput,
  PhoneInput,
} from '../components/ui/FormInput'

// TextInput 스토리
const textInputMeta: Meta<typeof TextInput> = {
  title: 'UI/Form/TextInput',
  component: TextInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '텍스트 입력 컴포넌트입니다. 라벨, 에러 메시지, 도움말을 표시할 수 있습니다.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'dark'],
      description: '입력 필드 스타일',
    },
    label: {
      control: 'text',
      description: '라벨 텍스트',
    },
    error: {
      control: 'text',
      description: '에러 메시지',
    },
    helperText: {
      control: 'text',
      description: '도움말 텍스트',
    },
    required: {
      control: 'boolean',
      description: '필수 입력 여부',
    },
    disabled: {
      control: 'boolean',
      description: '비활성화 상태',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
}

export default textInputMeta
type TextInputStory = StoryObj<typeof textInputMeta>

export const Default: TextInputStory = {
  args: {
    label: '이름',
    placeholder: '이름을 입력하세요',
  },
}

export const WithRequired: TextInputStory = {
  args: {
    label: '이메일',
    placeholder: 'example@email.com',
    required: true,
  },
}

export const WithHelperText: TextInputStory = {
  args: {
    label: '비밀번호',
    type: 'password',
    placeholder: '비밀번호를 입력하세요',
    helperText: '8자 이상 입력해주세요',
  },
}

export const WithError: TextInputStory = {
  args: {
    label: '이메일',
    placeholder: 'example@email.com',
    value: 'invalid-email',
    error: '올바른 이메일 형식이 아닙니다',
  },
}

export const Disabled: TextInputStory = {
  args: {
    label: '이름',
    value: '홍길동',
    disabled: true,
  },
}

export const DarkVariant: TextInputStory = {
  args: {
    label: '검색',
    placeholder: '검색어를 입력하세요',
    variant: 'dark',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
}
