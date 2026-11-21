import React, { useState, useMemo } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';
import {
  AppCategory,
  BlockFilterMode,
  SAMPLE_ANDROID_APPS,
  filterAndSortApps,
  getDistractingPresetPackages,
} from '../utils/appSelection';
import {
  ActiveFocusSession,
  BlockedAttemptEntry,
  EmergencyOverrideEntry,
  formatCountdownMillis,
} from '../utils/blockingEngine';

interface AppSelectionViewProps {
  blockedPackages: string[];
  activeSession: ActiveFocusSession | null;
  isNuclearLocked: boolean;
  remainingMillis: number;
  recentAttempts: BlockedAttemptEntry[];
  emergencyOverrides: EmergencyOverrideEntry[];
  lastAllowedFeedback: string | null;
  onTogglePackage: (packageName: string) => void;
  onSetPackages: (packages: string[]) => void;
  onStartSession: (durationMinutes: number, isNuclearMode: boolean) => void;
  onStopSession: () => void;
  onOpenEmergencyOverride: () => void;
  onTestOpenApp: (packageName: string, appName: string) => void;
}

const FILTER_MODES: BlockFilterMode[] = ['All', 'Blocked', 'Allowed'];
const CATEGORIES: AppCategory[] = ['Social', 'Video', 'Games', 'Browser', 'Productivity', 'Other'];

