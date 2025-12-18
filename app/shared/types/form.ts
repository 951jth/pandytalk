import type {ReactNode} from 'react'
import type {StyleProp, ViewStyle} from 'react-native'

export interface validationType {
  maxLength?: number
  message?: string
  pattern?: any
  customFn?: any
}

export interface FormItem {
  key: string // (필수) 고유값, formValues 세팅 기준
  label?: string // 항목 타이틀
  render?: (
    value: any,
    onChange: (value: string | number | null | undefined) => any,
    edit?: boolean, //수정유무
  ) => any | ReactNode | undefined
  children?: ReactNode // 직접 넣는 컴포넌트
  contents?: string
  required?: boolean // 필수값 여부
  topActions?: ReactNode // 항목 상단 컨텐츠
  bottomActions?: ReactNode // 항목 하단 컨텐츠
  rightActions?: ReactNode // 라벨 오른쪽 커스텀 컨텐츠
  validation?: validationType // 유효성 검사 로직
  tooltip?: boolean | ReactNode // 툴팁 옵션
  rowStyle?: StyleProp<ViewStyle> | null | undefined // row 스타일
  contentStyle?: StyleProp<ViewStyle> // content 스타일
  bottomGap?: number | string // rowGap보다 먼저 적용되는 옵션
  [key: string]: any // ...others 처리 (FormItemRenderer로 props 전달)
  type?: 'custom' //타입 추가예정
}
