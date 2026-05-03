import {useEffect} from 'react'
import * as Updates from 'expo-updates'
import {AppState} from 'react-native'
import {logger} from '@app/shared/services/logger'
import {formatUpdateCreatedAt} from '@app/shared/utils/update'

/**
 * EAS Update(CodePush)의 상태를 모니터링하고 업데이트를 관리하는 훅입니다.
 * 모든 주요 단계는 Crashlytics에 로깅되어 특정 디바이스의 업데이트 실패 원인을 분석하는 데 사용됩니다.
 */
export const useEASUpdateManager = () => {
  useEffect(() => {
    let isChecking = false

    const checkAndApplyUpdates = async () => {
      if (isChecking) {
        logger.debug(
          'Skipping EAS Update check because another check is running',
        )
        return
      }

      isChecking = true

      // 1. 현재 실행 중인 업데이트 정보 로깅 (Breadcrumbs)
      const currentStatus = {
        updateId: Updates.updateId,
        channel: Updates.channel,
        runtimeVersion: Updates.runtimeVersion,
        createdAt: formatUpdateCreatedAt(Updates.createdAt),
        isEmbeddedLaunch: Updates.isEmbeddedLaunch,
      }

      logger.info('EAS Update Current Status', currentStatus)

      // 개발 환경에서는 업데이트 체크를 건너뜁니다.
      if (__DEV__) {
        logger.debug('Skipping EAS Update check in DEV mode')
        isChecking = false
        return
      }

      try {
        // 2. 신규 업데이트 확인
        logger.info('Checking for new EAS Update...')
        const update = await Updates.checkForUpdateAsync()

        if (update.isAvailable) {
          logger.info('New EAS Update discovered!', {
            manifestVisible: !!update.manifest,
          })

          // 3. 업데이트 다운로드
          logger.info('Starting to fetch EAS Update...')
          const result = await Updates.fetchUpdateAsync()

          if (result.isNew) {
            logger.info(
              'EAS Update fetch successful. Reloading app to apply...',
            )
            // 4. 즉시 재시작하여 적용 (사용자 요청: 자동 로드 방식)
            await Updates.reloadAsync()
          } else {
            logger.info('EAS Update fetched, but it is not flagged as new.')
          }
        } else {
          logger.info('No new EAS Update available at this time.')
        }
      } catch (error) {
        // 모든 에러는 Crashlytics에 상세히 기록됩니다.
        logger.error('EAS Update process failed', error)
      } finally {
        isChecking = false
      }
    }

    checkAndApplyUpdates()

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkAndApplyUpdates()
      }
    })

    return () => {
      subscription.remove()
    }
  }, [])
}
