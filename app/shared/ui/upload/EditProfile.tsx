import storage from '@react-native-firebase/storage'
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
  type ForwardedRef,
} from 'react'
import {StyleSheet, View} from 'react-native'
import {launchImageLibrary} from 'react-native-image-picker'
import {ActivityIndicator, FAB} from 'react-native-paper'
import COLORS from '../../../constants/color'
import {auth} from '../../firebase/firestore'
import {isLocalFile} from '../../utils/file'
import {requestPhotoPermission} from '../../utils/permission'
import DefaultProfile from '../common/DefaultProfile'
import ImageViewer from '../common/ImageViewer'

interface propTypes {
  // previewUrl: string | null
  // setPreviewUrl: (value: string) => void
  defaultUrl: string | null | undefined
  edit?: boolean
  boxSize?: number
  iconSize?: number
}

export interface profileInputRef {
  upload: () => Promise<string | null>
  getImage: () => string | null | undefined
  setImage: (value: string) => void
  onReset: () => void
}

//ref로 받도록 수정함
export default forwardRef(function EditProfile(
  {
    // previewUrl,
    // setPreviewUrl = () => {},
    defaultUrl,
    edit,
    boxSize = 120,
    iconSize = 90,
  }: propTypes,
  ref: ForwardedRef<profileInputRef>,
) {
  const [previewUrl, setPreviewUrl] = useState(defaultUrl)
  // const [imageUri, setImageUri] = useState<string | null>(uri)
  const [loading, setLoading] = useState<boolean>(false)

  useImperativeHandle(ref, () => ({
    upload: () => uploadImage(),
    getImage: () => previewUrl,
    setImage: (url: string) => setPreviewUrl(url),
    onReset: () => setPreviewUrl(defaultUrl),
  }))

  useEffect(() => {
    ;(async () => {
      // Android 13 이상일 경우 권한 체크
      const hasPermission = await requestPhotoPermission()
      if (!hasPermission) return
    })()
  }, [])

  // 사용자가 이미지 변경 할때마다다 파일업로드 하는방식
  // const pickAndUploadImage = async () => {
  //   try {
  //     setLoading(true)
  //     const result = await launchImageLibrary({mediaType: 'photo'})
  //     const oldPhotoUrl = cloneDeep(imageUri)
  //     if (result.didCancel || !result.assets?.[0]?.uri) return

  //     const localUri = result.assets[0].uri!
  //     const fileName = `profile_${Date.now()}.jpg`

  //     const ref = storage().ref(`profiles/${fileName}`)
  //     await ref.putFile(localUri)

  //     const downloadURL = await ref.getDownloadURL()
  //     setImageUri(downloadURL)
  //     if (oldPhotoUrl) {
  //       const match = decodeURIComponent(oldPhotoUrl).match(/profiles\/.+/)
  //       if (match) {
  //         const oldRef = storage().ref(match[0])
  //         await oldRef.delete()
  //       }
  //     }
  //   } catch (e) {
  //     console.error('이미지 업로드 실패:', e)
  //     Alert.alert('오류', '이미지 업로드에 실패했습니다.')
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  const pickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
      })

      // 유저가 취소했거나 uri가 없을 경우 무시
      if (result.didCancel || result.errorCode) return
      const asset = result.assets?.[0]
      if (!asset?.uri) {
        console.warn('선택된 이미지가 없습니다.')
        return
      }

      // 결과 URI 설정
      setPreviewUrl(asset.uri)
    } catch (error) {
      console.error('이미지 선택 중 오류:', error)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    try {
      if (previewUrl && isLocalFile(previewUrl)) {
        const fileName = `profile_${Date.now()}.jpg`
        const uid = auth.currentUser?.uid
        const ref = storage().ref(`profiles/${uid}/${fileName}`)
        await ref.putFile(previewUrl)
        const newPhotoURL = await ref.getDownloadURL()
        return newPhotoURL
      } else return previewUrl || null
    } catch (e) {
      console.log(e)
      return null
    }
  }

  return (
    <View style={styles.profile}>
      {previewUrl ? (
        <View
          key={previewUrl}
          style={{
            width: boxSize,
            height: boxSize,
            borderRadius: boxSize / 2,
            overflow: 'hidden', // ✅ 추가
          }}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <ImageViewer
              images={[{uri: previewUrl}]}
              imageProps={{
                resizeMode: 'cover',
                style: {
                  width: boxSize,
                  height: boxSize,
                  borderRadius: boxSize / 2,
                },
              }}
            />
          )}
        </View>
      ) : (
        <DefaultProfile boxSize={boxSize} iconSize={iconSize} />
      )}
      {edit && (
        <FAB
          icon="camera"
          style={styles.editButton}
          onPress={pickImage}
          size="small"
          color="#000"
          customSize={40}
        />
      )}
    </View>
  )
})

const styles = StyleSheet.create({
  profile: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    // ✅ 그림자 (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // ✅ 그림자 (Android)
    elevation: 5,
    // ✅ 배경색이 있어야 그림자 표시됨 (특히 iOS)
    backgroundColor: '#FFF',
    // ✅ 둥근 외곽이 유지되도록
    borderRadius: 100,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderRadius: 100,
    // ✅ 그림자 (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // ✅ 그림자 (Android)
    elevation: 5,
  },
})
