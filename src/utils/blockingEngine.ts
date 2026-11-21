import { isProtectedSafetyPackage } from './appSelection';

export interface ActiveFocusSession {
  isActive: boolean;
  sessionLabel: string;
  startedAtEpochMs: number;
  endsAtEpochMs: number;
  durationMinutes: number;
  isNuclearMode?: boolean;
}

export interface BlockedAttemptEntry {
  id: string;
  packageName: string;
  appName: string;
  attemptedAtEpochMs: number;
}

export interface EmergencyOverrideEntry {
  id: string;
  sessionLabel: string;
  reason: string;
  remainingMillisAtAbort: number;
  overriddenAtEpochMs: number;
}

export interface EmergencyOverrideEvaluation {
  allowed: boolean;
  reasonValid: boolean;
  phraseMatches: boolean;
  delayComplete: boolean;
  message: string;
}

export const EMERGENCY_OVERRIDE_PHRASE = 'ABORT NUCLEAR LOCK';
export const NUCLEAR_OVERRIDE_DELAY_SECONDS = 5;
export const MINIMUM_OVERRIDE_REASON_LENGTH = 12;

export type BlockingDecision =
  | { type: 'allow'; reason: string }
  | {
      type: 'block';
      packageName: string;
      remainingMillis: number;
      sessionLabel: string;
      isNuclearMode: boolean;
    };

const DEBOUNCE_WINDOW_MS = 1200;

export function isSessionExpired(session: ActiveFocusSession | null, nowEpochMs: number): boolean {
  return Boolean(session && session.isActive && nowEpochMs >= session.endsAtEpochMs);
}

export function isNuclearLockActive(session: ActiveFocusSession | null, nowEpochMs: number): boolean {
  return Boolean(
    session &&
      session.isActive &&
      session.isNuclearMode &&
      !isSessionExpired(session, nowEpochMs)
  );
}

export function canModifySessionSettings(
  session: ActiveFocusSession | null,
  nowEpochMs: number
): boolean {
  return !isNuclearLockActive(session, nowEpochMs);
}

export function evaluateEmergencyOverride(params: {
  reason: string;
  typedPhrase: string;
  remainingDelaySeconds: number;
}): EmergencyOverrideEvaluation {
  const cleanReason = params.reason.trim();
  const cleanPhrase = params.typedPhrase.trim().toUpperCase();
  const reasonValid = cleanReason.length >= MINIMUM_OVERRIDE_REASON_LENGTH;
  const phraseMatches = cleanPhrase === EMERGENCY_OVERRIDE_PHRASE;
  const delayComplete = params.remainingDelaySeconds <= 0;

  if (!delayComplete) {
    return {
      allowed: false,
      reasonValid,
      phraseMatches,
      delayComplete,
      message: `Security hold active: wait ${params.remainingDelaySeconds}s before override unlocks.`,
    };
  }
  if (!reasonValid) {
    return {
      allowed: false,
      reasonValid,
      phraseMatches,
      delayComplete,
      message: `Enter an emergency reason of at least ${MINIMUM_OVERRIDE_REASON_LENGTH} characters.`,
    };
  }
  if (!phraseMatches) {
    return {
      allowed: false,
      reasonValid,
      phraseMatches,
      delayComplete,
      message: `Type "${EMERGENCY_OVERRIDE_PHRASE}" exactly to authorize emergency override.`,
    };
  }

  return {
    allowed: true,
    reasonValid: true,
    phraseMatches: true,
    delayComplete: true,
    message: 'Emergency override verified. Nuclear lock can now be lifted.',
  };
}

export function getRemainingMillis(session: ActiveFocusSession | null, nowEpochMs: number): number {
  if (!session || !session.isActive) return 0;
  return Math.max(0, session.endsAtEpochMs - nowEpochMs);
}

export function evaluateBlockingDecision(params: {
  foregroundPackage: string;
  selfPackageName?: string;
  session: ActiveFocusSession | null;
  blockedPackages: Set<string>;
  nowEpochMs: number;
  lastBlockedPackage?: string | null;
  lastBlockedAtEpochMs?: number;
}): BlockingDecision {
  const {
    foregroundPackage,
    selfPackageName = 'com.focusos.app',
    session,
    blockedPackages,
    nowEpochMs,
    lastBlockedPackage = null,
    lastBlockedAtEpochMs = 0,
  } = params;

  if (!foregroundPackage) {
    return { type: 'allow', reason: 'empty_package' };
  }

  if (!session || !session.isActive) {
    return { type: 'allow', reason: 'no_active_session' };
  }

  if (isSessionExpired(session, nowEpochMs)) {
    return { type: 'allow', reason: 'session_expired' };
  }

  if (foregroundPackage === selfPackageName || isProtectedSafetyPackage(foregroundPackage, selfPackageName)) {
    return { type: 'allow', reason: 'safety_protected' };
  }

  if (!blockedPackages.has(foregroundPackage)) {
    return { type: 'allow', reason: 'not_in_blocklist' };
  }

  const elapsed = nowEpochMs - lastBlockedAtEpochMs;
  if (foregroundPackage === lastBlockedPackage && elapsed >= 0 && elapsed < DEBOUNCE_WINDOW_MS) {
    return { type: 'allow', reason: 'debounced_duplicate_event' };
  }

  return {
    type: 'block',
    packageName: foregroundPackage,
    remainingMillis: getRemainingMillis(session, nowEpochMs),
    sessionLabel: session.sessionLabel,
    isNuclearMode: Boolean(session.isNuclearMode),
  };
}

