export interface DisciplineScoreInput {
  focusMinutesToday: number;
  focusTargetMinutes: number;
  distractingMinutesToday: number;
  blockedAttemptsResisted: number;
  completedMissionsToday: number;
  plannedMissionsToday: number;
}

export interface DisciplineScoreBreakdown {
  totalScore: number;
  focusComponent: number;
  missionComponent: number;
  resistanceBonus: number;
  distractionPenalty: number;
  statusLabel: 'Disciplined' | 'Steady' | 'At Risk' | 'Compromised';
}

export interface MissionSummary {
  id: number;
  title: string;
  subject: string;
  targetMinutes: number;
  completedMinutes: number;
  isCompleted: boolean;
  linkedPackages?: string[];
}

export interface WeeklyFocusDay {
  dateKey: string;
  dayLabel: string;
  focusMinutes: number;
  distractingMinutes: number;
  blockedAttempts?: number;
  missionsCompleted?: number;
}

export interface WeeklyDisciplinePoint {
  dateKey: string;
  dayLabel: string;
  score: number;
  statusLabel: DisciplineScoreBreakdown['statusLabel'];
  focusMinutes: number;
  distractingMinutes: number;
}

export interface CompletedMissionRecord {
  id: string;
  missionId: number;
  title: string;
  subject: string;
  targetMinutes: number;
  completedMinutes: number;
  dayLabel: string;
  completedAtEpochMs: number;
}

export interface CommandCenterState {
  dailyFocusTargetMinutes: number;
  activeMissionId: number;
  focusMinutesToday: number;
  screenTimeMinutesToday: number;
  distractingMinutesToday: number;
  blockedAttemptsToday: number;
  missions: MissionSummary[];
  completedMissionHistory: CompletedMissionRecord[];
  weeklyHistory: WeeklyFocusDay[];
}

export function calculateDisciplineScore(input: DisciplineScoreInput): DisciplineScoreBreakdown {
  const safeTarget = Math.max(30, input.focusTargetMinutes);
  const focusRatio = Math.min(1, Math.max(0, input.focusMinutesToday / safeTarget));
  const focusComponent = Math.round(focusRatio * 55);

  let missionRatio = 0;
  if (input.plannedMissionsToday <= 0) {
    missionRatio = input.completedMissionsToday > 0 ? 1 : 0;
  } else {
    missionRatio = Math.min(1, Math.max(0, input.completedMissionsToday / input.plannedMissionsToday));
  }
  const missionComponent = Math.round(missionRatio * 30);

  const resistanceBonus = Math.min(15, Math.max(0, input.blockedAttemptsResisted) * 3);

  const excessDistraction = Math.max(0, input.distractingMinutesToday - 15);
  const distractionPenalty = Math.min(40, Math.round(excessDistraction * 0.5));

  const raw = focusComponent + missionComponent + resistanceBonus - distractionPenalty;
  const totalScore = Math.min(100, Math.max(0, raw));

  let statusLabel: DisciplineScoreBreakdown['statusLabel'] = 'Compromised';
  if (totalScore >= 85) {
    statusLabel = 'Disciplined';
  } else if (totalScore >= 65) {
    statusLabel = 'Steady';
  } else if (totalScore >= 40) {
    statusLabel = 'At Risk';
  }

  return {
    totalScore,
    focusComponent,
    missionComponent,
    resistanceBonus,
    distractionPenalty,
    statusLabel,
  };
}

export function buildWeeklyDisciplineTrend(
  history: WeeklyFocusDay[],
  focusTargetMinutes: number,
  plannedMissionsCount: number
): WeeklyDisciplinePoint[] {
  return history.map((day) => {
    const breakdown = calculateDisciplineScore({
      focusMinutesToday: day.focusMinutes,
      focusTargetMinutes,
      distractingMinutesToday: day.distractingMinutes,
      blockedAttemptsResisted: day.blockedAttempts ?? 4,
      completedMissionsToday: day.missionsCompleted ?? 2,
      plannedMissionsToday: Math.max(1, plannedMissionsCount),
    });

    return {
      dateKey: day.dateKey,
      dayLabel: day.dayLabel,
      score: breakdown.totalScore,
      statusLabel: breakdown.statusLabel,
      focusMinutes: day.focusMinutes,
      distractingMinutes: day.distractingMinutes,
    };
  });
}

