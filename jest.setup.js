/* global jest */
import 'react-native-gesture-handler/jestSetup';

// 라이브러리들에 대한 Mock설정들
// SQLite Mock
jest.mock('react-native-sqlite-storage', () => {
  const mockDB = {
    transaction: jest.fn(cb => cb({executeSql: jest.fn()})),
    executeSql: jest.fn(),
  };
  return {
    openDatabase: jest.fn(() => mockDB),
    default: {
      openDatabase: jest.fn(() => mockDB),
    },
  };
});

// Firebase Mock (Modular Style)
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(() => ({})),
}));
jest.mock('@react-native-firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));
jest.mock('@react-native-firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(() => jest.fn()),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
}));
jest.mock('@react-native-firebase/messaging', () => {
  const messagingObj = {
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    requestPermission: jest.fn(() => Promise.resolve(1)),
    onTokenRefresh: jest.fn(() => jest.fn()),
    onMessage: jest.fn(() => jest.fn()),
    onNotificationOpenedApp: jest.fn(() => jest.fn()),
    getInitialNotification: jest.fn(() => Promise.resolve(null)),
    setBackgroundMessageHandler: jest.fn(),
    subscribeToTopic: jest.fn(() => Promise.resolve()),
    unsubscribeFromTopic: jest.fn(() => Promise.resolve()),
  };
  return {
    getMessaging: jest.fn(() => messagingObj),
    default: jest.fn(() => messagingObj),
    getToken: jest.fn(() => Promise.resolve('mock-token')),
    onMessage: jest.fn(() => jest.fn()),
    AuthorizationStatus: {
      NOT_DETERMINED: -1,
      DENIED: 0,
      AUTHORIZED: 1,
      PROVISIONAL: 2,
    },
  };
});
jest.mock('@react-native-firebase/storage', () => ({
  __esModule: true,
  default: jest.fn(),
  getStorage: jest.fn(() => ({})),
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
}));
jest.mock('@react-native-firebase/remote-config', () => ({
  __esModule: true,
  getRemoteConfig: jest.fn(() => ({})),
  default: jest.fn(() => ({
    activate: jest.fn(() => Promise.resolve(true)),
    fetch: jest.fn(() => Promise.resolve()),
    fetchAndActivate: jest.fn(() => Promise.resolve(true)),
    getValue: jest.fn(() => ({
      asString: jest.fn(() => ''),
      asNumber: jest.fn(() => 0),
      asBoolean: jest.fn(() => false),
    })),
  })),
}));
jest.mock('@react-native-firebase/crashlytics', () => ({
  __esModule: true,
  getCrashlytics: jest.fn(() => ({})),
  log: jest.fn(),
  recordError: jest.fn(),
  setAttributes: jest.fn(),
  default: jest.fn(() => ({
    log: jest.fn(),
    recordError: jest.fn(),
    setAttributes: jest.fn(),
    setUserId: jest.fn(),
  })),
}));
jest.mock('@react-native-firebase/analytics', () => ({
  __esModule: true,
  getAnalytics: jest.fn(() => ({})),
  logEvent: jest.fn(() => Promise.resolve()),
  setUserId: jest.fn(() => Promise.resolve()),
  default: jest.fn(() => ({
    logEvent: jest.fn(() => Promise.resolve()),
    setUserId: jest.fn(() => Promise.resolve()),
  })),
}));

// React Native Mocks
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.NativeModules.RNBootSplash = {
    hide: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(false),
    useHideAnimation: jest.fn(() => ({
      container: {},
      logo: {},
      background: {},
    })),
  };
  return RN;
});

jest.mock('react-native-bootsplash', () => ({
  hide: jest.fn().mockResolvedValue(undefined),
  isVisible: jest.fn().mockResolvedValue(false),
  useHideAnimation: jest.fn(() => ({container: {}, logo: {}, background: {}})),
}));

// Reanimated mock
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Other Native Modules
jest.mock('react-native-blob-util', () => ({
  fs: {
    dirs: {CacheDir: 'cache'},
  },
}));

jest.mock('react-native-fs', () => ({
  mkdir: jest.fn(),
  moveFile: jest.fn(),
  copyFile: jest.fn(),
  unlink: jest.fn(),
  exists: jest.fn(),
  CachesDirectoryPath: 'caches',
  DocumentDirectoryPath: 'documents',
}));

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: {
    ANDROID: {
      WRITE_EXTERNAL_STORAGE: 'android.permission.WRITE_EXTERNAL_STORAGE',
    },
  },
  RESULTS: {GRANTED: 'granted'},
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const inset = {top: 0, right: 0, bottom: 0, left: 0};
  return {
    SafeAreaProvider: jest.fn(({children}) => children),
    SafeAreaView: jest.fn(({children}) => children),
    useSafeAreaInsets: jest.fn(() => inset),
    SafeAreaConsumer: jest.fn(({children}) => children(inset)),
    SafeAreaContext: React.createContext(inset),
    SafeAreaInsetsContext: React.createContext(inset),
  };
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn(),
  hasString: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
}));

jest.mock('react-native-modal', () => {
  return jest.fn(({children, isVisible}) => (isVisible ? children : null));
});

jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
  launchCamera: jest.fn(),
}));

jest.mock('react-native-image-viewing', () => ({
  default: jest.fn(),
}));

jest.mock('react-native-fast-image', () => {
  const React = require('react');
  const {View} = require('react-native');
  return {
    default: jest
      .fn()
      .mockImplementation(({children}) =>
        React.createElement(View, {}, children),
      ),
    preload: jest.fn(),
  };
});

jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  ScreenContainer: jest.requireActual('react-native').View,
  Screen: jest.requireActual('react-native').View,
  NativeScreen: jest.requireActual('react-native').View,
  NativeScreenContainer: jest.requireActual('react-native').View,
  ScreenStack: jest.requireActual('react-native').View,
  ScreenStackHeaderConfig: jest.requireActual('react-native').View,
  ScreenStackHeaderSubview: jest.requireActual('react-native').View,
  shouldUseActivityState: jest.fn(),
}));

jest.mock('react-native-gesture-handler', () => {
  const RN = jest.requireActual('react-native');
  return {
    State: {},
    PanGestureHandler: RN.View,
    BaseButton: RN.View,
    RectButton: RN.View,
    BorderlessButton: RN.View,
    GestureHandlerRootView: RN.View,
    Direction: {},
  };
});

// Expo Mocks
jest.mock('expo-updates', () => ({
  reloadAsync: jest.fn(),
  checkForUpdateAsync: jest.fn(),
  fetchUpdateAsync: jest.fn(),
  addUpdatesStateChangeListener: jest.fn(() => ({
    remove: jest.fn(),
  })),
  updateId: 'mock-update-id',
  releaseChannel: 'default',
  isReady: true,
  isEmergencyLaunch: false,
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.3.5',
  },
}));

jest.mock('expo-font', () => ({
  loadAsync: jest.fn(),
  isLoaded: jest.fn(() => true),
  isLoading: jest.fn(() => false),
}))

jest.mock('@app/bootstrap/useFontFaceSetup', () => ({
  useFontFaceSetup: jest.fn(() => true),
}))
