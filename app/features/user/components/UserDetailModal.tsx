import React from 'react'
import {Modal, ScrollView, StyleSheet, Text, View} from 'react-native'

import InputForm from '../../../shared/ui/form/InputForm'

import {useUserDetail} from '@app/features/user/hooks/useUserDetail'
import {updateUserItems} from '@app/features/user/screens/updateUser.form'
import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import {AppButton} from '@app/shared/ui/button/AppButton'
import BottomSheetModal from '@app/shared/ui/modal/BottomSheetModal'
import EditProfile from '@app/shared/ui/upload/EditProfile'

const ButtonsByType = {
  pending: [
    {
      label: '거절',
      bgColor: '#FFF5F5', // Soft Pastel Rose
      textColor: '#E03131',
      status: 'reject',
    },
    {
      label: '승인',
      bgColor: '#F4FCF7', // Soft Pastel Mint
      textColor: '#099268',
      status: 'confirm',
    },
  ],
  confirm: [
    {
      label: '정지',
      bgColor: '#FFF9DB', // Soft Pastel Yellow
      textColor: '#F08C00',
      status: 'pending',
    },
    {
      label: '수정',
      bgColor: '#E7F5FF', // Soft Pastel Sky
      textColor: '#1C7ED6',
      status: 'confirm',
    },
  ],
  reject: [
    {
      label: '승인',
      bgColor: '#F4FCF7',
      textColor: '#099268',
      status: 'confirm',
    },
    {
      label: '삭제',
      bgColor: '#E03131', // Bold Red for destructive action
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
    <BottomSheetModal visible={open} onClose={onClose}>
      <View style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <InputForm
            ref={formRef}
            items={updateUserItems}
            formData={record}
            formKey={record?.uid}
            buttonLabel="유저 신청"
            topElement={
              <View style={styles.profileWrap}>
                <Text style={styles.title}>유저 상세 정보</Text>
                <EditProfile
                  edit={true}
                  defaultUrl={record?.photoURL || null}
                  boxSize={112}
                  iconSize={85}
                  ref={profileRef}
                />
              </View>
            }
            layout={{
              rowsStyle: {paddingVertical: 4},
              labelStyle: {fontFamily: 'BMDOHYEON', color: COLORS.secondary},
            }}
            bottomElement={
              user?.accountStatus && (
                <View style={styles.buttons}>
                  {(ButtonsByType?.[user?.accountStatus] || [])?.map(button => {
                    return (
                      <AppButton
                        key={button?.label}
                        onPress={() =>
                          handleMemberStatusUpdate?.(
                            button?.status as UserStatus,
                          )
                        }
                        style={{backgroundColor: button?.bgColor, flex: 1}}
                        labelStyle={{color: button?.textColor || '#FFF'}}>
                        {button?.label}
                      </AppButton>
                    )
                  })}
                </View>
              )
            }
          />
        </ScrollView>
      </View>
    </BottomSheetModal>
  )
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 32, // 스그니처 32px 곡률
    height: 550, // 시원하게 가시성 확보
  },
  profileWrap: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 8,
  },
  title: {
    color: '#2D2D2D',
    fontFamily: 'BMDOHYEON',
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
    paddingBottom: 12,
  },
})
