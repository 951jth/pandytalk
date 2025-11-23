import {Alert, PermissionsAndroid, Platform} from 'react-native'
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions'

export const requestPhotoPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const permission =
      Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE

    const currentStatus = await check(permission)
    if (currentStatus === RESULTS.GRANTED) {
      return true
    }

    // GRANTED가 아니면 요청만 시도하고 false 반환
    const result = await request(permission)

    if (result === RESULTS.LIMITED) {
      Alert.alert(
        '제한된 권한 허용됨',
        '선택한 사진에만 접근할 수 있어요. 전체 보기를 원하면 설정에서 권한을 변경해주세요.',
      )
    } else if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
      Alert.alert('권한 거부됨', '사진을 선택하려면 권한을 허용해주세요.')
    }

    return false
  }

  if (Platform.OS === 'ios') {
    const currentStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY)

    if (currentStatus === RESULTS.GRANTED) {
      return true
    }

    const result = await request(PERMISSIONS.IOS.PHOTO_LIBRARY)

    if (result === RESULTS.LIMITED) {
      Alert.alert(
        '제한된 권한 허용됨',
        '일부 사진에만 접근할 수 있어요. 전체 보기를 원하면 설정에서 권한을 변경해주세요.',
      )
    } else if (result === RESULTS.BLOCKED || result === RESULTS.DENIED) {
      Alert.alert('권한 거부됨', '사진을 선택하려면 권한을 허용해주세요.')
    }

    return false
  }

  return true
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
