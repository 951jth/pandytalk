// InputForm.tsx (교체용: ref + useImperativeHandle 추가)
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
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
import {IconButton} from 'react-native-paper'
import {type FormItem, type FormValue} from '../../types/form'

type BivariantCallback<T> = {
  bivarianceHack(value: T): void
}['bivarianceHack']
import {AppButton} from '../button/AppButton'

export type layoutType = {
  style?: StyleProp<ViewStyle>
  labelWidth?: number
  fontSize?: number
  rowsStyle?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  contentsStyle?: StyleProp<ViewStyle>
  buttonStyle?: StyleProp<ViewStyle> // ✅ 버튼 커스텀 스타일 추가
  buttonLabelStyle?: StyleProp<TextStyle> // ✅ 버튼 텍스트 커스텀 스타일 추가 (labelStyle과 혼동 방지 위해 명칭 변경)
}

interface Props {
  // 1. 폼 엔진 (필수)
  items: FormItem[]
  formData?: object | null
  formKey?: unknown
  // 2. 레이아웃 / 스타일 (선택)
  layout?: layoutType
  // 3. 액션 / 버튼 (선택)
  useBotton?: boolean
  buttonLabel?: string
  loading?: boolean
  onSubmit?: BivariantCallback<object | null>
  onReset?: () => void
  btnDisable?: boolean
  // 4. 확장 포인트
  topElement?: React.JSX.Element
  bottomElement?: React.JSX.Element
  onFormChange?: (key: string, value: FormValue, meta: unknown) => void
}

// 🔗 외부에서 사용할 ref 타입
export interface InputFormRef {
  /** 현재 formValues를 깊은 복사로 반환 */
  getValues: () => Record<string, unknown>
  /** formValues를 통째로 교체 (기존 값 덮어씀) */
  setValues: (next: Record<string, unknown> | null | undefined) => void
  /** formValues 일부만 갱신 (merge) */
  updateValues: (patch: Partial<Record<string, unknown>>) => void
  // formValues 폼데이터 입력값 초기화
  resetValues: () => void
  /** 현재 값을 새로운 세이브포인트로 갱신 */
  updateSavePoint: () => void
  // 폼값 검증
  validate: () => boolean
}

const DEFAULT_LAYOUT = {
  style: {},
  labelWidth: 80,
  fontSize: 12,
  rowsStyle: {},
  labelStyle: {},
  contentsStyle: {},
  buttonStyle: {},
  buttonLabelStyle: {},
} as const
const DEFAULT_FORM_DATA = {}

//row memoization
const MemoizedFormRow = memo(InputRowRender)

const InputForm = forwardRef<InputFormRef, Props>(function InputForm(
  {
    // 1. 폼 엔진 (필수)
    items = [],
    formData = DEFAULT_FORM_DATA,
    formKey, //폼 값 갱신(초기화값까지 갱신)
    // 2. 레이아웃 / 스타일 (선택)
    layout = DEFAULT_LAYOUT,
    // 3. 액션 / 버튼 (선택)
    useBotton = false, //버튼 생성 유무
    buttonLabel = '저장', //컨펌 버튼 라벨
    loading = false, //컨펌 버튼 로딩
    onSubmit = _values => {},
    onReset,
    btnDisable = false,
    // 4. 확장 포인트
    topElement,
    bottomElement,
    onFormChange = (_key, _value, _meta) => {}, // 폼 변경 이벤트
  }: Props,
  ref,
) {
  const valuesRef = useRef<Record<string, unknown>>(
    formData ? {...formData} : {},
  )
  const {
    formValues,
    setFormValues,
    errors,
    setErrors,
    changeField,
    resetValues,
    updateSavePoint, // ✅ 갱신 기능 추가
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
      buttonStyle: [DEFAULT_LAYOUT.buttonStyle, l.buttonStyle].filter(Boolean),
      buttonLabelStyle: [
        DEFAULT_LAYOUT.buttonLabelStyle,
        l.buttonLabelStyle,
      ].filter(Boolean),
    }
  }, [layout])

  useEffect(() => {
    valuesRef.current = formValues ? {...formValues} : {}
  }, [formValues])

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
      updateSavePoint, // ✅ 외부 노출
    }),
    [items, resetValues, setErrors, setFormValues, updateSavePoint, validateAll],
  )

  const memoizedChangeField = useCallback(
    (key: string, val: FormValue, item: FormItem) =>
      changeField(key, val, item),
    [changeField],
  )

  return (
    <>
      <View style={[styles.container, memoizedLayout.style]}>
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

        {topElement ? topElement : null}

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

        <View style={{flexGrow: 1}}>
          {bottomElement ? bottomElement : null}
        </View>

        {useBotton && (
          <AppButton
            mode="contained"
            onPress={() => {
              const isOk = validateAll(items)
              if (!isOk) return
              onSubmit?.(formValues)
            }}
            loading={loading}
            disabled={btnDisable}
            style={[memoizedLayout.buttonStyle, {marginTop: 20}]} // ✅ 버튼 상단 여백 추가
            labelStyle={memoizedLayout.buttonLabelStyle} // ✅ 텍스트 커스텀 스타일 연동
          >
            {buttonLabel}
          </AppButton>
        )}
      </View>
    </>
  )
})

export default InputForm

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexGrow: 1,
    // backgroundColor: COLORS.background,
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
