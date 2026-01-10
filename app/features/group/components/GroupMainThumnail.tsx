import COLORS from '@app/shared/constants/color'
import DefaultProfile from '@app/shared/ui/common/DefaultProfile'
import ImageViewer from '@app/shared/ui/common/ImageViewer'
import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import CustomChip from '../../../shared/ui/chip/CustomChip'
import {useAppSelector} from '../../../store/reduxHooks'
import {useGroup} from '../hooks/useGroupQuery'

export default function GroupMainThumnail({
  style,
}: {
  style: StyleProp<ViewStyle>
}) {
  const {data: userInfo} = useAppSelector(state => state?.user)
  const groupId = userInfo?.groupId
  const {data: groupInfo} = useGroup(groupId)
  return (
    <View style={[styles.container, style]}>
      <View style={styles.groupPhotoZone}>
        {groupInfo?.photoURL ? (
          <ImageViewer
            images={[{uri: groupInfo?.photoURL}]}
            imageProps={{
              resizeMode: 'cover',
              style: styles.chatImage,
            }}
          />
        ) : (
          <DefaultProfile boxSize={100} iconSize={75} />
        )}
      </View>
      <View style={styles.textZone}>
        <Text style={styles.title}>{groupInfo?.name || '현재 그룹 없음.'}</Text>
        <View style={styles.groupChips}>
          <CustomChip title={`멤버수: ${groupInfo?.memberCount || 0}명`} />
        </View>
        <Text style={styles.intro}>
          {groupInfo?.memo ||
            '현재 그룹이 설정되지않았습니다.\n관리자를 통해서 그룹이 설정됩니다.'}
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  groupPhotoZone: {
    backgroundColor: COLORS.primary,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textZone: {
    position: 'relative',
    backgroundColor: COLORS.onPrimary,
    gap: 12,
    padding: 16,
  },
  groupChips: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  title: {
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
  },
  intro: {
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
    fontSize: 12,
  },
  chatImage: {
    width: 100,
    height: 100,
    borderRadius: 100,
    marginTop: 8,
  },
})
