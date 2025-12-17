import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import ColorChip from '@app/shared/ui/chip/ColorChip'
import PressableWrapper from '@app/shared/ui/common/PressableWrapper'
import {Timestamp} from '@react-native-firebase/firestore'
import dayjs from 'dayjs'
import React from 'react'
import {Image, StyleProp, StyleSheet, Text, View, ViewStyle} from 'react-native'
import {Icon} from 'react-native-paper'

interface RequestMember {
  item: User
  style?: StyleProp<ViewStyle>
  onPress: (uid: object) => void
}

// const ButtonsByType = {
//   pending: [
//     {label: '승인', bgColor: '#2E7D32', onPress: () => {}},
//     {label: '거절', bgColor: '#F44336', onPress: () => {}},
//   ],
//   confirm: [
//     {label: '수정', bgColor: '#2E7D32', onPress: () => {}},
//     {label: '정지', bgColor: '#FF9800', onPress: () => {}},
//   ],
//   reject: [
//     {label: '승인', bgColor: '#2E7D32', onPress: () => {}},
//     {label: '삭제', bgColor: '#F44336', onPress: () => {}},
//   ],
// }

export default function RequestMemberCard({
  item,
  style,
  onPress = () => {},
}: RequestMember) {
  return (
    <PressableWrapper onPress={() => onPress(item)} style={style}>
      <View style={[styles.friend, style]}>
        <View style={styles.frame}>
          {item?.photoURL ? (
            <Image
              source={{uri: item?.photoURL}}
              resizeMode="cover"
              style={styles.image}
            />
          ) : (
            <Icon source="account" size={40} color={COLORS.primary} />
          )}
        </View>
        <View style={styles.contents}>
          <Text style={styles.name}>{item?.displayName}</Text>
          <Text style={styles.status}>
            {/* doc.updatedAt instanceof Timestamp ? doc.updatedAt.toDate() : null */}
            {item?.createdAt instanceof Timestamp
              ? dayjs(item?.createdAt?.toDate()).format('YYYY-MM-DD')
              : '-'}
          </Text>
          <Text style={styles.email}>{item?.email || '-'}</Text>
          <ColorChip status={item.accountStatus} />
          {/* <View style={styles.buttons}>
            {(ButtonsByType?.[item.accountStatus] || [])?.map(button => {
              return (
                <ColorButton
                  key={button?.label}
                  label={button?.label}
                  bgColor={button?.bgColor}
                  style={{paddingHorizontal: 12}}
                />
              )
            })}
          </View> */}
        </View>
      </View>
    </PressableWrapper>
  )
}

const styles = StyleSheet.create({
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
    gap: 8,
    position: 'relative',
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
  email: {
    fontFamily: 'BMDOHYEON',
    color: '#000',
    fontSize: 12,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  colorChip: {
    borderRadius: 8,
    fontSize: 10,
    position: 'absolute',
    top: 0,
    right: 0,
    // paddingHorizontal: 16,
    padding: 8,
  },
  colorChipText: {
    fontFamily: 'BMDOHYEON',
    fontSize: 11,
  },
  buttons: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    gap: 4,
  },
})
