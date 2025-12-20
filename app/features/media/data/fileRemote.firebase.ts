import {auth} from '@app/shared/firebase/firestore'
import {firebaseCall} from '@app/shared/utils/logger'
import storage from '@react-native-firebase/storage'

export const fileRemote = {
  uploadFile: (localUri: string, rootName?: string, fileName?: string) => {
    return firebaseCall<string>('fileRemote.uplodeFile', async () => {
      const uid = auth.currentUser?.uid
      console.log('uid', uid)
      console.log(
        `${rootName ?? 'uploads'}/${uid}/${fileName ?? Date.now()}.jpg`,
      )
      const ref = storage().ref(
        `${rootName ?? 'uploads'}/${uid}/${fileName ?? Date.now()}.jpg`,
      )
      await ref.putFile(localUri)
      const downloadURL = await ref.getDownloadURL()
      return downloadURL
    })
  },
}
