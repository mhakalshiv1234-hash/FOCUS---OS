import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Activity, Lock, RotateCcw, Shield, ShieldCheck, ShieldOff } from 'lucide-react';
import { formatMinutesCompact } from '../utils/discipline';
import { UiThemeId, getUiThemeDefinition } from '../utils/themeSettings';
import {
  AnalyticsFilterScope,
  AnalyticsSortMode,
  CategoryUsageItem,
  UsageAnalyticsSummary,
  WeeklyTrendSummary,
  filterAndSortUsageRows,
} from '../utils/usageAnalytics';

interface AnalyticsViewProps {
  summary: UsageAnalyticsSummary;
  weeklyTrend: WeeklyTrendSummary;
  focusMinutesToday: number;
  focusTargetMinutes: number;
  usageAccessGranted: boolean;
  rangeDays: 1 | 7;
  isNuclearLocked: boolean;
  uiTheme?: UiThemeId;
  onChangeRangeDays: (days: 1 | 7) => void;
  onToggleUsageAccess: () => void;
  onSimulateAppUsage: (packageName: string, deltaMinutes: number) => void;
  onTogglePackageBlock: (packageName: string) => void;
  onResetUsageDemo: () => void;
}

interface CategoryTooltipPayload {
  payload?: CategoryUsageItem;
}

