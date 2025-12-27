import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import storage from '@react-native-firebase/storage'

export const fileRemote = {
  uploadFile: (path: string, localUri: string) => {
    return firebaseCall<string>('fileRemote.uploadFile', async () => {
      const ref = storage().ref(path)
      await ref.putFile(localUri)
      return await ref.getDownloadURL()
    })
  },
}
