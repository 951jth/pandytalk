import React, {useState} from 'react'
import {StyleSheet} from 'react-native'
import {BottomNavigation, Icon} from 'react-native-paper'
import {authRoutes} from '../../hooks/useRoutes'

const AppContents: React.FC = () => {
  // authRoutes는 LayoutItem[] 타입이며, 우리는 그 중 첫 번째 layout의 children을 사용
  const authRouteConfig = authRoutes()?.[0] // key: 'auth'
  const routes = authRouteConfig.children.map(route => ({
    key: route.name,
    title: route.title ?? route.name,
    focusedIcon: route?.icon || 'help-circle-outline',
    unfocusedIcon: route?.icon || 'help-circle-outline',
  }))

  // BottomNavigation.SceneMap은 { [key: string]: React.ComponentType }
  const renderScene = BottomNavigation.SceneMap(
    Object.fromEntries(
      authRouteConfig.children.map(route => [route.name, route.component]),
    ),
  )
  const [index, setIndex] = useState<number>(0)

  return (
    <BottomNavigation
      navigationState={{index, routes}}
      onIndexChange={setIndex}
      renderScene={renderScene}
      renderIcon={({route, focused, color}) => {
        const {focusedIcon, unfocusedIcon} = route
        return (
          <Icon
            source={focused ? focusedIcon : unfocusedIcon}
            size={30}
            color={color}
          />
        )
      }}
      shifting={false}
      sceneAnimationEnabled={false}
      activeColor="#66B2FF"
      inactiveColor="#000000"
      barStyle={{
        backgroundColor: '#fff',
        elevation: 0,
        shadowOpacity: 0,
        borderTopWidth: 0.25,
        borderTopColor: '#ddd',
      }}
    />
  )
}

export default AppContents

const styles = StyleSheet.create({
  icon: {},
  label: {},
})
