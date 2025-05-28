import AuthLayout from '../components/layout/AuthLayout'
import ChatScreen from '../screens/ChatScreen'
import LoginScreen from '../screens/LoginScreen'
import ProfileScreen from '../screens/ProfileScreen'
import UsersScreen from '../screens/UsersScreen'

type RouteItem = {
  name: string
  title?: string
  component: React.ComponentType<any>
  options?: object
  icon?: string
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
          name: 'users',
          title: 'Users',
          component: UsersScreen,
          icon: 'account-group',
        },
        {
          name: 'chats',
          title: 'Chat',
          component: ChatScreen,
          icon: 'chat',
        },
        {
          name: 'profile',
          title: 'Profile',
          component: ProfileScreen,
          icon: 'account-circle',
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

const initialRouteName = 'users'

export {authRoutes, initialRouteName, noAuthRoutes}
