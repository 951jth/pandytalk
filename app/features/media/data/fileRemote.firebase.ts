import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {storage} from '@app/shared/firebase/firestore'
import {getDownloadURL, putFile, ref} from '@react-native-firebase/storage'

export const fileRemote = {
  uploadFile: (path: string, localUri: string) => {
    return firebaseCall<string>('fileRemote.uploadFile', async () => {
      const storageRef = ref(storage, path)
      await putFile(storageRef, localUri)
      return await getDownloadURL(storageRef)
    })
  },
}
