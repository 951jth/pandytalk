import {userRemote} from '@app/features/user/data/userRemote.firebase'
import {User} from '@app/shared/types/auth'

export const userService = {
  updateProfile: async (uid: string, payload: User) => {
    await userRemote.updateProfile(uid, payload)
  },
}
