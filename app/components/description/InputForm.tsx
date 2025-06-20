import {get, set} from 'lodash'
import React, {useEffect, useRef, useState} from 'react'
import {
  ScrollView,
  StyleProp,
  StyleSheet,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native'
import {Button, IconButton, Text} from 'react-native-paper'
import COLORS from '../../constants/color'
import {inputFormItemType} from '../../types/form'
import KeyboardUtilitiesWrapper from '../container/KeyboardUtilitiesWrapper'
import EditInput from '../input/EditInput'

interface propsType {
  items: inputFormItemType[]
  initialData?: object | null
  style?: StyleProp<ViewStyle>
  labelWidth?: number
  fontSize?: number
  rowStyle?: StyleProp<ViewStyle>
  labelStyle?: StyleProp<TextStyle>
  contentsStyle?: StyleProp<TextStyle>
  editable?: boolean
  buttonLabel?: string
  topElement?: React.JSX.Element
  bottomElement?: React.JSX.Element
  edit?: boolean
  setEdit?: (value: boolean) => void
  // onEdit?: (value: boolean) => void
  // defaultEdit?: boolean
  loading?: boolean
  onSubmit?: (value: any) => void
}

export default function InputForm({
  items = [],
  initialData = {},
  style = {},
  labelWidth = 100,
  fontSize = 16,
  rowStyle = {},
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
}: propsType): React.JSX.Element {
  const resetValues = useRef<object>({})
  const [formValues, setFormValues] = useState<object | null>()
  // const [edit, setEdit] = useState<boolean>(defaultEdit)

  const onEditChange = (bool: boolean) => {
    setEdit(bool)
    if (!bool) setFormValues(resetValues?.current)
  }

  useEffect(() => {
    if (initialData) {
      resetValues.current = initialData
      setFormValues(initialData)
    }
  }, [initialData])

  return (
    <>
      {/* {loading && <ActivityIndicator size="large" color={COLORS.primary} />} */}
      <KeyboardUtilitiesWrapper>
        <View style={[styles.container, style]}>
          {edit && (
            <IconButton
              icon="close"
              size={20}
              style={styles.backBtn}
              onTouchEnd={() => onEditChange(false)}
            />
          )}
          {topElement}
          <ScrollView style={[styles.items]}>
            {items?.map((item, index) => {
              const findText = item?.key ? get(formValues, item.key) : '-'
              return (
                <View style={[styles.row, rowStyle]} key={index}>
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
                      <EditInput
                        edit={item?.fixed ? false : edit}
                        defaultValue={findText}
                        onChangeText={text => {
                          if (!item?.key) return
                          setFormValues(prev => {
                            const updated = {...(prev || {})}
                            set(updated, item.key || '', text)
                            return updated
                          })
                        }}
                      />
                    )}
                  </View>
                </View>
              )
            })}
          </ScrollView>
          {bottomElement}
          {editable && (
            <Button
              mode="contained"
              onTouchEnd={() => {
                if (edit) onSubmit(formValues)
                onEditChange(!edit)
              }}
              loading={loading}>
              {`${buttonLabel}${edit ? '저장' : '수정'}`}
            </Button>
          )}
        </View>
      </KeyboardUtilitiesWrapper>
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
  items: {
    flex: 1,
  },
  row: {
    borderColor: '#D9D9D9',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 13,
    alignItems: 'center',
    height: 50,
  },
  label: {
    fontFamily: 'BMDOHYEON',
  },
  contents: {
    flex: 1,
    minWidth: 0,
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
})
