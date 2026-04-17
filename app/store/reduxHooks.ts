/**
 * [Redux 전용 커스텀 훅]
 * 컴포넌트에서 리덕스를 사용할 때, 매번 타입을 지정하는 번거로움을 줄이기 위해 사용합니다.
 *
 * [데이터 흐름(Data Flow)]
 * 1. 읽기 (Select): useAppSelector(state => state.xxx) 를 통해 창고에서 데이터를 꺼내옴
 * 2. 쓰기 (Dispatch): useAppDispatch() 를 통해 액션을 창고로 보내서 상태를 변경함
 *
 * [사용 예시(Usage Example)]
 * 1. 데이터 읽기: const user = useAppSelector(state => state.user.name);
 * 2. 데이터 변경: const dispatch = useAppDispatch();
 *                dispatch(login({ name: '홍길동' }));
 *
 * [새로운 기능(데이터 패칭) 추가 시나리오]
 * 1. Slice 파일에서 '비동기 함수(Thunk)'를 만듭니다. (예: fetchUser)
 *    export const fetchUser = createAsyncThunk('user/fetch', async (id) => { ... });
 * 2. Slice의 extraReducers에 해당 함수의 성공(fulfilled) 시 상태 변경 로직을 적습니다.
 * 3. 컴포넌트에서 아래와 같이 사용합니다:
 *    const dispatch = useAppDispatch();
 *    useEffect(() => {
 *      dispatch(fetchUser(userId)); // 비동기 주문 발송!
 *    }, []);
 */
import {TypedUseSelectorHook, useDispatch, useSelector} from 'react-redux'

// 위에서 만든 [설계도(RootState)]와 [자격증(AppDispatch)] 타입을 가져옵니다.
import type {AppDispatch, RootState} from './store'

// 1. 전용 주문 벨: 액션을 발생시킬 때 사용 (주문서 제출)
// - 우리 앱의 비동기 주문(Thunk)까지 찰떡같이 알아듣도록 개조된 전용 디스패치입니다.
export const useAppDispatch = () => useDispatch<AppDispatch>()

// 2. 전용 내비게이션: 상태를 조회할 때 사용 (재고 확인)
// - 전체 창고(RootState)에서 내가 필요한 칸으로 바로 안내해 주는 자동완성 내비게이션입니다.
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
