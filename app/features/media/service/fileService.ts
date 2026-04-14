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
    // ✅ 2. 예외 처리: 이미 원격(Remote) URL인 경우 업로드 불필요
    // (프로필 수정 화면에서 기존 이미지를 그대로 둔 경우 등)
    if (localUri.startsWith('http')) {
      return localUri
    }

    const currentUid = auth.currentUser?.uid
    const safeName = fileName ?? `${Date.now()}.${ext}`
    const path = `${rootName}/${uid ?? currentUid}/${safeName}`
    return await fileRemote.uploadFile(path, localUri)
  },

  uploadImagesFromPicker: async (
    result: ImagePickerResponse,
    options: UploadImageOptions,
  ): Promise<UploadResult[]> => {
    const assets = result.assets || []
    const uid = auth.currentUser?.uid
    const results: UploadResult[] = []

    if (!assets.length || !uid) return []

    const uploadPromises = assets.map(async (asset, index) => {
      const uri = asset.uri
      if (!uri) return null

      const assetFileName = asset.fileName
      const ext = options.ext ?? 'jpg'
      const resolvedFileName =
        options.fileName ?? assetFileName ?? `${Date.now()}_${index}.${ext}`

      const root = options.rootName ?? 'uploads'
      const filePath =
        options.filePath ?? `${root}/${uid}/${resolvedFileName}`

      try {
        const cleanedUri = normalizeLocalUri(uri)
        const downloadUrl = await fileRemote.uploadFile(filePath, cleanedUri)
        return {
          downloadUrl,
          fileName: resolvedFileName,
        }
      } catch (e) {
        console.error(
          `[fileService.uploadImagesFromPicker] index ${index} 실패:`,
          e,
        )
        return null
      }
    })

    const settledResults = await Promise.all(uploadPromises)
    return settledResults.filter((r): r is UploadResult => r !== null)
  },
}
