import {useQueryClient} from '@tanstack/react-query'
import React, {useRef} from 'react'
import {Modal, StyleSheet, View} from 'react-native'
import COLORS from '../../constants/color'
import {memberStatusUpdate} from '../../services/authService'
import type {User} from '../../types/auth'
import type {FormItem} from '../../types/form'
import ColorButton from '../card/ColorButton'
import InputForm from '../form/InputForm'
import EditInput from '../input/EditInput'
import EditTextArea from '../input/EditTextarea'
import GroupSelect from '../select/GroupSelect'
import Select from '../select/Select'
import EditProfile from '../upload/EditProfile'
import CustomModal from './CustomModal'

type propTypes = Omit<React.ComponentProps<typeof Modal>, 'visible'> & {
  open: boolean | any
  setOpen: (next: boolean) => void
  children?: React.ReactNode
  record?: User
  onComplete?: () => void
  onRefresh?: () => void
}

const ButtonsByType = {
  pending: [
    {
      label: '거절',
      bgColor: '#FFEBEE',
      textColor: '#C62828',
      status: 'reject',
    },
    {
      label: '승인',
      bgColor: '#E8F5E9',
      textColor: '#2E7D32',
      status: 'confirm',
    },
  ],
  confirm: [
    {
      label: '정지',
      bgColor: '#FFF3E0',
      textColor: '#FF9800',
      status: 'pending',
    },
    {
      label: '수정',
      bgColor: '#E8F5E9',
      textColor: '#2E7D32',
      // bgColor: '#FFEBEE',
      // textColor: '#C62828',
      status: 'confirm', //수정은 현재 일반유저만 가능
    },
  ],
  reject: [
    {
      label: '승인',
      bgColor: '#E8F5E9',
      textColor: '#2E7D32',
      status: 'confirm',
    },
    {
      label: '삭제',
      bgColor: '#F44336',
      textColor: '#FFF',
      status: 'delete',
    },
  ],
}

export default function RequestMemberDetailModal({
  open,
  setOpen = () => {},
  record,
  onRefresh,
  ...props
}: propTypes) {
  const formRef = useRef<any | null>(null)
  const queryClient = useQueryClient()
  const profileRef = useRef<any | null>(null)

  const handleMemberStatusUpdate = async (
    status: User['accountStatus'] & 'delete',
  ) => {
    try {
      console.log('status', status)
      if (!status) return
      if (status == 'delete') {
        //TODO 삭제로직 구현중
        return
      } else {
        console.log(profileRef.current)
        const formValues = formRef.current.getValues() as User
        const photoURL = await profileRef.current.upload()
        await memberStatusUpdate(status, {...formValues, photoURL})
        setOpen(false)
        onRefresh?.()
        // memberStatusUpdate(status, {...formValues, photoURL})
        //   .then(() => {
        //     setOpen(false)
        //     queryClient.invalidateQueries({queryKey: ['pending-users', 'users']})
        //   })
        //   .catch(e => console.log(e))
      }
    } catch (e) {
      console.log(e)
    }
  }

  const items: FormItem[] = [
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

  return (
    <CustomModal visible={open} onClose={() => setOpen(false)}>
      <View style={styles.container}>
        <InputForm
          edit={true}
          editable={false}
          items={items}
          buttonLabel="게스트 신청"
          topElement={
            <View style={styles.profileWrap}>
              <EditProfile
                edit={true}
                defaultUrl={record?.photoURL || null}
                boxSize={100}
                iconSize={75}
                ref={profileRef}
              />
            </View>
          }
          initialValues={record}
          rowsStyle={{paddingVertical: 0}}
          bottomElement={
            record?.accountStatus && (
              <View style={styles.buttons}>
                {(ButtonsByType?.[record.accountStatus] || [])?.map(button => {
                  return (
                    <ColorButton
                      key={button?.label}
                      label={button?.label}
                      bgColor={button?.bgColor}
                      textColor={button?.textColor || '#FFF'}
                      style={{
                        paddingVertical: 16,
                        flex: 1,
                      }}
                      onPress={() =>
                        button?.status &&
                        handleMemberStatusUpdate(
                          button?.status as User['accountStatus'] & 'delete',
                        )
                      }
                    />
                  )
                })}
              </View>
            )
          }
          onCancel={() => setOpen(false)}
          ref={formRef}
        />
      </View>
    </CustomModal>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    height: 470,
    // flex: 1,
    // minHeight: 600,
    // maxHeight: 600,
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  notiText: {
    color: COLORS.error,
    fontFamily: 'BMDOHYEON',
    textAlign: 'center',
    marginTop: 16,
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
})
