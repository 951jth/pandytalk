package com.cshchatapp

import android.os.Bundle            // ✅ 추가
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.zoontek.rnbootsplash.RNBootSplash

class MainActivity : ReactActivity() {


    override fun onCreate(savedInstanceState: Bundle?) {
        // BootSplash 초기화 (우리가 만든 BootTheme 사용)
        RNBootSplash.init(this, R.style.BootTheme)

        // 기존 RN 템플릿 그대로 유지 (react-native-screens 쓰면 null 그대로 둬도 됨)
        super.onCreate(null)  // super.onCreate(savedInstanceState) 써도 되고, 지금처럼 null 유지해도 됨
    }

    /**
     * Returns the name of the main component registered from JavaScript. This is used to schedule
     * rendering of the component.
     */
    override fun getMainComponentName(): String = "cshchatapp"

    /**
     * Returns the instance of the [ReactActivityDelegate]. We use [DefaultReactActivityDelegate]
     * which allows you to enable New Architecture with a single boolean flags [fabricEnabled]
     */
    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)
}
