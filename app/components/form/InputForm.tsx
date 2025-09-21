// InputForm.tsx (교체용: ref + useImperativeHandle 추가)
import {get} from 'lodash'
import React, {
  forwardRef,
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {IconButton, Text} from 'react-native-paper'
import COLORS from '../../constants/color'
import {type FormItem} from '../../types/form'
import {
  hasAnyError,
  validateAllFields,
  validateField,
} from '../../utils/validation'
import {CustomButton} from '../button/CustomButton'

interface Props {
  items: FormItem[]
  initialValues?: object | null
  style?: StyleProp<ViewStyle>
  labelWidth?: number
  fontSize?: number
  rowsStyle?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  contentsStyle?: StyleProp<TextStyle>
  editable?: boolean
  buttonLabel?: string
  topElement?: React.JSX.Element
  bottomElement?: React.JSX.Element
  edit?: boolean
  setEdit?: (value: boolean) => void
  loading?: boolean
  onSubmit?: (value: any) => void
  onFormChange?: (key: string, value: string | number, meta: object) => any
  formData?: object | null
  onCancel?: () => void
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
}

const InputForm = forwardRef<InputFormRef, Props>(function InputForm(
  {
    items = [],
    initialValues = {},
    style = {},
    labelWidth = 80,
    fontSize = 16,
    rowsStyle = {},
    labelStyle = {},
    contentsStyle = {},
    editable = false,
    buttonLabel = '',
    topElement,
    bottomElement,
    edit = false,
    setEdit = bool => {},
    loading = false,
    onSubmit = values => {},
    onFormChange = (key, value, meta) => {}, // 폼 변경 이벤트
    onCancel = () => {},
    formData,
  }: Props,
  ref,
) {
  const resetValues = useRef<object>({})
  const [formValues, setFormValues] = useState<object | null>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}) // 에러메시지 표기

  const onEditChange = (bool: boolean) => {
    setEdit(bool)
  }

  useEffect(() => {
    if (formData) {
      resetValues.current = formData
      setFormValues(formData)
      setErrors({})
    }
  }, [formData])

  // ✅ 외부로 노출할 메서드들
  useImperativeHandle(
    ref,
    (): InputFormRef => ({
      getValues: () => {
        // 객체를 직접 반환하면 외부에서 mutate할 수 있으니 얕은 복사
        return {...(formValues ?? {})} as Record<string, any>
      },
      setValues: next => {
        setFormValues(next ?? {})
        // 값 전체 교체 시 에러도 초기화 (필요 시 주석 처리)
        setErrors({})
      },
      updateValues: patch => {
        if (!patch || typeof patch !== 'object') return
        setFormValues(prev => ({...(prev ?? {}), ...patch}))
        // 부분 갱신 시 유효성 체크가 필요하면 아래 로직 확장 가능
        // Object.entries(patch).forEach(([k, v]) => { ...validateField... });
      },
      resetValues: () => setFormValues(formData || null),
    }),
    [formValues],
  )

  return (
    <>
      <View style={[styles.container, style]}>
        {edit && (
          <IconButton
            icon="close"
            size={20}
            style={styles.backBtn}
            onTouchEnd={() => {
              // onEditChange(false)
              onCancel()
            }}
          />
        )}

        <ScrollView contentContainerStyle={{flexGrow: 1}}>
          {topElement}
          {items?.map((item: FormItem) => {
            const {key, render, meta, rowStyle} = item
            const value = get(formValues ?? {}, key) // 기본값 '' 대신 값 그대로

            return (
              <Fragment key={key}>
                <View style={[styles.row, rowStyle, rowsStyle].filter(Boolean)}>
                  <Text
                    style={[
                      styles.label,
                      {minWidth: labelWidth, fontSize},
                      labelStyle,
                    ]}>
                    {item?.label}
                    {item?.required && <Text style={styles.required}>*</Text>}
                  </Text>

                  <View style={[styles.contents, contentsStyle, {fontSize}]}>
                    {item?.contents ? (
                      <Text style={styles.textContent}>{item?.contents}</Text>
                    ) : (
                      render?.(
                        value as string,
                        (val: any) => {
                          setFormValues(old => {
                            const next = {...(old ?? {}), [key]: val}
                            // 실시간 단일 필드 검증
                            const msg = validateField(item, val, formValues)
                            setErrors(prev => {
                              const copy = {...prev}
                              if (msg) copy[key] = msg
                              else delete copy[key]
                              return copy
                            })
                            return next
                          })
                          onFormChange(key, val, meta)
                        },
                        edit,
                      )
                    )}
                  </View>
                </View>
                {/* 에러 메시지 */}
                {errors[key] ? (
                  <Text style={styles.errorText}>{errors[key]}</Text>
                ) : null}
              </Fragment>
            )
          })}

          <View style={{flexGrow: 1}}>{bottomElement}</View>

          {editable && (
            <CustomButton
              mode="contained"
              onTouchEnd={() => {
                const errorsFields = validateAllFields(
                  items,
                  (formValues ?? {}) as any,
                )
                if (hasAnyError(errorsFields)) return setErrors(errorsFields) // 에러 있으면 저장/닫기 막기
                onSubmit?.(formValues)
              }}
              loading={loading}>
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
