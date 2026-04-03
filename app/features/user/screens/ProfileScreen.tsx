import React from 'react'
import {ScrollView, StyleSheet, Text, View} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'

import ProfileMenu from '@app/features/user/components/ProfileMenu'
import {useProfileScreen} from '@app/features/user/hooks/useProfileScreen'
import COLORS from '@app/shared/constants/color'
import {CustomButton} from '@app/shared/ui/button/CustomButton'
import EditProfile from '@app/shared/ui/upload/EditProfile'
import InputForm from '../../../shared/ui/form/InputForm'

/**
 * 사용자 프로필 관리 화면
 * 초경량화된 아키텍처 (userInfo 내부 조회, reset 액션 통합)
 */
export default function ProfileScreen(): React.JSX.Element {
  const {
    userInfo,
    submitting,
    keyboardHeight,
    formItems,
    formRef,
    profileRef,
    updateUserProfile,
    onReset, // ✅ 훅에서 가져옵니다.
  } = useProfileScreen()

  return (
    <View style={[styles.container, {paddingBottom: keyboardHeight}]}>
      {/* 상단 프리미엄 비주얼 헤더 (연한 톤) */}
      <LinearGradient
        colors={['#FADCD0', COLORS.background]}
        start={{x: 0, y: 0}}
        end={{x: 0, y: 1}}
        style={styles.visualHeader}
      />

      <ScrollView
        style={styles.contents}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* 아바타 중앙 배치 영역 */}
        <View style={styles.profileWrap}>
          <EditProfile
            edit={userInfo?.authority !== 'TEST'}
            ref={profileRef}
            defaultUrl={userInfo?.photoURL}
          />
          <Text style={styles.profileName}>
            {userInfo?.displayName || '사용자'}님
          </Text>
        </View>

        {/* 정보 카드 섹션 */}
        <View style={styles.infoCard}>
          <InputForm
            items={formItems}
            formData={userInfo}
            formKey={userInfo?.uid || ''}
            layout={{
              labelStyle: {
                width: 100,
                fontFamily: 'BMDOHYEON',
                color: COLORS.textSecondary,
              },
            }}
            ref={formRef}
          />
        </View>

        {/* 하단 메인 액션 버튼 */}
        <View style={styles.buttons}>
          {userInfo?.authority !== 'TEST' && (
            <CustomButton
              loading={submitting}
              style={styles.saveBtn}
              onTouchEnd={updateUserProfile}>
              내 정보 저장하기
            </CustomButton>
          )}
        </View>
      </ScrollView>

      {/* 유저 도메인 전용 메뉴 컴포넌트 (초경량 프롭스 모드) */}
      <ProfileMenu
        onReset={onReset}
        anchorStyle={styles.menuAnchor}
        style={styles.menuWrapper}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  visualHeader: {
    height: 180,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 40,
  },
  contents: {
    flexGrow: 1,
  },
  profileWrap: {
    alignItems: 'center',
    marginBottom: 24,
    zIndex: 2,
  },
  profileName: {
    marginTop: 12,
    fontSize: 24,
    fontFamily: 'BMDOHYEON',
    color: '#2D2D2D',
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    marginHorizontal: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  buttons: {
    marginTop: 30,
    paddingHorizontal: 24,
  },
  saveBtn: {
    borderRadius: 16,
  },
  menuWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1000,
  },
  menuAnchor: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
  },
})
