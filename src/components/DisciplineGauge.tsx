import React from 'react';
import { DisciplineScoreBreakdown, formatMinutesCompact } from '../utils/discipline';
import { UiThemeId, getUiThemeDefinition } from '../utils/themeSettings';

interface DisciplineGaugeProps {
  breakdown: DisciplineScoreBreakdown;
  focusMinutesToday: number;
  focusTargetMinutes: number;
  uiTheme?: UiThemeId;
}

export const DisciplineGauge: React.FC<DisciplineGaugeProps> = ({
  breakdown,
  focusMinutesToday,
  focusTargetMinutes,
  uiTheme = 'nda-khadakwasla',
}) => {
  const palette = getUiThemeDefinition(uiTheme).chartPalette;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const arcFraction = 0.75; // 270 degree gauge
  const totalArc = circumference * arcFraction;
  const filledArc = totalArc * (breakdown.totalScore / 100);
  const goalPct = Math.min(100, Math.round((focusMinutesToday / Math.max(1, focusTargetMinutes)) * 100));

  return (
    <div className="flex h-full flex-col justify-between gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-4 flex-1">
          <div>
            <p className="text-xs font-medium text-slate-400">Daily Discipline Score</p>
            <div className="mt-1 flex items-baseline gap-3">
              <h2 className="font-display text-3xl font-bold tracking-tight text-slate-50">
                {breakdown.statusLabel}
              </h2>
              <span className="text-xs font-medium text-[#D4AD5A]">
                Focus Readiness
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 border-t border-[#1E2534] pt-4 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Focus Target</dt>
              <dd className="font-semibold text-slate-100 tabular-nums">
                +{breakdown.focusComponent}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Missions</dt>
              <dd className="font-semibold text-slate-100 tabular-nums">
                +{breakdown.missionComponent}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Resisted Blocks</dt>
              <dd className="font-semibold text-slate-100 tabular-nums">
                +{breakdown.resistanceBonus}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Distraction Penalty</dt>
              <dd className="font-semibold text-rose-400 tabular-nums">
                -{breakdown.distractionPenalty}
              </dd>
            </div>
          </dl>
        </div>

        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center self-center sm:self-auto">
          <svg viewBox="0 0 136 136" className="h-full w-full" aria-hidden="true">
            <g transform="rotate(135 68 68)">
              <circle
                cx="68"
                cy="68"
                r={radius}
                fill="none"
                stroke={palette.track}
                strokeWidth="10"
                strokeDasharray={`${totalArc} ${circumference}`}
                strokeLinecap="round"
              />
              <circle
                cx="68"
                cy="68"
                r={radius}
                fill="none"
                stroke={palette.accent}
                strokeWidth="10"
                strokeDasharray={`${filledArc} ${circumference}`}
                strokeLinecap="round"
              />
            </g>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
            <span
              data-testid="discipline-score-value"
              className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-50 tabular-nums"
            >
              {breakdown.totalScore}
            </span>
            <span className="text-xs text-slate-400 tabular-nums">/ 100</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-[#1E2534] pt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Daily Focus Goal</span>
          <span className="font-medium text-slate-200 tabular-nums">
            {formatMinutesCompact(focusMinutesToday)} / {formatMinutesCompact(focusTargetMinutes)} ({goalPct}%)
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#232B3A]">
          <div className="h-full bg-rose-600 transition-all duration-200" style={{ width: `${goalPct}%` }} />
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Score breakdown: 55 pts focus goal · 30 pts mission completion · 15 pts resisted blocks · -0.5 pt/min after 15m grace.
        </p>
      </div>
    </div>
  );
};
