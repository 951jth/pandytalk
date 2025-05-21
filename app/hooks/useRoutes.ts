import HomeScreen from '@screens/HomeScreen'
import AuthLayout from '../components/layout/AuthLayout'
import LoginScreen from '../screens/LoginScreen'

type RouteItem = {
  name: string
  title?: string
  component: React.ComponentType<any>
  options?: object
}

type LayoutItem = {
  key: string
  layout: React.ComponentType<any>
  options?: object
  children: RouteItem[]
}

const authRoutes = (): LayoutItem[] => {
  return [
    {
      key: 'auth',
      layout: AuthLayout,
      options: {
        headerShown: false,
      },
      children: [
        {
          name: 'home',
          title: '홈',
          component: HomeScreen,
        },
      ],
    },
  ]
}
const noAuthRoutes: RouteItem[] = [
  {
    name: 'login',
    component: LoginScreen,
  },
]

const initialRouteName = 'home'

export {authRoutes, initialRouteName, noAuthRoutes}
