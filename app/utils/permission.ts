import {PermissionsAndroid, Platform} from 'react-native'
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions'

// Android 권한 요청
const requestAndroidPermission = async () => {
  if (Number(Platform.Version) >= 33) {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
    )
    return result === PermissionsAndroid.RESULTS.GRANTED
  } else {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    )
    return result === PermissionsAndroid.RESULTS.GRANTED
  }
}

// iOS 권한 요청
const requestIOSPermission = async () => {
  const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY)
  return result === RESULTS.GRANTED || result === RESULTS.LIMITED
}

// 플랫폼별 요청 통합
export const requestPhotoPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    return await requestAndroidPermission()
  } else if (Platform.OS === 'ios') {
    return await requestIOSPermission()
  }
  return true
}