export const AppSelectionView: React.FC<AppSelectionViewProps> = ({
  blockedPackages,
  activeSession,
  isNuclearLocked,
  remainingMillis,
  recentAttempts,
  emergencyOverrides,
  lastAllowedFeedback,
  onTogglePackage,
  onSetPackages,
  onStartSession,
  onStopSession,
  onOpenEmergencyOverride,
  onTestOpenApp,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<BlockFilterMode>('All');
  const [selectedCategory, setSelectedCategory] = useState<AppCategory | null>(null);
  const [nuclearArmSelected, setNuclearArmSelected] = useState(false);

  const blockedSet = useMemo(() => new Set(blockedPackages), [blockedPackages]);

  const appViewModels = useMemo(() => {
    return SAMPLE_ANDROID_APPS.map((app) => ({
      ...app,
      isBlocked: blockedSet.has(app.packageName) && !app.isProtectedSafetyApp,
    }));
  }, [blockedSet]);

  const filteredApps = useMemo(() => {
    return filterAndSortApps(appViewModels, searchQuery, selectedCategory, filterMode);
  }, [appViewModels, searchQuery, selectedCategory, filterMode]);

  const blockedCount = appViewModels.filter((a) => a.isBlocked).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1E2534] pb-5">
        <div>
          <h1 className="font-display text-3xl sm:text-[34px] font-bold tracking-tight text-slate-50">
            App Blocker &amp; Focus Lock
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            <span data-testid="blocked-count-label" className="font-medium text-slate-200 tabular-nums">
              {blockedCount} blocked
            </span>{' '}
            of{' '}
            <span className="font-medium text-slate-300 tabular-nums">
              {SAMPLE_ANDROID_APPS.length}
            </span>{' '}
            apps
            {isNuclearLocked && (
              <span className="ml-2 text-xs font-medium text-[#D4AD5A]">
                · Settings Locked by Strict Lock
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={isNuclearLocked}
            onClick={() => onSetPackages(getDistractingPresetPackages(SAMPLE_ANDROID_APPS))}
            className="rounded-lg border border-[#2A3346] bg-[#141923] px-3.5 py-2 text-xs font-medium text-slate-100 hover:border-slate-500 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 min-h-[38px]"
          >
            Select Social &amp; Video
          </button>
          <button
            type="button"
            disabled={isNuclearLocked}
            onClick={() => onSetPackages([])}
            className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-400 hover:text-slate-100 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 min-h-[38px]"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Focus Session & Strict Lock Controls */}
      <section
        aria-label="Focus blocking session controls"
        data-testid="blocking-session-panel"
        className={`rounded-xl border bg-[#141923] p-5 space-y-4 ${
          isNuclearLocked
            ? 'border-[#D4AD5A]'
            : activeSession
              ? 'border-rose-500'
              : 'border-[#232B3A]'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isNuclearLocked && (
                <ShieldAlert className="h-4 w-4 text-[#D4AD5A] shrink-0" aria-hidden="true" />
              )}
              <h2 className="font-display text-base font-semibold text-slate-100">
                {isNuclearLocked
                  ? 'Strict Lock Active · Settings Locked'
                  : activeSession
                    ? 'App Blocker Active'
                    : 'Start a Focus Session'}
              </h2>
            </div>

            {activeSession ? (
              <p className="text-xs text-slate-300 tabular-nums">
                <span
                  data-testid="session-countdown"
                  className={`font-mono text-sm font-semibold tabular-nums ${
                    isNuclearLocked ? 'text-[#D4AD5A]' : 'text-rose-400'
                  }`}
                >
                  {formatCountdownMillis(remainingMillis)}
                </span>{' '}
                remaining · {blockedCount} blocked apps paused ·{' '}
                {isNuclearLocked
                  ? 'Blocklist sealed until timer ends or emergency override'
                  : 'Apps restore automatically at zero'}
              </p>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Choose <span className="text-slate-200 font-medium">Standard Mode</span> or{' '}
                <span className="text-[#D4AD5A] font-medium">Strict Lock</span> (prevents edits until the session ends or you confirm an emergency override).
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeSession ? (
              isNuclearLocked ? (
                <button
                  type="button"
                  data-testid="emergency-override-trigger"
                  onClick={onOpenEmergencyOverride}
                  className="rounded-lg border border-rose-500/60 bg-rose-950/50 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-900/60 whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  Emergency Override
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onStopSession}
                  className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-4 py-2 text-xs font-semibold text-slate-100 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
                >
                  End &amp; Restore
                </button>
              )
            ) : (
              <>
                <div
                  role="group"
                  aria-label="Session strictness mode"
                  className="flex items-center gap-1 rounded-lg border border-[#232B3A] bg-[#0F131B] p-1"
                >
                  <button
                    type="button"
                    data-testid="mode-standard-btn"
                    onClick={() => setNuclearArmSelected(false)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      !nuclearArmSelected
                        ? 'bg-[#181F2C] text-slate-100'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Standard Mode
                  </button>
                  <button
                    type="button"
                    data-testid="mode-nuclear-btn"
                    onClick={() => setNuclearArmSelected(true)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      nuclearArmSelected
                        ? 'bg-[#D4AD5A] text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-[#D4AD5A]'
                    }`}
                  >
                    Strict Lock
                  </button>
                </div>

                {[25, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    disabled={blockedCount === 0}
                    data-testid={`start-session-${mins}m`}
                    onClick={() => onStartSession(mins, nuclearArmSelected)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-semibold tabular-nums transition-colors disabled:bg-[#1E2534] disabled:text-slate-500 whitespace-nowrap shrink-0 min-h-[38px] ${
                      nuclearArmSelected
                        ? 'bg-[#D4AD5A] text-slate-950 hover:bg-[#e0bc6d]'
                        : 'bg-rose-700 text-white hover:bg-rose-600'
                    }`}
                  >
                    {nuclearArmSelected ? `Strict ${mins}m` : `Start ${mins}m`}
                  </button>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Safety Guarantee */}
        <div className="border-t border-[#1E2534] pt-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            <span className="font-medium text-emerald-400">Safety Guarantee:</span> Phone calls, Contacts &amp;
            112/911 emergency services always remain accessible.
          </span>
          <span>
            Strict Lock stays active across app restarts until the countdown finishes.
          </span>
        </div>

        {lastAllowedFeedback && (
          <p data-testid="test-open-feedback" className="text-xs font-medium text-emerald-400 border-t border-[#1E2534] pt-3">
            {lastAllowedFeedback}
          </p>
        )}

        {(recentAttempts.length > 0 || emergencyOverrides.length > 0) && (
          <div className="border-t border-[#1E2534] pt-3 flex flex-col gap-1.5 text-xs text-slate-400">
            {recentAttempts.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-slate-300 font-medium">Recent Blocked Attempts:</span>
                {recentAttempts.slice(0, 4).map((entry) => (
                  <span key={entry.id} className="text-xs text-slate-400 tabular-nums">
                    {entry.appName} (
                    {new Date(entry.attemptedAtEpochMs).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    )
                  </span>
                ))}
              </div>
            )}
            {emergencyOverrides.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1" data-testid="override-audit-log">
                <span className="text-[#D4AD5A] font-medium">Last Emergency Override:</span>
                <span className="text-xs text-slate-400 tabular-nums">
                  &ldquo;{emergencyOverrides[0].reason}&rdquo; ({formatCountdownMillis(emergencyOverrides[0].remainingMillisAtAbort)} left)
                </span>
              </div>
            )}
          </div>
        )}
      </section>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="w-full lg:w-80">
          <label htmlFor="shield-search" className="sr-only">
            Search apps
          </label>
          <input
            id="shield-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps..."
            className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Filter by block status"
            className="flex items-center gap-1 rounded-lg border border-[#232B3A] bg-[#141923] p-1"
          >
            {FILTER_MODES.map((mode) => {
              const active = filterMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active ? 'bg-rose-700 text-white' : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  {mode}
                </button>
              );
            })}
          </div>

          <div
            role="group"
            aria-label="Filter by app category"
            className="flex flex-wrap items-center gap-1.5"
          >
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setSelectedCategory(active ? null : category)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[34px] ${
                    active
                      ? 'border-[#D4AD5A] bg-[#181F2C] text-slate-50'
                      : 'border-[#232B3A] bg-[#141923] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {filteredApps.length === 0 ? (
        <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-8 text-center">
          <p className="text-sm font-medium text-slate-200">No applications match the active filters.</p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setFilterMode('All');
              setSelectedCategory(null);
            }}
            className="mt-3 rounded-lg border border-[#2A3346] bg-[#0F131B] px-4 py-2 text-xs text-slate-200 hover:border-slate-500"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="app-selection-list">
          {filteredApps.map((app) => (
            <div
              key={app.packageName}
              className={`flex items-center justify-between gap-3 rounded-xl border bg-[#141923] px-4 py-3.5 transition-colors ${
                app.isBlocked ? 'border-rose-500/70' : 'border-[#232B3A]'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#2A3346] font-display text-xs font-semibold text-white"
                  style={{ backgroundColor: `${app.accentHex}26` }}
                  aria-hidden="true"
                >
                  {app.monogram}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">{app.appName}</p>
                  <p className="truncate text-xs text-slate-400">
                    {app.category} ·{' '}
                    {app.isProtectedSafetyApp
                      ? 'Always allowed'
                      : app.isBlocked
                        ? 'Blocked during focus'
                        : 'Allowed'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onTestOpenApp(app.packageName, app.appName)}
                  aria-label={`Test Open ${app.appName}`}
                  className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0"
                >
                  Preview
                </button>

                {app.isProtectedSafetyApp ? (
                  <span className="text-xs font-medium text-emerald-400 whitespace-nowrap shrink-0">
                    Protected
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {isNuclearLocked && (
                      <Lock
                        className="h-3.5 w-3.5 text-[#D4AD5A]"
                        aria-label="Locked by Strict Lock"
                      />
                    )}
                    <button
                      type="button"
                      role="switch"
                      disabled={isNuclearLocked}
                      aria-checked={app.isBlocked}
                      aria-label={`Block ${app.appName}`}
                      onClick={() => onTogglePackage(app.packageName)}
                      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500 disabled:opacity-55 disabled:cursor-not-allowed ${
                        app.isBlocked
                          ? 'border-rose-600 bg-rose-700'
                          : 'border-[#2A3346] bg-[#0F131B]'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          app.isBlocked ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
