import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from '@utils/dayjs'
import React from 'react'
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native'
import FastImage from 'react-native-fast-image'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'
import type {User} from '../../types/auth'

interface ChatMemberProps {
  item: User
  style?: StyleProp<ViewStyle>
  onPress: (uid: string) => void
}

export default function ChatMember({
  item,
  style,
  onPress = () => {},
}: ChatMemberProps) {
  const lastSeen =
    item?.lastSeen instanceof Timestamp
      ? item?.lastSeen?.toDate()
      : item?.lastSeen
  return (
    <Pressable
      onPress={() => onPress(item.uid)}
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
        style,
      ]}>
      <View style={[styles.friend]}>
        <View style={styles.frame}>
          {item?.photoURL ? (
            <FastImage
              source={{uri: item?.photoURL}}
              resizeMode={FastImage.resizeMode.cover}
              style={styles.image}
            />
          ) : (
            <Icon source="account" size={40} color={COLORS.primary} />
          )}
          {item?.status == 'online' && <View style={styles.point} />}
        </View>
        <View style={styles.contents}>
          <View style={styles.contentsRow}>
            <Text style={styles.name}>{item?.displayName}</Text>
            <Text style={styles.status}>
              {/* {item?.status == 'online' ? '온라인' : '오프라인'} */}
              {lastSeen ? dayjs(Number(lastSeen)).fromNow() : '알 수 없음'}
            </Text>
          </View>
          <Text style={styles.introduce} numberOfLines={2} ellipsizeMode="tail">
            {item?.intro}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  friend: {
    flexDirection: 'row',
    // marginBottom: 8,
    // backgroundColor: '#FFF',
    padding: 8,
    // borderRadius: 8,
    // // ✅ 그림자 효과 (iOS + Android 호환)
    // shadowColor: '#000',
    // shadowOffset: {width: 0, height: 1},
    // shadowOpacity: 0.1,
    // shadowRadius: 3,
    // elevation: 3, // Android 전용 그림자
    gap: 12, // RN 0.71+ 이상에서 사용 가능
  },
  frame: {
    width: 55,
    height: 55,
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
  contentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'BMDOHYEON',
  },
  status: {
    fontSize: 12,
    color: '#ADB5BD',
    fontFamily: 'BMDOHYEON',
  },
  introduce: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    color: '#ADB5BD',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
})
