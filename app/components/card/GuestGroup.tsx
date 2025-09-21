import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import React from 'react'
import {
  Image,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import {Icon} from 'react-native-paper'
import COLORS from '../../constants/color'
import type {Group} from '../../types/group'
import PressableWrapper from '../common/PressableWrapper'

type propTypes = {
  item: Group
  onPress: (item: Group) => void
  style?: StyleProp<ViewStyle>
}

export default function GuestGroup({item, onPress, style}: propTypes) {
  console.log('onPress', onPress)
  return (
    <PressableWrapper onPress={() => onPress(item)} style={styles.groupItem}>
      <View style={[styles.friend, style]}>
        <View style={styles.frame}>
          {item?.photoURL ? (
            <Image
              source={{uri: item?.photoURL}}
              resizeMode="cover"
              style={styles.image}
            />
          ) : (
            <Icon
              source="account-multiple-outline"
              size={40}
              color={COLORS.primary}
            />
          )}
        </View>
        <View style={styles.contents}>
          <Text style={styles.name}>{item?.name}</Text>
          <Text style={styles.status}>
            {item?.createdAt instanceof Timestamp
              ? dayjs(item?.createdAt?.toDate()).format('YYYY-MM-DD')
              : '-'}
          </Text>
        </View>
      </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
  groupItem: {
    backgroundColor: '#FFF',
  },
  friend: {
    flexDirection: 'row',
    padding: 8,
    gap: 12, // RN 0.71+ 이상에서 사용 가능
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    width: 60,
    height: 60,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: COLORS.primary,
    borderWidth: 1,
    position: 'relative',
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  name: {
    fontSize: 14,
    color: '#000',
    fontFamily: 'BMDOHYEON',
  },
  contents: {
    flex: 1,
    gap: 8,
    position: 'relative',
  },
  status: {
    fontSize: 12,
    color: '#ADB5BD',
    fontFamily: 'BMDOHYEON',
  },
})
