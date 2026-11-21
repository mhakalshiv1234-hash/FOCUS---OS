import { AppCategory, SAMPLE_ANDROID_APPS, isProtectedSafetyPackage } from './appSelection';
import {
  CommandCenterState,
  WeeklyFocusDay,
  buildWeeklyDisciplineTrend,
} from './discipline';

export type AnalyticsFilterScope = 'all' | 'distracting' | 'productive' | 'blocklisted';
export type AnalyticsSortMode = 'most_used' | 'launches' | 'name';

export interface AppUsageRecord {
  packageName: string;
  appName: string;
  category: AppCategory;
  monogram: string;
  accentHex: string;
  minutesToday: number;
  launchesToday: number;
  lastUsedLabel: string;
  weeklyMinutes: number[]; // 7 entries aligned with weeklyHistory [D-6 .. Today]
}

export interface AppUsageRow extends AppUsageRecord {
  isDistracting: boolean;
  isBlocklisted: boolean;
  sharePct: number;
  weeklyTotalMinutes: number;
}

export interface CategoryUsageItem {
  category: AppCategory;
  totalMinutes: number;
  sharePct: number;
  isDistracting: boolean;
}

export interface UsageAnalyticsSummary {
  usageAccessGranted: boolean;
  totalScreenTimeMinutes: number;
  distractingMinutes: number;
  productiveMinutes: number;
  otherMinutes: number;
  distractionSharePct: number;
  focusToDistractionRatio: number;
  topDistractingApp: AppUsageRow | null;
  categoryBreakdown: CategoryUsageItem[];
  apps: AppUsageRow[];
}

export interface WeeklyTrendSummary {
  avgFocusMinutes: number;
  avgScreenTimeMinutes: number;
  avgDistractingMinutes: number;
  avgDisciplineScore: number;
  focusStreakDays: number;
  bestDayLabel: string;
  bestDayScore: number;
  deltaFromStartPts: number;
}

export function isDistractingCategory(category: AppCategory): boolean {
  return category === 'Social' || category === 'Video' || category === 'Games';
}

export function getDefaultAppUsageRecords(): AppUsageRecord[] {
  const presets: Record<
    string,
    { minutesToday: number; launchesToday: number; lastUsedLabel: string; weeklyMinutes: number[] }
  > = {
    'md.obsidian': {
      minutesToday: 62,
      launchesToday: 6,
      lastUsedLabel: '14m ago',
      weeklyMinutes: [48, 66, 52, 74, 86, 70, 62],
    },
    'com.ichi2.anki': {
      minutesToday: 42,
      launchesToday: 5,
      lastUsedLabel: '32m ago',
      weeklyMinutes: [34, 48, 38, 54, 62, 46, 42],
    },
    'com.android.chrome': {
      minutesToday: 20,
      launchesToday: 7,
      lastUsedLabel: '25m ago',
      weeklyMinutes: [34, 24, 30, 22, 18, 26, 20],
    },
    'com.google.android.youtube': {
      minutesToday: 10,
      launchesToday: 4,
      lastUsedLabel: '48m ago',
      weeklyMinutes: [28, 18, 22, 12, 8, 15, 10],
    },
    'com.instagram.android': {
      minutesToday: 5,
      launchesToday: 3,
      lastUsedLabel: '2h ago',
      weeklyMinutes: [16, 10, 14, 6, 4, 8, 5],
    },
    'com.reddit.frontpage': {
      minutesToday: 3,
      launchesToday: 2,
      lastUsedLabel: '3h ago',
      weeklyMinutes: [8, 6, 12, 4, 2, 5, 3],
    },
    'com.zhiliaoapp.musically': {
      minutesToday: 0,
      launchesToday: 0,
      lastUsedLabel: 'Shielded',
      weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
    },
    'com.twitter.android': {
      minutesToday: 0,
      launchesToday: 0,
      lastUsedLabel: 'Unused today',
      weeklyMinutes: [6, 2, 4, 0, 0, 3, 0],
    },
    'com.discord': {
      minutesToday: 0,
      launchesToday: 0,
      lastUsedLabel: 'Unused today',
      weeklyMinutes: [10, 4, 6, 2, 0, 4, 0],
    },
    'com.supercell.clashroyale': {
      minutesToday: 0,
      launchesToday: 0,
      lastUsedLabel: 'Unused today',
      weeklyMinutes: [12, 5, 8, 0, 0, 0, 0],
    },
  };

  return SAMPLE_ANDROID_APPS.filter(
    (app) => !app.isProtectedSafetyApp && !isProtectedSafetyPackage(app.packageName)
  ).map((app) => {
    const preset = presets[app.packageName] ?? {
      minutesToday: 0,
      launchesToday: 0,
      lastUsedLabel: 'Unused today',
      weeklyMinutes: [0, 0, 0, 0, 0, 0, 0],
    };
    return {
      packageName: app.packageName,
      appName: app.appName,
      category: app.category,
      monogram: app.monogram,
      accentHex: app.accentHex,
      ...preset,
    };
  });
}

