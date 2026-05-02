import crashlytics from '@react-native-firebase/crashlytics'
import * as Updates from 'expo-updates'

type CrashReporter = {
  log?: (message: string) => void
  recordError?: (error: Error) => void
  setAttribute?: (key: string, value: string) => Promise<null>
  setAttributes?: (attributes: Record<string, string>) => Promise<null>
}

const getCrashReporter = () => {
  try {
    if (typeof crashlytics !== 'function') return null
    return crashlytics() as unknown as CrashReporter
  } catch (e) {
    return null
  }
}

const safeCrashLog = (crash: CrashReporter | null, message: string) => {
  try {
    crash?.log?.(message)
  } catch (e) {
    console.warn('Failed to write Crashlytics log', e)
  }
}

const safeRecordError = (crash: CrashReporter | null, error: Error) => {
  try {
    crash?.recordError?.(error)
  } catch (e) {
    console.warn('Failed to record Crashlytics error', e)
  }
}

const safeSetAttributes = (
  crash: CrashReporter | null,
  attributes: Record<string, string>,
) => {
  try {
    const result = crash?.setAttributes?.(attributes)
    result?.catch(e => console.warn('Failed to set Crashlytics attributes', e))
  } catch (e) {
    console.warn('Failed to set Crashlytics attributes', e)
  }
}

const safeStringify = (value: unknown) => {
  try {
    return JSON.stringify(value)
  } catch (e) {
    return String(value)
  }
}

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
      const createdAt = Updates.createdAt
      const info = {
        update_id: Updates.updateId || 'none',
        update_created_at:
          createdAt instanceof Date
            ? createdAt.toISOString()
            : String(createdAt || 'none'),
        update_channel: Updates.channel || 'none',
        runtime_version: Updates.runtimeVersion || 'none',
        is_embedded: Updates.isEmbeddedLaunch ? 'true' : 'false',
      }

      const crash = getCrashReporter()
      safeSetAttributes(crash, info)
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
    const crash = getCrashReporter()
    safeCrashLog(crash, logMsg)

    // 성공 케이스: 업데이트가 다운로드되었거나 사용 가능한 상태
    if (event.type === 'downloaded' || event.type === 'updateAvailable') {
      safeCrashLog(crash, `EAS Update Success: ${event.type}`)
      safeSetAttributes(crash, {
        last_update_status: 'success',
        last_update_error: 'none',
      })
    }

    // 에러 케이스
    if (event.type === 'error' || event.type === 'error_check') {
      const errorMsg = event.message || 'unknown'
      safeRecordError(crash, new Error(`EAS Update Error: ${errorMsg}`))
      safeSetAttributes(crash, {
        last_update_status: 'failed',
        last_update_error: errorMsg,
      })
    }
  }

  /**
   * Log debug message to console only in development
   */
  debug(message: string, context?: unknown) {
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Log info message to console
   */
  info(message: string, context?: unknown) {
    if (this.isDev) {
      console.info(`[INFO] ${message}`, context || '')
    } else {
      // In production, we can use crashlytics().log() for breadcrumbs
      const crash = getCrashReporter()
      safeCrashLog(
        crash,
        `[INFO] ${message} ${context ? safeStringify(context) : ''}`,
      )
    }
  }

  /**
   * Log warning message to console and Crashlytics
   */
  warn(message: string, error?: unknown) {
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, error || '')
    } else {
      const crash = getCrashReporter()
      safeCrashLog(crash, `[WARN] ${message}`)
      if (error) {
        safeRecordError(
          crash,
          error instanceof Error ? error : new Error(safeStringify(error)),
        )
      }
    }
  }

  /**
   * Log error message to console and Crashlytics
   */
  error(message: string, error?: unknown) {
    if (this.isDev) {
      console.error(`[ERROR] ${message}`, error || '')
    } else {
      const crash = getCrashReporter()
      safeCrashLog(crash, `[ERROR] ${message}`)
      if (error) {
        safeRecordError(
          crash,
          error instanceof Error ? error : new Error(safeStringify(error)),
        )
      } else {
        safeRecordError(crash, new Error(message))
      }
    }
  }
}

export const logger = new Logger()
