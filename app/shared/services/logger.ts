import crashlytics from '@react-native-firebase/crashlytics'
import * as Updates from 'expo-updates'

/**
 * Common logging utility with support for:
 * - Console logging in development
 * - Firebase Crashlytics in production
 */

class Logger {
  private isDev = __DEV__

  constructor() {
    this.initCrashlytics()
  }

  private initCrashlytics() {
    if (!this.isDev) {
      this.refreshUpdateInfo()
    }
  }

  /**
   * EAS Update 정보를 Crashlytics 커스텀 키에 최신화
   */
  refreshUpdateInfo() {
    try {
      const info = {
        update_id: Updates.updateId || 'none',
        update_created_at: Updates.createdAt?.toISOString() || 'none',
        update_channel: Updates.channel || 'none',
        runtime_version: Updates.runtimeVersion || 'none',
        is_embedded: Updates.isEmbeddedLaunch ? 'true' : 'false',
      }

      const crash = crashlytics() as any
      Object.entries(info).forEach(([key, value]) => {
        crash.setCustomKey(key, value)
      })
    } catch (e) {
      console.warn('Failed to set Crashlytics custom keys', e)
    }
  }

  /**
   * 업데이트 체크 결과를 상세히 로깅 (Crashlytics 로그에 포함)
   */
  logUpdateCheck(event: {type: string; message?: string}) {
    if (this.isDev) {
      console.log(`[UPDATE EVENT] ${event.type}`, event)
      return
    }

    const logMsg = `[EAS Update Event] Type: ${event.type}`
    const crash = crashlytics() as any
    crash.log(logMsg)

    // 성공 케이스: 업데이트가 다운로드되었거나 사용 가능한 상태
    if (event.type === 'downloaded' || event.type === 'updateAvailable') {
      crash.log(`🚀 EAS Update Success: ${event.type}`)
      crash.setCustomKey('last_update_status', 'success')
      crash.setCustomKey('last_update_error', 'none')
    }

    // 에러 케이스
    if (event.type === 'error' || event.type === 'error_check') {
      const errorMsg = event.message || 'unknown'
      crash.recordError(new Error(`EAS Update Error: ${errorMsg}`))
      crash.setCustomKey('last_update_status', 'failed')
      crash.setCustomKey('last_update_error', errorMsg)
    }
  }

  /**
   * Log debug message to console only in development
   */
  debug(message: string, context?: any) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Log info message to console
   */
  info(message: string, context?: any) {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, context || '')
    } else {
      // In production, we can use crashlytics().log() for breadcrumbs
      crashlytics().log(
        `[INFO] ${message} ${context ? JSON.stringify(context) : ''}`,
      )
    }
  }

  /**
   * Log warning message to console and Crashlytics
   */
  warn(message: string, error?: any) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, error || '')
    } else {
      crashlytics().log(`[WARN] ${message}`)
      if (error) {
        crashlytics().recordError(
          error instanceof Error ? error : new Error(JSON.stringify(error)),
        )
      }
    }
  }

  /**
   * Log error message to console and Crashlytics
   */
  error(message: string, error?: any) {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error || '')
    } else {
      crashlytics().log(`[ERROR] ${message}`)
      if (error) {
        crashlytics().recordError(
          error instanceof Error ? error : new Error(JSON.stringify(error)),
        )
      } else {
        crashlytics().recordError(new Error(message))
      }
    }
  }
}

export const logger = new Logger()