const CategoryTooltip: React.FC<{
  active?: boolean;
  payload?: CategoryTooltipPayload[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const item = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center justify-between gap-4 border-b border-[#1E2534] pb-1">
        <span className="font-semibold text-slate-100">{item.category}</span>
        <span
          className={`font-semibold tabular-nums ${
            item.isDistracting ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {formatMinutesCompact(item.totalMinutes)}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400 tabular-nums">
        {item.sharePct}% of tracked screen time ·{' '}
        {item.isDistracting ? 'Distracting tier' : 'Productive / Neutral'}
      </p>
    </div>
  );
};

const SCOPE_OPTIONS: { id: AnalyticsFilterScope; label: string }[] = [
  { id: 'all', label: 'All Apps' },
  { id: 'distracting', label: 'Distracting' },
  { id: 'productive', label: 'Productive' },
  { id: 'blocklisted', label: 'Blocked' },
];

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  summary,
  weeklyTrend,
  focusMinutesToday,
  focusTargetMinutes,
  usageAccessGranted,
  rangeDays,
  isNuclearLocked,
  uiTheme = 'nda-khadakwasla',
  onChangeRangeDays,
  onToggleUsageAccess,
  onSimulateAppUsage,
  onTogglePackageBlock,
  onResetUsageDemo,
}) => {
  const isTerminal = uiTheme === 'terminal';
  const tickFont = isTerminal ? 'JetBrains Mono' : 'Plus Jakarta Sans';
  const palette = getUiThemeDefinition(uiTheme).chartPalette;
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<AnalyticsFilterScope>('all');
  const [sortBy, setSortBy] = useState<AnalyticsSortMode>('most_used');

  const filteredApps = useMemo(
    () =>
      filterAndSortUsageRows({
        rows: summary.apps,
        searchQuery,
        scope,
        sortBy,
      }),
    [summary.apps, searchQuery, scope, sortBy]
  );

  const maxRowMinutes = useMemo(
    () => Math.max(1, ...summary.apps.map((r) => r.minutesToday)),
    [summary.apps]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-[#1E2534] pb-5">
        <div className="min-w-0">
          <h1 className="font-display text-3xl sm:text-[34px] font-bold tracking-tight text-slate-50 text-balance">
            Screen Time &amp; Insights
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Daily app usage breakdown, focus balance, and distraction trends
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 shrink-0">
          {/* Range toggle */}
          <div
            role="group"
            aria-label="Analytics time range"
            className="inline-flex rounded-lg border border-[#232B3A] bg-[#141923] p-0.5 shrink-0"
          >
            <button
              type="button"
              data-testid="analytics-range-1d"
              onClick={() => onChangeRangeDays(1)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] ${
                rangeDays === 1
                  ? 'bg-rose-700 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              Today (1d)
            </button>
            <button
              type="button"
              data-testid="analytics-range-7d"
              onClick={() => onChangeRangeDays(7)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] ${
                rangeDays === 7
                  ? 'bg-rose-700 text-white'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              7 Days
            </button>
          </div>

          <button
            type="button"
            data-testid="toggle-usage-access-btn"
            onClick={onToggleUsageAccess}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 min-h-[38px] ${
              usageAccessGranted
                ? 'border-emerald-700/60 bg-emerald-950/35 text-emerald-400 hover:border-emerald-500'
                : 'border-rose-700/70 bg-rose-950/35 text-rose-300 hover:border-rose-500'
            }`}
          >
            {usageAccessGranted ? (
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ShieldOff className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{usageAccessGranted ? 'Tracking: Active' : 'Tracking: Paused'}</span>
          </button>

          <button
            type="button"
            data-testid="reset-usage-demo-btn"
            onClick={onResetUsageDemo}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#232B3A] bg-[#141923] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white whitespace-nowrap shrink-0 min-h-[38px]"
          >
            <RotateCcw className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Permission Gate State */}
      {!usageAccessGranted ? (
        <section
          aria-label="Usage Access permission required"
          data-testid="usage-access-required-panel"
          className="rounded-xl border border-rose-500/40 bg-[#141923] p-8 text-center space-y-4"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-rose-500/40 bg-rose-950/30">
            <Activity className="h-6 w-6 text-rose-400" aria-hidden="true" />
          </div>
          <div className="mx-auto max-w-lg space-y-2">
            <h2 className="font-display text-lg font-semibold text-slate-100">
              Usage Tracking is Paused
            </h2>
            <p className="text-xs leading-relaxed text-slate-400">
              Enable usage tracking to measure daily screen time, distracting usage ratios, and app-by-app activity insights.
            </p>
          </div>
          <button
            type="button"
            data-testid="grant-usage-access-cta"
            onClick={onToggleUsageAccess}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-700 px-5 py-2.5 text-xs font-semibold text-white hover:bg-rose-600 transition-colors min-h-[40px]"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>Enable Usage Tracking</span>
          </button>
        </section>
      ) : (
        <>
          {/* 4-Column Analytics KPI Strip */}
          <section
            aria-label="Screen time summary KPIs"
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
              <p className="text-xs font-medium text-slate-400">
                {rangeDays === 7 ? '7-Day Screen Time' : 'Today Screen Time'}
              </p>
              <p
                data-testid="analytics-total-screentime"
                className="mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-slate-50 tabular-nums"
              >
                {formatMinutesCompact(summary.totalScreenTimeMinutes)}
              </p>
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                {formatMinutesCompact(summary.productiveMinutes)} productive
              </p>
            </div>

            <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
              <p className="text-xs font-medium text-slate-400">Distracting Usage</p>
              <p
                data-testid="analytics-distracting-minutes"
                className={`mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight tabular-nums ${
                  summary.distractingMinutes > (rangeDays === 7 ? 105 : 15)
                    ? 'text-rose-400'
                    : 'text-slate-50'
                }`}
              >
                {formatMinutesCompact(summary.distractingMinutes)}
              </p>
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                {summary.distractionSharePct}% of total screen time
              </p>
            </div>

            <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
              <p className="text-xs font-medium text-slate-400">Focus / Distraction</p>
              <p className="mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-[#D4AD5A] tabular-nums">
                {summary.focusToDistractionRatio}x
              </p>
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                Today {formatMinutesCompact(focusMinutesToday)} /{' '}
                {formatMinutesCompact(focusTargetMinutes)} target
              </p>
            </div>

            <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5">
              <p className="text-xs font-medium text-slate-400">7-Day Focus Streak</p>
              <p className="mt-2 font-display text-2xl sm:text-[28px] font-bold tracking-tight text-emerald-400 tabular-nums">
                {weeklyTrend.focusStreakDays} / 7d
              </p>
              <p className="mt-1 text-xs text-slate-400 tabular-nums">
                7d Avg Score {weeklyTrend.avgDisciplineScore} · Best {weeklyTrend.bestDayLabel} (
                {weeklyTrend.bestDayScore})
              </p>
            </div>
          </section>

          {/* Category Breakdown Chart + 7-Day Discipline Averages */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <section
              aria-label="Category usage breakdown"
              className="lg:col-span-7 rounded-xl border border-[#232B3A] bg-[#141923] p-5 flex flex-col justify-between"
            >
              <div className="flex items-baseline justify-between gap-4 border-b border-[#1E2534] pb-3.5">
                <div>
                  <h2 className="font-display text-base font-semibold text-slate-100">
                    Usage by App Category
                  </h2>
                  <p className="text-xs text-slate-400">
                    {rangeDays === 7 ? 'Cumulative 7-day breakdown' : 'Today app activity'} ·{' '}
                    {isTerminal ? 'Amber' : 'Crimson'} indicates distracting apps
                  </p>
                </div>
                <span className="text-xs font-medium text-slate-400 tabular-nums">
                  {summary.categoryBreakdown.length} categories
                </span>
              </div>

              <div className="mt-4 h-52 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary.categoryBreakdown}
                    margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="category"
                      stroke={palette.axisText}
                      tick={{ fill: palette.axisText, fontSize: 11, fontFamily: tickFont }}
                      tickLine={false}
                      axisLine={{ stroke: palette.track }}
                    />
                    <YAxis
                      stroke={palette.axisText}
                      tick={{ fill: palette.axisText, fontSize: 11, fontFamily: tickFont }}
                      tickLine={false}
                      axisLine={false}
                      unit="m"
                    />
                    <Tooltip
                      content={<CategoryTooltip />}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="totalMinutes" radius={[isTerminal ? 1 : 6, isTerminal ? 1 : 6, 0, 0]} maxBarSize={44}>
                      {summary.categoryBreakdown.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={
                            isTerminal
                              ? entry.isDistracting
                                ? '#FFB000'
                                : entry.category === 'Productivity'
                                  ? '#00FF66'
                                  : '#2E8B57'
                              : entry.isDistracting
                                ? '#E11D48'
                                : entry.category === 'Productivity'
                                  ? '#10b981'
                                  : '#64748b'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section
              aria-label="Weekly discipline metrics"
              className="lg:col-span-5 rounded-xl border border-[#232B3A] bg-[#141923] p-5 flex flex-col justify-between gap-4"
            >
              <div className="border-b border-[#1E2534] pb-3.5">
                <h2 className="font-display text-base font-semibold text-slate-100">
                  7-Day Focus Benchmarks
                </h2>
                <p className="text-xs text-slate-400">
                  Rolling averages synced with your daily progress
                </p>
              </div>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-xs">
                <div className="border-b border-[#1E2534] pb-3">
                  <span className="text-slate-400">Daily Avg Focus</span>
                  <p className="mt-1 font-display text-xl font-bold text-slate-100 tabular-nums">
                    {formatMinutesCompact(weeklyTrend.avgFocusMinutes)}
                  </p>
                </div>
                <div className="border-b border-[#1E2534] pb-3">
                  <span className="text-slate-400">Daily Avg Screen</span>
                  <p className="mt-1 font-display text-xl font-bold text-slate-100 tabular-nums">
                    {formatMinutesCompact(weeklyTrend.avgScreenTimeMinutes)}
                  </p>
                </div>
                <div className="border-b border-[#1E2534] pb-3">
                  <span className="text-slate-400">Daily Avg Distracting</span>
                  <p className="mt-1 font-display text-xl font-bold text-rose-400 tabular-nums">
                    {formatMinutesCompact(weeklyTrend.avgDistractingMinutes)}
                  </p>
                </div>
                <div className="border-b border-[#1E2534] pb-3">
                  <span className="text-slate-400">7d Score Progression</span>
                  <p
                    className={`mt-1 font-display text-xl font-bold tabular-nums ${
                      weeklyTrend.deltaFromStartPts >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {weeklyTrend.deltaFromStartPts >= 0
                      ? `+${weeklyTrend.deltaFromStartPts}`
                      : weeklyTrend.deltaFromStartPts}{' '}
                    pts
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1 text-xs">
                <span className="text-slate-400">Top Distracting App</span>
                <span className="font-semibold text-slate-100 tabular-nums truncate">
                  {summary.topDistractingApp
                    ? `${summary.topDistractingApp.appName} · ${formatMinutesCompact(
                        summary.topDistractingApp.minutesToday
                      )}`
                    : 'None recorded'}
                </span>
              </div>
            </section>
          </div>

          {/* Per-App Usage Breakdown */}
          <section
            aria-label="Per-app usage statistics"
            className="rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-4"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E2534] pb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100">
                  App Screen Time Breakdown ({filteredApps.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Review app time spent, test score impact, or block distracting apps with one tap.
                </p>
              </div>

              {isNuclearLocked && (
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[#D4AD5A] shrink-0">
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Strict Lock active · Blocklist edits locked</span>
                </div>
              )}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter apps by usage category">
                {SCOPE_OPTIONS.map((opt) => {
                  const active = scope === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setScope(opt.id)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap min-h-[34px] ${
                        active
                          ? 'bg-rose-700 text-white'
                          : 'border border-[#232B3A] bg-[#0F131B] text-slate-400 hover:text-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <label htmlFor="analytics-app-search" className="sr-only">
                  Search tracked apps
                </label>
                <input
                  id="analytics-app-search"
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search apps..."
                  className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none min-h-[36px]"
                />

                <label htmlFor="analytics-sort-select" className="sr-only">
                  Sort apps
                </label>
                <select
                  id="analytics-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as AnalyticsSortMode)}
                  className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-1.5 text-xs text-slate-200 focus:border-rose-500 focus:outline-none min-h-[36px]"
                >
                  <option value="most_used">Sort: Most Used</option>
                  <option value="launches">Sort: Opens</option>
                  <option value="name">Sort: Name</option>
                </select>
              </div>
            </div>

            {filteredApps.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400">
                No tracked applications match your current filter.
              </div>
            ) : (
              <div className="divide-y divide-[#1E2534]" data-testid="analytics-app-list">
                {filteredApps.map((app) => {
                  const barPct = Math.round((app.minutesToday / maxRowMinutes) * 100);
                  return (
                    <div
                      key={app.packageName}
                      data-testid={`analytics-row-${app.packageName}`}
                      className="py-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 lg:w-72 shrink-0">
                        <div
                          aria-hidden="true"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#2A3346] font-display text-xs font-semibold text-white"
                          style={{ backgroundColor: `${app.accentHex}22`, borderColor: `${app.accentHex}55` }}
                        >
                          {app.monogram}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-slate-100 truncate">
                              {app.appName}
                            </p>
                            {app.isDistracting && (
                              <span className="text-xs font-medium text-rose-400 shrink-0">
                                Distracting
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 truncate tabular-nums">
                            {app.category} · {app.launchesToday} opens · {app.lastUsedLabel}
                          </p>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#232B3A]">
                          <div
                            className={`h-full transition-all duration-200 ${
                              app.isDistracting
                                ? 'bg-rose-600'
                                : app.category === 'Productivity'
                                ? 'bg-emerald-500'
                                : 'bg-slate-500'
                            }`}
                            style={{ width: `${Math.max(app.minutesToday > 0 ? 4 : 0, barPct)}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-400 tabular-nums">
                          <span>
                            {app.isBlocklisted
                              ? 'Blocked in App Blocker'
                              : app.isDistracting
                                ? 'Distracting tier'
                                : 'Productive / Neutral'}
                          </span>
                          <span className="font-medium text-slate-200">
                            {formatMinutesCompact(app.minutesToday)} ({app.sharePct}%)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          data-testid={`simulate-usage-${app.packageName}`}
                          onClick={() => onSimulateAppUsage(app.packageName, 15)}
                          className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-2.5 py-1.5 text-xs font-medium text-slate-300 tabular-nums hover:border-slate-500 hover:text-white whitespace-nowrap min-h-[34px]"
                        >
                          +15m Usage
                        </button>

                        <button
                          type="button"
                          disabled={isNuclearLocked}
                          data-testid={`shield-toggle-${app.packageName}`}
                          onClick={() => onTogglePackageBlock(app.packageName)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap min-h-[34px] transition-colors disabled:opacity-45 disabled:cursor-not-allowed ${
                            app.isBlocklisted
                              ? 'border-rose-600/70 bg-rose-950/40 text-rose-300 hover:border-rose-500'
                              : 'border-[#232B3A] bg-[#0F131B] text-slate-300 hover:border-slate-500 hover:text-white'
                          }`}
                        >
                          <Shield className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{app.isBlocklisted ? 'Blocked' : 'Block App'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
};
