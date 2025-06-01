import storage from '@react-native-firebase/storage'
import React, {useState} from 'react'
import {Alert, Image, StyleSheet, View} from 'react-native'
import {launchImageLibrary} from 'react-native-image-picker'
import {ActivityIndicator, FAB} from 'react-native-paper'
import COLORS from '../../constants/color'
import DefaultProfile from '../common/DefaultProfile'

interface propTypes {
  imageUri: string | null
  setImageUri: (value: string) => void
  edit?: boolean
  boxSize?: number
  iconSize?: number
}

export default function EditProfile({
  imageUri,
  setImageUri = () => {},
  edit,
  boxSize = 150,
  iconSize = 120,
}: propTypes): React.JSX.Element {
  // const [imageUri, setImageUri] = useState<string | null>(uri)
  const [loading, setLoading] = useState<boolean>(false)

  const pickAndUploadImage = async () => {
    try {
      const result = await launchImageLibrary({mediaType: 'photo'})

      if (result.didCancel || !result.assets?.[0]?.uri) return

      const localUri = result.assets[0].uri!
      const fileName = `profile_${Date.now()}.jpg`

      const ref = storage().ref(`profiles/${fileName}`)
      await ref.putFile(localUri)

      const downloadURL = await ref.getDownloadURL()
      setImageUri(downloadURL)
    } catch (e) {
      console.error('이미지 업로드 실패:', e)
      Alert.alert('오류', '이미지 업로드에 실패했습니다.')
    }
  }

  // 'outlined' | 'contained' | 'contained-tonal'
  return (
    <View style={styles.profile}>
      {imageUri ? (
        <View
          key={imageUri}
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
              source={{uri: imageUri}}
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
          onPress={pickAndUploadImage}
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
  },
  shadowWrapper: {
    position: 'absolute',
    bottom: 0,
    right: 0,

    // ✅ 그림자 (iOS)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    // ✅ 그림자 (Android)
    elevation: 5,
    backgroundColor: '#FFF',
    padding: -10,
    height: 20,
    width: 20,
  },
  picture: {},
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
