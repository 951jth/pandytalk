import {createNavigationContainerRef} from '@react-navigation/native'
import {AppRouteParamList, RootStackParamList} from '../../types/navigate'

export const navigationRef = createNavigationContainerRef<AppRouteParamList>()

export function navigate<RouteName extends keyof RootStackParamList>(
  name: RouteName,
  ...args: RootStackParamList[RouteName] extends undefined
    ? []
    : [params: RootStackParamList[RouteName]]
) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, ...(args as [RootStackParamList[RouteName]]))
  }
}
