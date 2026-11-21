import React, { useMemo, useState } from 'react';
import { Clock, Play, Pause, Plus, Shield, Trash2, Pencil } from 'lucide-react';
import { MissionSummary, formatMinutesCompact } from '../utils/discipline';
import { SAMPLE_ANDROID_APPS } from '../utils/appSelection';
import { ActiveFocusSession, formatCountdownMillis } from '../utils/blockingEngine';
import {
  DailyBlockSchedule,
  DailyScheduleDraft,
  StudyMissionDraft,
  WEEKDAY_OPTIONS,
  WeekdayIso,
  evaluateSchedulesAt,
  formatDaysCompact,
  formatMinutesTo24h,
  formatNextTriggerForSchedule,
  validateMissionDraft,
  validateScheduleDraft,
} from '../utils/missionsScheduling';

interface MissionsViewProps {
  missions: MissionSummary[];
  activeMissionId: number;
  schedules: DailyBlockSchedule[];
  activeSession: ActiveFocusSession | null;
  remainingMillis: number;
  nowMs: number;
  isNuclearLocked: boolean;
  isMissionTimerRunning: boolean;
  missionElapsedSeconds: number;
  onCreateMission: (draft: StudyMissionDraft) => void;
  onUpdateMission: (missionId: number, draft: StudyMissionDraft) => void;
  onDeleteMission: (missionId: number) => void;
  onSelectActiveMission: (missionId: number) => void;
  onLaunchMissionStudyBlock: (mission: MissionSummary) => void;
  onToggleMissionTimer: () => void;
  onCreateSchedule: (draft: DailyScheduleDraft) => void;
  onToggleScheduleEnabled: (scheduleId: string) => void;
  onDeleteSchedule: (scheduleId: string) => void;
  onSimulateScheduleTrigger: (schedule: DailyBlockSchedule) => void;
}

const SELECTABLE_APPS = SAMPLE_ANDROID_APPS.filter((a) => !a.isProtectedSafetyApp);

