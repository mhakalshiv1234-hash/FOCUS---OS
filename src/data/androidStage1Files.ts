import settingsGradle from '../../android/settings.gradle.kts?raw';
import rootBuildGradle from '../../android/build.gradle.kts?raw';
import libsVersionsToml from '../../android/gradle/libs.versions.toml?raw';
import appBuildGradle from '../../android/app/build.gradle.kts?raw';
import proguardRules from '../../android/app/proguard-rules.pro?raw';
import androidManifest from '../../android/app/src/main/AndroidManifest.xml?raw';
import accessibilityXml from '../../android/app/src/main/res/xml/focus_accessibility_service_config.xml?raw';
import focusApplication from '../../android/app/src/main/java/com/focusos/app/FocusOsApplication.kt?raw';
import mainActivity from '../../android/app/src/main/java/com/focusos/app/MainActivity.kt?raw';
import colorKt from '../../android/app/src/main/java/com/focusos/app/ui/theme/Color.kt?raw';
import typeKt from '../../android/app/src/main/java/com/focusos/app/ui/theme/Type.kt?raw';
import themeKt from '../../android/app/src/main/java/com/focusos/app/ui/theme/Theme.kt?raw';
import calculatorKt from '../../android/app/src/main/java/com/focusos/app/domain/DisciplineCalculator.kt?raw';
import modelsKt from '../../android/app/src/main/java/com/focusos/app/domain/DashboardModels.kt?raw';
import appModelsKt from '../../android/app/src/main/java/com/focusos/app/domain/AppSelectionModels.kt?raw';
import appFilterKt from '../../android/app/src/main/java/com/focusos/app/domain/AppSelectionFilter.kt?raw';
import blockingModelsKt from '../../android/app/src/main/java/com/focusos/app/domain/BlockingEngineModels.kt?raw';
import blockingEvaluatorKt from '../../android/app/src/main/java/com/focusos/app/domain/BlockingEvaluator.kt?raw';
import nuclearPolicyKt from '../../android/app/src/main/java/com/focusos/app/domain/NuclearModePolicy.kt?raw';
import dailyEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/DailyMetricEntity.kt?raw';
import missionEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/MissionEntity.kt?raw';
import blockedEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/BlockedAppEntity.kt?raw';
import sessionEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/FocusSessionEntity.kt?raw';
import attemptEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/BlockedAttemptEntity.kt?raw';
import nuclearOverrideEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/NuclearOverrideLogEntity.kt?raw';
import daosKt from '../../android/app/src/main/java/com/focusos/app/data/local/FocusOsDaos.kt?raw';
import databaseKt from '../../android/app/src/main/java/com/focusos/app/data/local/FocusOsDatabase.kt?raw';
import prefsRepoKt from '../../android/app/src/main/java/com/focusos/app/data/preferences/UserPreferencesRepository.kt?raw';
import installedProviderKt from '../../android/app/src/main/java/com/focusos/app/data/apps/InstalledAppsProvider.kt?raw';
import permCheckerKt from '../../android/app/src/main/java/com/focusos/app/data/repository/PermissionStatusChecker.kt?raw';
import discRepoKt from '../../android/app/src/main/java/com/focusos/app/data/repository/DisciplineRepository.kt?raw';
import blocklistRepoKt from '../../android/app/src/main/java/com/focusos/app/data/repository/AppBlocklistRepository.kt?raw';
import sessionRepoKt from '../../android/app/src/main/java/com/focusos/app/data/repository/FocusSessionRepository.kt?raw';
import accessibilityServiceKt from '../../android/app/src/main/java/com/focusos/app/service/FocusBlockingAccessibilityService.kt?raw';
import foregroundServiceKt from '../../android/app/src/main/java/com/focusos/app/service/FocusSessionForegroundService.kt?raw';
import bootReceiverKt from '../../android/app/src/main/java/com/focusos/app/service/FocusBootReceiver.kt?raw';
import missionAlertPlayerKt from '../../android/app/src/main/java/com/focusos/app/service/MissionAlertPlayer.kt?raw';
import blockingShieldActivityKt from '../../android/app/src/main/java/com/focusos/app/ui/blocking/BlockingShieldActivity.kt?raw';
import navKt from '../../android/app/src/main/java/com/focusos/app/ui/navigation/FocusDestination.kt?raw';
import vmKt from '../../android/app/src/main/java/com/focusos/app/ui/dashboard/DashboardViewModel.kt?raw';
import dashScreenKt from '../../android/app/src/main/java/com/focusos/app/ui/dashboard/DashboardScreen.kt?raw';
import shieldVmKt from '../../android/app/src/main/java/com/focusos/app/ui/shield/AppSelectionViewModel.kt?raw';
import appIconKt from '../../android/app/src/main/java/com/focusos/app/ui/shield/AppIconImage.kt?raw';
import shieldScreenKt from '../../android/app/src/main/java/com/focusos/app/ui/shield/AppSelectionScreen.kt?raw';
import placeholderKt from '../../android/app/src/main/java/com/focusos/app/ui/components/StagePlaceholderScreen.kt?raw';
import calcTestKt from '../../android/app/src/test/java/com/focusos/app/DisciplineCalculatorTest.kt?raw';
import filterTestKt from '../../android/app/src/test/java/com/focusos/app/AppSelectionFilterTest.kt?raw';
import blockingTestKt from '../../android/app/src/test/java/com/focusos/app/BlockingEvaluatorTest.kt?raw';
import nuclearTestKt from '../../android/app/src/test/java/com/focusos/app/NuclearModePolicyTest.kt?raw';
import scheduleModelsKt from '../../android/app/src/main/java/com/focusos/app/domain/ScheduleModels.kt?raw';
import scheduleEvaluatorKt from '../../android/app/src/main/java/com/focusos/app/domain/ScheduleEvaluator.kt?raw';
import dailyScheduleEntityKt from '../../android/app/src/main/java/com/focusos/app/data/local/DailyScheduleEntity.kt?raw';
import missionScheduleRepoKt from '../../android/app/src/main/java/com/focusos/app/data/repository/MissionScheduleRepository.kt?raw';
import scheduleAlarmSchedulerKt from '../../android/app/src/main/java/com/focusos/app/service/ScheduleAlarmScheduler.kt?raw';
import scheduleTriggerReceiverKt from '../../android/app/src/main/java/com/focusos/app/service/ScheduleTriggerReceiver.kt?raw';
import scheduleWatchdogWorkerKt from '../../android/app/src/main/java/com/focusos/app/service/ScheduleWatchdogWorker.kt?raw';
import missionStudyServiceKt from '../../android/app/src/main/java/com/focusos/app/service/MissionStudyService.kt?raw';
import missionsVmKt from '../../android/app/src/main/java/com/focusos/app/ui/missions/MissionsViewModel.kt?raw';
import missionsScreenKt from '../../android/app/src/main/java/com/focusos/app/ui/missions/MissionsScreen.kt?raw';
import scheduleTestKt from '../../android/app/src/test/java/com/focusos/app/ScheduleEvaluatorTest.kt?raw';
import usageAnalyticsModelsKt from '../../android/app/src/main/java/com/focusos/app/domain/UsageAnalyticsModels.kt?raw';
import usageAnalyticsEvaluatorKt from '../../android/app/src/main/java/com/focusos/app/domain/UsageAnalyticsEvaluator.kt?raw';
import usageStatsDataSourceKt from '../../android/app/src/main/java/com/focusos/app/data/usage/UsageStatsDataSource.kt?raw';
import usageAnalyticsRepoKt from '../../android/app/src/main/java/com/focusos/app/data/repository/UsageAnalyticsRepository.kt?raw';
import analyticsVmKt from '../../android/app/src/main/java/com/focusos/app/ui/analytics/AnalyticsViewModel.kt?raw';
import analyticsScreenKt from '../../android/app/src/main/java/com/focusos/app/ui/analytics/AnalyticsScreen.kt?raw';
import usageAnalyticsTestKt from '../../android/app/src/test/java/com/focusos/app/UsageAnalyticsEvaluatorTest.kt?raw';
import migrationTestKt from '../../android/app/src/androidTest/java/com/focusos/app/FocusOsDatabaseMigrationTest.kt?raw';
import composeUiTestKt from '../../android/app/src/androidTest/java/com/focusos/app/FocusOsComposeUiTest.kt?raw';
import verifyApkSh from '../../android/verify_and_build_apk.sh?raw';
import devLogMd from '../../DEVELOPMENT_LOG.md?raw';

