import React from 'react';
import { WeeklyFocusDay, formatMinutesCompact } from '../utils/discipline';
import { UiThemeId } from '../utils/themeSettings';

interface WeeklyFocusChartProps {
  history: WeeklyFocusDay[];
  uiTheme?: UiThemeId;
}

export const WeeklyFocusChart: React.FC<WeeklyFocusChartProps> = ({
  history,
  uiTheme = 'nda-khadakwasla',
}) => {
  const maxFocus = Math.max(240, ...history.map((d) => d.focusMinutes));
  const totalMinutes = history.reduce((sum, day) => sum + day.focusMinutes, 0);
  const isTerminal = uiTheme === 'terminal';

  return (
    <section
      aria-label="Weekly focus statistics"
      className="h-full rounded-xl border border-[#232B3A] bg-[#141923] p-5 flex flex-col justify-between"
    >
      <div className="flex items-baseline justify-between gap-4 border-b border-[#1E2534] pb-3.5">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">Weekly Focus Log</h3>
          <p className="text-xs text-slate-400">7-day focus vs distracting minutes</p>
        </div>
        <span className="text-sm font-semibold text-[#D4AD5A] tabular-nums">
          {formatMinutesCompact(totalMinutes)} total
        </span>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-2 sm:gap-3 items-end h-36">
        {history.map((day, idx) => {
          const heightPct = Math.max(8, Math.round((day.focusMinutes / maxFocus) * 100));
          const isToday = idx === history.length - 1;
          return (
            <div key={day.dateKey} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-xs font-medium text-slate-400 tabular-nums">
                {Math.round((day.focusMinutes / 60) * 10) / 10}h
              </span>
              <div className="w-full max-w-[36px] flex-1 flex items-end justify-center">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full rounded-t-md transition-all duration-200 ${
                    isToday
                      ? 'bg-rose-600'
                      : isTerminal
                        ? 'bg-[#14532D] hover:bg-[#1D7A43]'
                        : 'bg-slate-600/85 hover:bg-slate-500'
                  }`}
                  title={`${day.dayLabel}: ${formatMinutesCompact(day.focusMinutes)} focus · ${day.distractingMinutes}m distraction`}
                />
              </div>
              <span className={`text-xs ${isToday ? 'font-semibold text-slate-100' : 'text-slate-400'}`}>
                {day.dayLabel}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
