import storage from '@react-native-firebase/storage'
import {ImagePickerResponse} from 'react-native-image-picker'

export const isLocalFile = (url: string | null): boolean => {
  if (!url) return false
  else return url.startsWith('file://')
}

interface UploadResult {
  downloadUrl: string
  fileName: string
}

export const firebaseImageUpload = async (
  result: ImagePickerResponse,
  filePath: string,
): Promise<UploadResult | null> => {
  const image = result?.assets?.[0]
  if (!image?.uri || !image.fileName) return null
  console.log('result', result)
  console.log('filePath', filePath)
  try {
    const storageRef = storage().ref(filePath)

    // Android: file:// 제거, iOS는 자동 처리 가능
    const cleanedUri = image.uri.replace('file://', '')
    await storageRef.putFile(cleanedUri)
    const downloadUrl = await storageRef.getDownloadURL()

    return {
      downloadUrl,
      fileName: image.fileName,
    }
  } catch (error) {
    console.error('[firebaseImageUpload] 업로드 실패:', error)
    return null
  }
}
