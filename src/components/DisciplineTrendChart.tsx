import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  WeeklyFocusDay,
  WeeklyDisciplinePoint,
  buildWeeklyDisciplineTrend,
  formatMinutesCompact,
} from '../utils/discipline';
import { UiThemeId, getUiThemeDefinition } from '../utils/themeSettings';

interface DisciplineTrendChartProps {
  history: WeeklyFocusDay[];
  focusTargetMinutes: number;
  plannedMissionsCount: number;
  uiTheme?: UiThemeId;
}

interface TooltipPayloadItem {
  payload?: WeeklyDisciplinePoint;
}

const CustomTrendTooltip: React.FC<{
  active?: boolean;
  payload?: TooltipPayloadItem[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0 || !payload[0].payload) {
    return null;
  }
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center justify-between gap-4 border-b border-[#1E2534] pb-1">
        <span className="font-semibold text-slate-100">{point.dayLabel}</span>
        <span className="font-semibold text-rose-400 tabular-nums">
          {point.score} / 100
        </span>
      </div>
      <div className="mt-1.5 space-y-0.5 text-xs text-slate-400 tabular-nums">
        <p>Tier: {point.statusLabel}</p>
        <p>Focus: {formatMinutesCompact(point.focusMinutes)}</p>
        <p>Distracting: {formatMinutesCompact(point.distractingMinutes)}</p>
      </div>
    </div>
  );
};

export const DisciplineTrendChart: React.FC<DisciplineTrendChartProps> = ({
  history,
  focusTargetMinutes,
  plannedMissionsCount,
  uiTheme = 'nda-khadakwasla',
}) => {
  const isTerminal = uiTheme === 'terminal';
  const tickFont = isTerminal ? 'JetBrains Mono' : 'Plus Jakarta Sans';
  const palette = getUiThemeDefinition(uiTheme).chartPalette;
  const data = useMemo(
    () => buildWeeklyDisciplineTrend(history, focusTargetMinutes, plannedMissionsCount),
    [history, focusTargetMinutes, plannedMissionsCount]
  );

  const avgScore = useMemo(() => {
    if (data.length === 0) return 0;
    return Math.round(data.reduce((sum, item) => sum + item.score, 0) / data.length);
  }, [data]);

  const delta = data.length >= 2 ? data[data.length - 1].score - data[0].score : 0;

  return (
    <section
      aria-label="Discipline Score 7-day trend"
      data-testid="discipline-trend-chart"
      className="h-full rounded-xl border border-[#232B3A] bg-[#141923] p-5 flex flex-col justify-between"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-[#1E2534] pb-3.5">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            Discipline Score Trend
          </h3>
          <p className="text-xs text-slate-400">7-day progression · 85+ target benchmark</p>
        </div>
        <div className="text-right tabular-nums">
          <span className="text-sm font-semibold text-slate-100">Avg {avgScore}</span>
          <span
            className={`ml-2 text-xs font-medium ${
              delta >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {delta >= 0 ? `+${delta}` : delta} pts
          </span>
        </div>
      </div>

      <div className="mt-4 h-44 w-full min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
            <CartesianGrid stroke={palette.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="dayLabel"
              stroke={palette.axisText}
              tick={{ fill: palette.axisText, fontSize: 11, fontFamily: tickFont }}
              tickLine={false}
              axisLine={{ stroke: palette.track }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              stroke={palette.axisText}
              tick={{ fill: palette.axisText, fontSize: 11, fontFamily: tickFont }}
              tickLine={false}
              axisLine={false}
            />
            <ReferenceLine
              y={85}
              stroke={palette.secondaryAccent}
              strokeOpacity={0.65}
              strokeDasharray="4 4"
            />
            <Tooltip
              content={<CustomTrendTooltip />}
              cursor={{ stroke: palette.track, strokeWidth: 1 }}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Discipline Score"
              stroke={palette.accent}
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#141923', stroke: palette.accent, strokeWidth: 2 }}
              activeDot={{ r: 5.5, fill: '#f8fafc', stroke: palette.secondaryAccent, strokeWidth: 2 }}
              isAnimationActive={true}
              animationDuration={250}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
};
