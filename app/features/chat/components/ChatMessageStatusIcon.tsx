import COLORS from '@app/shared/constants/color'
import {ChatMessage} from '@app/shared/types/chat'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {ActivityIndicator, IconButton} from 'react-native-paper'

type ChatMessageStatusIconsProps = {
  item: ChatMessage
  onDelete: (messageId: string) => void
  onRetry: (message: ChatMessage) => void
}

export default function ChatMessageStatusIcons({
  item,
  onDelete,
  onRetry,
}: ChatMessageStatusIconsProps) {
  return (
    <>
      {item?.status == 'failed' && (
        <View style={styles.icons}>
          <IconButton
            icon="reload"
            onPress={() => onRetry(item)}
            style={[styles.iconButton, styles.reload]}
            size={12}
            iconColor={COLORS.onPrimary}
          />
          <IconButton
            icon="close"
            onPress={() => onDelete(item.id)}
            style={[styles.iconButton, styles.cancel]}
            size={12}
            iconColor={COLORS.onPrimary}
          />
        </View>
      )}
      {item?.status == 'pending' && <ActivityIndicator animating size={12} />}
    </>
  )
}

const styles = StyleSheet.create({
  icons: {
    gap: 4,
    flexDirection: 'row',
    alignSelf: 'flex-end',
  },
  iconButton: {
    margin: 0,
    padding: 0,
    width: 24,
    height: 24,
    // backgroundColor: 'red',
  },
  cancel: {backgroundColor: COLORS.error},
  reload: {backgroundColor: COLORS.primary, color: COLORS.onPrimary},
})
