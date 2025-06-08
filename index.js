// index.js
import {AppRegistry} from 'react-native'
import {name as appName} from './app.json'
import App from './index.tsx'

AppRegistry.registerComponent(appName, () => App)
