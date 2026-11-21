import React, { useMemo } from 'react';
import { CheckCircle2 } from 'lucide-react';
import {
  CompletedMissionRecord,
  formatMinutesCompact,
  getRecentCompletedMissionSummaries,
} from '../utils/discipline';

interface CompletedMissionsCardProps {
  records: CompletedMissionRecord[];
}

export const CompletedMissionsCard: React.FC<CompletedMissionsCardProps> = ({ records }) => {
  const recentFive = useMemo(
    () => getRecentCompletedMissionSummaries(records, 5),
    [records]
  );

  const totalRecentMinutes = useMemo(
    () => recentFive.reduce((sum, item) => sum + item.completedMinutes, 0),
    [recentFive]
  );

  return (
    <section
      aria-label="Completed daily mission summaries"
      data-testid="completed-missions-card"
      className="rounded-xl border border-[#232B3A] bg-[#141923] p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[#1E2534] pb-3.5">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">
            Recent Completed Missions
          </h3>
          <p className="text-xs text-slate-400">
            Last 5 completed study mission summaries saved in your log
          </p>
        </div>

        <span className="text-sm font-semibold text-[#D4AD5A] tabular-nums shrink-0">
          {formatMinutesCompact(totalRecentMinutes)} logged
        </span>
      </div>

      {recentFive.length === 0 ? (
        <p className="py-6 text-center text-xs text-slate-500">
          No completed missions recorded yet. Complete an active study block to log your first summary.
        </p>
      ) : (
        <ol
          data-testid="completed-missions-list"
          className="mt-3 divide-y divide-[#1E2534]"
        >
          {recentFive.map((item) => {
            const isToday = item.dayLabel === 'Today';
            return (
              <li
                key={item.id}
                data-testid="completed-mission-row"
                className="flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-400 shrink-0"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-slate-400 tabular-nums">
                      {item.subject} · Target {formatMinutesCompact(item.targetMinutes)} met
                    </p>
                  </div>
                </div>

                <div className="flex items-baseline gap-4 shrink-0 text-right">
                  <span
                    className={`text-xs ${
                      isToday ? 'font-semibold text-[#D4AD5A]' : 'text-slate-400'
                    }`}
                  >
                    {item.dayLabel}
                  </span>
                  <span className="font-display text-sm font-semibold text-slate-100 tabular-nums min-w-[60px]">
                    {formatMinutesCompact(item.completedMinutes)}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
