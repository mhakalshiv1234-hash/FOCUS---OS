import { isProtectedSafetyPackage } from './appSelection';
import { MissionSummary } from './discipline';

export type WeekdayIso = 1 | 2 | 3 | 4 | 5 | 6 | 7; // 1 = Mon ... 7 = Sun

export const WEEKDAY_OPTIONS: { iso: WeekdayIso; shortLabel: string; bit: number }[] = [
  { iso: 1, shortLabel: 'Mon', bit: 1 << 0 },
  { iso: 2, shortLabel: 'Tue', bit: 1 << 1 },
  { iso: 3, shortLabel: 'Wed', bit: 1 << 2 },
  { iso: 4, shortLabel: 'Thu', bit: 1 << 3 },
  { iso: 5, shortLabel: 'Fri', bit: 1 << 4 },
  { iso: 6, shortLabel: 'Sat', bit: 1 << 5 },
  { iso: 7, shortLabel: 'Sun', bit: 1 << 6 },
];

export interface StudyMissionDraft {
  title: string;
  subject: string;
  targetMinutes: number;
  linkedPackages: string[];
}

export interface DailyBlockSchedule {
  id: string;
  label: string;
  startMinutesFromMidnight: number;
  endMinutesFromMidnight: number;
  daysOfWeek: WeekdayIso[];
  isEnabled: boolean;
  isNuclearMode: boolean;
  linkedMissionId: number | null;
  linkedPackages: string[];
}

export interface DailyScheduleDraft {
  label: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  daysOfWeek: WeekdayIso[];
  isNuclearMode: boolean;
  linkedMissionId: number | null;
  linkedPackages: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ScheduleWindowEvaluation {
  activeSchedule: DailyBlockSchedule | null;
  activeSchedulesCount: number;
  remainingMillis: number;
  nextUpcomingLabel: string | null;
}

export function getIsoWeekdayFromDate(date: Date): WeekdayIso {
  const jsDay = date.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  return (jsDay === 0 ? 7 : jsDay) as WeekdayIso;
}

export function getPreviousIsoWeekday(day: WeekdayIso): WeekdayIso {
  return (day === 1 ? 7 : day - 1) as WeekdayIso;
}

export function encodeDaysBitmask(days: WeekdayIso[]): number {
  return days.reduce((mask, d) => mask | (1 << (d - 1)), 0);
}

export function decodeDaysBitmask(mask: number): WeekdayIso[] {
  return WEEKDAY_OPTIONS.filter((opt) => (mask & opt.bit) !== 0).map((opt) => opt.iso);
}

export function formatMinutesTo24h(minutesFromMidnight: number): string {
  const safe = ((Math.round(minutesFromMidnight) % 1440) + 1440) % 1440;
  const hh = Math.floor(safe / 60);
  const mm = safe % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

export function parse24hToMinutes(hhmm: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm.trim());
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isInteger(hh) || !Number.isInteger(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return null;
  }
  return hh * 60 + mm;
}

export function formatDaysCompact(days: WeekdayIso[]): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return 'Daily';
  if (sorted.length === 5 && sorted.every((d, i) => d === i + 1)) return 'Mon–Fri';
  if (sorted.length === 6 && sorted.every((d, i) => d === i + 1)) return 'Mon–Sat';
  return sorted
    .map((iso) => WEEKDAY_OPTIONS.find((w) => w.iso === iso)?.shortLabel ?? '')
    .filter(Boolean)
    .join(', ');
}

export function validateMissionDraft(draft: StudyMissionDraft): ValidationResult {
  const errors: string[] = [];
  if (draft.title.trim().length < 3) {
    errors.push('Mission title must be at least 3 characters.');
  }
  if (draft.subject.trim().length < 2) {
    errors.push('Subject name must be at least 2 characters.');
  }
  if (!Number.isFinite(draft.targetMinutes) || draft.targetMinutes < 15 || draft.targetMinutes > 480) {
    errors.push('Target duration must be between 15 and 480 minutes.');
  }
  return { valid: errors.length === 0, errors };
}

export function createStudyMission(
  missions: MissionSummary[],
  draft: StudyMissionDraft,
  nowEpochMs: number = Date.now()
): { missions: MissionSummary[]; created: MissionSummary } {
  const maxId = missions.reduce((max, m) => Math.max(max, m.id), 0);
  const created: MissionSummary = {
    id: Math.max(maxId + 1, Math.floor(nowEpochMs % 1_000_000) + 10),
    title: draft.title.trim(),
    subject: draft.subject.trim(),
    targetMinutes: Math.round(draft.targetMinutes),
    completedMinutes: 0,
    isCompleted: false,
    linkedPackages: draft.linkedPackages.filter((pkg) => !isProtectedSafetyPackage(pkg)),
  };
  return {
    missions: [...missions, created],
    created,
  };
}

