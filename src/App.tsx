import { useState, useEffect, useRef } from 'react';
import { MotionConfig } from 'motion/react';
import { TopBar, ActiveTab } from './components/TopBar';
import { DashboardView } from './components/DashboardView';
import { MissionsView } from './components/MissionsView';
import { AppSelectionView } from './components/AppSelectionView';
import { AnalyticsView } from './components/AnalyticsView';
import { FocusTargetModal } from './components/FocusTargetModal';
import { UiSettingsModal } from './components/UiSettingsModal';
import { BlockingShieldOverlay } from './components/BlockingShieldOverlay';
import { EmergencyOverrideModal } from './components/EmergencyOverrideModal';
import { PersonalOsView } from './components/PersonalOsView';
import {
  MentorMessage,
  PersonalizationState,
  getDefaultPersonalizationState,
  loadMentorMessages,
  loadPersonalizationState,
  saveMentorMessages,
  savePersonalizationState,
} from './utils/personalization';
import {
  UiThemeId,
  applyThemeToDocument,
  getUiThemeDefinition,
  loadUiTheme,
  saveUiTheme,
} from './utils/themeSettings';
import {
  CommandCenterState,
  MissionSummary,
  WeeklyFocusDay,
  advanceMissionProgress,
  loadCommandState,
  saveCommandState,
} from './utils/discipline';
import {
  AppUsageRecord,
  computeUsageAnalyticsSummary,
  computeWeeklyTrendSummary,
  getDefaultAppUsageRecords,
  loadAppUsageRecords,
  loadUsageAccessGranted,
  saveAppUsageRecords,
  saveUsageAccessGranted,
  simulateAppUsageMinutes,
  syncUsageStatsIntoCommandState,
} from './utils/usageAnalytics';
import {
  DailyBlockSchedule,
  DailyScheduleDraft,
  StudyMissionDraft,
  createStudyMission,
  deleteStudyMission,
  loadDailySchedules,
  parse24hToMinutes,
  resolveEffectiveBlocklist,
  saveDailySchedules,
  updateStudyMission,
} from './utils/missionsScheduling';
import {
  loadAudioFeedbackEnabled,
  playMissionCompleteChime,
  saveAudioFeedbackEnabled,
} from './utils/audioFeedback';
import {
  isProtectedSafetyPackage,
  loadBlocklistPackages,
  saveBlocklistPackages,
} from './utils/appSelection';
import {
  ActiveFocusSession,
  BackgroundPowerTask,
  BlockedAttemptEntry,
  EmergencyOverrideEntry,
  canModifySessionSettings,
  evaluateBatteryUsageWarning,
  evaluateBlockingDecision,
  getRemainingMillis,
  isNuclearLockActive,
  isSessionExpired,
  loadActiveSession,
  loadBackgroundPowerTasks,
  loadBlockedAttempts,
  loadEmergencyOverrides,
  saveActiveSession,
  saveBackgroundPowerTasks,
  saveBlockedAttempts,
  saveEmergencyOverrides,
} from './utils/blockingEngine';

const NDA_BACKDROP_SRC = '/src/assets/images/nda_khadakwasla_backdrop_1795192544881.jpg';

