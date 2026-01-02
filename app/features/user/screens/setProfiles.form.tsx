import {authority} from '@app/shared/constants/korean'
import type {User} from '@app/shared/types/auth'
import type {FormItem} from '@app/shared/types/form'
import EditInput from '@app/shared/ui/input/EditInput'
import EditTextArea from '@app/shared/ui/input/EditTextarea'
import dayjs from 'dayjs'
import React from 'react'

export const setProfileItems = (user?: User | null): FormItem[] => {
  return [
    {
      label: '닉네임',
      key: 'displayName',
      render: (value, onChange, edit) => (
        <EditInput value={value} onChangeText={onChange} />
      ),
      validation: {
        // 2~20자, 한글/영문/숫자/공백/언더스코어/_-/만 허용
        maxLength: 20,
        pattern: /^[A-Za-z0-9가-힣 _-]{2,20}$/,
        message:
          '닉네임은 2-20자, 한글/영문/숫자/공백/언더스코어/하이픈만 가능합니다.',
        customFn: (v: string) => {
          if (!v) return '닉네임을 입력하세요.'
          if (v.trim().length < 2)
            return '닉네임은 공백 제외 2자 이상이어야 합니다.'
          if (/^\s|\s$/.test(v)) return '앞/뒤 공백은 제거해주세요.'
          return true // 통과
        },
      },
    },
    {label: '이메일', key: 'email', contents: user?.email},
    // {label: '그룹', key: 'groupName', contents: user?.groupName},
    {
      label: '권한',
      key: 'authority',
      contents: user?.authority ? authority?.[user?.authority] : '-',
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
    {
      label: '최근 접속일',
      key: 'lastSeen',
      contents: dayjs(Number(user?.lastSeen))?.format('YYYY-MM-DD hh:mm:ss'),
    },
  ]
}
