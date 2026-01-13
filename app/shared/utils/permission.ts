import {PermissionsAndroid, Platform} from 'react-native'
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions'

export const requestPhotoPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const permission =
      Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE

    let status = await check(permission)

    if (status === RESULTS.DENIED) {
      status = await request(permission)
    }

    if (status === RESULTS.GRANTED) {
      return true
    }
    return false
  }

  if (Platform.OS === 'ios') {
    let status = await check(PERMISSIONS.IOS.PHOTO_LIBRARY)

    if (status === RESULTS.DENIED) {
      status = await request(PERMISSIONS.IOS.PHOTO_LIBRARY)
    }

    // ✅ iOS 핵심
    if (status === RESULTS.GRANTED || status === RESULTS.LIMITED) {
      return true
    }

    return false
  }

  return false
}

export async function ensureAndroidWritePermission() {
  if (Platform.OS !== 'android') return true

  // Android 13(Tiramisu) 이상이면 READ/WRITE 대신 READ_MEDIA_* 권한 써야 하는데,
  // Download 폴더만 쓰는 정도면 대개 아래 WRITE_EXTERNAL_STORAGE로도 동작하는 케이스가 많음
  // (프로젝트 targetSdk/정책에 따라 조정 필요)
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
  )

  return granted === PermissionsAndroid.RESULTS.GRANTED
}
