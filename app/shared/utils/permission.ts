import {Alert, Platform} from 'react-native'
import {
  check,
  openSettings,
  PERMISSIONS,
  PermissionStatus,
  request,
  RESULTS,
} from 'react-native-permissions'

export type PhotoPermissionResult =
  | {ok: true; status: 'GRANTED' | 'LIMITED'}
  | {ok: false; status: 'DENIED' | 'BLOCKED' | 'UNAVAILABLE'; reason?: string}

/**
 * 사진 업로드 권한 확인/요청
 * - DENIED: request()로 1회 요청
 * - BLOCKED: 더 이상 OS 팝업 불가 -> 설정 유도 필요
 * - iOS: LIMITED도 업로드 가능으로 처리
 */
export const requestPhotoPermission =
  async (): Promise<PhotoPermissionResult> => {
    // Android
    if (Platform.OS === 'android') {
      const permission =
        Platform.Version >= 33
          ? PERMISSIONS.ANDROID.READ_MEDIA_IMAGES
          : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE

      let status: PermissionStatus = await check(permission)

      // 아직 요청 가능하면 1회 요청
      if (status === RESULTS.DENIED) {
        status = await request(permission)
      }

      if (status === RESULTS.GRANTED) {
        return {ok: true, status: 'GRANTED'}
      }

      if (status === RESULTS.BLOCKED) {
        return {
          ok: false,
          status: 'BLOCKED',
          reason: '설정에서 사진 접근 권한을 허용해야 합니다.',
        }
      }

      if (status === RESULTS.UNAVAILABLE) {
        return {
          ok: false,
          status: 'UNAVAILABLE',
          reason: '이 기기에서는 사진 접근을 지원하지 않습니다.',
        }
      }

      // RESULTS.DENIED 등
      return {ok: false, status: 'DENIED'}
    }

    // iOS
    if (Platform.OS === 'ios') {
      let status: PermissionStatus = await check(PERMISSIONS.IOS.PHOTO_LIBRARY)

      if (status === RESULTS.DENIED) {
        status = await request(PERMISSIONS.IOS.PHOTO_LIBRARY)
      }

      if (status === RESULTS.GRANTED) {
        return {ok: true, status: 'GRANTED'}
      }

      // ✅ iOS는 LIMITED도 실무에선 보통 허용으로 처리 (업로드 가능)
      if (status === RESULTS.LIMITED) {
        return {ok: true, status: 'LIMITED'}
      }

      if (status === RESULTS.BLOCKED) {
        return {
          ok: false,
          status: 'BLOCKED',
          reason: '설정에서 사진 접근 권한을 허용해야 합니다.',
        }
      }

      if (status === RESULTS.UNAVAILABLE) {
        return {
          ok: false,
          status: 'UNAVAILABLE',
          reason: '이 기기에서는 사진 접근을 지원하지 않습니다.',
        }
      }

      return {ok: false, status: 'DENIED'}
    }

    return {ok: false, status: 'UNAVAILABLE'}
  }

/**
 * BLOCKED 상태에서 호출: 설정으로 이동
 */
export const goToAppSettings = async (): Promise<boolean> => {
  try {
    await openSettings()
    return true
  } catch {
    return false
  }
}

export const showPermissionBlockedAlert = ({
  title = '권한이 필요해요',
  message = '설정에서 권한을 허용해야 업로드 기능을 사용할 수 있어요.',
}: {
  title?: string
  message?: string
}) => {
  console.log('ok')
  Alert.alert(
    title,
    message,
    [
      {text: '취소', style: 'cancel'},
      {
        text: '설정으로 이동',
        onPress: () => {
          openSettings().catch(() => {
            // 설정 앱 이동 실패 시 (거의 없음)
          })
        },
      },
    ],
    {cancelable: true},
  )
}