export interface AndroidSourceFile {
  path: string;
  stage: 'Stage 1' | 'Stage 2' | 'Stage 3' | 'Stage 4' | 'Stage 5' | 'Stage 6' | 'Stage 7';
  layer: 'Gradle & Manifest' | 'Domain' | 'Room & DataStore' | 'Compose UI' | 'Services' | 'Tests & Docs';
  summary: string;
  content: string;
}

export const ANDROID_STAGE1_FILES: AndroidSourceFile[] = [
  {
    path: 'android/app/src/androidTest/java/com/focusos/app/FocusOsDatabaseMigrationTest.kt',
    stage: 'Stage 7',
    layer: 'Tests & Docs',
    summary: 'Room MigrationTestHelper instrumented test verifying full v1→v5 schema migration preservation',
    content: migrationTestKt,
  },
  {
    path: 'android/app/src/androidTest/java/com/focusos/app/FocusOsComposeUiTest.kt',
    stage: 'Stage 7',
    layer: 'Tests & Docs',
    summary: 'Jetpack Compose createAndroidComposeRule instrumented UI test covering Dashboard and navigation tabs',
    content: composeUiTestKt,
  },
  {
    path: 'android/app/proguard-rules.pro',
    stage: 'Stage 7',
    layer: 'Gradle & Manifest',
    summary: 'R8/ProGuard keep rules protecting Room DAOs/entities, Services, BootReceiver, and Workers',
    content: proguardRules,
  },
  {
    path: 'android/verify_and_build_apk.sh',
    stage: 'Stage 7',
    layer: 'Gradle & Manifest',
    summary: 'Reproducible APK verification & build script running tests, Lint, assembleDebug, and assembleRelease',
    content: verifyApkSh,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/UsageAnalyticsEvaluator.kt',
    stage: 'Stage 6',
    layer: 'Domain',
    summary: 'Pure Kotlin evaluator summarizing foreground UsageStats, distracting ratios, and 7-day trends',
    content: usageAnalyticsEvaluatorKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/UsageAnalyticsModels.kt',
    stage: 'Stage 6',
    layer: 'Domain',
    summary: 'Immutable domain/UI models for AppUsageStatItem, CategoryUsageBreakdown, and AnalyticsUiState',
    content: usageAnalyticsModelsKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/usage/UsageStatsDataSource.kt',
    stage: 'Stage 6',
    layer: 'Services',
    summary: 'UsageStatsManager.queryEvents foreground session reconstructor and launch counter',
    content: usageStatsDataSourceKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/repository/UsageAnalyticsRepository.kt',
    stage: 'Stage 6',
    layer: 'Room & DataStore',
    summary: 'Refreshes live OS usage stats and replaces Stage 1 baseline seed metrics in Room DailyMetricDao',
    content: usageAnalyticsRepoKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/analytics/AnalyticsViewModel.kt',
    stage: 'Stage 6',
    layer: 'Compose UI',
    summary: 'StateFlow ViewModel coordinating UsageStats refresh, 1d/7d range switch, and Shield toggle',
    content: analyticsVmKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/analytics/AnalyticsScreen.kt',
    stage: 'Stage 6',
    layer: 'Compose UI',
    summary: 'Jetpack Compose AMOLED screen displaying UsageStats KPIs, Permission gate, and per-app breakdown',
    content: analyticsScreenKt,
  },
  {
    path: 'android/app/src/test/java/com/focusos/app/UsageAnalyticsEvaluatorTest.kt',
    stage: 'Stage 6',
    layer: 'Tests & Docs',
    summary: 'JUnit4 tests verifying distracting app attribution, permission-revoked state, and weekly streaks',
    content: usageAnalyticsTestKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/ScheduleEvaluator.kt',
    stage: 'Stage 5',
    layer: 'Domain',
    summary: 'Pure Kotlin evaluator for weekly bitmasks, overnight windows, countdowns, and mission-linked blocklists',
    content: scheduleEvaluatorKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/ScheduleModels.kt',
    stage: 'Stage 5',
    layer: 'Domain',
    summary: 'Domain models for StudyMissionItem, DailyBlockScheduleItem, and ScheduleEvaluation',
    content: scheduleModelsKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/DailyScheduleEntity.kt',
    stage: 'Stage 5',
    layer: 'Room & DataStore',
    summary: 'Room v5 entity persisting recurring daily restriction windows and linked missions',
    content: dailyScheduleEntityKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/repository/MissionScheduleRepository.kt',
    stage: 'Stage 5',
    layer: 'Room & DataStore',
    summary: 'Repository managing Mission CRUD, study progress increments, schedules, and blocklist merges',
    content: missionScheduleRepoKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/MissionStudyService.kt',
    stage: 'Stage 5',
    layer: 'Services',
    summary: 'SpecialUse foreground study timer notification logging progress and chiming via MissionAlertPlayer',
    content: missionStudyServiceKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/ScheduleWatchdogWorker.kt',
    stage: 'Stage 5',
    layer: 'Services',
    summary: 'WorkManager PeriodicWorkRequest watchdog reconciling scheduled blocking windows',
    content: scheduleWatchdogWorkerKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/ScheduleAlarmScheduler.kt',
    stage: 'Stage 5',
    layer: 'Services',
    summary: 'AlarmManager + WorkManager scheduler handling exact/inexact daily block triggers',
    content: scheduleAlarmSchedulerKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/ScheduleTriggerReceiver.kt',
    stage: 'Stage 5',
    layer: 'Services',
    summary: 'BroadcastReceiver starting linked MissionStudyService and App Shield on schedule start',
    content: scheduleTriggerReceiverKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/missions/MissionsViewModel.kt',
    stage: 'Stage 5',
    layer: 'Compose UI',
    summary: 'ViewModel wiring Room missions/schedules CRUD and ForegroundService study launches',
    content: missionsVmKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/missions/MissionsScreen.kt',
    stage: 'Stage 5',
    layer: 'Compose UI',
    summary: 'Jetpack Compose AMOLED screen for study missions CRUD and recurring daily block schedules',
    content: missionsScreenKt,
  },
  {
    path: 'android/app/src/test/java/com/focusos/app/ScheduleEvaluatorTest.kt',
    stage: 'Stage 5',
    layer: 'Tests & Docs',
    summary: 'JUnit4 tests verifying weekly schedules, overnight spans, and Nuclear blocklist sealing',
    content: scheduleTestKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/NuclearModePolicy.kt',
    stage: 'Stage 4',
    layer: 'Domain',
    summary: 'Enforces Nuclear Mode settings lock, deliberate security hold, and override validation',
    content: nuclearPolicyKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/FocusBootReceiver.kt',
    stage: 'Stage 4',
    layer: 'Services',
    summary: 'BOOT_COMPLETED & MY_PACKAGE_REPLACED receiver restoring active Nuclear sessions across reboots',
    content: bootReceiverKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/NuclearOverrideLogEntity.kt',
    stage: 'Stage 4',
    layer: 'Room & DataStore',
    summary: 'Room v4 audit log entity storing deliberate Nuclear Mode emergency overrides',
    content: nuclearOverrideEntityKt,
  },
  {
    path: 'android/app/src/test/java/com/focusos/app/NuclearModePolicyTest.kt',
    stage: 'Stage 4',
    layer: 'Tests & Docs',
    summary: 'JUnit4 tests verifying Nuclear lock enforcement, emergency dialer safety, and override gates',
    content: nuclearTestKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/FocusBlockingAccessibilityService.kt',
    stage: 'Stage 3',
    layer: 'Services',
    summary: 'Real AccessibilityService intercepting restricted apps on TYPE_WINDOW_STATE_CHANGED',
    content: accessibilityServiceKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/FocusSessionForegroundService.kt',
    stage: 'Stage 3',
    layer: 'Services',
    summary: 'SpecialUse ForegroundService with live countdown, UsageStats fallback, and auto-restoration',
    content: foregroundServiceKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/service/MissionAlertPlayer.kt',
    stage: 'Stage 3',
    layer: 'Services',
    summary: 'ToneGenerator dual-chime alert triggered when an active mission reaches target duration',
    content: missionAlertPlayerKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/blocking/BlockingShieldActivity.kt',
    stage: 'Stage 3',
    layer: 'Compose UI',
    summary: 'Full-screen AMOLED Compose blocking screen with countdown and safe home exit',
    content: blockingShieldActivityKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/BlockingEvaluator.kt',
    stage: 'Stage 3',
    layer: 'Domain',
    summary: 'Pure Kotlin evaluator enforcing session expiration, safety allowlists, and event debouncing',
    content: blockingEvaluatorKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/BlockingEngineModels.kt',
    stage: 'Stage 3',
    layer: 'Domain',
    summary: 'ActiveFocusSession, BlockingDecision, and BlockedAttemptLog models',
    content: blockingModelsKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/repository/FocusSessionRepository.kt',
    stage: 'Stage 3',
    layer: 'Room & DataStore',
    summary: 'Persists active focus sessions, auto-restoration, and blocked attempt counts in Room',
    content: sessionRepoKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/FocusSessionEntity.kt',
    stage: 'Stage 3',
    layer: 'Room & DataStore',
    summary: 'Room entity tracking active session start/end timestamps across restarts',
    content: sessionEntityKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/BlockedAttemptEntity.kt',
    stage: 'Stage 3',
    layer: 'Room & DataStore',
    summary: 'Room entity logging intercepted restricted app launches',
    content: attemptEntityKt,
  },
  {
    path: 'android/app/src/main/res/xml/focus_accessibility_service_config.xml',
    stage: 'Stage 3',
    layer: 'Gradle & Manifest',
    summary: 'AccessibilityService XML config scoped strictly to window state transitions',
    content: accessibilityXml,
  },
  {
    path: 'android/app/src/test/java/com/focusos/app/BlockingEvaluatorTest.kt',
    stage: 'Stage 3',
    layer: 'Tests & Docs',
    summary: 'JUnit4 unit tests for blocking rules, safety exemptions, expiration, and debounce',
    content: blockingTestKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/apps/InstalledAppsProvider.kt',
    stage: 'Stage 2',
    layer: 'Room & DataStore',
    summary: 'Enumerates launchable installed apps via PackageManager with LRU icon bitmap cache',
    content: installedProviderKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/shield/AppSelectionScreen.kt',
    stage: 'Stage 3',
    layer: 'Compose UI',
    summary: 'App Shield screen with BlockingEnginePanel, real icons, filters, and blocklist switches',
    content: shieldScreenKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/shield/AppSelectionViewModel.kt',
    stage: 'Stage 3',
    layer: 'Compose UI',
    summary: 'StateFlow ViewModel coordinating app scan, focus sessions, and Room blocklist',
    content: shieldVmKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/shield/AppIconImage.kt',
    stage: 'Stage 2',
    layer: 'Compose UI',
    summary: 'Async Compose Image loader rendering Android Drawable app icons with fallback monogram',
    content: appIconKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/repository/AppBlocklistRepository.kt',
    stage: 'Stage 2',
    layer: 'Room & DataStore',
    summary: 'Syncs detected launchable apps with Room BlockedAppDao and distracting app presets',
    content: blocklistRepoKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/BlockedAppEntity.kt',
    stage: 'Stage 2',
    layer: 'Room & DataStore',
    summary: 'Room entity storing custom blocklisted packages and timestamps',
    content: blockedEntityKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/AppSelectionFilter.kt',
    stage: 'Stage 2',
    layer: 'Domain',
    summary: 'Categorizes packages, guards safety/dialer apps, and filters/sorts installed apps',
    content: appFilterKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/AppSelectionModels.kt',
    stage: 'Stage 3',
    layer: 'Domain',
    summary: 'Immutable UI models for App Shield, active sessions, and recent intercepts',
    content: appModelsKt,
  },
  {
    path: 'android/app/src/test/java/com/focusos/app/AppSelectionFilterTest.kt',
    stage: 'Stage 2',
    layer: 'Tests & Docs',
    summary: 'JUnit4 unit tests for categorization, dialer/self-protection, and filtering',
    content: filterTestKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/MainActivity.kt',
    stage: 'Stage 6',
    layer: 'Compose UI',
    summary: 'Edge-to-edge Compose host wiring Dashboard, Shield, Missions, Analytics, and onResume sync',
    content: mainActivity,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/FocusOsDatabase.kt',
    stage: 'Stage 5',
    layer: 'Room & DataStore',
    summary: 'Room database v5 with MIGRATION_1_2 through MIGRATION_4_5',
    content: databaseKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/FocusOsDaos.kt',
    stage: 'Stage 6',
    layer: 'Room & DataStore',
    summary: 'Reactive Flow DAOs for metrics, missions, schedules, blocklists, sessions, and live usage updates',
    content: daosKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/repository/PermissionStatusChecker.kt',
    stage: 'Stage 3',
    layer: 'Room & DataStore',
    summary: 'Real AppOpsManager Usage Access and FocusBlockingAccessibilityService verification',
    content: permCheckerKt,
  },
  {
    path: 'android/app/src/main/AndroidManifest.xml',
    stage: 'Stage 5',
    layer: 'Gradle & Manifest',
    summary: 'Manifest registering AccessibilityService, SpecialUse ForegroundServices, BootReceiver, and Alarms',
    content: androidManifest,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/FocusOsApplication.kt',
    stage: 'Stage 6',
    layer: 'Gradle & Manifest',
    summary: 'Application class initializing AppContainer repositories and WorkManager watchdog for Stages 1–6',
    content: focusApplication,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/dashboard/DashboardScreen.kt',
    stage: 'Stage 7',
    layer: 'Compose UI',
    summary: 'AMOLED command center with Discipline Score arc, live UsageStats telemetry status, active mission, and 7-day bar chart',
    content: dashScreenKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/dashboard/DashboardViewModel.kt',
    stage: 'Stage 1',
    layer: 'Compose UI',
    summary: 'StateFlow ViewModel collecting Room, DataStore, and system permission state',
    content: vmKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/navigation/FocusDestination.kt',
    stage: 'Stage 1',
    layer: 'Compose UI',
    summary: 'Bottom navigation destinations mapped across Stages 1–6',
    content: navKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/components/StagePlaceholderScreen.kt',
    stage: 'Stage 1',
    layer: 'Compose UI',
    summary: 'Honest Stage-gated screens for Missions and Analytics',
    content: placeholderKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/theme/Color.kt',
    stage: 'Stage 1',
    layer: 'Compose UI',
    summary: 'AMOLED pure black, charcoal surfaces, white typography, and deep crimson tokens',
    content: colorKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/theme/Type.kt',
    stage: 'Stage 1',
    layer: 'Compose UI',
    summary: 'Typography scale with tabular numerals (tnum) for telemetry counters',
    content: typeKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/ui/theme/Theme.kt',
    stage: 'Stage 1',
    layer: 'Compose UI',
    summary: 'Material 3 dark color scheme and edge-to-edge black system bars',
    content: themeKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/DisciplineCalculator.kt',
    stage: 'Stage 1',
    layer: 'Domain',
    summary: 'Pure Kotlin 0–100 Discipline Score calculator and duration formatting',
    content: calculatorKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/domain/DashboardModels.kt',
    stage: 'Stage 1',
    layer: 'Domain',
    summary: 'Immutable UI state contracts for metrics, missions, and permission readiness',
    content: modelsKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/DailyMetricEntity.kt',
    stage: 'Stage 1',
    layer: 'Room & DataStore',
    summary: 'Room entity for daily focus, screen time, distracting usage, and blocked attempts',
    content: dailyEntityKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/local/MissionEntity.kt',
    stage: 'Stage 1',
    layer: 'Room & DataStore',
    summary: 'Room entity for study missions and active mission tracking',
    content: missionEntityKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/preferences/UserPreferencesRepository.kt',
    stage: 'Stage 1',
    layer: 'Room & DataStore',
    summary: 'Jetpack DataStore Preferences persisting daily focus target minutes',
    content: prefsRepoKt,
  },
  {
    path: 'android/app/src/main/java/com/focusos/app/data/repository/DisciplineRepository.kt',
    stage: 'Stage 1',
    layer: 'Room & DataStore',
    summary: 'Repository combining Room Flows, DataStore, and system readiness',
    content: discRepoKt,
  },
  {
    path: 'android/app/build.gradle.kts',
    stage: 'Stage 7',
    layer: 'Gradle & Manifest',
    summary: 'Module Gradle config (v1.0.0-stage7, R8 shrinking, release signing hook, Room schema assets, Compose/Work test deps)',
    content: appBuildGradle,
  },
  {
    path: 'android/gradle/libs.versions.toml',
    stage: 'Stage 7',
    layer: 'Gradle & Manifest',
    summary: 'Gradle Version Catalog for AGP 8.7.3, Kotlin 2.0.21, Compose, Room Testing, WorkManager Testing',
    content: libsVersionsToml,
  },
  {
    path: 'android/build.gradle.kts',
    stage: 'Stage 1',
    layer: 'Gradle & Manifest',
    summary: 'Root Gradle plugins declaration',
    content: rootBuildGradle,
  },
  {
    path: 'android/settings.gradle.kts',
    stage: 'Stage 1',
    layer: 'Gradle & Manifest',
    summary: 'Gradle repositories and :app module registration',
    content: settingsGradle,
  },
  {
    path: 'android/app/src/test/java/com/focusos/app/DisciplineCalculatorTest.kt',
    stage: 'Stage 1',
    layer: 'Tests & Docs',
    summary: 'JUnit4 unit tests for DisciplineCalculator edge cases',
    content: calcTestKt,
  },
  {
    path: 'DEVELOPMENT_LOG.md',
    stage: 'Stage 7',
    layer: 'Tests & Docs',
    summary: 'Living engineering log tracking Stages 1–7 completion, bug fixes, and toolchain status',
    content: devLogMd,
  },
];
