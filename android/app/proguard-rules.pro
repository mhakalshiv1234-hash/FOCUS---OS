# Preserve source filenames & line numbers for crash diagnostics
-keepattributes SourceFile,LineNumberTable,*Annotation*
-renamesourcefileattribute SourceFile
-dontwarn kotlin.Metadata

# Room Database, Entities, DAOs & Generated Implementations
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class * { *; }
-keep class com.focusos.app.data.local.** { *; }
-dontwarn androidx.room.paging.**

# Android Services, Receivers, Workers & Activities instantiated via reflection / Manifest
-keep class com.focusos.app.FocusOsApplication
-keep class com.focusos.app.MainActivity
-keep class com.focusos.app.ui.blocking.BlockingShieldActivity
-keep class com.focusos.app.service.FocusBlockingAccessibilityService
-keep class com.focusos.app.service.FocusSessionForegroundService
-keep class com.focusos.app.service.MissionStudyService
-keep class com.focusos.app.service.FocusBootReceiver
-keep class com.focusos.app.service.ScheduleTriggerReceiver
-keep class com.focusos.app.service.ScheduleWatchdogWorker {
    public <init>(android.content.Context, androidx.work.WorkerParameters);
}

# Kotlin Coroutines & DataStore Preferences
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
-dontwarn kotlinx.coroutines.flow.**
-keepclassmembers class * extends androidx.datastore.preferences.protobuf.GeneratedMessageLite {
    <fields>;
}
