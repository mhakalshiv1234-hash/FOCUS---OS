import React, { useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  HeatmapCell,
  WeeklyFocusDay,
  buildWeeklyHeatmapMatrix,
  formatMinutesCompact,
} from '../utils/discipline';
import { UiThemeId, getUiThemeDefinition } from '../utils/themeSettings';

interface WeeklyDisciplineHeatmapProps {
  history: WeeklyFocusDay[];
  focusTargetMinutes: number;
  uiTheme?: UiThemeId;
}

const SVG_WIDTH = 840;
const SVG_HEIGHT = 188;
const MARGIN = { top: 28, right: 12, bottom: 10, left: 132 };

const LEGEND_STEPS = [
  { label: '0%', value: 0 },
  { label: '25%', value: 0.25 },
  { label: '55%', value: 0.55 },
  { label: '80%', value: 0.8 },
  { label: 'Peak', value: 1 },
];

export const WeeklyDisciplineHeatmap: React.FC<WeeklyDisciplineHeatmapProps> = ({
  history,
  focusTargetMinutes,
  uiTheme = 'nda-khadakwasla',
}) => {
  const isTerminal = uiTheme === 'terminal';
  const svgFont = isTerminal ? '"JetBrains Mono", monospace' : '"Plus Jakarta Sans", sans-serif';
  const palette = getUiThemeDefinition(uiTheme).chartPalette;
  const cells = useMemo(
    () => buildWeeklyHeatmapMatrix(history, focusTargetMinutes),
    [history, focusTargetMinutes]
  );

  const [activeKey, setActiveKey] = useState<string | null>(null);

  const defaultCell = useMemo(() => {
    if (cells.length === 0) return null;
    const todayDateKey = history[history.length - 1]?.dateKey;
    const todayCells = cells.filter((c) => c.dateKey === todayDateKey);
    const pool = todayCells.some((c) => c.focusMinutes > 0) ? todayCells : cells;
    return pool.reduce((best, cur) => (cur.intensity >= best.intensity ? cur : best), pool[0]);
  }, [cells, history]);

  const activeCell: HeatmapCell | null = useMemo(() => {
    if (!activeKey) return defaultCell;
    return (
      cells.find((c) => `${c.dateKey}:${c.slotIndex}` === activeKey) ?? defaultCell
    );
  }, [activeKey, cells, defaultCell]);

  const { dayScale, slotScale, colorScale, dayHeaders, slotHeaders, peakIntensity } = useMemo(() => {
    const dayKeys = history.map((d) => d.dateKey);
    const slotIndices = ['0', '1', '2', '3'];

    const xScale = d3
      .scaleBand<string>()
      .domain(dayKeys)
      .range([MARGIN.left, SVG_WIDTH - MARGIN.right])
      .paddingInner(0.14)
      .paddingOuter(0.04);

    const yScale = d3
      .scaleBand<string>()
      .domain(slotIndices)
      .range([MARGIN.top, SVG_HEIGHT - MARGIN.bottom])
      .paddingInner(0.2)
      .paddingOuter(0.06);

    const cScale = d3
      .scaleSequential(d3.interpolateRgbBasis(palette.heatmapRamp))
      .domain([0, 1]);

    const days = history.map((d, idx) => ({
      dateKey: d.dateKey,
      dayLabel: d.dayLabel,
      focusMinutes: d.focusMinutes,
      isToday: idx === history.length - 1,
      x: (xScale(d.dateKey) ?? MARGIN.left) + xScale.bandwidth() / 2,
    }));

    const uniqueSlots = Array.from(
      new Map(
        cells.map((c) => [
          String(c.slotIndex),
          {
            slotKey: String(c.slotIndex),
            label: `${c.timeRange} ${c.slotLabel}`,
            y: (yScale(String(c.slotIndex)) ?? MARGIN.top) + yScale.bandwidth() / 2,
          },
        ])
      ).values()
    );

    const maxInt = d3.max(cells, (c) => c.intensity) ?? 0;

    return {
      dayScale: xScale,
      slotScale: yScale,
      colorScale: cScale,
      dayHeaders: days,
      slotHeaders: uniqueSlots,
      peakIntensity: maxInt,
    };
  }, [cells, history, palette.heatmapRamp]);

  const peakCell = useMemo(() => {
    if (cells.length === 0) return null;
    return cells.reduce((best, cur) => (cur.intensity > best.intensity ? cur : best), cells[0]);
  }, [cells]);

  const cellWidth = dayScale.bandwidth();
  const cellHeight = slotScale.bandwidth();

  return (
    <section
      aria-label="Weekly discipline heatmap"
      data-testid="weekly-discipline-heatmap"
      className="rounded-xl border border-[#232B3A] bg-[#141923] p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-[#1E2534] pb-3.5">
        <div>
          <h3 className="font-display text-base font-semibold text-slate-100">Weekly Focus Heatmap</h3>
          <p className="text-xs text-slate-400">
            7-day focus intensity across Dawn, Midday, Afternoon &amp; Evening blocks
          </p>
        </div>

        <div className="flex items-baseline gap-4 shrink-0">
          <span className="text-xs text-slate-400 tabular-nums">
            Peak Block{' '}
            <strong className="font-semibold text-[#D4AD5A]">
              {peakCell ? `${peakCell.dayLabel} ${peakCell.timeRange}` : '—'}
            </strong>
          </span>
          <span className="text-sm font-semibold text-slate-100 tabular-nums">
            {Math.round(peakIntensity * 100)}% max
          </span>
        </div>
      </div>

      <div className="mt-4 w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-label="7-day by 4-block focus intensity matrix"
          className="w-full min-w-[600px] h-auto select-none"
        >
          {/* Day column headers */}
          {dayHeaders.map((day) => (
            <text
              key={day.dateKey}
              x={day.x}
              y={16}
              textAnchor="middle"
              fill={day.isToday ? palette.secondaryAccent : palette.axisText}
              fontSize={11}
              fontWeight={day.isToday ? 600 : 500}
              fontFamily={svgFont}
            >
              {day.dayLabel} ({formatMinutesCompact(day.focusMinutes)})
            </text>
          ))}

          {/* Time-block row headers */}
          {slotHeaders.map((slot) => (
            <text
              key={slot.slotKey}
              x={MARGIN.left - 12}
              y={slot.y + 4}
              textAnchor="end"
              fill={palette.axisText}
              fontSize={10.5}
              fontFamily={svgFont}
            >
              {slot.label}
            </text>
          ))}

          {/* Matrix cells */}
          {cells.map((cell) => {
            const x = dayScale(cell.dateKey) ?? MARGIN.left;
            const y = slotScale(String(cell.slotIndex)) ?? MARGIN.top;
            const key = `${cell.dateKey}:${cell.slotIndex}`;
            const isSelected =
              activeCell?.dateKey === cell.dateKey && activeCell?.slotIndex === cell.slotIndex;
            const fillColor = colorScale(cell.intensity);
            const textColor =
              cell.intensity >= 0.85
                ? palette.highCellText
                : cell.intensity >= 0.32
                  ? palette.midCellText
                  : palette.lowCellText;

            return (
              <g
                key={key}
                transform={`translate(${x}, ${y})`}
                role="button"
                tabIndex={0}
                data-testid="heatmap-cell"
                data-day={cell.dayLabel}
                data-slot={cell.timeRange}
                data-intensity={cell.intensity}
                aria-label={`${cell.dayLabel} ${cell.timeRange} ${cell.slotLabel}: ${cell.focusMinutes} minutes focus, ${cell.tier}`}
                onMouseEnter={() => setActiveKey(key)}
                onFocus={() => setActiveKey(key)}
                onClick={() => setActiveKey(key)}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  width={cellWidth}
                  height={cellHeight}
                  rx={isTerminal ? 1 : 5}
                  fill={fillColor}
                  stroke={isSelected ? palette.selectedCellStroke : palette.cellStroke}
                  strokeWidth={isSelected ? 1.75 : 1}
                />
                {cellWidth >= 56 && cellHeight >= 22 && (
                  <text
                    x={cellWidth / 2}
                    y={cellHeight / 2 + 3.5}
                    textAnchor="middle"
                    fill={textColor}
                    fontSize={10.5}
                    fontWeight={cell.intensity >= 0.58 ? 600 : 500}
                    fontFamily={svgFont}
                    pointerEvents="none"
                  >
                    {cell.focusMinutes}m
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 pt-3 border-t border-[#1E2534] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <p
          data-testid="heatmap-cell-readout"
          className="text-slate-300 tabular-nums"
        >
          {activeCell ? (
            <>
              <span className="text-[#D4AD5A] font-semibold">{activeCell.dayLabel}</span>
              {' · '}
              <span>
                {activeCell.timeRange} {activeCell.slotLabel}
              </span>
              {' · '}
              <span className="font-medium text-slate-100">{activeCell.focusMinutes}m focus</span>
              {' · '}
              <span>{Math.round(activeCell.intensity * 100)}% intensity</span>
              {' · '}
              <span
                className={`font-medium ${
                  activeCell.tier === 'Peak'
                    ? 'text-[#D4AD5A]'
                    : activeCell.tier === 'Locked In'
                      ? 'text-rose-400'
                      : 'text-slate-400'
                }`}
              >
                {activeCell.tier}
              </span>
            </>
          ) : (
            'Select a time block to inspect your daily cadence.'
          )}
        </p>

        <div className="flex items-center gap-2 shrink-0 text-xs text-slate-400">
          <span>Standby</span>
          <div className="flex items-center gap-1" aria-hidden="true">
            {LEGEND_STEPS.map((step) => (
              <span
                key={step.label}
                title={`${step.label} intensity`}
                className="inline-block h-3 w-4 rounded-[3px] border border-[#1E2534]"
                style={{ backgroundColor: colorScale(step.value) }}
              />
            ))}
          </div>
          <span className="font-medium text-[#D4AD5A]">Peak</span>
        </div>
      </div>
    </section>
  );
};
