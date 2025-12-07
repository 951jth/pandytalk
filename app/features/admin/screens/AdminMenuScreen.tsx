import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React from 'react'
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native'
import COLORS from '../../../constants/color'
import type {AppRouteParamList} from '../../../types/navigate'

type AppRouteName = Extract<keyof AppRouteParamList, string>
type MenuItem = {
  title: string
  path: AppRouteName
  description: string
}

const menuItems: MenuItem[] = [
  {
    title: '유저 관리',
    path: 'guest-manage',
    description: '유저 신청 정보를 관리하는 스크린',
  },
  {
    title: '그룹 관리',
    path: 'group-manage',
    description: '유저 그룹을 관리하는 스크린',
  },
]

export default function AdminMenuScreen() {
  type AppNav = NativeStackNavigationProp<AppRouteParamList>
  const navigation = useNavigation<AppNav>()

  const MenuRenderer = ({
    item,
    index,
  }: {
    item: Record<string, any>
    index: number
  }) => {
    return (
      <Pressable
        onPress={() => item?.path && navigation.navigate(item?.path)}
        style={({pressed}) => [
          {
            marginBottom: 8,
            borderRadius: 8,
            shadowColor: '#000',
            shadowOffset: {width: 0, height: pressed ? 0.5 : 1.5},
            shadowOpacity: 0.1,
            shadowRadius: pressed ? 1 : 3,
            elevation: pressed ? 1 : 3,
            backgroundColor: '#FFF',
            transform: [{scale: pressed ? 0.98 : 1}],
          },
        ]}>
        <View style={styles.menuItem}>
          <View style={styles.menuTextRow}>
            <Text style={styles.menuTitle}>{item?.title}</Text>
            <Text style={styles.menuSubText}>{item?.path}</Text>
          </View>
          <Text style={styles.menuSubText}>{item?.description}</Text>
        </View>
      </Pressable>
    )
  }

  return (
    <FlatList
      style={styles.container}
      data={menuItems}
      keyExtractor={e => e?.path}
      keyboardShouldPersistTaps="handled"
      renderItem={MenuRenderer}
      contentContainerStyle={styles.menuItemContents}
    />
  )
}

const styles = StyleSheet.create({
  // container: {gap: 16m },
  container: {flex: 1},
  menuItemContents: {
    flexGrow: 1,
    padding: 16,
  },
  menuItem: {
    backgroundColor: COLORS.background,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderRadius: 16,
    gap: 8,
  },
  menuTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  menuTitle: {
    color: COLORS.text,
    fontFamily: 'BMDOHYEON',
  },
  menuSubText: {
    color: COLORS.gray,
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
  },
})