export function formatMinutesCompact(totalMinutes: number): string {
  const safe = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(safe / 60);
  const minutes = safe % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${minutes}m`;
}

export function getDefaultCommandState(): CommandCenterState {
  return {
    dailyFocusTargetMinutes: 240,
    activeMissionId: 1,
    focusMinutesToday: 185,
    screenTimeMinutesToday: 142,
    distractingMinutesToday: 18,
    blockedAttemptsToday: 8,
    missions: [
      {
        id: 1,
        title: 'Mathematics — Calculus Problem Set',
        subject: 'Mathematics',
        targetMinutes: 180,
        completedMinutes: 115,
        isCompleted: false,
        linkedPackages: ['com.zhiliaoapp.musically', 'com.google.android.youtube', 'com.instagram.android'],
      },
      {
        id: 2,
        title: 'English — Critical Reading & Essays',
        subject: 'English',
        targetMinutes: 60,
        completedMinutes: 60,
        isCompleted: true,
        linkedPackages: ['com.google.android.youtube'],
      },
      {
        id: 3,
        title: 'General Ability Test — Timed Drill',
        subject: 'General Ability Test',
        targetMinutes: 120,
        completedMinutes: 40,
        isCompleted: false,
        linkedPackages: ['com.zhiliaoapp.musically', 'com.instagram.android', 'com.reddit.frontpage'],
      },
      {
        id: 4,
        title: 'Personal Reading — Deep Work Chapter',
        subject: 'Personal Reading',
        targetMinutes: 30,
        completedMinutes: 30,
        isCompleted: true,
        linkedPackages: [],
      },
    ],
    completedMissionHistory: [
      {
        id: 'seed-mission-today-2',
        missionId: 2,
        title: 'English — Critical Reading & Essays',
        subject: 'English',
        targetMinutes: 60,
        completedMinutes: 60,
        dayLabel: 'Today',
        completedAtEpochMs: 1_763_650_000_000,
      },
      {
        id: 'seed-mission-today-4',
        missionId: 4,
        title: 'Personal Reading — Deep Work Chapter',
        subject: 'Personal Reading',
        targetMinutes: 30,
        completedMinutes: 30,
        dayLabel: 'Today',
        completedAtEpochMs: 1_763_638_000_000,
      },
      {
        id: 'seed-mission-thu-1',
        missionId: 101,
        title: 'Mathematics — Vector Algebra Mock',
        subject: 'Mathematics',
        targetMinutes: 120,
        completedMinutes: 120,
        dayLabel: 'Thu',
        completedAtEpochMs: 1_763_565_000_000,
      },
      {
        id: 'seed-mission-wed-3',
        missionId: 102,
        title: 'General Ability Test — GK & Polity Drill',
        subject: 'General Ability Test',
        targetMinutes: 90,
        completedMinutes: 90,
        dayLabel: 'Wed',
        completedAtEpochMs: 1_763_478_000_000,
      },
      {
        id: 'seed-mission-tue-2',
        missionId: 103,
        title: 'English — Précis & Comprehension',
        subject: 'English',
        targetMinutes: 45,
        completedMinutes: 45,
        dayLabel: 'Tue',
        completedAtEpochMs: 1_763_392_000_000,
      },
    ],
    weeklyHistory: [
      {
        dateKey: 'D-6',
        dayLabel: 'Sat',
        focusMinutes: 145,
        distractingMinutes: 52,
        blockedAttempts: 4,
        missionsCompleted: 1,
      },
      {
        dateKey: 'D-5',
        dayLabel: 'Sun',
        focusMinutes: 190,
        distractingMinutes: 34,
        blockedAttempts: 7,
        missionsCompleted: 2,
      },
      {
        dateKey: 'D-4',
        dayLabel: 'Mon',
        focusMinutes: 160,
        distractingMinutes: 48,
        blockedAttempts: 5,
        missionsCompleted: 1,
      },
      {
        dateKey: 'D-3',
        dayLabel: 'Tue',
        focusMinutes: 215,
        distractingMinutes: 22,
        blockedAttempts: 9,
        missionsCompleted: 2,
      },
      {
        dateKey: 'D-2',
        dayLabel: 'Wed',
        focusMinutes: 240,
        distractingMinutes: 14,
        blockedAttempts: 11,
        missionsCompleted: 3,
      },
      {
        dateKey: 'D-1',
        dayLabel: 'Thu',
        focusMinutes: 205,
        distractingMinutes: 28,
        blockedAttempts: 6,
        missionsCompleted: 2,
      },
      {
        dateKey: 'D-0',
        dayLabel: 'Today',
        focusMinutes: 185,
        distractingMinutes: 18,
        blockedAttempts: 8,
        missionsCompleted: 2,
      },
    ],
  };
}

const STORAGE_KEY = 'focus_os_stage1_state_v1';

export function loadCommandState(): CommandCenterState {
  if (typeof window === 'undefined') {
    return getDefaultCommandState();
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultCommandState();
    }
    const parsed = JSON.parse(raw) as Partial<CommandCenterState>;
    const defaults = getDefaultCommandState();
    const mergedHistory = Array.isArray(parsed.weeklyHistory)
      ? defaults.weeklyHistory.map((defDay, idx) => ({
          ...defDay,
          ...(parsed.weeklyHistory?.[idx] ?? {}),
        }))
      : defaults.weeklyHistory;

    return {
      ...defaults,
      ...parsed,
      weeklyHistory: mergedHistory,
      completedMissionHistory:
        Array.isArray(parsed.completedMissionHistory) && parsed.completedMissionHistory.length > 0
          ? parsed.completedMissionHistory
          : defaults.completedMissionHistory,
      dailyFocusTargetMinutes:
        typeof parsed.dailyFocusTargetMinutes === 'number'
          ? Math.min(720, Math.max(30, parsed.dailyFocusTargetMinutes))
          : defaults.dailyFocusTargetMinutes,
      activeMissionId:
        typeof parsed.activeMissionId === 'number' ? parsed.activeMissionId : defaults.activeMissionId,
    };
  } catch {
    return getDefaultCommandState();
  }
}

export function saveCommandState(state: CommandCenterState): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function getRecentCompletedMissionSummaries(
  records: CompletedMissionRecord[],
  limit = 5
): CompletedMissionRecord[] {
  return [...records]
    .sort((a, b) => b.completedAtEpochMs - a.completedAtEpochMs)
    .slice(0, Math.max(0, limit));
}

export function advanceMissionProgress(
  state: CommandCenterState,
  missionId: number,
  deltaMinutes: number,
  nowEpochMs: number = Date.now()
): { nextState: CommandCenterState; newlyCompletedMission: MissionSummary | null } {
  if (deltaMinutes <= 0) {
    return { nextState: state, newlyCompletedMission: null };
  }

  let actualDelta = 0;
  let newlyCompletedMission: MissionSummary | null = null;

  const nextMissions = state.missions.map((mission) => {
    if (mission.id !== missionId) return mission;

    const wasCompleted = mission.isCompleted || mission.completedMinutes >= mission.targetMinutes;
    const nextCompletedMinutes = Math.min(
      mission.targetMinutes,
      mission.completedMinutes + Math.round(deltaMinutes)
    );
    actualDelta = Math.max(0, nextCompletedMinutes - mission.completedMinutes);
    const isNowCompleted = nextCompletedMinutes >= mission.targetMinutes;

    const updated: MissionSummary = {
      ...mission,
      completedMinutes: nextCompletedMinutes,
      isCompleted: isNowCompleted,
    };

    if (!wasCompleted && isNowCompleted) {
      newlyCompletedMission = updated;
    }
    return updated;
  });

  if (actualDelta === 0) {
    return { nextState: state, newlyCompletedMission: null };
  }

  const completedCount = nextMissions.filter((m) => m.isCompleted).length;
  const nextFocusToday = state.focusMinutesToday + actualDelta;
  const nextWeeklyHistory = state.weeklyHistory.map((day, idx) =>
    idx === state.weeklyHistory.length - 1
      ? {
          ...day,
          focusMinutes: day.focusMinutes + actualDelta,
          missionsCompleted: completedCount,
        }
      : day
  );

  let nextCompletedHistory = state.completedMissionHistory;
  if (newlyCompletedMission) {
    const completed = newlyCompletedMission as MissionSummary;
    const newRecord: CompletedMissionRecord = {
      id: `mission-${completed.id}-${nowEpochMs}`,
      missionId: completed.id,
      title: completed.title,
      subject: completed.subject,
      targetMinutes: completed.targetMinutes,
      completedMinutes: completed.completedMinutes,
      dayLabel: 'Today',
      completedAtEpochMs: nowEpochMs,
    };
    nextCompletedHistory = [newRecord, ...state.completedMissionHistory].slice(0, 20);
  }

  return {
    nextState: {
      ...state,
      focusMinutesToday: nextFocusToday,
      missions: nextMissions,
      completedMissionHistory: nextCompletedHistory,
      weeklyHistory: nextWeeklyHistory,
    },
    newlyCompletedMission,
  };
}

export interface HeatmapCell {
  dayIndex: number;
  dayLabel: string;
  dateKey: string;
  slotIndex: number;
  slotLabel: string;
  timeRange: string;
  focusMinutes: number;
  distractingMinutes: number;
  intensity: number;
  tier: 'Standby' | 'Active' | 'Locked In' | 'Peak';
}

const WATCH_SLOTS = [
  { slotLabel: 'Dawn', timeRange: '0500–0900', weight: 0.30 },
  { slotLabel: 'Midday', timeRange: '0900–1300', weight: 0.22 },
  { slotLabel: 'Afternoon', timeRange: '1300–1800', weight: 0.20 },
  { slotLabel: 'Evening', timeRange: '1800–2300', weight: 0.28 },
];

export function buildWeeklyHeatmapMatrix(
  history: WeeklyFocusDay[],
  focusTargetMinutes: number
): HeatmapCell[] {
  const safeTargetSlot = Math.max(30, focusTargetMinutes / WATCH_SLOTS.length);
  const cells: HeatmapCell[] = [];

  history.forEach((day, dayIndex) => {
    // Deterministic per-day modulation using dayIndex + distractingMinutes so pattern feels organic
    const rawWeights = WATCH_SLOTS.map((slot, slotIndex) => {
      const mod = ((dayIndex * 3 + slotIndex * 5) % 4) * 0.025 - 0.025;
      return Math.max(0.1, slot.weight + mod);
    });
    const weightSum = rawWeights.reduce((acc, w) => acc + w, 0);

    let remaining = Math.max(0, Math.round(day.focusMinutes));
    const daySlotsMinutes = rawWeights.map((w, idx) => {
      if (idx === rawWeights.length - 1) return remaining;
      const val = Math.round((day.focusMinutes * w) / weightSum);
      remaining = Math.max(0, remaining - val);
      return val;
    });

    WATCH_SLOTS.forEach((slot, slotIndex) => {
      const slotMinutes = daySlotsMinutes[slotIndex];
      const distractionDampen = Math.min(0.18, (day.distractingMinutes / 180) * 0.18);
      const rawIntensity = slotMinutes / safeTargetSlot;
      const intensity = Math.min(1, Math.max(0, Number((rawIntensity - distractionDampen * 0.5).toFixed(3))));

      let tier: HeatmapCell['tier'] = 'Standby';
      if (intensity >= 0.85) {
        tier = 'Peak';
      } else if (intensity >= 0.58) {
        tier = 'Locked In';
      } else if (intensity > 0.15) {
        tier = 'Active';
      }

      cells.push({
        dayIndex,
        dayLabel: day.dayLabel,
        dateKey: day.dateKey,
        slotIndex,
        slotLabel: slot.slotLabel,
        timeRange: slot.timeRange,
        focusMinutes: slotMinutes,
        distractingMinutes: day.distractingMinutes,
        intensity,
        tier,
      });
    });
  });

  return cells;
}


