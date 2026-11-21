import React from 'react';

interface StageItem {
  stage: string;
  title: string;
  status:
    | 'Completed (Stage 1)'
    | 'Completed (Stage 2)'
    | 'Completed (Stage 3)'
    | 'Completed (Stage 4)'
    | 'Completed (Stage 5)'
    | 'Completed (Stage 6)'
    | 'Completed (Stage 7)'
    | 'Next'
    | 'Planned';
  scope: string;
  androidApis: string;
}

const STAGES: StageItem[] = [
  {
    stage: 'Stage 1',
    title: 'Project Foundation & Dashboard',
    status: 'Completed (Stage 1)',
    scope:
      'Gradle Kotlin DSL setup, AMOLED Compose theme, Room database (DailyMetric + Mission), DataStore Preferences, DisciplineCalculator, and Command Dashboard.',
    androidApis: 'Jetpack Compose, Material 3, Room 2.6, DataStore 1.1, Navigation Compose',
  },
  {
    stage: 'Stage 2',
    title: 'App Detection & Selection',
    status: 'Completed (Stage 2)',
    scope:
      'Enumerate launchable installed apps with real icons, package names, search/filter, safety package protection, and persistent custom blocklist selection in Room.',
    androidApis: 'PackageManager.queryIntentActivities, QUERY_ALL_PACKAGES, Room BlockedAppEntity (v2)',
  },
  {
    stage: 'Stage 3',
    title: 'Working App-Blocking Engine',
    status: 'Completed (Stage 3)',
    scope:
      'Real foreground app interception, full-screen FOCUS//OS blocking screen, persistent session countdown, blocked attempt counter, and automatic restoration when sessions end.',
    androidApis: 'FocusBlockingAccessibilityService, FocusSessionForegroundService, BlockingShieldActivity, Room v3',
  },
  {
    stage: 'Stage 4',
    title: 'Nuclear Mode',
    status: 'Completed (Stage 4)',
    scope:
      'Locks active blocklist settings, enforces two-gate deliberate Emergency Override with security hold & phrase verification, persists across reboots, and preserves dialer/emergency safety calls.',
    androidApis: 'NuclearModePolicy, FocusBootReceiver (BOOT_COMPLETED), Room v4 nuclear_override_logs, Telecom exemption',
  },
  {
    stage: 'Stage 5',
    title: 'Missions & Scheduling',
    status: 'Completed (Stage 5)',
    scope:
      'Custom study missions CRUD, MissionStudyService live countdown notifications, WorkManager & AlarmManager recurring daily schedules, and mission-linked blocklist overrides.',
    androidApis: 'MissionStudyService, WorkManager ScheduleWatchdogWorker, AlarmManager, Room v5 DailyScheduleEntity',
  },
  {
    stage: 'Stage 6',
    title: 'Analytics & Screen Time',
    status: 'Completed (Stage 6)',
    scope:
      'Replaced Stage 1 baseline seed metrics with live UsageStatsManager.queryEvents session reconstruction, distracting app attribution, 7-day trend metrics, and one-tap App Shield toggling.',
    androidApis: 'UsageStatsManager.queryEvents, UsageStatsDataSource, UsageAnalyticsRepository, AnalyticsScreen',
  },
  {
    stage: 'Stage 7',
    title: 'Testing & APK Generation',
    status: 'Completed (Stage 7)',
    scope:
      'Added Room v1→v5 MigrationTestHelper suite, Compose instrumented UI verification, R8/ProGuard keep rules, release signing hooks, verify_and_build_apk.sh, and live Web Release QA console.',
    androidApis: 'FocusOsDatabaseMigrationTest, FocusOsComposeUiTest, ProGuard R8, verify_and_build_apk.sh',
  },
];

export const StageRoadmapView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1D2421] pb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-50">
          Staged Build Roadmap
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          FOCUS//OS is built and verified incrementally across 7 engineering stages, tracked in{' '}
          <span className="font-mono text-slate-200">DEVELOPMENT_LOG.md</span>.
        </p>
      </div>

      <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-100">
          Honest Android Platform &amp; Container Constraints
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-slate-300">
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-100">Container Build Limitation</p>
            <p className="text-slate-400">
              This cloud container provides Node.js and Chromium without JDK 17, Gradle, or Android
              SDK 35. Android source files are written in <span className="font-mono">/android/</span>{' '}
              and ready for Android Studio, but APK compilation cannot execute inside this web container.
            </p>
          </div>
          <div className="space-y-1.5">
            <p className="font-semibold text-slate-100">Android Blocking &amp; Nuclear Mode Reality</p>
            <p className="text-slate-400">
              On non-rooted Android, apps cannot disable Safe Mode, block Settings uninstallation
              without Device Owner provisioning, or block the system emergency dialer. Stage 4 Nuclear
              Mode explicitly preserves Phone/Dialer and emergency calls while locking in-app rules.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm divide-y divide-[#1C2320]">
        {STAGES.map((item) => (
          <div
            key={item.stage}
            className="grid grid-cols-1 md:grid-cols-12 gap-4 p-5 items-start"
          >
            <div className="md:col-span-3 space-y-1">
              <span className="font-mono text-xs text-slate-400">{item.stage}</span>
              <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
              <p
                className={`font-mono text-xs ${
                  item.status.startsWith('Completed')
                    ? 'text-emerald-500'
                    : item.status === 'Next'
                    ? 'text-red-500'
                    : 'text-slate-500'
                }`}
              >
                {item.status}
              </p>
            </div>
            <p className="md:col-span-5 text-xs leading-relaxed text-slate-300">{item.scope}</p>
            <p className="md:col-span-4 font-mono text-xs leading-relaxed text-slate-400">
              {item.androidApis}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
