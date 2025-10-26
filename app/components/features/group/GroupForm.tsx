import {
  serverTimestamp,
  type FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore'
import {useNavigation} from '@react-navigation/native'
import type {NativeStackNavigationProp} from '@react-navigation/native-stack'
import React, {useMemo, useRef, useState} from 'react'
import {Alert, StyleSheet, Text, View} from 'react-native'
// import COLORS from '../../constants/color'
// import {auth, firestore} from '../../store/firestore'
// import type {FormItem} from '../../types/form'
// import type {Group} from '../../types/group'
// import type {AppRouteParamList} from '../../types/navigate'
// import PandyButton from '../button/PandyButton'
// import InputForm from '../form/InputForm'
// import EditInput from '../input/EditInput'
import {useQueryClient} from '@tanstack/react-query'
import COLORS from '../../../constants/color'
import {auth, firestore} from '../../../store/firestore'
import type {FormItem} from '../../../types/form'
import type {Group} from '../../../types/group'
import type {AppRouteParamList} from '../../../types/navigate'
import {formatServerDate} from '../../../utils/firebase'
import InputForm from '../../form/InputForm'
import EditInput from '../../input/EditInput'
import UserSelect from '../../select/UserSelect'
import type {profileInputRef} from '../../upload/EditProfile'
import EditProfile from '../../upload/EditProfile'

const initialValues = {
  name: '',
  memo: '',
  created: '',
  ownerId: auth.currentUser?.uid || null,
}

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
  const profileRef = useRef<profileInputRef | null>(null)
  const navigation =
    useNavigation<NativeStackNavigationProp<AppRouteParamList>>()
  const queryClient = useQueryClient()

  const items: FormItem[] = useMemo(
    () => [
      {
        key: 'name',
        label: '그룹명',
        required: true,
        render: (value, onChange) => (
          <EditInput value={value} onChangeText={onChange} />
        ),
      },
      {
        key: 'ownerId',
        label: '그룹장',
        // required: true,
        render: (value, onChange) => (
          //   <EditInput
          //     value={value}
          //     onChangeText={onChange}
          //     rightElement={
          //       <PandyButton
          //         shape="rounded"
          //         title="선택"
          //         onPress={() => navigation.navigate('user-select')}
          //       />
          //     }
          //   />
          <UserSelect value={value} onChange={onChange} />
        ),
      },
      {
        key: 'memo',
        label: '메모',
        required: true,
        render: (value, onChange) => (
          <EditInput value={value} onChangeText={onChange} />
        ),
      },
      {
        key: 'createdAt',
        label: '생성일',
        render: (value: string) =>
          value && <Text>{formatServerDate(value)}</Text>,
      },
    ],
    [navigation],
  )

  const handleSubmit = async (formValues: GroupCreateInput) => {
    try {
      setLoading(true)
      const newPhotoURL = await profileRef?.current?.upload?.()
      const currentUid = auth.currentUser?.uid ?? undefined

      // 🔎 편집 여부 판정 (uid 우선, 없으면 id도 허용)
      const targetId = (record as any)?.uid ?? (record as any)?.id
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
  console.log('record', record)
  return (
    <View style={styles.container}>
      <InputForm
        editable={true}
        buttonLabel="저장"
        items={items}
        initialValues={record || initialValues}
        onSubmit={handleSubmit}
        topElement={
          <>
            <View style={styles.topRow}>
              <Text style={styles.title}>그룹 설정하기</Text>
              <EditProfile
                ref={profileRef}
                edit={true}
                defaultUrl={record?.photoURL || null}
                boxSize={120}
                iconSize={80}
              />
            </View>
          </>
        }
        loading={loading}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 430,
    backgroundColor: '#FFF',
  },
  topRow: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: COLORS.primary,
    fontFamily: 'BMDOHYEON',
    fontWeight: 500,
    fontSize: 20,
    marginBottom: 12,
  },
})
