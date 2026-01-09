import React from 'react'
import {ScrollView, StyleSheet, View} from 'react-native'
import {Button, IconButton} from 'react-native-paper'

import {useProfileScreen} from '@app/features/user/hooks/useProfileScreen'
import COLORS from '@app/shared/constants/color'
import {CustomButton} from '@app/shared/ui/button/CustomButton'
import EditProfile from '@app/shared/ui/upload/EditProfile'
import InputForm from '../../../shared/ui/form/InputForm'
import WithdrawalButton from '../../user/components/WithdrawalButton'

export default function ProfileScreen(): React.JSX.Element {
  const {
    userInfo,
    submitting,
    keyboardHeight,
    formItems,
    formRef,
    profileRef,
    updateUserProfile,
    setKeyboardHeight,
    onClean,
  } = useProfileScreen()

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      <Button icon="close" onPress={onClean} style={styles.cleanButton}>
        캐시 초기화
      </Button>
      <IconButton
        icon="refresh"
        size={20}
        style={styles.resetBtn}
        onTouchEnd={() => {
          formRef?.current?.resetValues()
          profileRef?.current?.onReset()
        }}
      />
      <ScrollView style={styles.contents} contentContainerStyle={{flexGrow: 1}}>
        <InputForm
          items={formItems}
          formData={userInfo}
          formKey={userInfo?.uid || ''}
          layout={{
            labelStyle: {width: 100},
          }}
          ref={formRef}
          topElement={
            <View style={styles.profileWrap}>
              <EditProfile
                edit={true}
                ref={profileRef}
                defaultUrl={userInfo?.photoURL}
              />
            </View>
          }
          bottomElement={
            <View style={styles.buttons}>
              <CustomButton loading={submitting} onTouchEnd={updateUserProfile}>
                프로필 저장
              </CustomButton>
              {userInfo?.authority !== 'ADMIN' && <WithdrawalButton />}
            </View>
          }
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    position: 'relative',
    backgroundColor: COLORS.white,
  },
  contents: {
    flexGrow: 1,
    borderRadius: 8,
    marginBottom: 16,
    // backgroundColor: 'skyblue',
    backgroundColor: COLORS.background,
    // 그림자 스타일 (iOS + Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3, // Android 그림자
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  buttons: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 8,
  },
  profileWrap: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cleanButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  resetBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
})
