import {get} from 'lodash'
import React, {useEffect, useState} from 'react'
import {StyleProp, StyleSheet, TextStyle, View, ViewStyle} from 'react-native'
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
}: propsType): React.JSX.Element {
  const [formValues, setFormValues] = useState<object | null>()
  const [edit, setEdit] = useState<boolean>(false)

  useEffect(() => {
    if (!edit) setFormValues(initialData)
  }, [initialData, edit])

  return (
    <View style={[styles.container, style]}>
      {edit && (
        <IconButton
          icon="close"
          size={20}
          style={styles.backBtn}
          onTouchEnd={() => setEdit(false)}
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
                  />
                )}
              </View>
            </View>
          )
        })}
      </View>
      {bottomElement}
      {editable && (
        <Button mode="contained" onTouchEnd={() => setEdit(!edit)}>
          {`${buttonLabel}${edit ? '저장' : '수정'}`}
        </Button>
      )}
    </View>
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
