import {fileService} from '@app/features/media/service/fileService'
import dayjs from 'dayjs'
import {Platform} from 'react-native'
import ReactNativeBlobUtil from 'react-native-blob-util'
import RNFS from 'react-native-fs'
import {ImagePickerResponse} from 'react-native-image-picker'
import {ensureAndroidWritePermission} from './permission'

export const isLocalFile = (url: string | null): boolean => {
  if (!url) return false
  else return url.startsWith('file://')
}

interface UploadResult {
  downloadUrl: string
  fileName: string
}

export function normalizeLocalUri(uri: string) {
  // putFile은 Android에서 보통 file:// 제거가 안정적
  // iOS도 제거해도 대체로 문제 없음
  return uri.startsWith('file://') ? uri.replace('file://', '') : uri
}

export function pickFirstAsset(result: ImagePickerResponse) {
  return result?.assets?.[0]
}

export const firebaseImageUpload = async (
  result: ImagePickerResponse,
  rootName?: string,
): Promise<UploadResult | null> => {
  const image = result?.assets?.[0]
  if (!image?.uri || !image.fileName) return null
  try {
    const uploadRes = await fileService.uploadImagesFromPicker(result, {
      rootName: rootName ?? 'common',
      ext: 'jpg',
    })
    return uploadRes?.[0] || null
  } catch (error) {
    console.error('[firebaseImageUpload] 업로드 실패:', error)
    return null
  }
}

export const filebaseFileDownload = async (uid: string, imageUrl: string) => {
  try {
    // ✅ 안드로이드: /storage/emulated/0/Download/PandyTalk/{uid}
    // ✅ iOS: 기존대로 CachesDirectoryPath 사용
    const baseDir =
      Platform.OS === 'android'
        ? RNFS.DownloadDirectoryPath
        : RNFS.CachesDirectoryPath

    if (Platform.OS === 'android') {
      const ok = await ensureAndroidWritePermission()
      if (!ok) {
        return
      }
    }

    // 1. 저장할 폴더 & 파일 경로
    const dir = `${baseDir}/PandyTalk/${uid}` // ← 여기서 PandyTalk 폴더 생성
    await RNFS.mkdir(dir)

    const localPath = `${dir}/profile_${dayjs().format(
      'YYYYMMDD_HHmmss',
    )}_${uid}.jpg`

    // 2. 다운로드
    const {promise} = RNFS.downloadFile({
      fromUrl: imageUrl,
      toFile: localPath,
    })

    const res = await promise

    if (res.statusCode !== 200) {
      throw new Error(`다운로드 실패 (status: ${res.statusCode})`)
    }

    console.log('다운로드 완료:', localPath)
    return localPath
  } catch (e) {
    console.log('file download err:', e)
  }
}

export const downloadWithSystemUI = async (uid: string, imageUrl: string) => {
  if (Platform.OS !== 'android') {
    // iOS는 DownloadManager 개념이 없어서, 그냥 기존 함수 쓰는 게 맞음
    return filebaseFileDownload(uid, imageUrl)
  }

  const {fs, config} = ReactNativeBlobUtil
  const downloads = fs.dirs.DownloadDir // /storage/emulated/0/Download

  const fileName = `pandyTalk_${uid}_${Date.now()}.jpg`
  const path = `${downloads}/${fileName}`
  try {
    const res = await config({
      fileCache: true,
      path,
      addAndroidDownloads: {
        useDownloadManager: true, // ✅ 시스템 DownloadManager 사용
        notification: true, // ✅ 알림 표시 (툴바/알림창 뜸)
        mediaScannable: true, // 갤러리 앱에도 노출
        title: fileName, // 알림에 나올 제목
        description: '프로필 이미지를 다운로드 중입니다.',
        mime: 'image/jpeg',
      },
    }).fetch('GET', imageUrl)

    return res.path()
  } catch (e) {
    console.log('DownloadManager 다운로드 실패:', e)
  }
}

/**
 * 안드로이드: DownloadManager + 상단 알림 + /Download 에 저장
 * iOS      : 앱 DocumentDirectory/profiles/{uid} 에 저장 (RNFS)
 *
 * @return 저장된 파일의 로컬 경로
 */
export const downloadUrl = async (
  fileUrl: string,
  filename?: string,
): Promise<string | undefined> => {
  if (!fileUrl) return

  // 📌 공통적으로 사용할 파일 이름
  const fileName =
    filename || `pandyTalk_${dayjs().format('YYYYMMDD_HHmmss')}.jpg`

  // ===========================
  //  ANDROID: DownloadManager
  // ===========================
  if (Platform.OS === 'android') {
    const {fs, config} = ReactNativeBlobUtil
    // ✅ 공개 Download 경로 직접 지정
    const downloadsRoot = '/storage/emulated/0/Download'
    const targetDir = `${downloadsRoot}/PandyTalk` // 원하면 서브폴더
    const path = `${targetDir}/${fileName}`

    try {
      const res = await config({
        addAndroidDownloads: {
          useDownloadManager: true, // ✅ 시스템 DownloadManager 사용
          notification: true, // ✅ 알림 표시
          mediaScannable: true, // 갤러리 앱에 노출
          title: fileName,
          description: '프로필 이미지를 다운로드 중입니다.',
          mime: 'image/jpeg',
          path, // ✅ 실제 저장 경로 (Download/PandyTalk_xxx.jpg)
        },
      }).fetch('GET', fileUrl)

      // DownloadManager가 저장한 실제 경로 대신 우리가 지정한 path 리턴
      return path
    } catch (e) {
      console.log('DownloadManager 다운로드 실패:', e)
      return
    }
  }

  // ===========================
  //  iOS: RNFS 로 내부 저장
  // ===========================
  try {
    // 예: /var/mobile/Containers/Data/.../Documents/profiles/{uid}/pandyTalk_...
    // const dir = `${RNFS.DocumentDirectoryPath}/profiles/${uid}`
    // await RNFS.mkdir(dir)
    const dir = `${RNFS.DocumentDirectoryPath}/downloads`
    await RNFS.mkdir(dir)
    const localPath = `${dir}/${fileName}`

    console.log('[iOS] RNFS path:', localPath)

    const {promise} = RNFS.downloadFile({
      fromUrl: fileUrl,
      toFile: localPath,
    })

    const res = await promise

    if (res.statusCode !== 200) {
      throw new Error(`다운로드 실패 (status: ${res.statusCode})`)
    }

    console.log('다운로드 완료(iOS RNFS):', localPath)
    return localPath
  } catch (e) {
    console.log('iOS RNFS 다운로드 실패:', e)
    return
  }
}