export const MissionsView: React.FC<MissionsViewProps> = ({
  missions,
  activeMissionId,
  schedules,
  activeSession,
  remainingMillis,
  nowMs,
  isNuclearLocked,
  isMissionTimerRunning,
  missionElapsedSeconds,
  onCreateMission,
  onUpdateMission,
  onDeleteMission,
  onSelectActiveMission,
  onLaunchMissionStudyBlock,
  onToggleMissionTimer,
  onCreateSchedule,
  onToggleScheduleEnabled,
  onDeleteSchedule,
  onSimulateScheduleTrigger,
}) => {
  const [isMissionFormOpen, setIsMissionFormOpen] = useState(false);
  const [editingMissionId, setEditingMissionId] = useState<number | null>(null);
  const [missionTitle, setMissionTitle] = useState('');
  const [missionSubject, setMissionSubject] = useState('');
  const [missionTargetMinutes, setMissionTargetMinutes] = useState('60');
  const [missionLinkedPackages, setMissionLinkedPackages] = useState<string[]>([
    'com.zhiliaoapp.musically',
    'com.google.android.youtube',
  ]);
  const [missionErrors, setMissionErrors] = useState<string[]>([]);

  const [isScheduleFormOpen, setIsScheduleFormOpen] = useState(false);
  const [schedLabel, setSchedLabel] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('06:00');
  const [schedEndTime, setSchedEndTime] = useState('08:00');
  const [schedDays, setSchedDays] = useState<WeekdayIso[]>([1, 2, 3, 4, 5]);
  const [schedIsNuclear, setSchedIsNuclear] = useState(false);
  const [schedLinkedMissionId, setSchedLinkedMissionId] = useState<string>('');
  const [schedLinkedPackages, setSchedLinkedPackages] = useState<string[]>([
    'com.zhiliaoapp.musically',
    'com.google.android.youtube',
    'com.instagram.android',
  ]);
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);

  const [lastCheckFeedback, setLastCheckFeedback] = useState<string | null>(null);

  const appNameLookup = useMemo(() => {
    const map = new Map<string, string>();
    SAMPLE_ANDROID_APPS.forEach((app) => map.set(app.packageName, app.appName));
    return map;
  }, []);

  const roundedMinuteMs = Math.floor(nowMs / 60_000) * 60_000;
  const evalDate = useMemo(() => new Date(roundedMinuteMs), [roundedMinuteMs]);

  const scheduleEvaluation = useMemo(
    () => evaluateSchedulesAt(schedules, evalDate),
    [schedules, evalDate]
  );

  const openNewMissionForm = () => {
    setEditingMissionId(null);
    setMissionTitle('');
    setMissionSubject('');
    setMissionTargetMinutes('90');
    setMissionLinkedPackages(['com.zhiliaoapp.musically', 'com.google.android.youtube']);
    setMissionErrors([]);
    setIsMissionFormOpen(true);
  };

  const openEditMissionForm = (mission: MissionSummary) => {
    setEditingMissionId(mission.id);
    setMissionTitle(mission.title);
    setMissionSubject(mission.subject);
    setMissionTargetMinutes(String(mission.targetMinutes));
    setMissionLinkedPackages(mission.linkedPackages ?? []);
    setMissionErrors([]);
    setIsMissionFormOpen(true);
  };

  const handleToggleMissionPkg = (pkg: string) => {
    setMissionLinkedPackages((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    );
  };

  const handleSubmitMission = (e: React.FormEvent) => {
    e.preventDefault();
    const draft: StudyMissionDraft = {
      title: missionTitle,
      subject: missionSubject,
      targetMinutes: Number(missionTargetMinutes),
      linkedPackages: missionLinkedPackages,
    };
    const validation = validateMissionDraft(draft);
    if (!validation.valid) {
      setMissionErrors(validation.errors);
      return;
    }
    if (editingMissionId === null) {
      onCreateMission(draft);
    } else {
      onUpdateMission(editingMissionId, draft);
    }
    setIsMissionFormOpen(false);
    setMissionErrors([]);
  };

  const handleToggleSchedDay = (iso: WeekdayIso) => {
    setSchedDays((prev) =>
      prev.includes(iso) ? prev.filter((d) => d !== iso) : [...prev, iso].sort((a, b) => a - b)
    );
  };

  const handleToggleSchedPkg = (pkg: string) => {
    setSchedLinkedPackages((prev) =>
      prev.includes(pkg) ? prev.filter((p) => p !== pkg) : [...prev, pkg]
    );
  };

  const handleSubmitSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const draft: DailyScheduleDraft = {
      label: schedLabel,
      startTime: schedStartTime,
      endTime: schedEndTime,
      daysOfWeek: schedDays,
      isNuclearMode: schedIsNuclear,
      linkedMissionId: schedLinkedMissionId ? Number(schedLinkedMissionId) : null,
      linkedPackages: schedLinkedPackages,
    };
    const validation = validateScheduleDraft(draft);
    if (!validation.valid) {
      setScheduleErrors(validation.errors);
      return;
    }
    onCreateSchedule(draft);
    setIsScheduleFormOpen(false);
    setSchedLabel('');
    setScheduleErrors([]);
  };

  const handleCheckSchedulesNow = () => {
    const evalNow = evaluateSchedulesAt(schedules, new Date());
    if (evalNow.activeSchedule) {
      onSimulateScheduleTrigger(evalNow.activeSchedule);
      setLastCheckFeedback(
        `Schedule active: "${evalNow.activeSchedule.label}" — focus block started.`
      );
    } else {
      setLastCheckFeedback(
        evalNow.nextUpcomingLabel
          ? `Schedule check complete · ${evalNow.nextUpcomingLabel}.`
          : 'Schedule check complete · No enabled daily schedules.'
      );
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1E2534] pb-5">
        <div>
          <h1 className="font-display text-3xl sm:text-[34px] font-bold tracking-tight text-slate-50 text-balance">
            Missions &amp; Schedules
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Custom study goals, mission-linked app blocking, and daily focus schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="font-medium text-slate-300 tabular-nums">
            {activeSession ? (
              <>
                {activeSession.sessionLabel} ·{' '}
                <span className="font-mono">{formatCountdownMillis(remainingMillis)}</span>
              </>
            ) : (
              scheduleEvaluation.nextUpcomingLabel ?? 'No active window'
            )}
          </span>
          <button
            type="button"
            data-testid="watchdog-check-btn"
            onClick={handleCheckSchedulesNow}
            className="rounded-lg border border-[#232B3A] bg-[#141923] px-3.5 py-2 font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
          >
            Check Active Schedules
          </button>
        </div>
      </header>

      {lastCheckFeedback && (
        <div
          role="status"
          className="rounded-xl border border-[#232B3A] bg-[#141923] px-4 py-2.5 text-xs font-medium text-[#D4AD5A]"
        >
          {lastCheckFeedback}
        </div>
      )}

      {isNuclearLocked && (
        <div
          role="status"
          className="rounded-xl border border-[#D4AD5A]/40 bg-[#141923] px-4 py-3 text-xs text-slate-200 leading-relaxed"
        >
          <span className="font-semibold text-[#D4AD5A]">Strict Lock Active:</span> Starting a
          study mission tracks your study countdown while keeping your current app blocklist locked until the timer ends.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Study Missions CRUD Column */}
        <section
          aria-label="Study missions"
          className="lg:col-span-7 rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-4"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-slate-100">
                Study Missions ({missions.length})
              </h2>
              <button
                type="button"
                data-testid="new-mission-button"
                onClick={openNewMissionForm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-600 whitespace-nowrap shrink-0 min-h-[38px]"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                <span>New Mission</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Each mission can automatically block distracting apps while you study.
            </p>
          </div>

          {isMissionFormOpen && (
            <form
              onSubmit={handleSubmitMission}
              data-testid="mission-editor-form"
              className="rounded-xl border border-[#2A3346] bg-[#0F131B] p-4 space-y-4"
            >
              <h3 className="font-display text-sm font-semibold text-slate-100">
                {editingMissionId === null ? 'Create Study Mission' : 'Edit Study Mission'}
              </h3>

              {missionErrors.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300 space-y-0.5"
                >
                  {missionErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label htmlFor="mission-title-input" className="block text-xs font-medium text-slate-300 mb-1">
                    Mission Title
                  </label>
                  <input
                    id="mission-title-input"
                    type="text"
                    value={missionTitle}
                    onChange={(e) => setMissionTitle(e.target.value)}
                    placeholder="e.g. Physics — Electromagnetism Drills"
                    className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="mission-subject-input" className="block text-xs font-medium text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    id="mission-subject-input"
                    type="text"
                    value={missionSubject}
                    onChange={(e) => setMissionSubject(e.target.value)}
                    placeholder="e.g. Physics"
                    className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label htmlFor="mission-target-input" className="block text-xs font-medium text-slate-300 mb-1">
                    Target Minutes (15–480)
                  </label>
                  <input
                    id="mission-target-input"
                    type="number"
                    min={15}
                    max={480}
                    value={missionTargetMinutes}
                    onChange={(e) => setMissionTargetMinutes(e.target.value)}
                    className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 tabular-nums focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-300 mb-2">
                  Apps to Block During This Mission
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SELECTABLE_APPS.slice(0, 6).map((app) => {
                    const checked = missionLinkedPackages.includes(app.packageName);
                    return (
                      <label
                        key={app.packageName}
                        className="flex items-center gap-2 rounded-lg border border-[#232B3A] bg-[#141923] px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleToggleMissionPkg(app.packageName)}
                          className="accent-rose-600"
                        />
                        <span className="truncate">{app.appName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsMissionFormOpen(false)}
                  className="rounded-lg border border-[#232B3A] bg-[#141923] px-3.5 py-2 text-xs text-slate-300 hover:border-slate-500 min-h-[38px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-mission-submit"
                  className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 min-h-[38px]"
                >
                  Save Mission
                </button>
              </div>
            </form>
          )}

          {missions.length === 0 ? (
            <div className="rounded-xl border border-[#232B3A] bg-[#0F131B] p-8 text-center space-y-3">
              <p className="text-sm text-slate-300">No study missions configured yet.</p>
              <button
                type="button"
                onClick={openNewMissionForm}
                className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600"
              >
                Create First Mission
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#1E2534]" data-testid="missions-crud-list">
              {missions.map((mission) => {
                const isSelected = mission.id === activeMissionId;
                const pct = Math.min(
                  100,
                  Math.round((mission.completedMinutes / Math.max(1, mission.targetMinutes)) * 100)
                );
                const linkedNames = (mission.linkedPackages ?? [])
                  .map((pkg) => appNameLookup.get(pkg) ?? pkg.split('.').pop() ?? pkg)
                  .join(', ');

                return (
                  <div key={mission.id} className="py-4 first:pt-1 last:pb-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-sm font-semibold text-slate-100">{mission.title}</h3>
                          <span
                            className={`text-xs font-medium ${
                              mission.isCompleted
                                ? 'text-emerald-400'
                                : isSelected
                                ? 'text-[#D4AD5A]'
                                : 'text-slate-400'
                            }`}
                          >
                            {mission.isCompleted
                              ? 'Completed'
                              : isSelected
                              ? isMissionTimerRunning
                                ? `Active · ${String(missionElapsedSeconds).padStart(2, '0')}s/60s`
                                : 'Active Mission'
                              : 'Standby'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-400 tabular-nums leading-relaxed">
                          {mission.subject} · {formatMinutesCompact(mission.completedMinutes)} /{' '}
                          {formatMinutesCompact(mission.targetMinutes)} ({pct}%)
                          {linkedNames ? ` · Blocked: ${linkedNames}` : ' · Standard Blocker'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isSelected && (
                          <button
                            type="button"
                            onClick={() => onSelectActiveMission(mission.id)}
                            className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 whitespace-nowrap"
                          >
                            Set Active
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Edit ${mission.title}`}
                          onClick={() => openEditMissionForm(mission)}
                          className="rounded-lg border border-[#232B3A] bg-[#0F131B] p-1.5 text-slate-400 hover:text-slate-100"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${mission.title}`}
                          onClick={() => onDeleteMission(mission.id)}
                          className="rounded-lg border border-[#232B3A] bg-[#0F131B] p-1.5 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="h-1.5 w-full rounded-full bg-[#232B3A] overflow-hidden">
                      <div
                        className={`h-full transition-all duration-200 ${
                          mission.isCompleted ? 'bg-emerald-500' : 'bg-rose-600'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button
                        type="button"
                        data-testid={`launch-mission-${mission.id}`}
                        onClick={() => onLaunchMissionStudyBlock(mission)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 min-h-[36px] transition-colors ${
                          isSelected
                            ? 'bg-rose-700 text-white hover:bg-rose-600'
                            : 'border border-[#2A3346] bg-[#0F131B] text-slate-200 hover:border-rose-500 hover:text-white'
                        }`}
                      >
                        <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Start Study Block</span>
                      </button>

                      {isSelected && !mission.isCompleted && (
                        <button
                          type="button"
                          onClick={onToggleMissionTimer}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[36px]"
                        >
                          {isMissionTimerRunning ? (
                            <>
                              <Pause className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                              <span>Pause Countdown</span>
                            </>
                          ) : (
                            <>
                              <Play className="h-3.5 w-3.5 text-[#D4AD5A]" aria-hidden="true" />
                              <span>Resume Countdown</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recurring Daily Block Schedules Column */}
        <section
          aria-label="Daily block schedules"
          className="lg:col-span-5 rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-4"
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-slate-100">
                Daily Schedules ({schedules.length})
              </h2>
              <button
                type="button"
                data-testid="new-schedule-button"
                onClick={() => {
                  setScheduleErrors([]);
                  setIsScheduleFormOpen((prev) => !prev);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3.5 py-2 text-xs font-medium text-slate-100 hover:border-rose-500 whitespace-nowrap shrink-0 min-h-[38px]"
              >
                <Clock className="h-3.5 w-3.5 text-[#D4AD5A]" aria-hidden="true" />
                <span>New Schedule</span>
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Recurring daily focus &amp; blocking windows.
            </p>
          </div>

          {isScheduleFormOpen && (
            <form
              onSubmit={handleSubmitSchedule}
              data-testid="schedule-editor-form"
              className="rounded-xl border border-[#2A3346] bg-[#0F131B] p-4 space-y-4"
            >
              <h3 className="font-display text-sm font-semibold text-slate-100">
                New Recurring Window
              </h3>

              {scheduleErrors.length > 0 && (
                <div
                  role="alert"
                  className="rounded-lg border border-rose-500/50 bg-rose-950/30 px-3 py-2 text-xs text-rose-300 space-y-0.5"
                >
                  {scheduleErrors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}

              <div>
                <label htmlFor="schedule-label-input" className="block text-xs font-medium text-slate-300 mb-1">
                  Schedule Label
                </label>
                <input
                  id="schedule-label-input"
                  type="text"
                  value={schedLabel}
                  onChange={(e) => setSchedLabel(e.target.value)}
                  placeholder="e.g. Morning Deep Study"
                  className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="schedule-start-input" className="block text-xs font-medium text-slate-300 mb-1">
                    Start Time
                  </label>
                  <input
                    id="schedule-start-input"
                    type="time"
                    value={schedStartTime}
                    onChange={(e) => setSchedStartTime(e.target.value)}
                    className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 tabular-nums focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="schedule-end-input" className="block text-xs font-medium text-slate-300 mb-1">
                    End Time
                  </label>
                  <input
                    id="schedule-end-input"
                    type="time"
                    value={schedEndTime}
                    onChange={(e) => setSchedEndTime(e.target.value)}
                    className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 tabular-nums focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-300 mb-1.5">Active Weekdays</p>
                <div className="flex flex-wrap gap-1.5">
                  {WEEKDAY_OPTIONS.map((opt) => {
                    const selected = schedDays.includes(opt.iso);
                    return (
                      <button
                        key={opt.iso}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => handleToggleSchedDay(opt.iso)}
                        className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors ${
                          selected
                            ? 'border-rose-600 bg-rose-700 text-white'
                            : 'border-[#232B3A] bg-[#141923] text-slate-400 hover:text-slate-100'
                        }`}
                      >
                        {opt.shortLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="schedule-mission-select" className="block text-xs font-medium text-slate-300 mb-1">
                  Linked Study Mission (optional)
                </label>
                <select
                  id="schedule-mission-select"
                  value={schedLinkedMissionId}
                  onChange={(e) => setSchedLinkedMissionId(e.target.value)}
                  className="w-full rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
                >
                  <option value="">None (App Blocker Only)</option>
                  {missions.map((m) => (
                    <option key={m.id} value={String(m.id)}>
                      {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-xs font-medium text-slate-300 mb-1.5">Apps Blocked by Schedule</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {SELECTABLE_APPS.slice(0, 4).map((app) => (
                    <label
                      key={app.packageName}
                      className="flex items-center gap-2 rounded-lg border border-[#232B3A] bg-[#141923] px-2.5 py-1.5 text-xs text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={schedLinkedPackages.includes(app.packageName)}
                        onChange={() => handleToggleSchedPkg(app.packageName)}
                        className="accent-rose-600"
                      />
                      <span className="truncate">{app.appName}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedIsNuclear}
                  onChange={(e) => setSchedIsNuclear(e.target.checked)}
                  className="accent-[#D4AD5A]"
                />
                <span>Enable Strict Lock automatically during this window</span>
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsScheduleFormOpen(false)}
                  className="rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-1.5 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="save-schedule-submit"
                  className="rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          )}

          {schedules.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No daily schedules saved.
            </p>
          ) : (
            <div className="divide-y divide-[#1E2534]" data-testid="schedules-list">
              {schedules.map((sched) => {
                const isActiveNow = scheduleEvaluation.activeSchedule?.id === sched.id;
                const nextLabel = formatNextTriggerForSchedule(sched, evalDate);
                return (
                  <div key={sched.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-baseline gap-2">
                          <h3 className="text-sm font-medium text-slate-100">{sched.label}</h3>
                          {sched.isNuclearMode && (
                            <span className="text-xs font-medium text-[#D4AD5A]">
                              Strict Lock
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
                          {formatMinutesTo24h(sched.startMinutesFromMidnight)}–
                          {formatMinutesTo24h(sched.endMinutesFromMidnight)} ·{' '}
                          {formatDaysCompact(sched.daysOfWeek)}
                        </p>
                        <p
                          className={`mt-0.5 text-xs tabular-nums ${
                            isActiveNow ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        >
                          {sched.isEnabled ? nextLabel ?? 'Enabled' : 'Paused'}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={sched.isEnabled}
                          aria-label={`Toggle ${sched.label}`}
                          onClick={() => onToggleScheduleEnabled(sched.id)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                            sched.isEnabled
                              ? 'border-emerald-700/60 bg-emerald-950/40 text-emerald-400'
                              : 'border-[#232B3A] bg-[#0F131B] text-slate-400'
                          }`}
                        >
                          {sched.isEnabled ? 'Enabled' : 'Paused'}
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete schedule ${sched.label}`}
                          onClick={() => onDeleteSchedule(sched.id)}
                          className="rounded-lg border border-[#232B3A] bg-[#0F131B] p-1.5 text-slate-400 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="tabular-nums">
                        {sched.linkedPackages.length} linked apps
                      </span>
                      <button
                        type="button"
                        aria-label={`Test trigger ${sched.label}`}
                        onClick={() => onSimulateScheduleTrigger(sched)}
                        className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-2.5 py-1 text-xs font-medium text-slate-300 hover:border-rose-500 hover:text-white whitespace-nowrap"
                      >
                        Start Window Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <p className="border-t border-[#1E2534] pt-3 text-xs leading-relaxed text-slate-400">
            Schedules activate automatically at your chosen times and stay synced even after device restarts.
          </p>
        </section>
      </div>
    </div>
  );
};
