import {Alert, Platform} from 'react-native'
import {check, PERMISSIONS, request, RESULTS} from 'react-native-permissions'

export const requestPhotoPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const permission =
      Platform.Version >= 33
        ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE

    const currentStatus = await check(permission)
    console.log('currentStatus', currentStatus)
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