export function computeUsageAnalyticsSummary(params: {
  records: AppUsageRecord[];
  blockedPackages: string[];
  usageAccessGranted: boolean;
  focusMinutesToday: number;
  rangeDays?: 1 | 7;
}): UsageAnalyticsSummary {
  const { records, blockedPackages, usageAccessGranted, focusMinutesToday, rangeDays = 1 } = params;
  const blockedSet = new Set(blockedPackages);

  if (!usageAccessGranted) {
    return {
      usageAccessGranted: false,
      totalScreenTimeMinutes: 0,
      distractingMinutes: 0,
      productiveMinutes: 0,
      otherMinutes: 0,
      distractionSharePct: 0,
      focusToDistractionRatio: 0,
      topDistractingApp: null,
      categoryBreakdown: [],
      apps: [],
    };
  }

  const getMetricMinutes = (rec: AppUsageRecord) =>
    rangeDays === 7
      ? rec.weeklyMinutes.reduce((sum, val) => sum + val, 0)
      : rec.minutesToday;

  const totalScreen = records.reduce((sum, rec) => sum + getMetricMinutes(rec), 0);

  const rows: AppUsageRow[] = records
    .map((rec) => {
      const used = getMetricMinutes(rec);
      const weeklyTotal = rec.weeklyMinutes.reduce((sum, val) => sum + val, 0);
      return {
        ...rec,
        minutesToday: used,
        isDistracting: isDistractingCategory(rec.category),
        isBlocklisted: blockedSet.has(rec.packageName),
        sharePct: totalScreen > 0 ? Math.round((used / totalScreen) * 100) : 0,
        weeklyTotalMinutes: weeklyTotal,
      };
    })
    .sort((a, b) => b.minutesToday - a.minutesToday || a.appName.localeCompare(b.appName));

  const distractingMinutes = rows
    .filter((r) => r.isDistracting)
    .reduce((sum, r) => sum + r.minutesToday, 0);
  const productiveMinutes = rows
    .filter((r) => r.category === 'Productivity')
    .reduce((sum, r) => sum + r.minutesToday, 0);
  const otherMinutes = Math.max(0, totalScreen - distractingMinutes - productiveMinutes);

  const distractionSharePct =
    totalScreen > 0 ? Math.min(100, Math.round((distractingMinutes / totalScreen) * 100)) : 0;

  const effectiveFocus = rangeDays === 7 ? focusMinutesToday * 7 : focusMinutesToday;
  const focusToDistractionRatio =
    distractingMinutes > 0
      ? Number((effectiveFocus / distractingMinutes).toFixed(1))
      : effectiveFocus > 0
      ? effectiveFocus
      : 0;

  const categories: AppCategory[] = ['Productivity', 'Browser', 'Video', 'Social', 'Games', 'Other'];
  const categoryBreakdown: CategoryUsageItem[] = categories
    .map((category) => {
      const mins = rows
        .filter((r) => r.category === category)
        .reduce((sum, r) => sum + r.minutesToday, 0);
      return {
        category,
        totalMinutes: mins,
        sharePct: totalScreen > 0 ? Math.round((mins / totalScreen) * 100) : 0,
        isDistracting: isDistractingCategory(category),
      };
    })
    .filter((item) => item.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  return {
    usageAccessGranted: true,
    totalScreenTimeMinutes: totalScreen,
    distractingMinutes,
    productiveMinutes,
    otherMinutes,
    distractionSharePct,
    focusToDistractionRatio,
    topDistractingApp: rows.find((r) => r.isDistracting && r.minutesToday > 0) ?? null,
    categoryBreakdown,
    apps: rows,
  };
}

export function filterAndSortUsageRows(params: {
  rows: AppUsageRow[];
  searchQuery: string;
  scope: AnalyticsFilterScope;
  sortBy: AnalyticsSortMode;
}): AppUsageRow[] {
  const q = params.searchQuery.trim().toLowerCase();
  const filtered = params.rows.filter((row) => {
    const matchesQuery =
      !q ||
      row.appName.toLowerCase().includes(q) ||
      row.packageName.toLowerCase().includes(q) ||
      row.category.toLowerCase().includes(q);
    if (!matchesQuery) return false;
    if (params.scope === 'distracting') return row.isDistracting;
    if (params.scope === 'productive') return row.category === 'Productivity';
    if (params.scope === 'blocklisted') return row.isBlocklisted;
    return true;
  });

  return [...filtered].sort((a, b) => {
    if (params.sortBy === 'launches') {
      return b.launchesToday - a.launchesToday || b.minutesToday - a.minutesToday;
    }
    if (params.sortBy === 'name') {
      return a.appName.localeCompare(b.appName);
    }
    return b.minutesToday - a.minutesToday || b.launchesToday - a.launchesToday || a.appName.localeCompare(b.appName);
  });
}

export function computeWeeklyTrendSummary(params: {
  history: WeeklyFocusDay[];
  appUsageRecords: AppUsageRecord[];
  usageAccessGranted: boolean;
  focusTargetMinutes: number;
  plannedMissionsCount: number;
}): WeeklyTrendSummary {
  const { history, appUsageRecords, usageAccessGranted, focusTargetMinutes, plannedMissionsCount } =
    params;

  if (history.length === 0) {
    return {
      avgFocusMinutes: 0,
      avgScreenTimeMinutes: 0,
      avgDistractingMinutes: 0,
      avgDisciplineScore: 0,
      focusStreakDays: 0,
      bestDayLabel: '--',
      bestDayScore: 0,
      deltaFromStartPts: 0,
    };
  }

  const trend = buildWeeklyDisciplineTrend(history, focusTargetMinutes, plannedMissionsCount);

  let streak = 0;
  for (let i = trend.length - 1; i >= 0; i--) {
    const point = trend[i];
    if (point.score >= 70 || point.focusMinutes >= focusTargetMinutes * 0.75) {
      streak += 1;
    } else {
      break;
    }
  }

  const best = trend.reduce(
    (max, pt) => (pt.score > max.score ? pt : max),
    trend[0]
  );
  const deltaFromStartPts =
    trend.length >= 2 ? trend[trend.length - 1].score - trend[0].score : 0;

  const avgFocusMinutes = Math.round(
    history.reduce((sum, d) => sum + d.focusMinutes, 0) / history.length
  );
  const avgDistractingMinutes = Math.round(
    history.reduce((sum, d) => sum + d.distractingMinutes, 0) / history.length
  );
  const avgDisciplineScore = Math.round(
    trend.reduce((sum, pt) => sum + pt.score, 0) / trend.length
  );

  const avgScreenTimeMinutes = usageAccessGranted
    ? Math.round(
        history.reduce((sum, _, idx) => {
          const dayScreen = appUsageRecords.reduce(
            (acc, rec) => acc + (rec.weeklyMinutes[idx] ?? 0),
            0
          );
          return sum + dayScreen;
        }, 0) / history.length
      )
    : 0;

  return {
    avgFocusMinutes,
    avgScreenTimeMinutes,
    avgDistractingMinutes,
    avgDisciplineScore,
    focusStreakDays: streak,
    bestDayLabel: best.dayLabel,
    bestDayScore: best.score,
    deltaFromStartPts,
  };
}

export function simulateAppUsageMinutes(
  records: AppUsageRecord[],
  packageName: string,
  deltaMinutes: number
): AppUsageRecord[] {
  const safeDelta = Math.max(0, Math.round(deltaMinutes));
  if (safeDelta === 0) return records;
  return records.map((rec) => {
    if (rec.packageName !== packageName) return rec;
    const nextWeekly = [...rec.weeklyMinutes];
    const lastIdx = nextWeekly.length - 1;
    if (lastIdx >= 0) {
      nextWeekly[lastIdx] = nextWeekly[lastIdx] + safeDelta;
    }
    return {
      ...rec,
      minutesToday: rec.minutesToday + safeDelta,
      launchesToday: rec.launchesToday + 1,
      lastUsedLabel: 'Just now',
      weeklyMinutes: nextWeekly,
    };
  });
}

export function syncUsageStatsIntoCommandState(
  state: CommandCenterState,
  records: AppUsageRecord[],
  usageAccessGranted: boolean
): CommandCenterState {
  if (!usageAccessGranted) {
    return {
      ...state,
      screenTimeMinutesToday: 0,
      distractingMinutesToday: 0,
    };
  }

  const totalScreenToday = records.reduce((sum, r) => sum + r.minutesToday, 0);
  const distractingToday = records
    .filter((r) => isDistractingCategory(r.category))
    .reduce((sum, r) => sum + r.minutesToday, 0);

  const nextWeeklyHistory = state.weeklyHistory.map((day, idx) => {
    const dayDistracting = records
      .filter((r) => isDistractingCategory(r.category))
      .reduce((sum, r) => sum + (r.weeklyMinutes[idx] ?? 0), 0);
    if (idx === state.weeklyHistory.length - 1) {
      return {
        ...day,
        distractingMinutes: distractingToday,
      };
    }
    return {
      ...day,
      distractingMinutes: dayDistracting,
    };
  });

  return {
    ...state,
    screenTimeMinutesToday: totalScreenToday,
    distractingMinutesToday: distractingToday,
    weeklyHistory: nextWeeklyHistory,
  };
}

const USAGE_RECORDS_KEY = 'focus_os_stage6_usage_records_v1';
const USAGE_ACCESS_KEY = 'focus_os_stage6_usage_access_v1';

export function loadAppUsageRecords(): AppUsageRecord[] {
  const defaults = getDefaultAppUsageRecords();
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(USAGE_RECORDS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as AppUsageRecord[];
    if (!Array.isArray(parsed) || parsed.length === 0) return defaults;
    return defaults.map((def) => {
      const saved = parsed.find((item) => item && item.packageName === def.packageName);
      if (!saved || typeof saved.minutesToday !== 'number') return def;
      return {
        ...def,
        minutesToday: Math.max(0, saved.minutesToday),
        launchesToday: typeof saved.launchesToday === 'number' ? Math.max(0, saved.launchesToday) : def.launchesToday,
        lastUsedLabel: typeof saved.lastUsedLabel === 'string' ? saved.lastUsedLabel : def.lastUsedLabel,
        weeklyMinutes:
          Array.isArray(saved.weeklyMinutes) && saved.weeklyMinutes.length === 7
            ? saved.weeklyMinutes
            : def.weeklyMinutes,
      };
    });
  } catch {
    return defaults;
  }
}

export function saveAppUsageRecords(records: AppUsageRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USAGE_RECORDS_KEY, JSON.stringify(records));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadUsageAccessGranted(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = window.localStorage.getItem(USAGE_ACCESS_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function saveUsageAccessGranted(granted: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(USAGE_ACCESS_KEY, granted ? 'true' : 'false');
  } catch {
    // Ignore storage quota errors
  }
}