export function updateStudyMission(
  missions: MissionSummary[],
  missionId: number,
  draft: StudyMissionDraft
): MissionSummary[] {
  const cleanLinked = draft.linkedPackages.filter((pkg) => !isProtectedSafetyPackage(pkg));
  return missions.map((mission) => {
    if (mission.id !== missionId) return mission;
    const nextTarget = Math.round(draft.targetMinutes);
    return {
      ...mission,
      title: draft.title.trim(),
      subject: draft.subject.trim(),
      targetMinutes: nextTarget,
      isCompleted: mission.completedMinutes >= nextTarget,
      linkedPackages: cleanLinked,
    };
  });
}

export function deleteStudyMission(
  missions: MissionSummary[],
  missionId: number,
  currentActiveMissionId: number
): { missions: MissionSummary[]; nextActiveMissionId: number } {
  const filtered = missions.filter((m) => m.id !== missionId);
  const nextActiveMissionId =
    currentActiveMissionId === missionId ? (filtered[0]?.id ?? -1) : currentActiveMissionId;
  return {
    missions: filtered,
    nextActiveMissionId,
  };
}

export function resolveEffectiveBlocklist(params: {
  baseBlockedPackages: string[];
  missionLinkedPackages?: string[];
  isNuclearLockActive: boolean;
}): string[] {
  const safeBase = params.baseBlockedPackages.filter((pkg) => !isProtectedSafetyPackage(pkg));
  if (params.isNuclearLockActive) {
    return Array.from(new Set(safeBase));
  }
  const safeMission = (params.missionLinkedPackages ?? []).filter(
    (pkg) => !isProtectedSafetyPackage(pkg)
  );
  return Array.from(new Set([...safeBase, ...safeMission]));
}

export function validateScheduleDraft(draft: DailyScheduleDraft): ValidationResult {
  const errors: string[] = [];
  if (draft.label.trim().length < 3) {
    errors.push('Schedule label must be at least 3 characters.');
  }
  const start = parse24hToMinutes(draft.startTime);
  const end = parse24hToMinutes(draft.endTime);
  if (start === null || end === null) {
    errors.push('Enter valid 24-hour times (HH:MM).');
  } else if (start === end) {
    errors.push('Start and end times cannot be identical.');
  }
  if (draft.daysOfWeek.length === 0) {
    errors.push('Select at least one active weekday.');
  }
  return { valid: errors.length === 0, errors };
}

export function isScheduleActiveAt(schedule: DailyBlockSchedule, date: Date): boolean {
  if (!schedule.isEnabled || schedule.daysOfWeek.length === 0) {
    return false;
  }
  const minutesNow = date.getHours() * 60 + date.getMinutes();
  const todayIso = getIsoWeekdayFromDate(date);
  const start = schedule.startMinutesFromMidnight;
  const end = schedule.endMinutesFromMidnight;

  if (end > start) {
    return schedule.daysOfWeek.includes(todayIso) && minutesNow >= start && minutesNow < end;
  }

  // Overnight schedule (e.g. 22:00 -> 05:00):
  // Active late tonight if today is scheduled and minutesNow >= start,
  // OR active early this morning if yesterday was scheduled and minutesNow < end.
  if (schedule.daysOfWeek.includes(todayIso) && minutesNow >= start) {
    return true;
  }
  const prevIso = getPreviousIsoWeekday(todayIso);
  return schedule.daysOfWeek.includes(prevIso) && minutesNow < end;
}

export function getScheduleRemainingMillis(schedule: DailyBlockSchedule, date: Date): number {
  if (!isScheduleActiveAt(schedule, date)) {
    return 0;
  }
  const minutesNow = date.getHours() * 60 + date.getMinutes();
  const secondsNow = date.getSeconds();
  const start = schedule.startMinutesFromMidnight;
  const end = schedule.endMinutesFromMidnight;

  let remainingMinutes = 0;
  if (end > start) {
    remainingMinutes = end - minutesNow;
  } else if (minutesNow >= start) {
    remainingMinutes = 1440 - minutesNow + end;
  } else {
    remainingMinutes = end - minutesNow;
  }
  return Math.max(0, remainingMinutes * 60_000 - secondsNow * 1000);
}

