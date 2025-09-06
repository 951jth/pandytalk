import {FormItem} from '../types/form'

export function getValueByDataIndex<T = any>(
  obj: Record<string, any>,
  dataIndex: (string | number)[],
): T | null {
  try {
    if (!dataIndex?.[0]) return obj as T
    const keyValue = dataIndex.reduce((acc, key) => {
      return acc?.[key] !== undefined ? acc[key] : null
    }, obj)
    return keyValue as T
  } catch {
    return null
  }
}

//dataIndex로 keyValue 세팅
export function setValueByDataIndex<T = any>(
  obj: Record<string, any>,
  value: T,
  dataIndex: string | (string | number)[],
): Record<string, any> {
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
    return acc[key]
  }, obj)

  return obj
}

//dataIndex로 array안의  keyValue 세팅
export function setArrayByDataIndex<T = any>(
  array: Record<string, any>[],
  value: T,
  dataIndex: string | (string | number)[],
  rowIndex: number,
): Record<string, any>[] {
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
    return acc[key]
  }, row)

  return array
}

//item값으로 validation 체크(required: true만 검증함)
export function validationCheckByItems(
  items: FormItem[],
  checkObj: object | any,
): any {
  // const items = [
  //   {label: '에러항목 한글명', key: 'object key값', required: true}
  // ]
  const requiredValues: FormItem[] = items?.filter(e => e?.required)
  const errorValues: any[] = []
  requiredValues.forEach(value => {
    // if (!value?.key) return
    if ([undefined, null, ''].includes(checkObj?.[value?.key])) {
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
