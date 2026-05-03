import {
  getAnalytics,
  logEvent,
  logScreenView,
  setUserId,
} from '@react-native-firebase/analytics'
import {logger} from './logger'

type AnalyticsParamValue = string | number | boolean | null | undefined
type AnalyticsParams = Record<string, AnalyticsParamValue>

const normalizeParams = (params?: AnalyticsParams) => {
  if (!params) return undefined

  return Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  )
}

const getAnalyticsInstance = () => {
  try {
    return getAnalytics()
  } catch (e) {
    logger.warn('⚠️ [Analytics] Instance unavailable', e)
    return null
  }
}

export const analytics = {
  /**
   * 커스텀 이벤트 기록
   */
  track: (eventName: string, params?: AnalyticsParams) => {
    if (__DEV__) {
      logger.info(`📊 [Analytics] ${eventName}`, params)
      return
    }

    const instance = getAnalyticsInstance()
    if (!instance) return

    logEvent(instance, eventName, normalizeParams(params)).catch(e => {
      logger.warn(`❌ [Analytics] Event failed: ${eventName}`, e)
    })
  },

  /**
   * 사용자 식별 정보 설정
   */
  identify: (uid: string | null) => {
    if (__DEV__) {
      logger.info(`👤 [Analytics] Set User ID: ${uid}`)
      return
    }

    const instance = getAnalyticsInstance()
    if (!instance) return

    setUserId(instance, uid).catch(e => {
      logger.warn('❌ [Analytics] Set User ID failed', e)
    })
  },

  /**
   * 화면 방문 기록
   */
  screen: (screenName: string, screenClass?: string) => {
    if (__DEV__) {
      logger.info(`👀 [Analytics] Screen View: ${screenName}`, {screenClass})
      return
    }

    const instance = getAnalyticsInstance()
    if (!instance) return

    logScreenView(instance, {
      screen_name: screenName,
      screen_class: screenClass,
    }).catch(e => {
      logger.warn(`❌ [Analytics] Screen view failed: ${screenName}`, e)
    })
  },
}
