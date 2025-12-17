// InputForm.tsx (교체용: ref + useImperativeHandle 추가)
import COLORS from '@app/shared/constants/color'
import {useInputForm} from '@app/shared/ui/form/hooks/useInputForm'
import {get} from 'lodash'
import React, {forwardRef, Fragment, useImperativeHandle} from 'react'
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {IconButton, Text} from 'react-native-paper'
import {type FormItem} from '../../types/form'
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
  onReset?: () => void
  btnDisable?: boolean
  formKey?: any
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

const InputForm = forwardRef<InputFormRef, Props>(function InputForm(
  {
    // 1. 폼 엔진 (필수)
    items = [],
    formData = {},
    formKey, //폼 값 갱신(초기화값까지 갱신)
    // 2. 레이아웃 / 스타일 (선택)
    style = {},
    labelWidth = 80,
    fontSize = 16,
    rowsStyle = {},
    labelStyle = {},
    contentsStyle = {},
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
  const {
    formValues,
    setFormValues,
    errors,
    setErrors,
    changeField,
    resetValues,
    validateAll,
  } = useInputForm(formData, formKey)

  // ✅ 외부로 노출할 메서드들
  useImperativeHandle(
    ref,
    (): InputFormRef => ({
      getValues: () => {
        // 객체를 직접 반환하면 외부에서 mutate할 수 있으니 얕은 복사
        return {...(formValues ?? {})} as Record<string, any>
      },
      setValues: next => {
        // 값 전체 교체 시 에러도 초기화 (필요 시 주석 처리)
        setFormValues(next ?? {})
        setErrors({})
      },
      updateValues: patch => {
        if (!patch || typeof patch !== 'object') return
        setFormValues(prev => ({...(prev ?? {}), ...patch}))
      },
      validate: () => validateAll(items),
      resetValues,
    }),
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
              // onEditChange(false)
              onReset?.()
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
                      render?.(value as string, (val: any) => {
                        changeField(key, val, item)
                        onFormChange(key, val, meta)
                      })
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
// type inputRowType = {
//   item: FormItem
//   value: any
// }

// const InputRowRender = ({item, value, rowsStyle, labelWidth,fontSize. labelStyle, contentsStyle}: inputRowType) => {
//   const {key, render, meta, rowStyle} = item

//   return (
//     <Fragment key={key}>
//       <View style={[styles.row, rowStyle, rowsStyle].filter(Boolean)}>
//         <Text
//           style={[styles.label, {minWidth: labelWidth, fontSize}, labelStyle]}>
//           {item?.label}
//           {item?.required && <Text style={styles.required}>*</Text>}
//         </Text>

//         <View style={[styles.contents, contentsStyle, {fontSize}]}>
//           {item?.contents ? (
//             <Text style={styles.textContent}>{item?.contents}</Text>
//           ) : (
//             render?.(value as string, (val: any) => {
//               changeField(key, val, item)
//               onFormChange(key, val, meta)
//             })
//           )}
//         </View>
//       </View>
//       {/* 에러 메시지 */}
//       {errors[key] ? <Text style={styles.errorText}>{errors[key]}</Text> : null}
//     </Fragment>
//   )
// }

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
