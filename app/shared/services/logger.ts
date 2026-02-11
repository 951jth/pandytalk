import crashlytics from '@react-native-firebase/crashlytics'

/**
 * Common logging utility with support for:
 * - Console logging in development
 * - Firebase Crashlytics in production
 */

class Logger {
  private isDev = __DEV__

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
