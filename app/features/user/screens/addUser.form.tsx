import type {FormItem} from '@app/shared/types/form'
import EditInput from '@app/shared/ui/input/EditInput'
import EditTextArea from '@app/shared/ui/input/EditTextarea'
import PasswordInput from '@app/shared/ui/input/PasswordInput'
import React from 'react'

export const addUserItems: FormItem[] = [
  {
    key: 'email',
    label: '이메일',
    required: true,
    validation: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: '이메일 형식이 올바르지 않습니다.',
      customFn: (v: string) => {
        if (!v) return '이메일을 입력하세요.'
        if (v !== v.trim()) return '앞뒤 공백을 제거해주세요.'
        return true
      },
    },
    render: (value, onChange) => (
      <EditInput
        value={value}
        onChangeText={onChange}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="이메일을 입력해주세요."
      />
    ),
  },
  {
    key: 'password',
    label: '비밀번호',
    required: true,
    validation: {
      pattern: /^.{8,32}$/, // 길이 8~32자
      message: '비밀번호는 8–32자여야 합니다.',
      customFn: (v: string) => {
        if (!v) return '비밀번호를 입력하세요.'
        if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v))
          return '영문과 숫자를 모두 포함하세요.'
        if (/\s/.test(v)) return '공백은 사용할 수 없습니다.'
        return true
      },
    },
    render: (value, onChange) => (
      <PasswordInput value={value} onChangeText={onChange} />
    ),
  },
  {
    key: 'passwordCheck',
    label: `비밀번호\n확인`,
    required: true,
    validation: {
      pattern: /^.{8,32}$/, // 길이 8~32자
      message: '현재 입력한 비밀번호와 다릅니다.',
      customFn: (v: string, allValues: any) => {
        return allValues?.password == v
      },
    },
    render: (value, onChange) => (
      <PasswordInput value={value} onChangeText={onChange} />
    ),
  },
  {
    key: 'displayName',
    label: '닉네임',
    required: true,
    validation: {
      maxLength: 20,
      pattern: /^[A-Za-z0-9가-힣 _-]{2,20}$/,
      message: '닉네임은 2-20자, 한글/영문/숫자/공백/_/-만 허용됩니다.',
      customFn: (v: string) => {
        if (!v) return '닉네임을 입력하세요.'
        if (v.trim().length < 2)
          return '닉네임은 공백 제외 2자 이상이어야 합니다.'
        if (/^\s|\s$/.test(v)) return '앞/뒤 공백은 제거해주세요.'
        return true
      },
    },
    render: (value, onChange) => (
      <EditInput value={value} onChangeText={onChange} maxLength={20} />
    ),
  },
  {
    key: 'note',
    label: '신청메모',
    required: true,
    validation: {
      maxLength: 200,
      message: '신청메모는 1-200자 입력해주세요.',
      customFn: (v: string) => {
        if (!v || v.trim().length === 0) return '신청메모를 입력하세요.'
        return true
      },
    },
    render: (value, onChange) => (
      <EditTextArea
        value={value}
        onChangeText={onChange}
        minRows={1}
        maxRows={6}
        maxLength={200}
      />
    ),
  },
  {
    key: 'intro',
    label: '소개',
    validation: {
      maxLength: 200,
      message: '소개는 최대 200자입니다.',
    },
    render: (value, onChange) => (
      <EditTextArea
        value={value}
        onChangeText={onChange}
        minRows={1}
        maxRows={6}
        maxLength={200}
      />
    ),
  },
]
