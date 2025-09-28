// app/store/routeCacheSlice.ts
import {createSlice, PayloadAction} from '@reduxjs/toolkit'

/** 라우트별 임시 파라미터 저장 엔트리 */
export type RouteCacheEntry = {
  params: Record<string, any>
  updatedAt: number // ms epoch
}

export type RouteCacheState = {
  byKey: Record<string, RouteCacheEntry>
}

const initialState: RouteCacheState = {
  byKey: {},
}

type SetParamsPayload = {
  routeKey: string
  /** 새로 넣을 파라미터 객체 */
  params: Record<string, any>
  /** true면 완전 교체, 기본은 병합 */
  replace?: boolean
}

type RemoveParamsPayload = {
  routeKey: string
  /** 지울 키 목록 (없으면 해당 라우트 전체 삭제) */
  keys?: string[]
}

type PurgePayload = {
  /** updatedAt 기준으로 이 ms보다 오래된 엔트리를 삭제 */
  olderThanMs: number
}

const routeCacheSlice = createSlice({
  name: 'routeCache',
  initialState,
  reducers: {
    /** 파라미터 설정(병합 기본) */
    setParams: (state, action: PayloadAction<SetParamsPayload>) => {
      const {routeKey, params, replace} = action.payload
      const prev = state.byKey[routeKey]?.params ?? {}
      state.byKey[routeKey] = {
        params: replace ? {...params} : {...prev, ...params},
        updatedAt: Date.now(),
      }
    },

    /** 특정 키만 제거하거나, keys 미지정 시 라우트 전체 제거 */
    removeParams: (state, action: PayloadAction<RemoveParamsPayload>) => {
      const {routeKey, keys} = action.payload
      if (!state.byKey[routeKey]) return
      if (!keys || keys.length === 0) {
        delete state.byKey[routeKey]
        return
      }
      const next = {...(state.byKey[routeKey].params || {})}
      keys.forEach(k => delete next[k])
      // 모두 지워졌으면 엔트리 자체 제거
      if (Object.keys(next).length === 0) {
        delete state.byKey[routeKey]
      } else {
        state.byKey[routeKey] = {params: next, updatedAt: Date.now()}
      }
    },

    /** 해당 라우트 완전 초기화 */
    clearRoute: (state, action: PayloadAction<{routeKey: string}>) => {
      delete state.byKey[action.payload.routeKey]
    },

    /** 전체 초기화 */
    clearAll: state => {
      state.byKey = {}
    },

    /** 오래된 엔트리 정리(선택 기능) */
    purgeOlderThan: (state, action: PayloadAction<PurgePayload>) => {
      const now = Date.now()
      const limit = action.payload.olderThanMs
      Object.entries(state.byKey).forEach(([key, entry]) => {
        if (now - entry.updatedAt > limit) delete state.byKey[key]
      })
    },
  },
})

export const {setParams, removeParams, clearRoute, clearAll, purgeOlderThan} =
  routeCacheSlice.actions

export default routeCacheSlice.reducer

/** -------- Selectors -------- */
export type RootState = {
  routeCache: RouteCacheState
  // ...다른 slice 타입들
}

/** 라우트 전체 파라미터 */
export const selectRouteParams = (state: RootState, routeKey: string) =>
  state.routeCache.byKey[routeKey]?.params ?? {}

/** 단일 파라미터 (없으면 undefined) */
export const selectRouteParam = <T = any>(
  state: RootState,
  routeKey: string,
  name: string,
): T | undefined => state.routeCache.byKey[routeKey]?.params?.[name]

/**
 * "읽고 지우기" 유틸(선택): 한 번만 소비해야 하는 값 처리에 사용
 * 예) const leaderUid = consumeOnceParam(store, routeKey, 'leaderUid')
 */
export const consumeOnceParam = <T = any>(
  store: {getState: () => RootState; dispatch: (a: any) => void},
  routeKey: string,
  name: string,
): T | undefined => {
  const value = selectRouteParam<T>(store.getState(), routeKey, name)
  if (value !== undefined) {
    store.dispatch(removeParams({routeKey, keys: [name]}))
  }
  return value
}
