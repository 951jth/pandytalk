import storage from '@react-native-firebase/storage'
import {isLocalFile} from '../shared/utils/file'

//localFile 업로드 로직
export const fileUpload: any = async (uid: string, previewUrl: string) => {
  if (!isLocalFile(previewUrl)) return
  try {
    const fileName = `profile_${Date.now()}.jpg`
    const ref = storage().ref(`profiles/${uid}/${fileName}`)
    await ref.putFile(previewUrl)
    const newPhotoURL = await ref.getDownloadURL()
    return newPhotoURL
  } catch (e) {
    console.error('fileUpload error', e)
    return null
  }
}
