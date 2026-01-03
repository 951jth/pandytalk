import React from 'react'
import {Modal, StyleSheet, View} from 'react-native'

import InputForm from '../../../shared/ui/form/InputForm'

import {useUserDetail} from '@app/features/user/hooks/useUserDetail'
import {updateUserItems} from '@app/features/user/screens/updateUser.form'
import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import ColorButton from '@app/shared/ui/button/ColorButton'
import CustomModal from '@app/shared/ui/modal/CustomModal'
import EditProfile from '@app/shared/ui/upload/EditProfile'

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

type propTypes = Omit<React.ComponentProps<typeof Modal>, 'visible'> & {
  open: boolean | any
  children?: React.ReactNode
  record?: User
  onComplete?: () => void
  onClose?: () => void
}

type UserStatus = User['accountStatus'] & 'delete'

export default function UserDetailModal({
  open,
  onComplete = () => {},
  onClose = () => {},
  record,
}: propTypes) {
  const {handleMemberStatusUpdate, formRef, profileRef, user} =
    useUserDetail(onComplete)

  return (
    <CustomModal visible={open} onClose={onClose}>
      <View style={styles.container}>
        <InputForm
          ref={formRef}
          items={updateUserItems}
          formData={record}
          formKey={record?.uid}
          buttonLabel="유저 신청"
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
          layout={{
            rowsStyle: {paddingVertical: 0},
          }}
          bottomElement={
            user?.accountStatus && (
              <View style={styles.buttons}>
                {(ButtonsByType?.[user?.accountStatus] || [])?.map(button => {
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
                        handleMemberStatusUpdate?.(button?.status as UserStatus)
                      }
                    />
                  )
                })}
              </View>
            )
          }
        />
      </View>
    </CustomModal>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    height: 470,
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
