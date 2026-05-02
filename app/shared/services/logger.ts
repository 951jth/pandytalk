import crashlytics from '@react-native-firebase/crashlytics'
import * as Updates from 'expo-updates'

type CrashReporter = {
  log?: (message: string) => void
  recordError?: (error: Error) => void
  setAttribute?: (key: string, value: string) => Promise<null>
  setAttributes?: (attributes: Record<string, string>) => Promise<null>
}

const isFunction = (value: unknown): value is (...args: any[]) => unknown =>
  typeof value === 'function'

const isPromiseLike = (value: unknown): value is Promise<null> =>
  !!value && typeof value === 'object' && 'catch' in value

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
    if (isFunction(crash?.log)) {
      crash.log(message)
    }
  } catch (e) {
    console.warn('Failed to write Crashlytics log', e)
  }
}

const safeRecordError = (crash: CrashReporter | null, error: Error) => {
  try {
    if (isFunction(crash?.recordError)) {
      crash.recordError(error)
    }
  } catch (e) {
    console.warn('Failed to record Crashlytics error', e)
  }
}

const safeSetAttributes = (
  crash: CrashReporter | null,
  attributes: Record<string, string>,
) => {
  try {
    if (isFunction(crash?.setAttributes)) {
      const result = crash.setAttributes(attributes)
      if (isPromiseLike(result)) {
        result.catch(e =>
          console.warn('Failed to set Crashlytics attributes', e),
        )
      }
      return
    }

    if (isFunction(crash?.setAttribute)) {
      Object.entries(attributes).forEach(([key, value]) => {
        const result = crash.setAttribute?.(key, value)
        if (isPromiseLike(result)) {
          result.catch(e =>
            console.warn('Failed to set Crashlytics attribute', e),
          )
        }
      })
    }
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
