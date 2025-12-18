import {FormItem} from '@app/shared/types/form'
import {
  hasAnyError,
  validateAllFields,
  validateField,
} from '@app/shared/utils/validation'
import {cloneDeep} from 'lodash'
import {useEffect, useRef, useState} from 'react'

export function useInputForm(formData: object | null, formKey?: any) {
  const [formValues, setFormValues] = useState<object | null>(formData) //폼 값
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}) // 에러메시지 표기
  const savePoint = useRef(formData)

  useEffect(() => {
    savePoint.current = cloneDeep(formData ?? {})
    setFormValues(formData)
    setErrors({})
  }, [formKey])

  //필드 변경
  const changeField = (key: string, val: string | any, item: FormItem) => {
    setFormValues(old => {
      const next = {...(old ?? {}), [key]: val}
      // 실시간 단일 필드 검증
      const msg = validateField(item, val, next)
      setErrors(prev => {
        const copy = {...prev}
        if (msg) copy[key] = msg
        else delete copy[key]
        return copy
      })
      return next
    })
  }
  const resetValues = () => {
    setFormValues(cloneDeep(savePoint.current))
    setErrors({})
  }

  //필수 값 검증
  const validateAll = (items: FormItem[]) => {
    const errorsFields = validateAllFields(
      items,
      (formValues ?? {}) as Record<string, any>,
    )
    setErrors(errorsFields)
    if (hasAnyError(errorsFields)) return false
    else return true
  }

  return {
    formValues,
    setFormValues,
    errors,
    setErrors,
    changeField,
    resetValues,
    validateAll,
  }
}
