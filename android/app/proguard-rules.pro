# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt
# You can edit the include path and order by changing the proguardFiles
# directive in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# Add any project specific keep options here:

# React Native Core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.proguard.annotations.** { *; }
-keep class com.facebook.react.bridge.CatalystInstanceImpl { *; }
-keep class com.facebook.react.bridge.JavaScriptExecutor { *; }
-keep class com.facebook.react.bridge.NativeModule { *; }
-keep class com.facebook.react.uimanager.UIImplementation { *; }
-keep class com.facebook.react.uimanager.ViewManager { *; }

# SoLoader (Native library loader)
-keep class com.facebook.soloader.** { *; }
-keep class com.facebook.common.soloader.** { *; }

# Yoga (Layout engine)
-keep class com.facebook.yoga.** { *; }
-keep class com.facebook.jni.** { *; }

# Expo modules and Compatibility layers
-keep class expo.modules.** { *; }
-keep class expo.modules.rncompatibility.** { *; }

# Bridgeless and New Architecture flags (Needed even if disabled in gradle)
-keep class com.facebook.react.common.build.ReactBuildConfig { *; }
-keep class com.facebook.react.fabric.** { *; }

# Firebase and other third party native components
-keep class com.google.firebase.** { *; }

# Support for Hermes
-keep class com.facebook.hermes.** { *; }
