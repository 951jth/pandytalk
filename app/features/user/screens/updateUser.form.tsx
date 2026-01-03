import GroupSelect from '@app/features/group/components/GroupSelect'
import type {FormItem} from '@app/shared/types/form'
import EditInput from '@app/shared/ui/input/EditInput'
import EditTextArea from '@app/shared/ui/input/EditTextarea'
import Select from '@app/shared/ui/select/Select'
import React from 'react'

export const updateUserItems: FormItem[] = [
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
      />
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
      <EditInput value={value} onChangeText={onChange} />
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
    key: 'authority',
    label: '권한설정',
    required: true,
    render: (value, onChange) => (
      <Select
        options={[
          {
            label: '관리자',
            value: 'ADMIN',
          },
          {
            label: '운영자',
            value: 'MANAGER',
          },
          {
            label: '일반유저',
            value: 'USER',
          },
        ]}
        value={value}
        onChange={onChange}
      />
    ),
  },

  {
    key: 'groupId',
    label: '그룹설정',
    required: true,
    render: (value, onChange) => (
      // <Select options={groupOptions} value={value} onChange={onChange} />
      <GroupSelect value={value} onChange={onChange} />
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
