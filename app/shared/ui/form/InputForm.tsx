// InputForm.tsx (교체용: ref + useImperativeHandle 추가)
import COLORS from '@app/shared/constants/color'
import {useInputForm} from '@app/shared/ui/form/hooks/useInputForm'
import InputRowRender from '@app/shared/ui/form/InputFormRow'
import {get} from 'lodash'
import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from 'react'
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {IconButton} from 'react-native-paper'
import {type FormItem} from '../../types/form'
import {CustomButton} from '../button/CustomButton'

export type layoutType = {
  style?: StyleProp<ViewStyle>
  labelWidth?: number
  fontSize?: number
  rowsStyle?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  contentsStyle?: StyleProp<ViewStyle>
}

interface Props {
  // 1. 폼 엔진 (필수)
  items: FormItem[]
  formData?: object | null
  formKey?: any
  // 2. 레이아웃 / 스타일 (선택)
  layout?: layoutType
  // 3. 액션 / 버튼 (선택)
  editable?: boolean
  buttonLabel?: string
  loading?: boolean
  onSubmit?: (value: any) => void
  onReset?: () => void
  btnDisable?: boolean
  // 4. 확장 포인트
  topElement?: React.JSX.Element
  bottomElement?: React.JSX.Element
  onFormChange?: (key: string, value: string | number, meta: object) => any
}

// 🔗 외부에서 사용할 ref 타입
export interface InputFormRef {
  /** 현재 formValues를 깊은 복사로 반환 */
  getValues: () => Record<string, any>
  /** formValues를 통째로 교체 (기존 값 덮어씀) */
  setValues: (next: Record<string, any> | null | undefined) => void
  /** formValues 일부만 갱신 (merge) */
  updateValues: (patch: Partial<Record<string, any>>) => void
  // formValues 폼데이터 입력값 초기화
  resetValues: () => void
  // 폼값 검증
  validate: () => boolean
}

const DEFAULT_LAYOUT = {
  style: {},
  labelWidth: 80,
  fontSize: 16,
  rowsStyle: {},
  labelStyle: {},
  contentsStyle: {},
} as const

//row memoization
const MemoizedFormRow = memo(InputRowRender)

const InputForm = forwardRef<InputFormRef, Props>(function InputForm(
  {
    // 1. 폼 엔진 (필수)
    items = [],
    formData = {},
    formKey, //폼 값 갱신(초기화값까지 갱신)
    // 2. 레이아웃 / 스타일 (선택)
    layout = DEFAULT_LAYOUT,
    // 3. 액션 / 버튼 (선택)
    editable = false, //버튼 생성 유무
    buttonLabel = '', //컨펌 버튼 라벨
    loading = false, //컨펌 버튼 로딩
    onSubmit = values => {},
    onReset,
    btnDisable = false,
    // 4. 확장 포인트
    topElement,
    bottomElement,
    onFormChange = (key, value, meta) => {}, // 폼 변경 이벤트
  }: Props,
  ref,
) {
  const valuesRef = useRef<object>(formData)
  const {
    formValues,
    setFormValues,
    errors,
    setErrors,
    changeField,
    resetValues,
    validateAll,
  } = useInputForm(formData, formKey)
  //부모에서 layout 참조를 고정시키지 않아도 자식에서 참조를 고정시키게
  const memoizedLayout = useMemo(() => {
    const l = layout ?? DEFAULT_LAYOUT
    return {
      ...DEFAULT_LAYOUT,
      ...l,
      style: [DEFAULT_LAYOUT.style, l.style].filter(Boolean),
      rowsStyle: [DEFAULT_LAYOUT.rowsStyle, l.rowsStyle].filter(Boolean),
      labelStyle: [DEFAULT_LAYOUT.labelStyle, l.labelStyle].filter(Boolean),
      contentsStyle: [DEFAULT_LAYOUT.contentsStyle, l.contentsStyle].filter(
        Boolean,
      ),
    }
  }, [layout])

  useEffect(() => {
    valuesRef.current = formValues as object
  }, [formValues])

  const {style} = memoizedLayout
  // ✅ 외부로 노출할 메서드들
  useImperativeHandle(
    ref,
    () => ({
      getValues: () => ({...valuesRef.current}),
      setValues: next => {
        setFormValues(next ?? {})
        setErrors({})
      },
      updateValues: patch => {
        setFormValues(prev => ({...(prev ?? {}), ...patch}))
      },
      validate: () => validateAll(items),
      resetValues,
    }),
    [items, resetValues, validateAll],
  )

  const memoizedChangeField = useCallback(
    (key: string, val: string | object | null, item: FormItem) =>
      changeField(key, val, item),
    [],
  )

  return (
    <>
      <View style={[styles.container, style]}>
        {onReset && (
          <IconButton
            icon="refresh"
            size={20}
            style={styles.backBtn}
            onTouchEnd={() => {
              resetValues()
              onReset()
            }}
          />
        )}

        <ScrollView contentContainerStyle={{flexGrow: 1}}>
          {topElement}
          {items?.map((item: FormItem) => {
            const {key} = item
            const value = get(formValues ?? {}, key) // 기본값 '' 대신 값 그대로
            const errMsg = errors?.[key]
            return (
              <MemoizedFormRow
                key={key}
                item={item}
                value={value}
                layout={memoizedLayout}
                changeField={memoizedChangeField}
                onFormChange={onFormChange}
                errMsg={errMsg}
              />
            )
          })}

          <View style={{flexGrow: 1}}>{bottomElement}</View>

          {editable && (
            <CustomButton
              mode="contained"
              onPress={() => {
                validateAll(items)
                onSubmit?.(formValues)
              }}
              loading={loading}
              disabled={btnDisable}>
              {buttonLabel}
            </CustomButton>
          )}
        </ScrollView>
      </View>
    </>
  )
})

export default InputForm

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
  },
  row: {
    borderColor: '#D9D9D9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 13,
    // 에러 라인을 위해 높이 자동
    minHeight: 50,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
    paddingTop: 8,
  },
  contents: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  textContent: {
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
    color: '#5D5D5D',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#D32F2F',
    paddingHorizontal: 12,
  },
  required: {color: '#D32F2F'},
})
