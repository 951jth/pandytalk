import {fileRemote} from '@app/features/media/data/fileRemote.firebase'
import {auth} from '@app/shared/firebase/firestore'
import {normalizeLocalUri, pickFirstAsset} from '@app/shared/utils/file'
import {ImagePickerResponse} from 'react-native-image-picker'

export type UploadResult = {
  downloadUrl: string
  fileName: string
}

type UploadImageOptions = {
  /**
   * filePath를 외부에서 확정해서 넣고 싶으면 사용
   * (예: `uploads/{uid}/avatar.jpg`)
   */
  filePath?: string

  /**
   * 정책 기반으로 자동 생성하고 싶으면 사용
   * (filePath가 없을 때 적용)
   */
  rootName?: string // default: 'uploads'
  uid?: string // default: throw (권장: UI에서 주입)
  fileName?: string
  /**
   * asset.fileName이 없을 때 fallback 확장자
   */
  ext?: 'jpg' | 'jpeg' | 'png' | 'webp'
}

export const fileService = {
  uploadFile: async ({
    localUri,
    uid,
    rootName = 'uploads',
    fileName,
    ext = 'jpg',
  }: {
    localUri: string
    uid?: string
    rootName?: string
    fileName?: string
    ext?: 'jpg' | 'png' | 'webp'
  }) => {
    const currentUid = auth.currentUser?.uid
    const safeName = fileName ?? `${Date.now()}.${ext}`
    const path = `${rootName}/${uid ?? currentUid}/${safeName}`
    return await fileRemote.uploadFile(path, localUri)
  },

  uploadImageFromPicker: async (
    result: ImagePickerResponse,
    options: UploadImageOptions,
  ): Promise<UploadResult | null> => {
    const asset = pickFirstAsset(result)
    const uri = asset?.uri
    const uid = auth.currentUser?.uid
    if (!uri) return null

    // fileName은 picker가 항상 주지 않을 수 있어서 fallback 필요
    const assetFileName = asset?.fileName
    const ext = options.ext ?? 'jpg'
    const resolvedFileName =
      options.fileName ?? assetFileName ?? `${Date.now()}.${ext}`
    // filePath가 있으면 그대로 쓰고, 없으면 정책으로 생성
    const filePath =
      options.filePath ??
      (() => {
        const root = options.rootName ?? 'uploads'
        return `${root}/${uid}/${resolvedFileName}`
      })()

    try {
      const cleanedUri = normalizeLocalUri(uri)
      const downloadUrl = await fileRemote.uploadFile(filePath, cleanedUri)

      return {
        downloadUrl,
        fileName: resolvedFileName,
      }
    } catch (e) {
      console.error('[fileService.uploadImageFromPicker] 업로드 실패:', e)
      return null
    }
  },
}