export function formatCountdownMillis(millis: number): string {
  const totalSeconds = Math.floor(Math.max(0, millis) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const SESSION_KEY = 'focus_os_stage3_session_v1';
const ATTEMPTS_KEY = 'focus_os_stage3_attempts_v1';
const OVERRIDES_KEY = 'focus_os_stage4_overrides_v1';

export function loadActiveSession(): ActiveFocusSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ActiveFocusSession;
    if (!parsed.isActive || isSessionExpired(parsed, Date.now())) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveActiveSession(session: ActiveFocusSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (!session) {
      window.localStorage.removeItem(SESSION_KEY);
    } else {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
  } catch {
    // Ignore quota errors
  }
}

export function loadBlockedAttempts(): BlockedAttemptEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveBlockedAttempts(entries: BlockedAttemptEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(entries.slice(0, 20)));
  } catch {
    // Ignore quota errors
  }
}

export function loadEmergencyOverrides(): EmergencyOverrideEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveEmergencyOverrides(entries: EmergencyOverrideEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(entries.slice(0, 15)));
  } catch {
    // Ignore quota errors
  }
}

export interface BackgroundPowerTask {
  id: string;
  name: string;
  powerImpact: 'high' | 'moderate';
  estimatedDrainPctPerHour: number;
  enabled: boolean;
}

export interface BatteryUsageWarning {
  severity: 'subtle' | 'elevated';
  headline: string;
  detail: string;
  activeTaskNames: string[];
  estimatedExtraDrainPctPerHour: number;
  batteryLevelPct: number | null;
  isCharging: boolean | null;
}

export function getDefaultBackgroundPowerTasks(): BackgroundPowerTask[] {
  return [
    {
      id: 'usage-stats-poller',
      name: 'UsageStats Watchdog Poller',
      powerImpact: 'high',
      estimatedDrainPctPerHour: 3.4,
      enabled: true,
    },
    {
      id: 'offline-study-indexer',
      name: 'Offline Study Indexer',
      powerImpact: 'high',
      estimatedDrainPctPerHour: 2.2,
      enabled: false,
    },
  ];
}

export function evaluateBatteryUsageWarning(params: {
  session: ActiveFocusSession | null;
  nowEpochMs: number;
  tasks: BackgroundPowerTask[];
  batteryLevelPct?: number | null;
  isCharging?: boolean | null;
}): BatteryUsageWarning | null {
  const {
    session,
    nowEpochMs,
    tasks,
    batteryLevelPct = null,
    isCharging = null,
  } = params;

  if (!session || !session.isActive || isSessionExpired(session, nowEpochMs)) {
    return null;
  }

  const activeHighPowerTasks = tasks.filter((t) => t.enabled && t.powerImpact === 'high');
  const activeAnyTasks = tasks.filter((t) => t.enabled);
  const lowBatteryDischarging =
    batteryLevelPct !== null && batteryLevelPct <= 25 && isCharging !== true;

  if (activeHighPowerTasks.length === 0 && !(lowBatteryDischarging && activeAnyTasks.length > 0)) {
    return null;
  }

  const relevantTasks =
    activeHighPowerTasks.length > 0 ? activeHighPowerTasks : activeAnyTasks;

  const estimatedExtraDrainPctPerHour = Number(
    relevantTasks.reduce((sum, task) => sum + task.estimatedDrainPctPerHour, 0).toFixed(1)
  );

  const severity: BatteryUsageWarning['severity'] =
    lowBatteryDischarging || activeHighPowerTasks.length >= 2 ? 'elevated' : 'subtle';

  const taskSummary = relevantTasks.map((t) => t.name).join(', ');
  const batteryText =
    batteryLevelPct !== null
      ? ` · ${Math.round(batteryLevelPct)}% battery${isCharging ? ' (charging)' : ''}`
      : '';

  return {
    severity,
    headline:
      severity === 'elevated'
        ? 'Elevated background power draw during focus session'
        : 'High-power background task active during focus session',
    detail: `${taskSummary} (+${estimatedExtraDrainPctPerHour}%/hr est.)${batteryText}`,
    activeTaskNames: relevantTasks.map((t) => t.name),
    estimatedExtraDrainPctPerHour,
    batteryLevelPct,
    isCharging,
  };
}

const POWER_TASKS_KEY = 'focus_os_stage3_power_tasks_v1';

export function loadBackgroundPowerTasks(): BackgroundPowerTask[] {
  const defaults = getDefaultBackgroundPowerTasks();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(POWER_TASKS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<BackgroundPowerTask>[];
    if (!Array.isArray(parsed)) return defaults;
    return defaults.map((def) => {
      const saved = parsed.find((item) => item && item.id === def.id);
      return saved && typeof saved.enabled === 'boolean'
        ? { ...def, enabled: saved.enabled }
        : def;
    });
  } catch {
    return defaults;
  }
}

export function saveBackgroundPowerTasks(tasks: BackgroundPowerTask[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(POWER_TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // Ignore quota errors
  }
}

