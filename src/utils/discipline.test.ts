import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceMissionProgress,
  buildWeeklyDisciplineTrend,
  buildWeeklyHeatmapMatrix,
  calculateDisciplineScore,
  formatMinutesCompact,
  getDefaultCommandState,
  getRecentCompletedMissionSummaries,
} from './discipline';

test('calculates perfect 100 score when focus target and all missions are met without excess distraction', () => {
  const result = calculateDisciplineScore({
    focusMinutesToday: 240,
    focusTargetMinutes: 240,
    distractingMinutesToday: 10,
    blockedAttemptsResisted: 5,
    completedMissionsToday: 4,
    plannedMissionsToday: 4,
  });

  assert.equal(result.totalScore, 100);
  assert.equal(result.focusComponent, 55);
  assert.equal(result.missionComponent, 30);
  assert.equal(result.resistanceBonus, 15);
  assert.equal(result.distractionPenalty, 0);
  assert.equal(result.statusLabel, 'Disciplined');
});

test('applies distraction penalty beyond 15-minute grace allowance', () => {
  const result = calculateDisciplineScore({
    focusMinutesToday: 120,
    focusTargetMinutes: 240,
    distractingMinutesToday: 55,
    blockedAttemptsResisted: 0,
    completedMissionsToday: 1,
    plannedMissionsToday: 2,
  });

  assert.equal(result.distractionPenalty, 20);
  assert.equal(result.totalScore, 23);
  assert.equal(result.statusLabel, 'Compromised');
});

test('clamps score to zero under severe distraction and zero focus', () => {
  const result = calculateDisciplineScore({
    focusMinutesToday: 0,
    focusTargetMinutes: 240,
    distractingMinutesToday: 200,
    blockedAttemptsResisted: 0,
    completedMissionsToday: 0,
    plannedMissionsToday: 3,
  });

  assert.equal(result.totalScore, 0);
  assert.equal(result.statusLabel, 'Compromised');
});

test('formats durations compactly with hours and minutes', () => {
  assert.equal(formatMinutesCompact(185), '3h 05m');
  assert.equal(formatMinutesCompact(180), '3h 00m');
  assert.equal(formatMinutesCompact(30), '30m');
  assert.equal(formatMinutesCompact(0), '0m');
});

test('default command state includes 4 requested study missions', () => {
  const state = getDefaultCommandState();
  assert.equal(state.missions.length, 4);
  assert.equal(state.missions[0].subject, 'Mathematics');
  assert.equal(state.missions[0].targetMinutes, 180);
});

test('builds 7-day discipline score trend bounded between 0 and 100', () => {
  const state = getDefaultCommandState();
  const trend = buildWeeklyDisciplineTrend(
    state.weeklyHistory,
    state.dailyFocusTargetMinutes,
    state.missions.length
  );

  assert.equal(trend.length, 7);
  assert.equal(trend[0].dayLabel, 'Sat');
  assert.equal(trend[6].dayLabel, 'Today');
  assert.equal(trend[6].score, 70);
  for (const point of trend) {
    assert.ok(point.score >= 0 && point.score <= 100);
  }
});

test('advanceMissionProgress detects completion transition exactly once when target is hit', () => {
  const initial = getDefaultCommandState();
  // Mathematics starts at 115 / 180 min
  const step1 = advanceMissionProgress(initial, 1, 30);
  assert.equal(step1.newlyCompletedMission, null);
  assert.equal(step1.nextState.missions[0].completedMinutes, 145);
  assert.equal(step1.nextState.focusMinutesToday, initial.focusMinutesToday + 30);

  // Advance another 50m -> caps at 180m and emits newlyCompletedMission
  const step2 = advanceMissionProgress(step1.nextState, 1, 50);
  assert.ok(step2.newlyCompletedMission);
  assert.equal(step2.newlyCompletedMission.id, 1);
  assert.equal(step2.newlyCompletedMission.isCompleted, true);
  assert.equal(step2.nextState.missions[0].completedMinutes, 180);
  assert.equal(step2.nextState.focusMinutesToday, initial.focusMinutesToday + 65);

  // Advancing an already-completed mission must not re-trigger completion
  const step3 = advanceMissionProgress(step2.nextState, 1, 15);
  assert.equal(step3.newlyCompletedMission, null);
});

test('buildWeeklyHeatmapMatrix produces 28 bounded watch cells preserving daily focus minutes', () => {
  const state = getDefaultCommandState();
  const cells = buildWeeklyHeatmapMatrix(state.weeklyHistory, state.dailyFocusTargetMinutes);

  assert.equal(cells.length, 28);
  for (let dayIdx = 0; dayIdx < state.weeklyHistory.length; dayIdx++) {
    const dayCells = cells.filter((c) => c.dayIndex === dayIdx);
    assert.equal(dayCells.length, 4);
    const sum = dayCells.reduce((acc, c) => acc + c.focusMinutes, 0);
    assert.equal(sum, state.weeklyHistory[dayIdx].focusMinutes);
  }
  for (const cell of cells) {
    assert.ok(cell.intensity >= 0 && cell.intensity <= 1);
  }
});

test('getRecentCompletedMissionSummaries returns last 5 newest-first and records new mission completion', () => {
  const initial = getDefaultCommandState();
  const initialLast5 = getRecentCompletedMissionSummaries(initial.completedMissionHistory, 5);
  assert.equal(initialLast5.length, 5);
  assert.equal(initialLast5[0].subject, 'English');

  const completed = advanceMissionProgress(initial, 1, 65, 1_763_690_000_000);
  assert.ok(completed.newlyCompletedMission);
  const updatedLast5 = getRecentCompletedMissionSummaries(
    completed.nextState.completedMissionHistory,
    5
  );
  assert.equal(updatedLast5.length, 5);
  assert.equal(updatedLast5[0].missionId, 1);
  assert.equal(updatedLast5[0].subject, 'Mathematics');
  assert.equal(updatedLast5[0].dayLabel, 'Today');
  assert.equal(updatedLast5[0].targetMinutes, 180);
  assert.ok(updatedLast5.every((r, idx) => idx === 0 || updatedLast5[idx - 1].completedAtEpochMs >= r.completedAtEpochMs));
});



