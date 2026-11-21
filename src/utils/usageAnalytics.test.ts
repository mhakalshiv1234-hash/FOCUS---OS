import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeUsageAnalyticsSummary,
  computeWeeklyTrendSummary,
  filterAndSortUsageRows,
  getDefaultAppUsageRecords,
  simulateAppUsageMinutes,
  syncUsageStatsIntoCommandState,
} from './usageAnalytics';
import { getDefaultCommandState } from './discipline';

test('computeUsageAnalyticsSummary totals distracting, productive, and blocklisted usage accurately', () => {
  const records = getDefaultAppUsageRecords();
  const summary = computeUsageAnalyticsSummary({
    records,
    blockedPackages: ['com.instagram.android', 'com.zhiliaoapp.musically'],
    usageAccessGranted: true,
    focusMinutesToday: 185,
    rangeDays: 1,
  });

  assert.equal(summary.usageAccessGranted, true);
  assert.equal(summary.totalScreenTimeMinutes, 142);
  assert.equal(summary.distractingMinutes, 18);
  assert.equal(summary.productiveMinutes, 104); // Obsidian 54 + Kindle 26 + Forest 24
  assert.equal(summary.otherMinutes, 20); // Chrome 20
  assert.equal(summary.topDistractingApp?.packageName, 'com.google.android.youtube');
  assert.equal(summary.apps.find((a) => a.packageName === 'com.instagram.android')?.isBlocklisted, true);
});

test('computeUsageAnalyticsSummary returns zeroed honest state when Usage Access is not granted', () => {
  const records = getDefaultAppUsageRecords();
  const summary = computeUsageAnalyticsSummary({
    records,
    blockedPackages: ['com.instagram.android'],
    usageAccessGranted: false,
    focusMinutesToday: 185,
  });

  assert.equal(summary.usageAccessGranted, false);
  assert.equal(summary.totalScreenTimeMinutes, 0);
  assert.equal(summary.distractingMinutes, 0);
  assert.deepEqual(summary.apps, []);
});

test('simulateAppUsageMinutes updates app screen time and syncUsageStatsIntoCommandState replaces baseline metrics', () => {
  const baseState = getDefaultCommandState();
  const records = getDefaultAppUsageRecords();

  const updatedRecords = simulateAppUsageMinutes(records, 'com.instagram.android', 20);
  const synced = syncUsageStatsIntoCommandState(baseState, updatedRecords, true);

  assert.equal(synced.screenTimeMinutesToday, 162);
  assert.equal(synced.distractingMinutesToday, 38);
  assert.equal(synced.weeklyHistory[synced.weeklyHistory.length - 1].distractingMinutes, 38);

  const revoked = syncUsageStatsIntoCommandState(baseState, updatedRecords, false);
  assert.equal(revoked.screenTimeMinutesToday, 0);
  assert.equal(revoked.distractingMinutesToday, 0);
});

test('filterAndSortUsageRows filters by scope/search and sorts by launches', () => {
  const summary = computeUsageAnalyticsSummary({
    records: getDefaultAppUsageRecords(),
    blockedPackages: ['com.instagram.android'],
    usageAccessGranted: true,
    focusMinutesToday: 185,
  });

  const distracting = filterAndSortUsageRows({
    rows: summary.apps,
    searchQuery: '',
    scope: 'distracting',
    sortBy: 'launches',
  });
  assert.ok(distracting.every((r) => r.isDistracting));
  assert.equal(distracting[0].packageName, 'com.google.android.youtube');

  const blocklisted = filterAndSortUsageRows({
    rows: summary.apps,
    searchQuery: 'insta',
    scope: 'blocklisted',
    sortBy: 'most_used',
  });
  assert.equal(blocklisted.length, 1);
  assert.equal(blocklisted[0].packageName, 'com.instagram.android');
});

test('computeWeeklyTrendSummary derives streak, best day, and 7-day averages', () => {
  const state = getDefaultCommandState();
  const records = getDefaultAppUsageRecords();
  const trend = computeWeeklyTrendSummary({
    history: state.weeklyHistory,
    appUsageRecords: records,
    usageAccessGranted: true,
    focusTargetMinutes: state.dailyFocusTargetMinutes,
    plannedMissionsCount: state.missions.length,
  });

  assert.ok(trend.focusStreakDays >= 1);
  assert.equal(trend.bestDayLabel, 'Wed');
  assert.ok(trend.avgScreenTimeMinutes > 0);
  assert.ok(trend.avgDisciplineScore > 0);
});