export function formatNextTriggerForSchedule(
  schedule: DailyBlockSchedule,
  nowDate: Date
): string | null {
  if (!schedule.isEnabled || schedule.daysOfWeek.length === 0) {
    return null;
  }
  if (isScheduleActiveAt(schedule, nowDate)) {
    return `Active until ${formatMinutesTo24h(schedule.endMinutesFromMidnight)}`;
  }

  const todayIso = getIsoWeekdayFromDate(nowDate);
  const minutesNow = nowDate.getHours() * 60 + nowDate.getMinutes();

  for (let offset = 0; offset < 7; offset++) {
    const candidateIso = ((((todayIso - 1 + offset) % 7) + 1) as WeekdayIso);
    if (!schedule.daysOfWeek.includes(candidateIso)) continue;
    if (offset === 0 && schedule.startMinutesFromMidnight <= minutesNow) {
      continue;
    }
    const dayPrefix =
      offset === 0
        ? 'Today'
        : offset === 1
        ? 'Tomorrow'
        : WEEKDAY_OPTIONS.find((w) => w.iso === candidateIso)?.shortLabel ?? '';
    return `Next: ${dayPrefix} ${formatMinutesTo24h(schedule.startMinutesFromMidnight)}`;
  }

  return `Next: ${formatMinutesTo24h(schedule.startMinutesFromMidnight)}`;
}

export function evaluateSchedulesAt(
  schedules: DailyBlockSchedule[],
  nowDate: Date
): ScheduleWindowEvaluation {
  const active = schedules.filter((s) => isScheduleActiveAt(s, nowDate));
  // Prioritize Nuclear schedules, then shortest remaining / latest added
  const sortedActive = [...active].sort((a, b) => {
    if (a.isNuclearMode !== b.isNuclearMode) return a.isNuclearMode ? -1 : 1;
    return getScheduleRemainingMillis(b, nowDate) - getScheduleRemainingMillis(a, nowDate);
  });

  const topActive = sortedActive[0] ?? null;
  if (topActive) {
    return {
      activeSchedule: topActive,
      activeSchedulesCount: active.length,
      remainingMillis: getScheduleRemainingMillis(topActive, nowDate),
      nextUpcomingLabel: `Active until ${formatMinutesTo24h(topActive.endMinutesFromMidnight)}`,
    };
  }

  // Find earliest next trigger among enabled schedules
  const enabled = schedules.filter((s) => s.isEnabled && s.daysOfWeek.length > 0);
  if (enabled.length === 0) {
    return {
      activeSchedule: null,
      activeSchedulesCount: 0,
      remainingMillis: 0,
      nextUpcomingLabel: null,
    };
  }

  const todayIso = getIsoWeekdayFromDate(nowDate);
  const minutesNow = nowDate.getHours() * 60 + nowDate.getMinutes();
  let bestLabel: string | null = null;
  let bestDeltaMinutes = Number.MAX_SAFE_INTEGER;

  for (const sched of enabled) {
    for (let offset = 0; offset <= 7; offset++) {
      const candidateIso = ((((todayIso - 1 + offset) % 7) + 1) as WeekdayIso);
      if (!sched.daysOfWeek.includes(candidateIso)) continue;
      const delta = offset * 1440 + sched.startMinutesFromMidnight - minutesNow;
      if (delta <= 0) continue;
      if (delta < bestDeltaMinutes) {
        bestDeltaMinutes = delta;
        bestLabel = formatNextTriggerForSchedule(sched, nowDate);
      }
      break;
    }
  }

  return {
    activeSchedule: null,
    activeSchedulesCount: 0,
    remainingMillis: 0,
    nextUpcomingLabel: bestLabel,
  };
}

export function getDefaultDailySchedules(): DailyBlockSchedule[] {
  return [
    {
      id: 'sched-morning-drill',
      label: 'Morning Drill & Calculus Block',
      startMinutesFromMidnight: 5 * 60 + 30,
      endMinutesFromMidnight: 8 * 60 + 0,
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      isEnabled: true,
      isNuclearMode: false,
      linkedMissionId: 1,
      linkedPackages: ['com.zhiliaoapp.musically', 'com.google.android.youtube', 'com.instagram.android'],
    },
    {
      id: 'sched-evening-study',
      label: 'Evening Quiet Study & GAT Prep',
      startMinutesFromMidnight: 19 * 60 + 0,
      endMinutesFromMidnight: 21 * 60 + 30,
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      isEnabled: true,
      isNuclearMode: true,
      linkedMissionId: 3,
      linkedPackages: [
        'com.zhiliaoapp.musically',
        'com.google.android.youtube',
        'com.instagram.android',
        'com.reddit.frontpage',
      ],
    },
  ];
}

const SCHEDULES_STORAGE_KEY = 'focus_os_stage5_schedules_v1';

export function loadDailySchedules(): DailyBlockSchedule[] {
  if (typeof window === 'undefined') {
    return getDefaultDailySchedules();
  }
  try {
    const raw = window.localStorage.getItem(SCHEDULES_STORAGE_KEY);
    if (!raw) return getDefaultDailySchedules();
    const parsed = JSON.parse(raw) as DailyBlockSchedule[];
    return Array.isArray(parsed) ? parsed : getDefaultDailySchedules();
  } catch {
    return getDefaultDailySchedules();
  }
}

export function saveDailySchedules(schedules: DailyBlockSchedule[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
  } catch {
    // Ignore storage quota errors
  }
}
