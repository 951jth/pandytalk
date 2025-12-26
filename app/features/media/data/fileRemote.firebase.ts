import {firebaseCall} from '@app/shared/firebase/firebaseUtils'
import {auth} from '@app/shared/firebase/firestore'
import storage from '@react-native-firebase/storage'

export const fileRemote = {
  uploadFile: (localUri: string, rootName?: string, fileName?: string) => {
    return firebaseCall<string>('fileRemote.uplodeFile', async () => {
      const uid = auth.currentUser?.uid
      const ref = storage().ref(
        `${rootName ?? 'uploads'}/${uid}/${fileName ?? Date.now()}.jpg`,
      )
      await ref.putFile(localUri)
      const downloadURL = await ref.getDownloadURL()
      return downloadURL
    })
  },
}