function syncTodayMissionsCompleted(
  weeklyHistory: WeeklyFocusDay[],
  missions: MissionSummary[]
): WeeklyFocusDay[] {
  const completedCount = missions.filter((m) => m.isCompleted).length;
  return weeklyHistory.map((day, idx) =>
    idx === weeklyHistory.length - 1 ? { ...day, missionsCompleted: completedCount } : day
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [appUsageRecords, setAppUsageRecords] = useState<AppUsageRecord[]>(() =>
    loadAppUsageRecords()
  );
  const [usageAccessGranted, setUsageAccessGranted] = useState<boolean>(() =>
    loadUsageAccessGranted()
  );
  const [analyticsRangeDays, setAnalyticsRangeDays] = useState<1 | 7>(1);
  const [state, setState] = useState<CommandCenterState>(() =>
    syncUsageStatsIntoCommandState(
      loadCommandState(),
      loadAppUsageRecords(),
      loadUsageAccessGranted()
    )
  );
  const [blockedPackages, setBlockedPackages] = useState<string[]>(() => loadBlocklistPackages());
  const [activeSession, setActiveSession] = useState<ActiveFocusSession | null>(() => loadActiveSession());
  const [recentAttempts, setRecentAttempts] = useState<BlockedAttemptEntry[]>(() => loadBlockedAttempts());
  const [emergencyOverrides, setEmergencyOverrides] = useState<EmergencyOverrideEntry[]>(() =>
    loadEmergencyOverrides()
  );
  const [backgroundPowerTasks, setBackgroundPowerTasks] = useState<BackgroundPowerTask[]>(() =>
    loadBackgroundPowerTasks()
  );
  const [schedules, setSchedules] = useState<DailyBlockSchedule[]>(() => loadDailySchedules());
  const [batteryStatus, setBatteryStatus] = useState<{
    levelPct: number | null;
    charging: boolean | null;
  }>({ levelPct: null, charging: null });
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [uiTheme, setUiTheme] = useState<UiThemeId>(() => {
    const initial = loadUiTheme();
    applyThemeToDocument(initial);
    return initial;
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isEmergencyOverrideOpen, setIsEmergencyOverrideOpen] = useState(false);
  const [backdropFailed, setBackdropFailed] = useState(false);
  const [personalization, setPersonalization] = useState<PersonalizationState>(() =>
    loadPersonalizationState()
  );
  const [mentorMessages, setMentorMessages] = useState<MentorMessage[]>(() =>
    loadMentorMessages()
  );
  const [shieldOverlayApp, setShieldOverlayApp] = useState<{
    appName: string;
    packageName: string;
    sessionLabel: string;
    isNuclearMode?: boolean;
  } | null>(null);
  const [lastAllowedFeedback, setLastAllowedFeedback] = useState<string | null>(null);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(() => loadAudioFeedbackEnabled());
  const [isMissionTimerRunning, setIsMissionTimerRunning] = useState(false);
  const [missionElapsedSeconds, setMissionElapsedSeconds] = useState(0);
  const [missionNotice, setMissionNotice] = useState<{
    missionTitle: string;
    soundPlayed: boolean;
    reason: 'played' | 'muted' | 'unsupported';
  } | null>(null);

  const lastBlockedRef = useRef<{ pkg: string | null; at: number }>({ pkg: null, at: 0 });

  useEffect(() => {
    saveCommandState(state);
  }, [state]);

  useEffect(() => {
    saveBlocklistPackages(blockedPackages);
  }, [blockedPackages]);

  useEffect(() => {
    saveActiveSession(activeSession);
  }, [activeSession]);

  useEffect(() => {
    saveBlockedAttempts(recentAttempts);
  }, [recentAttempts]);

  useEffect(() => {
    saveEmergencyOverrides(emergencyOverrides);
  }, [emergencyOverrides]);

  useEffect(() => {
    saveBackgroundPowerTasks(backgroundPowerTasks);
  }, [backgroundPowerTasks]);

  useEffect(() => {
    saveDailySchedules(schedules);
  }, [schedules]);

  useEffect(() => {
    saveAudioFeedbackEnabled(audioEnabled);
  }, [audioEnabled]);

  useEffect(() => {
    saveAppUsageRecords(appUsageRecords);
  }, [appUsageRecords]);

  useEffect(() => {
    saveUsageAccessGranted(usageAccessGranted);
  }, [usageAccessGranted]);

  useEffect(() => {
    saveUiTheme(uiTheme);
    applyThemeToDocument(uiTheme);
  }, [uiTheme]);

  useEffect(() => {
    savePersonalizationState(personalization);
  }, [personalization]);

  useEffect(() => {
    saveMentorMessages(mentorMessages);
  }, [mentorMessages]);

  useEffect(() => {
    setState((prev) =>
      syncUsageStatsIntoCommandState(prev, appUsageRecords, usageAccessGranted)
    );
  }, [appUsageRecords, usageAccessGranted]);

  useEffect(() => {
    type BatteryManagerLike = {
      level: number;
      charging: boolean;
      addEventListener?: (type: string, listener: () => void) => void;
      removeEventListener?: (type: string, listener: () => void) => void;
    };
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<BatteryManagerLike>;
    };
    if (typeof nav.getBattery !== 'function') return;

    let mounted = true;
    let manager: BatteryManagerLike | null = null;
    const syncBattery = () => {
      if (!mounted || !manager) return;
      setBatteryStatus({
        levelPct: Math.round(manager.level * 100),
        charging: Boolean(manager.charging),
      });
    };

    nav
      .getBattery()
      .then((bat) => {
        if (!mounted) return;
        manager = bat;
        syncBattery();
        bat.addEventListener?.('levelchange', syncBattery);
        bat.addEventListener?.('chargingchange', syncBattery);
      })
      .catch(() => {
        // Battery API unavailable or restricted
      });

    return () => {
      mounted = false;
      manager?.removeEventListener?.('levelchange', syncBattery);
      manager?.removeEventListener?.('chargingchange', syncBattery);
    };
  }, []);

  // Live 1s countdown ticker during active sessions + 15s clock refresh when idle for schedules
  useEffect(() => {
    if (!activeSession || !activeSession.isActive) {
      const idleTimer = window.setInterval(() => {
        setNowMs(Date.now());
      }, 15_000);
      return () => window.clearInterval(idleTimer);
    }
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNowMs(current);
      if (isSessionExpired(activeSession, current)) {
        setActiveSession(null);
        setShieldOverlayApp(null);
        setIsMissionTimerRunning(false);
        setMissionElapsedSeconds(0);
        setLastAllowedFeedback('Focus session completed — restricted apps automatically restored.');
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession]);

  const stateRef = useRef(state);
  stateRef.current = state;
  const audioEnabledRef = useRef(audioEnabled);
  audioEnabledRef.current = audioEnabled;

  const triggerMissionProgress = (missionId: number, deltaMinutes: number) => {
    const { nextState, newlyCompletedMission } = advanceMissionProgress(
      stateRef.current,
      missionId,
      deltaMinutes
    );
    stateRef.current = nextState;
    setState(nextState);
    if (newlyCompletedMission) {
      const result = playMissionCompleteChime(audioEnabledRef.current);
      setIsMissionTimerRunning(false);
      setMissionElapsedSeconds(0);
      setMissionNotice({
        missionTitle: newlyCompletedMission.subject,
        soundPlayed: result.played,
        reason: result.reason,
      });
    }
  };

  // Live 1-second active mission study timer -> logs +1m every 60s and triggers chime at target
  useEffect(() => {
    if (!isMissionTimerRunning) return;
    const activeMission =
      state.missions.find((m) => m.id === state.activeMissionId) ?? state.missions[0];
    if (!activeMission || activeMission.isCompleted) {
      setIsMissionTimerRunning(false);
      return;
    }

    const timer = window.setInterval(() => {
      setMissionElapsedSeconds((prevSec) => prevSec + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isMissionTimerRunning, state.activeMissionId, state.missions]);

  useEffect(() => {
    if (isMissionTimerRunning && missionElapsedSeconds >= 60) {
      setMissionElapsedSeconds(0);
      triggerMissionProgress(stateRef.current.activeMissionId, 1);
    }
  }, [isMissionTimerRunning, missionElapsedSeconds]);

  const handleSelectMission = (missionId: number) => {
    setIsMissionTimerRunning(false);
    setMissionElapsedSeconds(0);
    setState((prev) => ({
      ...prev,
      activeMissionId: missionId,
    }));
  };

  const handleAdvanceActiveMission = (deltaMinutes: number) => {
    triggerMissionProgress(state.activeMissionId, deltaMinutes);
  };

  const handleReplayChime = () => {
    const result = playMissionCompleteChime(true);
    setMissionNotice((prev) =>
      prev ? { ...prev, soundPlayed: result.played, reason: result.reason } : null
    );
  };

  const handleSaveTarget = (minutes: number) => {
    setState((prev) => ({
      ...prev,
      dailyFocusTargetMinutes: minutes,
    }));
  };

  const handleToggleBlockedPackage = (packageName: string) => {
    if (isProtectedSafetyPackage(packageName)) return;
    if (!canModifySessionSettings(activeSession, Date.now())) return;
    setBlockedPackages((prev) =>
      prev.includes(packageName)
        ? prev.filter((pkg) => pkg !== packageName)
        : [...prev, packageName]
    );
  };

  const handleSetBlockedPackages = (packages: string[]) => {
    if (!canModifySessionSettings(activeSession, Date.now())) return;
    setBlockedPackages(packages.filter((pkg) => !isProtectedSafetyPackage(pkg)));
  };

  const handleStartSession = (
    durationMinutes: number,
    isNuclearMode = false,
    customLabel?: string
  ) => {
    if (!canModifySessionSettings(activeSession, Date.now())) {
      setIsEmergencyOverrideOpen(true);
      return;
    }
    const startedAt = Date.now();
    const session: ActiveFocusSession = {
      isActive: true,
      sessionLabel:
        customLabel ?? (isNuclearMode ? 'Nuclear Discipline Lock' : 'Strict Focus Session'),
      startedAtEpochMs: startedAt,
      endsAtEpochMs: startedAt + durationMinutes * 60_000,
      durationMinutes,
      isNuclearMode,
    };
    setNowMs(startedAt);
    setActiveSession(session);
    setLastAllowedFeedback(null);
  };

  const handleStartQuickSession = (durationMinutes: number, sessionLabel: string) => {
    handleStartSession(durationMinutes, false, sessionLabel);
    const activeMission =
      stateRef.current.missions.find((m) => m.id === stateRef.current.activeMissionId) ??
      stateRef.current.missions[0];
    setMissionElapsedSeconds(0);
    setIsMissionTimerRunning(Boolean(activeMission && !activeMission.isCompleted));
  };

  const handleCreateMission = (draft: StudyMissionDraft) => {
    setState((prev) => {
      const { missions, created } = createStudyMission(prev.missions, draft);
      return {
        ...prev,
        activeMissionId: prev.missions.length === 0 ? created.id : prev.activeMissionId,
        missions,
        weeklyHistory: syncTodayMissionsCompleted(prev.weeklyHistory, missions),
      };
    });
  };

  const handleUpdateMission = (missionId: number, draft: StudyMissionDraft) => {
    setState((prev) => {
      const nextMissions = updateStudyMission(prev.missions, missionId, draft);
      return {
        ...prev,
        missions: nextMissions,
        weeklyHistory: syncTodayMissionsCompleted(prev.weeklyHistory, nextMissions),
      };
    });
  };

  const handleDeleteMission = (missionId: number) => {
    if (missionId === state.activeMissionId) {
      setIsMissionTimerRunning(false);
      setMissionElapsedSeconds(0);
    }
    setState((prev) => {
      const { missions, nextActiveMissionId } = deleteStudyMission(
        prev.missions,
        missionId,
        prev.activeMissionId
      );
      return {
        ...prev,
        missions,
        activeMissionId: nextActiveMissionId,
        weeklyHistory: syncTodayMissionsCompleted(prev.weeklyHistory, missions),
      };
    });
  };

  const handleLaunchMissionStudyBlock = (mission: MissionSummary) => {
    const now = Date.now();
    const locked = isNuclearLockActive(activeSession, now);
    setState((prev) => ({
      ...prev,
      activeMissionId: mission.id,
    }));
    setMissionElapsedSeconds(0);
    setIsMissionTimerRunning(!mission.isCompleted);

    if (!locked) {
      setBlockedPackages((prev) =>
        resolveEffectiveBlocklist({
          baseBlockedPackages: prev,
          missionLinkedPackages: mission.linkedPackages,
          isNuclearLockActive: false,
        })
      );
      const remainingTarget = Math.max(15, mission.targetMinutes - mission.completedMinutes);
      handleStartSession(Math.min(120, remainingTarget), false, `${mission.subject} Study Block`);
    }
  };

  const handleCreateSchedule = (draft: DailyScheduleDraft) => {
    const startMin = parse24hToMinutes(draft.startTime);
    const endMin = parse24hToMinutes(draft.endTime);
    if (startMin === null || endMin === null) return;
    const newSchedule: DailyBlockSchedule = {
      id: `sched-${Date.now()}`,
      label: draft.label.trim(),
      startMinutesFromMidnight: startMin,
      endMinutesFromMidnight: endMin,
      daysOfWeek: [...draft.daysOfWeek].sort((a, b) => a - b),
      isEnabled: true,
      isNuclearMode: draft.isNuclearMode,
      linkedMissionId: draft.linkedMissionId,
      linkedPackages: [...draft.linkedPackages],
    };
    setSchedules((prev) => [...prev, newSchedule]);
  };

  const handleToggleScheduleEnabled = (scheduleId: string) => {
    setSchedules((prev) =>
      prev.map((sched) =>
        sched.id === scheduleId ? { ...sched, isEnabled: !sched.isEnabled } : sched
      )
    );
  };

  const handleDeleteSchedule = (scheduleId: string) => {
    setSchedules((prev) => prev.filter((sched) => sched.id !== scheduleId));
  };

  const handleSimulateScheduleTrigger = (schedule: DailyBlockSchedule) => {
    const now = Date.now();
    const locked = isNuclearLockActive(activeSession, now);
    if (locked) {
      setIsEmergencyOverrideOpen(true);
      return;
    }

    setBlockedPackages((prev) =>
      resolveEffectiveBlocklist({
        baseBlockedPackages: prev,
        missionLinkedPackages: schedule.linkedPackages,
        isNuclearLockActive: false,
      })
    );

    const rawSpan =
      schedule.endMinutesFromMidnight > schedule.startMinutesFromMidnight
        ? schedule.endMinutesFromMidnight - schedule.startMinutesFromMidnight
        : 1440 - schedule.startMinutesFromMidnight + schedule.endMinutesFromMidnight;
    const durationMinutes = Math.min(480, Math.max(15, rawSpan));

    handleStartSession(durationMinutes, schedule.isNuclearMode, schedule.label);
    setMissionElapsedSeconds(0);

    if (schedule.linkedMissionId !== null) {
      const targetMission = state.missions.find((m) => m.id === schedule.linkedMissionId);
      if (targetMission) {
        setState((prev) => ({
          ...prev,
          activeMissionId: targetMission.id,
        }));
        setIsMissionTimerRunning(!targetMission.isCompleted);
      } else {
        setIsMissionTimerRunning(false);
      }
    } else {
      setIsMissionTimerRunning(false);
    }
  };

  const handleStopSession = () => {
    if (!canModifySessionSettings(activeSession, Date.now())) {
      setIsEmergencyOverrideOpen(true);
      return;
    }
    setActiveSession(null);
    setShieldOverlayApp(null);
    setLastAllowedFeedback('Session ended — restricted apps restored.');
  };

  const handleConfirmEmergencyOverride = (reason: string) => {
    const now = Date.now();
    const remaining = getRemainingMillis(activeSession, now);
    const entry: EmergencyOverrideEntry = {
      id: `${now}-override`,
      sessionLabel: activeSession?.sessionLabel ?? 'Nuclear Discipline Lock',
      reason,
      remainingMillisAtAbort: remaining,
      overriddenAtEpochMs: now,
    };
    setEmergencyOverrides((prev) => [entry, ...prev].slice(0, 15));
    setActiveSession(null);
    setShieldOverlayApp(null);
    setLastAllowedFeedback('Emergency Override logged — Nuclear lock lifted and apps restored.');
  };

  const handleTestOpenApp = (packageName: string, appName: string) => {
    const now = Date.now();
    setNowMs(now);
    const decision = evaluateBlockingDecision({
      foregroundPackage: packageName,
      session: activeSession,
      blockedPackages: new Set(blockedPackages),
      nowEpochMs: now,
      lastBlockedPackage: lastBlockedRef.current.pkg,
      lastBlockedAtEpochMs: lastBlockedRef.current.at,
    });

    if (decision.type === 'block') {
      lastBlockedRef.current = { pkg: packageName, at: now };
      setLastAllowedFeedback(null);
      setShieldOverlayApp({
        appName,
        packageName,
        sessionLabel: decision.sessionLabel,
        isNuclearMode: decision.isNuclearMode,
      });

      const attempt: BlockedAttemptEntry = {
        id: `${now}-${packageName}`,
        packageName,
        appName,
        attemptedAtEpochMs: now,
      };
      setRecentAttempts((prev) => [attempt, ...prev].slice(0, 20));
      setState((prev) => ({
        ...prev,
        blockedAttemptsToday: prev.blockedAttemptsToday + 1,
        weeklyHistory: prev.weeklyHistory.map((day, idx) =>
          idx === prev.weeklyHistory.length - 1
            ? { ...day, blockedAttempts: (day.blockedAttempts ?? prev.blockedAttemptsToday) + 1 }
            : day
        ),
      }));
    } else {
      setLastAllowedFeedback(`Allowed (${decision.reason}): ${appName} opened without restriction.`);
    }
  };

  const handleEnableEcoPolling = () => {
    setBackgroundPowerTasks((prev) =>
      prev.map((task) => ({ ...task, enabled: false }))
    );
  };

  const handleRestoreWatchdogPolling = () => {
    setBackgroundPowerTasks((prev) =>
      prev.map((task) =>
        task.id === 'usage-stats-poller' ? { ...task, enabled: true } : task
      )
    );
  };

  const handleSimulateAppUsage = (packageName: string, deltaMinutes: number) => {
    setAppUsageRecords((prev) => simulateAppUsageMinutes(prev, packageName, deltaMinutes));
  };

  const handleResetUsageDemo = () => {
    setAppUsageRecords(getDefaultAppUsageRecords());
    setUsageAccessGranted(true);
  };

  const remainingMillis = getRemainingMillis(activeSession, nowMs);
  const nuclearLocked = isNuclearLockActive(activeSession, nowMs);
  const batteryWarning = evaluateBatteryUsageWarning({
    session: activeSession,
    nowEpochMs: nowMs,
    tasks: backgroundPowerTasks,
    batteryLevelPct: batteryStatus.levelPct,
    isCharging: batteryStatus.charging,
  });

  const analyticsSummary = computeUsageAnalyticsSummary({
    records: appUsageRecords,
    blockedPackages,
    usageAccessGranted,
    focusMinutesToday: state.focusMinutesToday,
    rangeDays: analyticsRangeDays,
  });

  const weeklyTrendSummary = computeWeeklyTrendSummary({
    history: state.weeklyHistory,
    appUsageRecords,
    usageAccessGranted,
    focusTargetMinutes: state.dailyFocusTargetMinutes,
    plannedMissionsCount: state.missions.length,
  });

  const activeThemeMeta = getUiThemeDefinition(uiTheme);
  const isTerminalTheme = uiTheme === 'terminal';

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative min-h-screen bg-[#0C0F14] text-slate-100 flex flex-col overflow-x-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 bg-[#0C0F14]"
        >
          {!isTerminalTheme && !backdropFailed && (
            <img
              src={NDA_BACKDROP_SRC}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setBackdropFailed(true)}
              data-testid="nda-army-backdrop"
              className="h-full w-full object-cover object-[center_28%] opacity-80"
            />
          )}
          <div
            data-testid={isTerminalTheme ? 'terminal-grid-backdrop' : 'nda-grid-backdrop'}
            className={`${isTerminalTheme ? 'terminal-tactical-grid' : 'nda-tactical-grid'} absolute inset-0`}
          />
          {!isTerminalTheme && (
            <div className="absolute inset-0 bg-gradient-to-b from-[#0C0F14]/50 via-[#0C0F14]/28 to-[#0C0F14]/58" />
          )}
        </div>

        <div className="relative z-10 flex min-h-screen flex-col">
          <TopBar
            activeTab={activeTab}
            uiTheme={uiTheme}
            onSelectTab={setActiveTab}
            onOpenTargetModal={() => setIsTargetModalOpen(true)}
            onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          />

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-7 sm:px-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                state={state}
                personalization={personalization}
                uiTheme={uiTheme}
                blockedPackagesCount={blockedPackages.length}
                usageAccessGranted={usageAccessGranted}
                activeSession={activeSession}
                remainingMillis={remainingMillis}
                batteryWarning={batteryWarning}
                audioEnabled={audioEnabled}
                isMissionTimerRunning={isMissionTimerRunning}
                missionElapsedSeconds={missionElapsedSeconds}
                missionNotice={missionNotice}
                onToggleAudio={() => setAudioEnabled((prev) => !prev)}
                onToggleMissionTimer={() => setIsMissionTimerRunning((prev) => !prev)}
                onAdvanceMission={handleAdvanceActiveMission}
                onReplayChime={handleReplayChime}
                onDismissMissionNotice={() => setMissionNotice(null)}
                onEnableEcoPolling={handleEnableEcoPolling}
                onRestoreWatchdogPolling={handleRestoreWatchdogPolling}
                onStartQuickSession={handleStartQuickSession}
                onStopOrOverrideSession={handleStopSession}
                onSelectMission={handleSelectMission}
                onNavigateTab={setActiveTab}
                onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
              />
            )}
            {activeTab === 'missions' && (
              <MissionsView
                missions={state.missions}
                activeMissionId={state.activeMissionId}
                schedules={schedules}
                activeSession={activeSession}
                remainingMillis={remainingMillis}
                nowMs={nowMs}
                isNuclearLocked={nuclearLocked}
                isMissionTimerRunning={isMissionTimerRunning}
                missionElapsedSeconds={missionElapsedSeconds}
                onCreateMission={handleCreateMission}
                onUpdateMission={handleUpdateMission}
                onDeleteMission={handleDeleteMission}
                onSelectActiveMission={handleSelectMission}
                onLaunchMissionStudyBlock={handleLaunchMissionStudyBlock}
                onToggleMissionTimer={() => setIsMissionTimerRunning((prev) => !prev)}
                onCreateSchedule={handleCreateSchedule}
                onToggleScheduleEnabled={handleToggleScheduleEnabled}
                onDeleteSchedule={handleDeleteSchedule}
                onSimulateScheduleTrigger={handleSimulateScheduleTrigger}
              />
            )}
            {activeTab === 'shield' && (
              <AppSelectionView
                blockedPackages={blockedPackages}
                activeSession={activeSession}
                isNuclearLocked={nuclearLocked}
                remainingMillis={remainingMillis}
                recentAttempts={recentAttempts}
                emergencyOverrides={emergencyOverrides}
                lastAllowedFeedback={lastAllowedFeedback}
                onTogglePackage={handleToggleBlockedPackage}
                onSetPackages={handleSetBlockedPackages}
                onStartSession={handleStartSession}
                onStopSession={handleStopSession}
                onOpenEmergencyOverride={() => setIsEmergencyOverrideOpen(true)}
                onTestOpenApp={handleTestOpenApp}
              />
            )}
            {activeTab === 'analytics' && (
              <AnalyticsView
                summary={analyticsSummary}
                weeklyTrend={weeklyTrendSummary}
                focusMinutesToday={state.focusMinutesToday}
                focusTargetMinutes={state.dailyFocusTargetMinutes}
                usageAccessGranted={usageAccessGranted}
                rangeDays={analyticsRangeDays}
                isNuclearLocked={nuclearLocked}
                uiTheme={uiTheme}
                onChangeRangeDays={setAnalyticsRangeDays}
                onToggleUsageAccess={() => setUsageAccessGranted((prev) => !prev)}
                onSimulateAppUsage={handleSimulateAppUsage}
                onTogglePackageBlock={handleToggleBlockedPackage}
                onResetUsageDemo={handleResetUsageDemo}
              />
            )}
            {activeTab === 'personal' && (
              <PersonalOsView
                personalization={personalization}
                commandState={state}
                usageRecords={appUsageRecords}
                usageAccessGranted={usageAccessGranted}
                mentorMessages={mentorMessages}
                onUpdatePersonalization={(updater) => setPersonalization(updater)}
                onResetPersonalization={() => setPersonalization(getDefaultPersonalizationState())}
                onAppendMentorMessage={(msg) =>
                  setMentorMessages((prev) => [...prev, msg].slice(-24))
                }
                onClearMentorMessages={() => setMentorMessages([])}
              />
            )}
          </main>

          <footer className="border-t border-[#1E2534] bg-[#0E121A]/95 py-5">
            <div className="mx-auto flex max-w-6xl flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-4 sm:px-6 text-xs text-slate-400">
              <span>
                FOCUS//OS · {activeThemeMeta.name} Theme
              </span>
              <span>Personal Focus, Study Missions, App Blocker &amp; Screen Time Insights</span>
            </div>
          </footer>
        </div>

        <UiSettingsModal
          isOpen={isSettingsModalOpen}
          activeTheme={uiTheme}
          audioEnabled={audioEnabled}
          dailyFocusTargetMinutes={state.dailyFocusTargetMinutes}
          onSelectTheme={setUiTheme}
          onToggleAudio={() => setAudioEnabled((prev) => !prev)}
          onOpenFocusTargetModal={() => setIsTargetModalOpen(true)}
          onClose={() => setIsSettingsModalOpen(false)}
        />

        <FocusTargetModal
          isOpen={isTargetModalOpen}
          currentTargetMinutes={state.dailyFocusTargetMinutes}
          onClose={() => setIsTargetModalOpen(false)}
          onSave={handleSaveTarget}
        />

        <EmergencyOverrideModal
          isOpen={isEmergencyOverrideOpen}
          sessionLabel={activeSession?.sessionLabel ?? 'Nuclear Discipline Lock'}
          remainingMillis={remainingMillis}
          onClose={() => setIsEmergencyOverrideOpen(false)}
          onConfirmOverride={handleConfirmEmergencyOverride}
        />

        <BlockingShieldOverlay
          blockedApp={shieldOverlayApp}
          remainingMillis={remainingMillis}
          onDismiss={() => setShieldOverlayApp(null)}
        />
      </div>
    </MotionConfig>
  );
}
