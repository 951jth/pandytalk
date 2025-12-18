// InputForm.tsx (교체용: ref + useImperativeHandle 추가)
import COLORS from '@app/shared/constants/color'
import {layoutType} from '@app/shared/ui/form/InputForm'
import React, {Fragment} from 'react'
import {StyleSheet, View} from 'react-native'
import {Text} from 'react-native-paper'
import {type FormItem} from '../../types/form'

type inputRowType = {
  item: FormItem
  value: any
  layout: layoutType
  changeField: (key: string, val: string, item: FormItem) => void
  onFormChange?: (key: string, val: string, meta: any) => void
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
  const {key, render, meta, rowStyle} = item
  const {rowsStyle, labelWidth, fontSize, labelStyle, contentsStyle} = layout

  return (
    <Fragment key={key}>
      <View style={[styles.row, rowStyle, rowsStyle].filter(Boolean)}>
        <Text
          style={[styles.label, {minWidth: labelWidth, fontSize}, labelStyle]}>
          {item?.label}
          {item?.required && <Text style={styles.required}>*</Text>}
        </Text>

        <View style={[styles.contents, contentsStyle]}>
          {item?.contents ? (
            <Text style={[styles.textContent, {fontSize}]}>
              {item?.contents}
            </Text>
          ) : (
            render?.(value as string, (val: any) => {
              changeField(key, val, item)
              onFormChange?.(key, val, meta)
            })
          )}
        </View>
      </View>
      {/* 에러 메시지 */}
      {errMsg ? <Text style={styles.errorText}>{errMsg}</Text> : null}
    </Fragment>
  )
}

export default InputRowRender

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
