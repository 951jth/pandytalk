import {doc, getDoc} from '@react-native-firebase/firestore'
import {firestore} from '../store/firestore'

// collection(...): “컬렉션(문서들의 모음)”을 가리키는 컬렉션 참조를 만듭니다. 최상위 컬렉션도, 서브컬렉션도 모두 collection으로 접근합니다.
// doc(...): “하나의 문서”를 가리키는 문서 참조를 만듭니다

export async function getGroupInfo(groupId: string) {
  try {
    const groupRef = doc(firestore, 'groups', groupId)
    const snap = await getDoc(groupRef)
    return snap?.data()
  } catch (e) {
    console.log(e)
  }
}
