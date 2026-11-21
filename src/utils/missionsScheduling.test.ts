import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DailyBlockSchedule,
  createStudyMission,
  decodeDaysBitmask,
  deleteStudyMission,
  encodeDaysBitmask,
  evaluateSchedulesAt,
  formatMinutesTo24h,
  getScheduleRemainingMillis,
  isScheduleActiveAt,
  parse24hToMinutes,
  resolveEffectiveBlocklist,
  updateStudyMission,
  validateMissionDraft,
  validateScheduleDraft,
} from './missionsScheduling';
import { getDefaultCommandState } from './discipline';

test('mission draft validation enforces title, subject, and duration bounds', () => {
  const invalid = validateMissionDraft({
    title: 'Hi',
    subject: 'M',
    targetMinutes: 10,
    linkedPackages: [],
  });
  assert.equal(invalid.valid, false);
  assert.equal(invalid.errors.length, 3);

  const valid = validateMissionDraft({
    title: 'Physics — Electromagnetism Set',
    subject: 'Physics',
    targetMinutes: 90,
    linkedPackages: ['com.google.android.youtube'],
  });
  assert.equal(valid.valid, true);
  assert.deepEqual(valid.errors, []);
});

test('mission CRUD creates, updates, and deletes while reassigning active mission safely', () => {
  const base = getDefaultCommandState().missions;
  const { missions: afterCreate, created } = createStudyMission(base, {
    title: 'History — Modern India Revision',
    subject: 'GAT History',
    targetMinutes: 75,
    linkedPackages: ['com.instagram.android', 'com.android.dialer'],
  }, 1_763_700_000_000);

  assert.equal(afterCreate.length, base.length + 1);
  // Safety dialer package is stripped automatically
  assert.deepEqual(created.linkedPackages, ['com.instagram.android']);

  const afterUpdate = updateStudyMission(afterCreate, created.id, {
    title: 'History — Modern India Mock',
    subject: 'GAT History',
    targetMinutes: 120,
    linkedPackages: ['com.zhiliaoapp.musically'],
  });
  const edited = afterUpdate.find((m) => m.id === created.id);
  assert.equal(edited?.title, 'History — Modern India Mock');
  assert.equal(edited?.targetMinutes, 120);

  const afterDelete = deleteStudyMission(afterUpdate, created.id, created.id);
  assert.equal(afterDelete.missions.length, base.length);
  assert.equal(afterDelete.nextActiveMissionId, base[0].id);
});

test('resolveEffectiveBlocklist merges mission packages when unlocked and seals when Nuclear locked', () => {
  const merged = resolveEffectiveBlocklist({
    baseBlockedPackages: ['com.google.android.youtube'],
    missionLinkedPackages: ['com.instagram.android', 'com.android.emergency'],
    isNuclearLockActive: false,
  });
  assert.deepEqual(merged, ['com.google.android.youtube', 'com.instagram.android']);

  const sealed = resolveEffectiveBlocklist({
    baseBlockedPackages: ['com.google.android.youtube'],
    missionLinkedPackages: ['com.instagram.android'],
    isNuclearLockActive: true,
  });
  assert.deepEqual(sealed, ['com.google.android.youtube']);
});

test('day bitmask roundtrip encodes and decodes ISO weekdays cleanly', () => {
  const mask = encodeDaysBitmask([1, 3, 5, 7]);
  assert.deepEqual(decodeDaysBitmask(mask), [1, 3, 5, 7]);
  assert.equal(formatMinutesTo24h(5 * 60 + 30), '05:30');
  assert.equal(parse24hToMinutes('19:45'), 19 * 60 + 45);
  assert.equal(parse24hToMinutes('25:00'), null);
});

test('schedule window evaluation handles same-day and overnight windows accurately', () => {
  const sameDaySchedule: DailyBlockSchedule = {
    id: 'morning',
    label: 'Morning NDA Drill',
    startMinutesFromMidnight: 5 * 60 + 30,
    endMinutesFromMidnight: 8 * 60 + 0,
    daysOfWeek: [1, 2, 3, 4, 5],
    isEnabled: true,
    isNuclearMode: false,
    linkedMissionId: 1,
    linkedPackages: [],
  };

  // Monday 2026-11-16 06:15 -> active with 105 minutes remaining
  const monMorning = new Date(2026, 10, 16, 6, 15, 0);
  assert.equal(isScheduleActiveAt(sameDaySchedule, monMorning), true);
  assert.equal(getScheduleRemainingMillis(sameDaySchedule, monMorning), 105 * 60_000);

  // Sunday 2026-11-15 06:15 -> inactive (only Mon-Fri)
  const sunMorning = new Date(2026, 10, 15, 6, 15, 0);
  assert.equal(isScheduleActiveAt(sameDaySchedule, sunMorning), false);

  // Overnight window 22:00 -> 05:00 on Fridays only (iso=5 -> spills into Saturday 02:30)
  const overnightSchedule: DailyBlockSchedule = {
    id: 'night',
    label: 'Lights Out Lock',
    startMinutesFromMidnight: 22 * 60,
    endMinutesFromMidnight: 5 * 60,
    daysOfWeek: [5],
    isEnabled: true,
    isNuclearMode: true,
    linkedMissionId: null,
    linkedPackages: [],
  };
  const satEarly = new Date(2026, 10, 21, 2, 30, 0); // Saturday 02:30 AM (2026-11-21 is Saturday)
  assert.equal(isScheduleActiveAt(overnightSchedule, satEarly), true);
  assert.equal(getScheduleRemainingMillis(overnightSchedule, satEarly), 150 * 60_000);
});

test('evaluateSchedulesAt prioritizes Nuclear schedule and validates schedule drafts', () => {
  const mondayMorning = new Date(2026, 10, 16, 6, 0, 0);
  const strictSched: DailyBlockSchedule = {
    id: 's1',
    label: 'Strict Block',
    startMinutesFromMidnight: 5 * 60,
    endMinutesFromMidnight: 8 * 60,
    daysOfWeek: [1],
    isEnabled: true,
    isNuclearMode: false,
    linkedMissionId: null,
    linkedPackages: [],
  };
  const nuclearSched: DailyBlockSchedule = {
    id: 's2',
    label: 'Nuclear Mock',
    startMinutesFromMidnight: 5 * 60 + 30,
    endMinutesFromMidnight: 7 * 60,
    daysOfWeek: [1],
    isEnabled: true,
    isNuclearMode: true,
    linkedMissionId: 1,
    linkedPackages: [],
  };
  const evalResult = evaluateSchedulesAt([strictSched, nuclearSched], mondayMorning);
  assert.equal(evalResult.activeSchedulesCount, 2);
  assert.equal(evalResult.activeSchedule?.id, 's2');

  const badDraft = validateScheduleDraft({
    label: 'AB',
    startTime: '18:00',
    endTime: '18:00',
    daysOfWeek: [],
    isNuclearMode: false,
    linkedMissionId: null,
    linkedPackages: [],
  });
  assert.equal(badDraft.valid, false);
  assert.equal(badDraft.errors.length, 3);
});
