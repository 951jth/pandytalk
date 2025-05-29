import React from 'react'
import {StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'
import {User} from '../../types/firebase'

interface ChatMemberProps {
  item: User
  style?: StyleProp<ViewStyle>
}

export default function ChatMember({item, style}: ChatMemberProps) {
  return (
    <View style={[styles.friend, style]}>
      <View style={styles.frame}>
        <Icon source="account" size={35} color={COLORS.primary} />
        {item?.status == 'online' && <View style={styles.point} />}
      </View>
      <View style={styles.contents}>
        <Text style={styles.name}>{item?.nickname}</Text>
        <Text style={styles.status}>
          {item?.status == 'online' ? '온라인' : '오프라인'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  friend: {
    flexDirection: 'row',
    marginBottom: 8,
    backgroundColor: '#FFF',
    padding: 8,
    borderRadius: 8,
    // ✅ 그림자 효과 (iOS + Android 호환)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3, // Android 전용 그림자
    // ✅ 공간감 추가
    gap: 12, // RN 0.71+ 이상에서 사용 가능
  },
  frame: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
  point: {
    backgroundColor: '#2CC069',
    width: 14,
    height: 14,
    // borderRadius: '100%',
    borderRadius: 100,
    borderColor: '#FFF',
    borderWidth: 2,
    position: 'absolute',
    right: -6,
    top: -6,
  },
  contents: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'Mulish-Semibold',
  },
  status: {
    fontSize: 12,
    color: '#ADB5BD',
  },
})
