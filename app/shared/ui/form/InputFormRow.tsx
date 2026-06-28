// InputForm.tsx (교체용: ref + useImperativeHandle 추가)
import {layoutType} from '@app/shared/ui/form/InputForm'
import React, {Fragment, type ReactNode} from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {type FormItem, type FormValue} from '../../types/form'

type inputRowType = {
  item: FormItem
  value: FormValue
  layout: layoutType
  changeField: (key: string, val: FormValue, item: FormItem) => void
  onFormChange?: (key: string, val: FormValue, meta: unknown) => void
  errMsg?: string
}

//1. 메모이제이션을 활용하기위한 컴포넌트화
//2. 나중에 별도의 inputType을 추가해서 switch로 분기도 가능함.

const InputRowRender = ({
  item,
  value,
  layout,
  changeField,
  onFormChange,
  errMsg,
}: inputRowType) => {
  const {key, render, type, meta, rowStyle} = item
  const {
    rowsStyle,
    labelWidth,
    fontSize = 10,
    labelStyle,
    contentsStyle,
  } = layout
  let InnerContents: ReactNode = null

  switch (type) {
    case 'custom':
      InnerContents = render?.(value, (val: FormValue) => {
        changeField(key, val, item)
        onFormChange?.(key, val, meta)
      })
      break
    default:
      InnerContents = (
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

          <View style={[styles.contents, contentsStyle]}>
            {item?.contents ? (
              <Text style={[styles.textContent, {fontSize}]}>
                {item?.contents}
              </Text>
            ) : (
              render?.(value, (val: FormValue) => {
                changeField(key, val, item)
                onFormChange?.(key, val, meta)
              })
            )}
          </View>
        </View>
      )
      break
  }

  return (
    <Fragment key={key}>
      {InnerContents}
      {/* 에러 메시지 */}
      {errMsg ? <Text style={styles.errorText}>{errMsg}</Text> : null}
    </Fragment>
  )
}

export default InputRowRender

const styles = StyleSheet.create({
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
    alignContent: 'center',
  },
  label: {
    fontFamily: 'BMDOHYEON',
    fontSize: 10,
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
