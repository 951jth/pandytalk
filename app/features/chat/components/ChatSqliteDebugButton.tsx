import {
  messageTestService,
  type SqliteDebugSnapshot,
} from '@app/features/chat/service/messageTestService'
import COLORS from '@app/shared/constants/color'
import React, { useState } from 'react'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

/**
 * [디버그 전용] SQLite 마이그레이션 버전, 인덱스, 컬럼 스키마, 저장된 데이터를 확인하는 버튼 컴포넌트
 * 사용 후 화면에서 `<ChatSqliteDebugButton />` 한 줄만 주석 처리하면 됩니다.
 */
export default function ChatSqliteDebugButton() {
  const [visible, setVisible] = useState(false)
  const [snapshot, setSnapshot] = useState<SqliteDebugSnapshot | null>(null)
  const [loading, setLoading] = useState(false)

  const handleInspect = async () => {
    setLoading(true)
    try {
      const data = await messageTestService.inspectSqliteStatus()
      setSnapshot(data)
      setVisible(true)
    } catch (e) {
      console.error('[ChatSqliteDebugButton] inspect failed:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        style={styles.debugButton}
        onPress={handleInspect}
        disabled={loading}>
        <Text style={styles.debugButtonText}>
          {loading ? 'SQLite 조회 중...' : '🛠 SQLite 상태/스키마/데이터 확인'}
        </Text>
      </Pressable>

      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>SQLite 디버그 인스펙터</Text>
              <View style={styles.headerActions}>
                <Pressable style={styles.refreshBtn} onPress={handleInspect}>
                  <Text style={styles.refreshBtnText}>새로고침</Text>
                </Pressable>
                <Pressable
                  style={styles.closeBtn}
                  onPress={() => setVisible(false)}>
                  <Text style={styles.closeBtnText}>닫기</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView style={styles.scrollArea}>
              {/* 1. 마이그레이션 버전 & 인덱스 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  1. 마이그레이션 버전 & 인덱스
                </Text>
                <Text style={styles.infoText}>
                  • 현재 DB 버전 (user_version):{' '}
                  <Text style={styles.highlight}>
                    v{snapshot?.userVersion ?? '-'}
                  </Text>
                </Text>
                <Text style={styles.infoText}>
                  • 생성된 인덱스 ({snapshot?.indexes.length ?? 0}개):{' '}
                  <Text style={styles.highlight}>
                    {snapshot?.indexes.length
                      ? snapshot.indexes.join(', ')
                      : '없음'}
                  </Text>
                </Text>
                <Text style={styles.infoText}>
                  • 누락된 컬럼:{' '}
                  <Text style={styles.highlight}>
                    {snapshot?.missingColumns.length
                      ? snapshot.missingColumns.join(', ')
                      : '없음 (정상)'}
                  </Text>
                </Text>
              </View>

              {/* 2. 컬럼 스키마 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  2. 컬럼 스키마 ({snapshot?.columns.length ?? 0}개)
                </Text>
                {snapshot?.columns.map((col, idx) => (
                  <View key={col.name} style={styles.schemaRow}>
                    <Text style={styles.schemaName}>
                      {idx + 1}. {col.name}
                    </Text>
                    <Text style={styles.schemaMeta}>
                      {col.type}
                      {col.isPrimaryKey ? ' | PK' : ''}
                      {col.notNull ? ' | NOT NULL' : ''}
                      {col.defaultValue !== null
                        ? ` | DEFAULT ${col.defaultValue}`
                        : ''}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 3. 저장된 메시지 데이터 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  3. SQLite 저장 메시지 ({snapshot?.messages.length ?? 0}건,
                  최근 20건 표시)
                </Text>
                {snapshot?.messages.length === 0 ? (
                  <Text style={styles.emptyText}>
                    저장된 로컬 메시지가 없습니다.
                  </Text>
                ) : (
                  snapshot?.messages
                    .slice()
                    .reverse()
                    .slice(0, 20)
                    .map(msg => (
                      <View key={msg.id} style={styles.messageBox}>
                        <Text style={styles.messageMeta}>
                          [seq: {msg.seq ?? 0}] [{msg.type}] status:{' '}
                          {msg.status ?? '-'}
                        </Text>
                        <Text style={styles.messageSubMeta}>id: {msg.id}</Text>
                        <Text style={styles.messageText} numberOfLines={2}>
                          {msg.text ||
                            (msg.imageUrls?.length
                              ? `[이미지 ${msg.imageUrls.length}장]`
                              : msg.imageUrl || '(내용 없음)')}
                        </Text>
                      </View>
                    ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  debugButton: {
    backgroundColor: '#2D3748',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  refreshBtn: {
    backgroundColor: '#EDF2F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D3748',
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  scrollArea: {
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A202C',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#4A5568',
    marginBottom: 4,
  },
  highlight: {
    fontWeight: '700',
    color: '#2B6CB0',
  },
  schemaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  schemaName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D3748',
  },
  schemaMeta: {
    fontSize: 11,
    color: '#718096',
  },
  emptyText: {
    fontSize: 12,
    color: '#A0AEC0',
  },
  messageBox: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  messageMeta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  messageSubMeta: {
    fontSize: 11,
    color: '#718096',
    marginTop: 2,
  },
  messageText: {
    fontSize: 13,
    color: '#1A202C',
    marginTop: 4,
  },
})
