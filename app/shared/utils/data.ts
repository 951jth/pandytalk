import type {InfiniteData} from '@tanstack/react-query'
import {FormItem} from '../types/form'
import type {SQLError, Transaction} from 'react-native-sqlite-storage'

type MutableRecord = Record<string, unknown>

export function getValueByDataIndex<T = unknown>(
  obj: MutableRecord,
  dataIndex: (string | number)[],
): T | null {
  try {
    if (!dataIndex?.[0]) return obj as T
    let current: unknown = obj
    for (const key of dataIndex) {
      if (
        current &&
        typeof current === 'object' &&
        (current as MutableRecord)[key] !== undefined
      ) {
        current = (current as MutableRecord)[key]
      } else {
        return null
      }
    }
    return current as T
  } catch {
    return null
  }
}

//dataIndex로 keyValue 세팅
export function setValueByDataIndex<T = unknown>(
  obj: MutableRecord,
  value: T,
  dataIndex: string | (string | number)[],
): MutableRecord {
  if (!dataIndex) return obj

  const keys = typeof dataIndex === 'string' ? [dataIndex] : dataIndex

  keys.reduce((acc, key, index) => {
    if (index === keys.length - 1) {
      acc[key] = value
    } else {
      if (acc[key] === undefined || typeof acc[key] !== 'object') {
        acc[key] = {}
      }
    }
    return acc[key] as MutableRecord
  }, obj)

  return obj
}

//dataIndex로 array안의  keyValue 세팅
export function setArrayByDataIndex<T = unknown>(
  array: MutableRecord[],
  value: T,
  dataIndex: string | (string | number)[],
  rowIndex: number,
): MutableRecord[] {
  if (!dataIndex || rowIndex === undefined || !array?.[rowIndex]) {
    return array
  }

  const keys = typeof dataIndex === 'string' ? [dataIndex] : dataIndex
  const row = array[rowIndex]

  keys.reduce((acc, key, index) => {
    if (index === keys.length - 1) {
      acc[key] = value
    } else {
      if (acc[key] === undefined || typeof acc[key] !== 'object') {
        acc[key] = {}
      }
    }
    return acc[key] as MutableRecord
  }, row)

  return array
}

//item값으로 validation 체크(required: true만 검증함)
export function validationCheckByItems(
  items: FormItem[],
  checkObj: Record<string, unknown>,
): FormItem[] {
  // const items = [
  //   {label: '에러항목 한글명', key: 'object key값', required: true}
  // ]
  const requiredValues: FormItem[] = items?.filter(e => e?.required)
  const errorValues: FormItem[] = []
  requiredValues.forEach(value => {
    // if (!value?.key) return
    const targetValue = checkObj?.[value?.key]
    if (targetValue === undefined || targetValue === null || targetValue === '') {
      errorValues.push(value)
    }
  })
  // if (errorValues?.[0])
  //   showToast(
  //     <>
  //       <span style={{ color: dangerColor, fontWeight: 550 }}>
  //         {errorValues?.map((e) => e?.label)?.join(', ')}
  //       </span>
  //       은(는) 필수값입니다.
  //     </>,
  //   );
  return errorValues
}

// 공용 exec 유틸 (Promise 래핑)
export function exec(tx: Transaction, sql: string, params: unknown[] = []) {
  return new Promise<void>((resolve, reject) => {
    tx.executeSql(
      sql,
      params,
      () => resolve(),
      (_tx: Transaction, err: SQLError) => {
        console.log('[SQLite] exec error:', err, 'SQL:', sql)
        reject(err)
        return false
      },
    )
  })
}

/**
 * React Query useInfiniteQuery 결과에서
 * 원하는 배열 필드만 꺼내서 1차원 배열로 평탄화하는 유틸
 */
export function flattenInfiniteQueryData<TItem>(
  data: InfiniteData<unknown> | undefined, //page type은 알아서 추론시킴
  selectItems: (page: unknown) => TItem[] | undefined = page =>
    ((page as {data?: TItem[]})?.data ?? []) as TItem[],
): TItem[] {
  if (!data) return []
  return data.pages.flatMap(page => selectItems(page) ?? [])
}
