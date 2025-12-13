import _ from 'lodash'
import type {FormItem} from '../types/form'

//악성 스크립트 검사
export const containsMaliciousScript = (value: string) => {
  const pattern = /<script.*?>.*?<\/script>|javascript:/gi
  return pattern.test(value)
}

export const isValidPassword = (password: string) => {
  const regex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
  return regex.test(password)
}

export const isValidEmail = (email: string) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
  return emailRegex.test(email)
}

//사업자 번호 확인
export const isValidBizNumber = (bizNumber: string) => {
  const digits = bizNumber.replace(/-/g, '')
  if (!/^\d{10}$/.test(digits)) return false

  const multiply = [1, 3, 7, 1, 3, 7, 1, 3, 5]
  const arr = digits.split('').map(Number)
  let sum = 0

  for (let i = 0; i < 9; i++) {
    sum += arr[i] * multiply[i]
  }

  sum += Math.floor((arr[8] * 5) / 10)
  const checkDigit = (10 - (sum % 10)) % 10

  return arr[9] === checkDigit
}

export const isValidPhoneNumber = (phone: string) => {
  if (!phone) return false

  const digits = phone.replace(/[^0-9]/g, '') // 숫자만 추출

  // 010, 011, 016, 017, 018, 019로 시작 + 총 10~11자리
  const regex = /^01[0|1|6|7|8|9][0-9]{7,8}$/

  return regex.test(digits)
}

//전화번호 통합 검증(지역번호, 콜센터 번호 등 통합)
export const isValidKoreanPhoneNumber = (phone: string) => {
  if (!phone) return false

  const digits = phone.replace(/[^0-9]/g, '') // 숫자만 추출

  // 휴대전화: 010, 011, 016~019 (10~11자리)
  const mobileRegex = /^01[016789]\d{7,8}$/

  // 서울 유선전화: 02-xxx-xxxx 또는 02-xxxx-xxxx → 9~10자리
  const seoulLandlineRegex = /^02\d{7,8}$/

  // 기타 지역번호 유선전화: 031~064 → 10자리
  const landlineRegex = /^0(3[1-3]|4[1-4]|5[1-5]|6[1-4])\d{7,8}$/

  // 대표번호(콜센터): 15xx, 16xx, 18xx (8자리)
  const serviceNumberRegex = /^(15|16|18)\d{6}$/

  return (
    mobileRegex.test(digits) ||
    seoulLandlineRegex.test(digits) ||
    landlineRegex.test(digits) ||
    serviceNumberRegex.test(digits)
  )
}

export const isEmpty = (v: any) =>
  v === null || v === undefined || (typeof v === 'string' && v.trim() === '')

export const validateField = (
  formItem: FormItem,
  value: string,
  allValues: object | null,
) => {
  const {required, validation, children} = formItem
  if (children) return //children은 커스텀 세팅이기 떄문에 별도의 검증을 하지않음
  // 1. 필수값 검사
  if (required && (!value || String(value).trim() === '')) {
    return '필수 입력 항목입니다.'
  }

  // 2. XSS 검사
  if (containsMaliciousScript(value)) {
    return '유효하지 않은 스크립트가 포함되어 있습니다.'
  }

  // 3. 추가 유효성 검사
  if (validation) {
    // ✅ maxLength 검사
    if (validation.maxLength && String(value).length > validation.maxLength) {
      return (
        validation.message ||
        `최대 ${validation.maxLength}자까지 입력 가능합니다.`
      )
    }
    // ✅ pattern 검사
    if (validation.pattern && !validation.pattern.test(String(value))) {
      return validation.message || '형식이 올바르지 않습니다.'
    }
    // ✅ custom 함수 검사
    if (typeof validation.customFn === 'function') {
      const result = validation.customFn(value, allValues)
      if (result !== true) {
        return validation.message || '유효하지 않은 값입니다.'
      }
    }
  }

  return '' // 유효
}

export const validateAllFields = (
  formItems: FormItem[],
  formValues: object,
) => {
  const newErrors: any = {}
  //데이터 값 검사
  formItems.forEach(item => {
    const value = _.get(formValues, item.key, '')
    const error = validateField(item, value, formValues)
    if (error) {
      newErrors[item.key] = error
    }
  })
  return newErrors
  // if (hasAnyError(newErrors)) return setErrors(newErrors);
}

export const hasAnyError = (errors: object) => {
  return Object.values(errors).some(
    val => val !== undefined && val !== null && String(val).trim() !== '',
  )
}
