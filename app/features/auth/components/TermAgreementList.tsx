import COLORS from '@app/shared/constants/color'
import {terms} from '@app/shared/constants/terms'
import {termType} from '@app/shared/types/auth'
import {ServerTime} from '@app/shared/types/chat'
import {serverTimestamp} from '@react-native-firebase/firestore'
import React, {useMemo, useState} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Checkbox, IconButton} from 'react-native-paper'
import TermViewModal from './TermViewModal'

export type CheckedRecordType = Record<string, ServerTime | null>

type Props = {
  /** Controlled: 외부에서 전달하는 체크 레코드 (없으면 내부 상태 사용) */
  checkedRecord?: CheckedRecordType
  /** 변경 콜백: 외부 제어 시 필수 권장 */
  onChange?: (next: CheckedRecordType) => void
}

const defaultCheckedRecord: CheckedRecordType = terms.reduce(
  (acc, obj) => ({...acc, [obj.id]: null}),
  {} as CheckedRecordType,
)

export default (function TermAgreementList({
  checkedRecord: controlled,
  onChange,
}: Props) {
  // Uncontrolled 모드에서만 사용하는 내부 상태
  const [innerRecord, setInnerRecord] =
    useState<CheckedRecordType>(defaultCheckedRecord)
  const [viewCode, setViewCode] = useState<string | null>(null)

  // 항상 여기서 현재 사용할 소스를 결정
  const record = controlled ?? innerRecord

  const isAllChecked = useMemo(() => {
    const values = Object.values(record)
    return values.length > 0 && values.every(v => v !== null)
  }, [record])

  // 내부/외부 모두를 커버하는 set 함수
  const applyRecord = (next: CheckedRecordType) => {
    if (controlled) {
      onChange?.(next)
    } else {
      setInnerRecord(next)
      onChange?.(next) // 필요하면 외부에도 알림
    }
  }

  const handleCheck = (termId: string, isChecked: boolean) => {
    const next: CheckedRecordType = {
      ...record,
      [termId]: isChecked ? serverTimestamp() : null,
    }
    applyRecord(next)
  }

  const handleAllCheck = () => {
    if (isAllChecked) {
      // 전체 해제
      const cleared = Object.keys(record).reduce((acc, key) => {
        acc[key] = null
        return acc
      }, {} as CheckedRecordType)
      applyRecord(cleared)
    } else {
      // 전체 선택
      const now = serverTimestamp()
      const all = Object.keys(record).reduce((acc, key) => {
        acc[key] = now
        return acc
      }, {} as CheckedRecordType)
      applyRecord(all)
    }
  }

  const handleMoveTerm = (term: termType) => setViewCode(term.id)

  const handleTermConfirm = (term: termType) => {
    const now = serverTimestamp()
    applyRecord({...record, [term.id]: now})
    setViewCode(null)
  }

  return (
    <View style={styles.termList}>
      <View style={styles.termItem}>
        <Checkbox
          status={isAllChecked ? 'checked' : 'unchecked'}
          onPress={handleAllCheck}
          color={COLORS.secondary}
        />
        <Text style={styles.termTitle}>전체동의</Text>
      </View>

      {terms.map((term: termType) => {
        const isChecked = !!record[term.id]
        return (
          <View style={styles.termItem} key={term.id}>
            <Checkbox
              status={isChecked ? 'checked' : 'unchecked'}
              onPress={() => handleCheck(term.id, !isChecked)}
              color={COLORS.secondary}
            />
            <Text style={styles.requiredText}>
              ({term.required ? '필수' : '선택'})
            </Text>
            <Text style={styles.termTitle}>{term.title}</Text>
            <IconButton
              icon="chevron-right"
              style={styles.iconRIght}
              onPress={() => handleMoveTerm(term)}
            />
          </View>
        )
      })}

      <TermViewModal
        code={viewCode}
        onClose={() => setViewCode(null)}
        onConfirm={handleTermConfirm}
      />
    </View>
  )
})

const styles = StyleSheet.create({
  termList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    paddingVertical: 16,
  },
  termItem: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  requiredText: {
    fontSize: 12,
    fontFamily: 'BMDOHYEON',
    marginRight: 4,
    color: COLORS.deepGray,
  },
  termTitle: {color: COLORS.text, fontFamily: 'BMDOHYEON', fontSize: 13},
  iconRIght: {position: 'absolute', right: 0},
})
