import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BatteryWarning, Play, Pause, Shield, Target, Volume2, VolumeX, Zap } from 'lucide-react';
import {
  CommandCenterState,
  calculateDisciplineScore,
  formatMinutesCompact,
} from '../utils/discipline';
import { DisciplineGauge } from './DisciplineGauge';
import { WeeklyFocusChart } from './WeeklyFocusChart';
import { DisciplineTrendChart } from './DisciplineTrendChart';
import { WeeklyDisciplineHeatmap } from './WeeklyDisciplineHeatmap';
import { CompletedMissionsCard } from './CompletedMissionsCard';
import { ActiveTab } from './TopBar';
import { UiThemeId, getUiThemeDefinition } from '../utils/themeSettings';
import {
  ActiveFocusSession,
  BatteryUsageWarning,
  formatCountdownMillis,
} from '../utils/blockingEngine';
import {
  PersonalizationState,
  computeJeeMathProgress,
  computeNdaCountdown,
  computeOverallNdaSyllabusPct,
} from '../utils/personalization';

interface DashboardViewProps {
  state: CommandCenterState;
  personalization: PersonalizationState;
  uiTheme: UiThemeId;
  blockedPackagesCount: number;
  usageAccessGranted: boolean;
  activeSession: ActiveFocusSession | null;
  remainingMillis: number;
  batteryWarning: BatteryUsageWarning | null;
  audioEnabled: boolean;
  isMissionTimerRunning: boolean;
  missionElapsedSeconds: number;
  missionNotice: {
    missionTitle: string;
    soundPlayed: boolean;
    reason: 'played' | 'muted' | 'unsupported';
  } | null;
  onToggleAudio: () => void;
  onToggleMissionTimer: () => void;
  onAdvanceMission: (deltaMinutes: number) => void;
  onReplayChime: () => void;
  onDismissMissionNotice: () => void;
  onEnableEcoPolling: () => void;
  onRestoreWatchdogPolling: () => void;
  onStartQuickSession: (durationMinutes: number, sessionLabel: string) => void;
  onStopOrOverrideSession: () => void;
  onSelectMission: (missionId: number) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenSettingsModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  state,
  personalization,
  uiTheme,
  blockedPackagesCount,
  usageAccessGranted,
  activeSession,
  remainingMillis,
  batteryWarning,
  audioEnabled,
  isMissionTimerRunning,
  missionElapsedSeconds,
  missionNotice,
  onToggleAudio,
  onToggleMissionTimer,
  onAdvanceMission,
  onReplayChime,
  onDismissMissionNotice,
  onEnableEcoPolling,
  onRestoreWatchdogPolling,
  onStartQuickSession,
  onStopOrOverrideSession,
  onSelectMission,
  onNavigateTab,
  onOpenSettingsModal,
}) => {
  const themeMeta = getUiThemeDefinition(uiTheme);
  const completedMissions = state.missions.filter((m) => m.isCompleted).length;
  const totalMissions = state.missions.length;
  const activeMission =
    state.missions.find((m) => m.id === state.activeMissionId) ?? state.missions[0];

  const breakdown = calculateDisciplineScore({
    focusMinutesToday: state.focusMinutesToday,
    focusTargetMinutes: state.dailyFocusTargetMinutes,
    distractingMinutesToday: state.distractingMinutesToday,
    blockedAttemptsResisted: state.blockedAttemptsToday,
    completedMissionsToday: completedMissions,
    plannedMissionsToday: totalMissions,
  });

  const activeProgressPct = activeMission
    ? Math.min(100, Math.round((activeMission.completedMinutes / activeMission.targetMinutes) * 100))
    : 0;
  const ndaCountdown = computeNdaCountdown(personalization.profile.ndaExamDateIso);
  const ndaPct = computeOverallNdaSyllabusPct(personalization.ndaChapters);
  const jeeSummary = computeJeeMathProgress(
    personalization.jeeLectures,
    personalization.jeePractice
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1E2534] pb-5">
        <div>
          <h1 className="font-display text-3xl sm:text-[34px] font-bold tracking-tight text-slate-50 text-balance">
            Focus Overview
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            <span data-testid="dashboard-theme-label" className="text-[#D4AD5A] font-medium">
              {themeMeta.shortLabel}
            </span>
            {' · '}Daily Goal{' '}
            <span className="font-medium text-slate-200 tabular-nums">
              {formatMinutesCompact(state.dailyFocusTargetMinutes)}
            </span>{' '}
            ·{' '}
            <span className="font-medium text-slate-200 tabular-nums">
              {blockedPackagesCount} apps
            </span>{' '}
            blocked
            {activeSession ? (
              <>
                {' · '}
                <span
                  data-testid="dashboard-session-status"
                  className={`font-medium tabular-nums ${
                    activeSession.isNuclearMode ? 'text-[#D4AD5A]' : 'text-rose-400'
                  }`}
                >
                  {activeSession.isNuclearMode ? 'Strict Lock Active' : 'Blocker Active'} (
                  <span className="font-mono">{formatCountdownMillis(remainingMillis)}</span>)
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <button
            type="button"
            onClick={() => onNavigateTab('personal')}
            className="rounded-lg border border-[#D4AD5A]/45 bg-[#141923] px-3.5 py-2 font-medium text-[#D4AD5A] transition-colors hover:border-[#D4AD5A] whitespace-nowrap shrink-0"
          >
            AI Mentor &amp; Intel
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('shield')}
            className="rounded-lg border border-[#2A3346] bg-[#141923] px-3.5 py-2 font-medium text-slate-200 transition-colors hover:border-slate-500 whitespace-nowrap shrink-0"
          >
            Manage App Blocker
          </button>
        </div>
      </div>

      {/* Personalized Mission Brief (NDA 2027 + JEE Mathematics + Environment) */}
      <section
        aria-label="Personal mission brief"
        data-testid="personal-mission-brief"
        className="rounded-xl border border-[#232B3A] bg-[#141923] px-4 py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <div>
            <span className="text-slate-400">NDA 2027: </span>
            <span className="font-semibold text-[#D4AD5A] tabular-nums">
              {ndaCountdown.daysRemaining}d left
            </span>
            <span className="text-slate-400 tabular-nums"> · {ndaPct}% syllabus</span>
          </div>
          <div>
            <span className="text-slate-400">JEE Math: </span>
            <span
              className={`font-semibold tabular-nums ${
                jeeSummary.pendingBacklogItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {jeeSummary.pendingBacklogItems.length} backlog lecture(s)
            </span>
            <span className="text-slate-400 tabular-nums">
              {' '}
              · {jeeSummary.questionsSolvedThisWeek}/{jeeSummary.weeklyQuestionTarget} Qs
            </span>
          </div>
          <div className="text-slate-400">
            <span className="text-slate-300 font-medium">Blocks:</span> Library (Math) · Home (GAT/Eng)
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('personal')}
          className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-rose-500 whitespace-nowrap shrink-0 self-start lg:self-auto"
        >
          Open Personal OS
        </button>
      </section>

      {/* Quick Actions Bar */}
      <section
        aria-label="Quick actions"
        data-testid="quick-actions-bar"
        className="rounded-xl border border-[#232B3A] bg-[#141923] px-4 py-3.5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-baseline gap-3 shrink-0">
            <h2 className="font-display text-sm font-semibold text-slate-200">
              Quick Focus
            </h2>
            <span className="text-xs text-slate-400 tabular-nums">
              {activeSession ? (
                <>
                  {activeSession.sessionLabel} ·{' '}
                  <span className="font-mono text-slate-200">
                    {formatCountdownMillis(remainingMillis)}
                  </span>
                </>
              ) : (
                `${blockedPackagesCount} apps protected`
              )}
            </span>
          </div>

          <div
            data-testid="quick-actions-scroll"
            className="flex items-center gap-2.5 overflow-x-auto pb-0.5"
          >
            <button
              type="button"
              disabled={Boolean(activeSession)}
              data-testid="quick-action-15m"
              onClick={() => onStartQuickSession(15, '15m Sprint')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-100 transition-colors hover:border-rose-500 hover:bg-[#181F2C] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <Zap className="h-3.5 w-3.5 text-rose-400 shrink-0" aria-hidden="true" />
              <span>Start 15m Sprint</span>
            </button>

            <button
              type="button"
              disabled={Boolean(activeSession)}
              data-testid="quick-action-30m"
              onClick={() => onStartQuickSession(30, '30m Deep Work')}
              className="inline-flex items-center gap-2 rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-100 transition-colors hover:border-rose-500 hover:bg-[#181F2C] disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <Target className="h-3.5 w-3.5 text-[#D4AD5A] shrink-0" aria-hidden="true" />
              <span>Start 30m Deep Work</span>
            </button>

            <button
              type="button"
              disabled={Boolean(activeSession)}
              data-testid="quick-action-60m"
              onClick={() => onStartQuickSession(60, '60m Intensive Block')}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:opacity-45 disabled:cursor-not-allowed whitespace-nowrap shrink-0 min-h-[38px]"
            >
              <Shield className="h-3.5 w-3.5 text-rose-100 shrink-0" aria-hidden="true" />
              <span>Start 60m Intensive Block</span>
            </button>

            {activeSession && (
              <button
                type="button"
                data-testid="quick-action-stop"
                onClick={onStopOrOverrideSession}
                className="inline-flex items-center rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 min-h-[38px]"
              >
                {activeSession.isNuclearMode ? 'Emergency Override' : 'End Session'}
              </button>
            )}
          </div>
        </div>
      </section>

      <AnimatePresence>
        {batteryWarning && (
          <motion.aside
            key="battery-usage-warning"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            role="status"
            aria-label="Battery usage advisory"
            data-testid="battery-usage-warning"
            className={`rounded-xl border bg-[#141923] px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              batteryWarning.severity === 'elevated'
                ? 'border-amber-500/45'
                : 'border-amber-500/25'
            }`}
          >
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <BatteryWarning
                className="h-4 w-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="text-xs font-medium text-amber-200">
                  {batteryWarning.headline}
                </p>
                <p className="mt-0.5 text-xs text-slate-400 tabular-nums truncate">
                  {batteryWarning.detail}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onEnableEcoPolling}
              className="rounded-lg border border-amber-500/35 bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-amber-200 hover:border-amber-400 hover:text-amber-100 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto min-h-[36px]"
            >
              Switch to Eco Mode
            </button>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Focal Anchor Split: Discipline Score + Active Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <section
          aria-label="Discipline score"
          className="lg:col-span-7 rounded-xl border border-[#232B3A] bg-[#141923] p-6 flex flex-col justify-between"
        >
          <DisciplineGauge
            breakdown={breakdown}
            focusMinutesToday={state.focusMinutesToday}
            focusTargetMinutes={state.dailyFocusTargetMinutes}
            uiTheme={uiTheme}
          />
        </section>

        <section
          aria-label="Current active mission"
          className="lg:col-span-5 rounded-xl border border-[#232B3A] bg-[#141923] p-6 flex flex-col justify-between gap-5"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h2 className="font-display text-lg font-semibold tracking-tight text-slate-100">
                  Active Mission
                </h2>
                <span className="text-xs font-medium text-[#D4AD5A] tabular-nums">
                  {completedMissions} / {totalMissions} complete
                </span>
              </div>
              <button
                type="button"
                onClick={onToggleAudio}
                aria-label={audioEnabled ? 'Mute mission completion chime' : 'Enable mission completion chime'}
                data-testid="mission-audio-toggle"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3346] bg-[#0F131B] px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-slate-100 whitespace-nowrap shrink-0 min-h-[30px]"
              >
                {audioEnabled ? (
                  <Volume2 className="h-3.5 w-3.5 text-[#D4AD5A]" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                )}
                <span>{audioEnabled ? 'Chime On' : 'Muted'}</span>
              </button>
            </div>

            {activeMission && (
              <div>
                <p
                  data-testid="active-mission-title"
                  className="text-sm font-semibold text-slate-50 leading-snug"
                >
                  {activeMission.title}
                </p>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#232B3A]">
                  <div
                    className="h-full bg-rose-600 transition-all duration-200"
                    style={{ width: `${activeProgressPct}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-slate-400 tabular-nums">
                  <span>
                    {formatMinutesCompact(activeMission.completedMinutes)} elapsed
                  </span>
                  <span>
                    {formatMinutesCompact(activeMission.targetMinutes)} target ({activeProgressPct}%)
                  </span>
                </div>

                {!activeMission.isCompleted && (
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={onToggleMissionTimer}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[34px]"
                    >
                      {isMissionTimerRunning ? (
                        <Pause className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                      ) : (
                        <Play className="h-3.5 w-3.5 text-[#D4AD5A]" aria-hidden="true" />
                      )}
                      <span className="tabular-nums">
                        {isMissionTimerRunning ? (
                          <>
                            Running (<span className="font-mono">{String(missionElapsedSeconds).padStart(2, '0')}s</span>)
                          </>
                        ) : (
                          'Start Timer'
                        )}
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onAdvanceMission(15)}
                        className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-2.5 py-1.5 text-xs font-medium text-slate-300 tabular-nums hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 min-h-[34px]"
                      >
                        +15m
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onAdvanceMission(
                            Math.max(1, activeMission.targetMinutes - activeMission.completedMinutes)
                          )
                        }
                        className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 transition-colors whitespace-nowrap shrink-0 min-h-[34px]"
                      >
                        Hit Target
                      </button>
                    </div>
                  </div>
                )}

                <AnimatePresence>
                  {missionNotice && (
                    <motion.div
                      key="mission-chime-notice"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      role="status"
                      data-testid="mission-chime-notice"
                      className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-[#D4AD5A]/40 bg-[#0F131B] px-3 py-2 text-xs"
                    >
                      <span className="text-slate-200 truncate">
                        Target reached: <strong className="text-[#D4AD5A]">{missionNotice.missionTitle}</strong>
                        {missionNotice.soundPlayed
                          ? ' · Chime played'
                          : missionNotice.reason === 'muted'
                          ? ' · Muted'
                          : ''}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={onReplayChime}
                          className="text-xs font-medium text-[#D4AD5A] hover:underline whitespace-nowrap"
                        >
                          Replay
                        </button>
                        <button
                          type="button"
                          onClick={onDismissMissionNotice}
                          aria-label="Dismiss mission completion notice"
                          className="text-xs text-slate-400 hover:text-slate-200 whitespace-nowrap"
                        >
                          Dismiss
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="space-y-1.5 border-t border-[#1E2534] pt-3">
            <span className="block text-xs font-medium text-slate-400">Select Active Mission</span>
            <div className="grid grid-cols-1 gap-1.5">
              {state.missions.map((mission) => {
                const isSelected = mission.id === activeMission?.id;
                return (
                  <button
                    key={mission.id}
                    type="button"
                    onClick={() => onSelectMission(mission.id)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                      isSelected
                        ? 'border-rose-500/70 bg-[#181F2C] text-slate-50'
                        : 'border-transparent bg-[#0F131B] text-slate-400 hover:border-[#2A3346] hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate pr-3 font-medium">{mission.subject}</span>
                    <span className="font-medium shrink-0 tabular-nums">
                      {mission.isCompleted
                        ? 'Done'
                        : formatMinutesCompact(mission.targetMinutes)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* 4-Column Telemetry KPI Strip */}
      <section aria-label="Today's telemetry" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
          <p className="text-xs font-medium text-slate-400">Today&apos;s Focus</p>
          <p className="mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-50 tabular-nums">
            {formatMinutesCompact(state.focusMinutesToday)}
          </p>
          <p className="mt-1 text-xs text-slate-400 tabular-nums">
            Target {formatMinutesCompact(state.dailyFocusTargetMinutes)}
          </p>
        </div>

        <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
          <p className="text-xs font-medium text-slate-400">Daily Screen Time</p>
          <p
            data-testid="dashboard-screentime-value"
            className="mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-50 tabular-nums"
          >
            {usageAccessGranted ? formatMinutesCompact(state.screenTimeMinutesToday) : '--'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {usageAccessGranted ? (
              <span className="tabular-nums">
                Tracked today ·{' '}
                {state.screenTimeMinutesToday > 0
                  ? Math.round((state.distractingMinutesToday / state.screenTimeMinutesToday) * 100)
                  : 0}
                % distracting
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateTab('analytics')}
                className="text-rose-400 hover:text-rose-300 underline underline-offset-2"
              >
                Enable tracking in Analytics
              </button>
            )}
          </p>
        </div>

        <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
          <p className="text-xs font-medium text-slate-400">Distracting Usage</p>
          <p
            className={`mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight tabular-nums ${
              state.distractingMinutesToday > 15 ? 'text-rose-400' : 'text-slate-50'
            }`}
          >
            {formatMinutesCompact(state.distractingMinutesToday)}
          </p>
          <p className="mt-1 text-xs text-slate-400">15m daily grace allowance</p>
        </div>

        <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
          <p className="text-xs font-medium text-slate-400">Blocked Attempts</p>
          <p className="mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-50 tabular-nums">
            {state.blockedAttemptsToday}
          </p>
          <p className="mt-1 text-xs text-slate-400 tabular-nums">
            Missions {completedMissions}/{totalMissions} completed
          </p>
        </div>
      </section>

      {/* Dual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-6">
          <DisciplineTrendChart
            history={state.weeklyHistory}
            focusTargetMinutes={state.dailyFocusTargetMinutes}
            plannedMissionsCount={totalMissions}
            uiTheme={uiTheme}
          />
        </div>

        <div className="lg:col-span-6">
          <WeeklyFocusChart history={state.weeklyHistory} uiTheme={uiTheme} />
        </div>
      </div>

      {/* Weekly Discipline Heatmap */}
      <WeeklyDisciplineHeatmap
        history={state.weeklyHistory}
        focusTargetMinutes={state.dailyFocusTargetMinutes}
        uiTheme={uiTheme}
      />

      {/* Recent Completed Daily Missions */}
      <CompletedMissionsCard records={state.completedMissionHistory} />

      {/* Focus Status & Quick Navigation */}
      <section
        aria-label="Focus status and quick navigation"
        className="rounded-xl border border-[#232B3A] bg-[#141923] p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5"
      >
        <div className="space-y-1">
          <h3 className="font-display text-base font-semibold text-slate-100">
            Focus Status &amp; Controls
          </h3>
          <p className="text-xs leading-relaxed text-slate-400">
            Keep study sessions uninterrupted with scheduled blocking windows, automatic distraction protection, and local progress history.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs shrink-0">
          <div className="rounded-lg border border-[#1E2534] bg-[#0F131B] px-3.5 py-2.5">
            <span className="block text-slate-400">App Blocker</span>
            <span className="mt-1 block font-medium text-slate-100 tabular-nums">
              {blockedPackagesCount} apps blocked
            </span>
          </div>
          <div className="rounded-lg border border-[#1E2534] bg-[#0F131B] px-3.5 py-2.5">
            <span className="block text-slate-400">Protection Status</span>
            <span
              className={`mt-1 block font-medium ${
                activeSession?.isNuclearMode ? 'text-[#D4AD5A]' : 'text-emerald-400'
              }`}
            >
              {activeSession
                ? activeSession.isNuclearMode
                  ? 'Active · Strict Lock'
                  : batteryWarning
                    ? 'Active · High Draw'
                    : 'Active · Eco Mode'
                : 'Standby · Ready'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {activeSession && !batteryWarning && (
            <button
              type="button"
              onClick={onRestoreWatchdogPolling}
              className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
            >
              Standard Mode
            </button>
          )}
          <button
            type="button"
            onClick={() => onNavigateTab('missions')}
            className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            Missions &amp; Schedules
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('analytics')}
            className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            Usage Analytics
          </button>
          <button
            type="button"
            onClick={onOpenSettingsModal}
            className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            UI Settings
          </button>
        </div>
      </section>
    </div>
  );
};
