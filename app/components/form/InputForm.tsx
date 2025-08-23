// InputForm.tsx (교체용)
import {get} from 'lodash'
import React, {Fragment, useEffect, useRef, useState} from 'react'
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

interface propsType {
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
}

export default function InputForm({
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
  formData,
}: propsType): React.JSX.Element {
  const resetValues = useRef<object>({})
  const [formValues, setFormValues] = useState<object | null>(initialValues)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}) // 에러메시지 표기

  const onEditChange = (bool: boolean) => {
    setEdit(bool)
    if (!bool) {
      setFormValues(resetValues?.current)
      setErrors({}) // 편집 종료 시 에러 초기화
    }
  }

  useEffect(() => {
    if (formData) {
      console.log('formData', formData)
      resetValues.current = formData
      setFormValues(formData)
      setErrors({})
    }
  }, [formData])

  return (
    <>
      <View style={[styles.container, style]}>
        {edit && (
          <IconButton
            icon="close"
            size={20}
            style={styles.backBtn}
            onTouchEnd={() => onEditChange(false)}
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
                            const msg = validateField(item, val, item)
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
                if (edit) {
                  const errorsFields = validateAllFields(
                    items,
                    (formValues ?? {}) as any,
                  )
                  if (hasAnyError(errorsFields)) return setErrors(errorsFields) // 에러 있으면 저장/닫기 막기
                  onSubmit?.(formValues)
                }
                onEditChange(!edit)
              }}
              loading={loading}>
              {buttonLabel}
            </CustomButton>
          )}
        </ScrollView>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.background,
    position: 'relative',
    paddingVertical: 20,
    paddingHorizontal: 16,
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
  },
  label: {
    fontFamily: 'BMDOHYEON',
    fontSize: 12,
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
    paddingHorizontal: 24,
  },
})
