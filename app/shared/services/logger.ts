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
      // EAS Update 정보가 있으면 Crashlytics 커스텀 키로 설정
      try {
        const info = {
          update_id: Updates.updateId || 'none',
          update_created_at: Updates.createdAt?.toISOString() || 'none',
          update_channel: Updates.channel || 'none',
          is_embedded: Updates.isEmbeddedLaunch ? 'true' : 'false',
        }
        
        // 타입 추론 오류 방지를 위해 any 캐스팅 후 호출
        const crash = crashlytics() as any
        Object.entries(info).forEach(([key, value]) => {
          crash.setCustomKey(key, value)
        })
      } catch (e) {
        console.warn('Failed to set Crashlytics custom keys', e)
      }
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
