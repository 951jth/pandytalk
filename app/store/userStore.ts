import {atom} from 'recoil'
import {User} from '../types/firebase'

export const userState = atom<User | null>({
  key: 'userState',
  default: null,
})
