import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React from 'react'
import {FlatList, StyleSheet, Text, View} from 'react-native'
import {Icon} from 'react-native-paper'

import COLORS from '@app/shared/constants/color'
import {AppRouteParamList} from '@app/navigation/types'
import PressableWrapper from '@app/shared/ui/common/PressableWrapper'

type AppRouteName = 'guest-manage' | 'group-manage' | 'admin-inquiries'
type MenuItem = {
  title: string
  path: AppRouteName
  description: string
  icon: string
}

const menuItems: MenuItem[] = [
  {
    title: '유저 관리',
    path: 'guest-manage',
    description: '가입 신청 및 게스트 정보를 관리합니다.',
    icon: 'account-cog',
  },
  {
    title: '그룹 관리',
    path: 'group-manage',
    description: '채팅 그룹 생성 및 할당을 관리합니다.',
    icon: 'domain',
  },
  {
    title: '문의 관리',
    path: 'admin-inquiries',
    description: '사용자 문의 및 신고 내역을 관리합니다.',
    icon: 'email-outline',
  },
]

function AdminMenuItem({
  item,
  onPress,
}: {
  item: MenuItem
  onPress: (item: MenuItem) => void
}) {
  return (
    <PressableWrapper
      onPress={() => onPress(item)}
      style={styles.cardWrapper}>
      <View style={styles.cardContainer}>
        {/* 아이콘 영역 */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <Icon source={item.icon} size={28} color={COLORS.primary} />
          </View>
        </View>

        {/* 정보 영역 */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.menuTitle}>{item?.title}</Text>
            <Text style={styles.menuPath}>{item?.path}</Text>
          </View>
          <Text style={styles.menuDescription}>{item?.description}</Text>
        </View>

        {/* 화살표 영역 */}
        <View style={styles.arrowSection}>
          <Icon source="chevron-right" size={24} color="#ADB5BD" />
        </View>
      </View>
    </PressableWrapper>
  )
}

export default function AdminMenuScreen() {
  type AppNav = NativeStackNavigationProp<AppRouteParamList>
  const navigation = useNavigation<AppNav>()

  const onPressMenu = (item: MenuItem) => {
    navigation.navigate(item.path)
  }

  return (
    <FlatList
      style={styles.container}
      data={menuItems}
      keyExtractor={e => e?.path}
      keyboardShouldPersistTaps="handled"
      renderItem={({item}) => (
        <AdminMenuItem item={item} onPress={onPressMenu} />
      )}
      contentContainerStyle={styles.menuItemContents}
      showsVerticalScrollIndicator={false}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background, // 프리미엄 크림 베이지
  },
  menuItemContents: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
  },
  cardWrapper: {
    backgroundColor: COLORS.white,
    borderRadius: 32,
    marginBottom: 12, // 카드 간 간격
    // 프리미엄 소프트 디퓨전 섀도우
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
  },
  cardContainer: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconSection: {
    marginRight: 16,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FAF5F2', // 연한 테라코타 틴트
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  infoSection: {
    flex: 1,
    gap: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  menuTitle: {
    color: '#2D2D2D',
    fontFamily: 'BMDOHYEON',
    fontSize: 16,
  },
  menuPath: {
    color: COLORS.primary,
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
    opacity: 0.7,
    marginBottom: 2,
  },
  menuDescription: {
    color: COLORS.textSecondary,
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
    opacity: 0.6,
  },
  arrowSection: {
    paddingLeft: 8,
  },
})
