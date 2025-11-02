import {serverTimestamp} from '@react-native-firebase/firestore'
import React, {useState} from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {Checkbox} from 'react-native-paper'
import COLORS from '../../../constants/color'
import {terms} from '../../../constants/terms'
import type {termType} from '../../../types/auth'
import type {ServerTime} from '../../../types/chat'

export default function TermAgreementList() {
  const [checkedRecord, setCheckedRecord] = useState<
    Record<string, ServerTime | null>
  >({})
  const isAllChecked =
    Object.values(checkedRecord).length > 0 &&
    Object.values(checkedRecord).every(v => v !== null)

  const handleCheck = (termId: string, isChecked: boolean) => {
    setCheckedRecord(old => ({
      ...old,
      [termId]: isChecked ? serverTimestamp() : null,
    }))
  }

  const handleAllCheck = () => {
    console.log('allChecked', isAllChecked)
    if (!isAllChecked) {
      // ✅ 전체 해제
      const cleared = Object.keys(checkedRecord).reduce(
        (acc, key) => {
          acc[key] = null
          return acc
        },
        {} as Record<string, null>,
      )
      setCheckedRecord(cleared)
    } else {
      // ✅ 전체 선택 (현재 시간으로 채움)
      const now = serverTimestamp()
      const all: Record<string, ServerTime> = Object.keys(checkedRecord).reduce(
        (acc, key) => {
          acc[key] = now
          return acc
        },
        {} as Record<string, ServerTime>,
      )
      setCheckedRecord(all)
    }
  }

  return (
    <View style={styles.termList}>
      <View style={styles.termItem}>
        <Checkbox
          status={isAllChecked ? 'checked' : 'unchecked'}
          onPress={handleAllCheck}
          color={COLORS.primary}
        />
        <Text style={styles.termTitle}>전체동의</Text>
      </View>
      {terms?.map((term: termType) => {
        const isChecked = !!checkedRecord[term?.id]
        return (
          <View style={styles.termItem} key={term?.id}>
            <Checkbox
              status={isChecked ? 'checked' : 'unchecked'}
              onPress={() => handleCheck(term.id, !isChecked)}
              color={COLORS.primary}
            />
            <Text style={styles.termTitle}>{term?.title}</Text>
          </View>
        )
      })}
    </View>
  )
}

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
  termTitle: {color: COLORS.text, fontFamily: 'BMDOHYEON', fontSize: 13},
})
