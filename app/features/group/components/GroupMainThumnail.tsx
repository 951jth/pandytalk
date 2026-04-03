import COLORS from '@app/shared/constants/color'
import ImageViewer from '@app/shared/ui/common/ImageViewer'
import logo from '@shared/assets/images/pandy_logo.png'
import React from 'react'
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import CustomChip from '../../../shared/ui/chip/CustomChip'
import {useAppSelector} from '../../../store/reduxHooks'
import {useGroup} from '../hooks/useGroupQuery'

export default function GroupMainThumnail({
  style,
}: {
  style?: StyleProp<ViewStyle>
}) {
  const {data: userInfo} = useAppSelector(state => state?.user)
  const groupId = userInfo?.groupId
  const {data: groupInfo} = useGroup(groupId)

  return (
    <View style={[styles.container, style]}>
      <View style={styles.dashboardCard}>
        {/* 역동적인 비대칭 그라데이션 배경 요소 */}
        <LinearGradient
          colors={[COLORS.primary, '#FADCD0']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.gradientWave}
        />

        <View style={styles.cardContent}>
          {/* 상단: 인사말 및 프로필 영역 */}
          <View style={styles.headerRow}>
            <View style={styles.greetingContainer}>
              <Text style={styles.welcomeTag}>WELCOME BACK</Text>
              <Text style={styles.userNameText}>
                {userInfo?.displayName || '사용자'} <Text style={styles.plainText}>님</Text>
              </Text>
            </View>
            <View style={styles.avatarWrapper}>
              {groupInfo?.photoURL ? (
                <ImageViewer
                  images={[{uri: groupInfo?.photoURL}]}
                  imageProps={{resizeMode: 'cover', style: styles.avatarImage}}
                />
              ) : (
                <Image source={logo} style={styles.avatarImage} />
              )}
              <View style={styles.onlineIndicator} />
            </View>
          </View>

          {/* 중간: 메인 그룹 정보 (타이틀 + 칩 한 줄 배치) */}
          <View style={styles.groupHeaderRow}>
            <Text style={styles.groupName} numberOfLines={1}>
              {groupInfo?.name || '우리 그룹 소식'}
            </Text>
            <CustomChip
              title={`${groupInfo?.memberCount || 0}`}
              iconName="account"
              iconColor={COLORS.accentDeep}
              textColor={COLORS.accentDeep}
              bgColor={COLORS.accentLight}
              style={styles.memberChip}
            />
          </View>

          {/* 하단: 그룹 소개 */}
          <View style={styles.descriptionBox}>
            <Text style={styles.introText} numberOfLines={2}>
              {groupInfo?.memo ||
                '소속된 그룹이 없어도 걱정 마세요.\nPANDY TALK에서 새로운 인연을 만날 수 있어요.'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 16,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    minHeight: 200,
    overflow: 'hidden',
    // 하이엔드 소프트 디퓨전 섀도우
    shadowColor: COLORS.primary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 12,
  },
  gradientWave: {
    position: 'absolute',
    top: -50,
    right: -20,
    width: '70%',
    height: '140%',
    borderRadius: 100,
    transform: [{rotate: '15deg'}],
    opacity: 0.15, // 매우 은은하게 배경 효과로 사용
  },
  cardContent: {
    padding: 24,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  greetingContainer: {
    flex: 1,
  },
  welcomeTag: {
    fontSize: 10,
    fontFamily: 'BMDOHYEON',
    color: '#D35400', // 더 진하고 선명한 오렌지 (Contrast 강조)
    letterSpacing: 2,
    marginBottom: 4,
  },
  userNameText: {
    fontSize: 26, // 살짝 크기 키움
    fontFamily: 'BMDOHYEON',
    color: '#000000', // 울트라 블랙으로 가독성 극대화
  },
  plainText: {
    fontSize: 18,
    color: '#555555', // 조금 더 어두운 회색으로 보정
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    backgroundColor: COLORS.outerColor,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.success,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  memberChip: {
    backgroundColor: COLORS.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  groupName: {
    fontSize: 24,
    fontFamily: 'BMDOHYEON',
    color: '#000000',
    flex: 1, // 남은 공간 차지
  },
  timeInfo: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    color: '#777777', // 가독성 보정
    opacity: 0.9,
  },
  descriptionBox: {
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  introText: {
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: '#444444', // 더 진한 회색으로 가독성 확보
    lineHeight: 20,
  },
})
