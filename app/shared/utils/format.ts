
import dayjs from 'dayjs'

import type {ServerTime} from '../types/firebase'
import {toMillisFromServerTime} from './firebase'

type NonEmptyRecord<T extends Record<string, unknown>> = {
  [K in keyof T as T[K] extends null | undefined ? never : K]: T[K]
}

export function removeEmpty<T extends Record<string, unknown>>(
  obj: T,
): NonEmptyRecord<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== null && value !== undefined,
    ),
  ) as unknown as NonEmptyRecord<T>
}

export const toStr = (v: unknown) => (v == null ? '' : String(v))

/** '오전 3:45' 형태로 포맷 (serverTimestamp 미확정이면 '') */
export const formatChatTime = (
  timestamp: ServerTime | number | null | undefined,
): string => {
  const ms = toMillisFromServerTime(timestamp)
  if (ms == null) return ''
  const d = dayjs(ms)
  const period = d.hour() < 12 ? '오전' : '오후'
  const hhmm = d.format('h:mm')
  return `${period} ${hhmm}`
}

/** 서버타임스탬프를 원하는 포맷으로 ('YYYY년 MM월 DD일 dddd') */
export const formatServerDate = (
  ts: ServerTime | number | null | undefined,
  fmt = 'YYYY년 MM월 DD일 dddd',
): string => {
  const ms = typeof ts === 'number' ? ts : toMillisFromServerTime(ts)
  if (ms == null) return ''
  return dayjs(ms).format(fmt)
}
