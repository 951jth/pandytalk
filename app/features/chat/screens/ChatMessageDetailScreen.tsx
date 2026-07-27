import ChatMessageAvatar from '@app/features/chat/components/ChatMessageAvatar'
import ChatMessageContent from '@app/features/chat/components/ChatMessageContent'
import {useChatMessageDetailScreen} from '@app/features/chat/hooks/useChatMessageDetailScreen'
import AppHeader from '@app/layout/AppHeader'
import COLORS from '@app/shared/constants/color'
import React from 'react'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native'
import {Text} from 'react-native-paper'
import {SafeAreaView} from 'react-native-safe-area-context'

export default function ChatMessageDetailScreen() {
  const {width} = useWindowDimensions()
  const {
    message,
    isMine,
    senderName,
    formattedDate,
    isLoading,
    isError,
    refetch,
  } = useChatMessageDetailScreen()

  if (isLoading) {
    return (
      <DetailScreenContainer>
        <View style={styles.stateContainer}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      </DetailScreenContainer>
    )
  }

  if (isError || !message) {
    return (
      <DetailScreenContainer>
        <View style={styles.stateContainer}>
          <Text style={styles.stateText}>
            메시지 정보를 불러올 수 없습니다.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </DetailScreenContainer>
    )
  }

  return (
    <DetailScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.senderSection}>
          <ChatMessageAvatar item={message} />
          <View style={styles.senderInfo}>
            <Text style={styles.senderName}>{senderName}</Text>
            <Text style={styles.sentAt}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.messageCard}>
          <ChatMessageContent
            item={message}
            isMine={isMine}
            bubbleMaxWidth={width - 64}
            mode="detail"
          />
        </View>
      </ScrollView>
    </DetailScreenContainer>
  )
}

const DetailScreenContainer = ({children}: {children: React.ReactNode}) => {
  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="메시지 상세" />
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  senderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  senderInfo: {
    flex: 1,
    gap: 4,
  },
  senderName: {
    fontSize: 16,
    fontFamily: 'BMDOHYEON',
    color: COLORS.text,
  },
  sentAt: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
  },
  messageCard: {
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  stateText: {
    marginBottom: 16,
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    minWidth: 120,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: 'BMDOHYEON',
    color: COLORS.onPrimary,
  },
})
