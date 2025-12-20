import {fileRemote} from '@app/features/media/data/fileRemote.firebase'
import {isLocalFile} from '@app/shared/utils/file'

export const fileService = {
  uploadFile: (localUri: string, rootName?: string, fileName?: string) => {
    if (isLocalFile(localUri)) {
      return fileRemote.uploadFile(localUri, rootName, fileName)
    } else return localUri || null
  },
}
