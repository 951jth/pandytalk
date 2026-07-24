import ChatMessageStatusIcons from '@app/features/chat/components/ChatMessageStatusIcon'
import {useChatMessageDeleteMutation} from '@app/features/chat/hooks/useChatMessageDeleteMutation'
import {useChatMessageUpsertMutation} from '@app/features/chat/hooks/useChatMessageUpsertMutation'
import type {ChatMessage} from '@app/shared/types/chat'
import {formatChatTime} from '@app/shared/utils/format'
import React from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'

type ChatMessageMetaProps = {
  isMine: boolean
  item: ChatMessage
  roomId?: string | null
  hideMinute?: boolean
}

const ChatMessageMeta = ({
  isMine,
  item,
  roomId,
  hideMinute,
}: ChatMessageMetaProps) => {
  const {mutate: deleteAction} = useChatMessageDeleteMutation(roomId)
  const {retryMessage} = useChatMessageUpsertMutation(roomId)

  return (
    <View
      style={[
        styles.chatOptionsWrap,
        {flexDirection: isMine ? 'row' : 'row-reverse'},
      ]}>
      {/* 상태 아이콘은 시간이 가려지더라도 내 메시지라면 항상 표시 (실패/재전송 등) */}
      {isMine && !!item.status && (
        <ChatMessageStatusIcons
          item={item}
          onDelete={id => deleteAction(id)}
          onRetry={message => retryMessage({message})}
        />
      )}
      {/* 분 단위가 겹치지 않을 때만 시간 표시 */}
      {!hideMinute && (
        <Text style={styles.chatTime}>{formatChatTime(item.createdAt)}</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  chatOptionsWrap: {
    alignItems: 'flex-end',
    gap: 4,
    marginBottom: 4,
  },
  chatTime: {
    fontSize: 10,
    fontFamily: 'BMDOHYEON',
    color: '#BDBDBD',
  },
})

export default ChatMessageMeta
