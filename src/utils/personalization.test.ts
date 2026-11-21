import test from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultCommandState } from './discipline';
import { getDefaultAppUsageRecords } from './usageAnalytics';
import {
  buildMonthlyMissionReview,
  buildWeeklyIntelligenceReport,
  computeJeeMathProgress,
  computeNdaCountdown,
  computeNdaSubjectSummaries,
  computeOverallNdaSyllabusPct,
  detectWeaknessPatterns,
  formatWeeklyReportMarkdown,
  getDefaultPersonalizationState,
} from './personalization';

test('default personalization profile reflects NDA 2027, JEE Math, environments, and MUN as developing interest', () => {
  const state = getDefaultPersonalizationState();
  assert.equal(state.profile.age, 17);
  assert.equal(state.profile.primaryAcademicTarget, 'NDA 2027');
  assert.equal(state.profile.secondaryAcademicTarget, 'JEE Mathematics');
  assert.match(state.profile.mathEnvironment, /Library/i);
  assert.match(state.profile.generalEnvironment, /Home/i);
  assert.equal(state.profile.munDevelopingInterest.role, 'Director of Central Intelligence');
  assert.match(state.profile.munDevelopingInterest.focusAreas, /developing interest/i);
});

test('computeNdaCountdown returns non-negative days remaining to NDA 2027 target date', () => {
  const fixedNow = Date.parse('2026-11-21T09:00:00Z');
  const countdown = computeNdaCountdown('2027-04-18', fixedNow);
  assert.equal(countdown.daysRemaining, 148);
  assert.equal(computeNdaCountdown('2020-01-01', fixedNow).daysRemaining, 0);
});

test('NDA subject summaries and JEE Math backlog counts never drop unfinished lectures', () => {
  const state = getDefaultPersonalizationState();
  const subjects = computeNdaSubjectSummaries(state.ndaChapters);
  assert.equal(subjects.length, 3);
  assert.ok(computeOverallNdaSyllabusPct(state.ndaChapters) > 0);

  const jee = computeJeeMathProgress(state.jeeLectures, state.jeePractice);
  assert.equal(jee.completedLectures, 1);
  assert.equal(jee.inProgressLectures, 1);
  assert.equal(jee.backlogLectures, 1);
  assert.equal(jee.pendingBacklogItems.length, 2);
});

test('detectWeaknessPatterns identifies real bottlenecks without labeling user as lazy', () => {
  const cmd = getDefaultCommandState();
  const usage = getDefaultAppUsageRecords();
  const pers = getDefaultPersonalizationState();

  const diagnostics = detectWeaknessPatterns(cmd, usage, true, pers);
  assert.ok(diagnostics.length >= 2);
  for (const item of diagnostics) {
    assert.doesNotMatch(item.problem, /lazy/i);
    assert.doesNotMatch(item.cause, /lazy/i);
    assert.ok(item.recoveryPlan.length > 10);
  }
});

test('buildWeeklyIntelligenceReport generates all 12 grounded sections from actual recorded data', () => {
  const cmd = getDefaultCommandState();
  const usage = getDefaultAppUsageRecords();
  const pers = getDefaultPersonalizationState();

  const report = buildWeeklyIntelligenceReport(cmd, usage, true, pers, Date.parse('2026-11-21T09:00:00Z'));
  assert.equal(report.generatedAtIso, '2026-11-21');
  assert.ok(report.productivityPct > 0 && report.productivityPct <= 100);
  assert.match(report.mostProductiveDay, /Wed/i);
  assert.match(report.backlogText, /Sequences & Series/i);
  assert.match(report.backlogText, /Limits & Continuity/i);
  assert.ok(report.recommendations.length >= 1);

  const markdown = formatWeeklyReportMarkdown(report, pers.profile);
  assert.match(markdown, /1\. NDA Preparation Progress:/);
  assert.match(markdown, /12\. Recommendations for Next Week:/);
});

test('buildMonthlyMissionReview compares current recorded pace against previous month cleanly', () => {
  const cmd = getDefaultCommandState();
  const pers = getDefaultPersonalizationState();

  const review = buildMonthlyMissionReview(cmd, pers, Date.parse('2026-11-21T09:00:00Z'));
  assert.equal(review.previousMonthLabel, 'Previous Month (Baseline)');
  assert.ok(review.ndaSyllabusPct >= review.prevNdaSyllabusPct);
  assert.match(review.nda2027ReadinessNote, /days to NDA 2027 target/i);
  assert.ok(review.honestAssessment.length > 20);
});
