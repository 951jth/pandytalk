import React from 'react'
import {Image, StyleSheet, View} from 'react-native'
import {Icon} from 'react-native-paper'
import {AI_BOT_IMAGE} from '@app/shared/constants/ai'
import COLORS from '@app/shared/constants/color'
import {User} from '@app/shared/types/auth'
import type {ChatMessage} from '@app/shared/types/chat'
import ImageViewer from '@app/shared/ui/common/ImageViewer'

interface ChatMessageAvatarProps {
  item: ChatMessage
  member?: User
  isHidden?: boolean
}

const ChatMessageAvatar = ({
  item,
  member,
  isHidden = false,
}: ChatMessageAvatarProps) => {
  if (isHidden) {
    return <View style={{width: 44}} />
  }

  const isAi = item.type === 'ai_text'
  const profileUri = isAi
    ? Image.resolveAssetSource(AI_BOT_IMAGE).uri
    : member?.photoURL || item?.senderPicURL || ''

  return (
    <View style={styles.frame}>
      {profileUri ? (
        <ImageViewer
          images={[{uri: profileUri}]}
          useDownload={!isAi}
          imageProps={{
            resizeMode: 'cover',
            style: styles.profile,
          }}
        />
      ) : (
        <Icon source="account" size={35} color={COLORS.primary} />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  frame: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  profile: {
    width: 44,
    height: 44,
    borderRadius: 15,
  },
})

export default ChatMessageAvatar
