import React from 'react';

interface PermissionRow {
  permission: string;
  stageRequired: string;
  currentStatus: string;
  purpose: string;
}

const PERMISSIONS: PermissionRow[] = [
  {
    permission: 'QUERY_ALL_PACKAGES',
    stageRequired: 'Stage 2 (App Detection)',
    currentStatus: 'Declared in Manifest · Implemented in InstalledAppsProvider',
    purpose:
      'Allows PackageManager.queryIntentActivities to enumerate all launchable user applications and extract real app icons for blocklist selection.',
  },
  {
    permission: 'PACKAGE_USAGE_STATS',
    stageRequired: 'Stage 3 / Stage 6',
    currentStatus:
      'Implemented in UsageStatsDataSource & UsageAnalyticsRepository · AppOpsManager checked',
    purpose:
      'Reconstructs foreground app sessions and distracting app usage via UsageStatsManager.queryEvents. Requires explicit user grant in Android Usage Access settings.',
  },
  {
    permission: 'BIND_ACCESSIBILITY_SERVICE',
    stageRequired: 'Stage 3 (Blocking Engine)',
    currentStatus: 'Implemented in FocusBlockingAccessibilityService · XML configured',
    purpose:
      'Detects TYPE_WINDOW_STATE_CHANGED foreground package transitions in real time (without reading screen content) to trigger BlockingShieldActivity on restricted apps.',
  },
  {
    permission: 'FOREGROUND_SERVICE_SPECIAL_USE & POST_NOTIFICATIONS',
    stageRequired: 'Stage 3 / Stage 5',
    currentStatus: 'Implemented in FocusSessionForegroundService',
    purpose:
      'Keeps active blocking session countdowns, UsageStats secondary verification, and automatic restoration alive reliably with a persistent notification.',
  },
  {
    permission: 'RECEIVE_BOOT_COMPLETED',
    stageRequired: 'Stage 4 / Stage 5',
    currentStatus: 'Implemented in FocusBootReceiver · Manifest declared',
    purpose:
      'Restores active Nuclear Mode restrictions, FocusSessionForegroundService countdowns, and recurring AlarmManager/WorkManager schedules after reboot.',
  },
  {
    permission: 'SCHEDULE_EXACT_ALARM & WorkManager',
    stageRequired: 'Stage 5 (Missions & Scheduling)',
    currentStatus: 'Implemented in ScheduleAlarmScheduler & ScheduleWatchdogWorker',
    purpose:
      'Triggers recurring daily study block windows cleanly at scheduled times, falling back to inexact alarms and 15m WorkManager watchdog checks when exact alarm permission is denied.',
  },
];

export const PermissionsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#1D2421] pb-5">
        <h1 className="font-display text-4xl font-bold tracking-tight text-slate-50">
          Android Permissions Architecture
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          <span className="font-mono text-slate-200">PermissionStatusChecker.kt</span> queries real
          Android <span className="font-mono text-slate-200">AppOpsManager</span> &amp;{' '}
          <span className="font-mono text-slate-200">AccessibilityManager</span> state for Stages 1–6
          readiness.
        </p>
      </div>

      <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#222926] text-xs text-slate-400">
              <th className="py-3.5 px-4 font-medium">Permission / API</th>
              <th className="py-3.5 px-4 font-medium">Stage</th>
              <th className="py-3.5 px-4 font-medium">Implementation Status</th>
              <th className="py-3.5 px-4 font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2320] text-xs">
            {PERMISSIONS.map((row) => (
              <tr key={row.permission} className="hover:bg-[#111614]">
                <td className="py-4 px-4 font-mono text-slate-100 whitespace-nowrap">
                  {row.permission}
                </td>
                <td className="py-4 px-4 font-mono text-[#C59B43] whitespace-nowrap">
                  {row.stageRequired}
                </td>
                <td className="py-4 px-4 text-slate-300">{row.currentStatus}</td>
                <td className="py-4 px-4 text-slate-400 leading-relaxed max-w-md">
                  {row.purpose}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
