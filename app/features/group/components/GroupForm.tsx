import {
  serverTimestamp,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {useQueryClient} from '@tanstack/react-query'
import React, {useMemo, useRef, useState} from 'react'
import {Alert, ScrollView, StyleSheet, Text, View} from 'react-native'

import {auth, firestore} from '../../../shared/firebase/firestore'
import InputForm from '../../../shared/ui/form/InputForm'

import COLORS from '@app/shared/constants/color'
import {ServerTime} from '@app/shared/types/firebase'
import {FormItem} from '@app/shared/types/form'
import {Group} from '@app/features/group/types/group'
import AppInput from '@app/shared/ui/input/AppInput'
import EditProfile, {ProfileInputRef} from '@app/shared/ui/upload/EditProfile'
import {formatServerDate} from '../../../shared/utils/format'
import UserSelect from '../../user/components/UserSelect'

type propTypes = {
  record?: Group | null
  onRefresh?: () => void
  onClose?: () => void
}
type GroupCreateInput = {
  name: string
  ownerId?: string | null
  memo?: string
}

export default function GroupForm({record, onRefresh, onClose}: propTypes) {
  const [loading, setLoading] = useState(false)
  const profileRef = useRef<ProfileInputRef | null>(null)
  const queryClient = useQueryClient()

  const items: FormItem[] = useMemo(
    () => [
      {
        key: 'name',
        label: '그룹명',
        required: true,
        render: (value, onChange) => (
          <AppInput value={value} onChangeText={onChange} />
        ),
      },
      {
        key: 'ownerId',
        label: '그룹장',
        // required: true,
        render: (value, onChange) => (
          <UserSelect
            value={typeof value === 'string' ? value : null}
            onChange={onChange}
          />
        ),
      },
      {
        key: 'memo',
        label: '메모',
        required: true,
        render: (value, onChange) => (
          <AppInput
            value={value}
            onChangeText={onChange}
            multiline={true}
            numberOfLines={4}
            style={{height: 100}}
          />
        ),
      },
      {
        key: 'createdAt',
        label: '생성일',
        render: value => (
          <Text>{formatServerDate(value as unknown as ServerTime)}</Text>
        ),
      },
    ],
    [],
  )

  const handleSubmit = async (formValues: GroupCreateInput) => {
    try {
      setLoading(true)
      const newPhotoURL = await profileRef?.current?.upload?.()
      const currentUid = auth.currentUser?.uid ?? undefined

      // 🔎 편집 여부 판정 (uid 우선, 없으면 id도 허용)
      const targetId = record?.uid ?? record?.id
      const isEditing = !!targetId

      if (isEditing) {
        // ====== UPDATE ======
        const docRef = firestore.collection('groups').doc(String(targetId))

        // 바꿀 필드만 패치(ownerId/createdAt은 보존)
        const patch: {
          name: string
          memo?: string
          photoURL?: string | null
        } = {
          name: formValues.name.trim(),
          memo: formValues?.memo?.trim() || '',
          photoURL: newPhotoURL,
        }

        // 새 업로드가 있을 때만 photoURL 갱신(없으면 기존 값 유지)
        if (typeof newPhotoURL !== 'undefined') {
          patch.photoURL = newPhotoURL // null을 의도적으로 넣고 싶다면 UI에서 null 전달
        }

        await docRef.set(patch, {merge: true}) // 또는 await docRef.update(patch)
        Alert.alert('수정성공', '그룹 정보가 수정되었습니다.')
        onClose?.()
      } else {
        // ====== CREATE ======
        const docRef = firestore.collection('groups').doc()
        const data: {
          id: string
          name: string
          createdAt: FirebaseFirestoreTypes.FieldValue
          memo?: string
          ownerId?: string
          photoURL?: string | null
        } = {
          id: docRef.id,
          name: formValues.name.trim(),
          createdAt: serverTimestamp(),
          memo: formValues.memo?.trim() || undefined,
          ownerId: formValues?.ownerId || currentUid, // 규칙상 본인 UID가 들어가야 함
          photoURL: newPhotoURL ?? null,
        }

        await docRef.set(data)
      }

      Alert.alert('등록성공', '그룹 등록에 성공하였습니다.')
      onRefresh?.()
      onClose?.()
      queryClient.invalidateQueries({queryKey: ['users']}) //유저 조회 쿼리갱신
    } catch (err) {
      console.error(err)
      Alert.alert('실패', '그룹 저장에 실패하였습니다.')
    } finally {
      setLoading(false)
    }
  }
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <InputForm
          buttonLabel="저장"
          items={items}
          formData={record}
          formKey={record?.uid}
          onSubmit={handleSubmit}
          topElement={
            <View style={styles.topRow}>
              <Text style={styles.title}>그룹 설정하기</Text>
              <View>
                <EditProfile
                  ref={profileRef}
                  edit={true}
                  defaultUrl={record?.photoURL || null}
                  boxSize={120}
                  iconSize={85}
                />
              </View>
            </View>
          }
          layout={{
            rowsStyle: {paddingVertical: 8},
            labelStyle: {fontFamily: 'BMDOHYEON', color: COLORS.secondary},
          }}
          loading={loading}
          btnDisable={loading}
          useBotton={true}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    // padding: 24,
    borderRadius: 32, // 스그니처 32px 곡률
    backgroundColor: '#FFF',
    height: 570, // 시원하게 가시성 확보
  },
  topRow: {
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  title: {
    color: '#2D2D2D',
    fontFamily: 'BMDOHYEON',
    fontSize: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
})
