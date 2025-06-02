import React, {useState} from 'react'
import {Image, StyleSheet, View} from 'react-native'
import {launchImageLibrary} from 'react-native-image-picker'
import {ActivityIndicator, FAB} from 'react-native-paper'
import COLORS from '../../constants/color'
import {requestPhotoPermission} from '../../utils/permission'
import DefaultProfile from '../common/DefaultProfile'

interface propTypes {
  previewUrl: string | null
  setPreviewUrl: (value: string) => void
  edit?: boolean
  boxSize?: number
  iconSize?: number
}

export default function EditProfile({
  previewUrl,
  setPreviewUrl = () => {},
  edit,
  boxSize = 150,
  iconSize = 120,
}: propTypes): React.JSX.Element {
  // const [imageUri, setImageUri] = useState<string | null>(uri)
  const [loading, setLoading] = useState<boolean>(false)

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
      const hasPermission = await requestPhotoPermission()
      if (!hasPermission) return
      const result = await launchImageLibrary({mediaType: 'photo'})
      if (result.didCancel || !result.assets?.[0]?.uri) return
      setPreviewUrl(result.assets[0].uri!)
    } catch (e) {
      console.log('이미지피커 오류: ', e)
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
            <Image
              source={{uri: previewUrl}}
              resizeMode="cover"
              style={{
                width: boxSize,
                height: boxSize,
                borderRadius: boxSize / 2,
              }}
              // loading={loading}
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
}

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
