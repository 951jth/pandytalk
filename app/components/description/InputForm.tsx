import {get, set} from 'lodash'
import React, {useEffect, useState} from 'react'
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleProp,
  StyleSheet,
  TextStyle,
  TouchableWithoutFeedback,
  View,
  ViewStyle,
} from 'react-native'
import {Button, IconButton, Text} from 'react-native-paper'
import COLORS from '../../constants/color'
import {inputFormItemType} from '../../types/form'
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
  const [formValues, setFormValues] = useState<object | null>()
  // const [edit, setEdit] = useState<boolean>(defaultEdit)

  const onEditChange = (bool: boolean) => {
    setEdit(bool)
  }

  useEffect(() => {
    if (initialData) setFormValues(initialData)
  }, [initialData])

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* {loading && <ActivityIndicator size="large" color={COLORS.primary} />} */}
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
          <View style={[styles.items]}>
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
                      <Text>{item?.contents}</Text>
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
          </View>
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
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    color: '#5D5D5D',
    fontWeight: 'bold',
  },
  contents: {
    flex: 1,
    minWidth: 0,
    // width: '100%',
  },
  backBtn: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
