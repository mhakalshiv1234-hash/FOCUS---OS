import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ActiveFocusSession,
  EMERGENCY_OVERRIDE_PHRASE,
  canModifySessionSettings,
  evaluateBatteryUsageWarning,
  evaluateBlockingDecision,
  evaluateEmergencyOverride,
  formatCountdownMillis,
  getDefaultBackgroundPowerTasks,
  isNuclearLockActive,
} from './blockingEngine';

const activeSession: ActiveFocusSession = {
  isActive: true,
  sessionLabel: 'Strict Focus Session',
  startedAtEpochMs: 1000,
  endsAtEpochMs: 600_000,
  durationMinutes: 10,
};

test('blocks blocklisted package during active focus session', () => {
  const decision = evaluateBlockingDecision({
    foregroundPackage: 'com.instagram.android',
    session: activeSession,
    blockedPackages: new Set(['com.instagram.android']),
    nowEpochMs: 10_000,
  });

  assert.equal(decision.type, 'block');
  if (decision.type === 'block') {
    assert.equal(decision.packageName, 'com.instagram.android');
    assert.equal(decision.remainingMillis, 590_000);
  }
});

test('allows protected safety packages even if present in blocklist set', () => {
  const decision = evaluateBlockingDecision({
    foregroundPackage: 'com.google.android.dialer',
    session: activeSession,
    blockedPackages: new Set(['com.google.android.dialer']),
    nowEpochMs: 10_000,
  });

  assert.deepEqual(decision, { type: 'allow', reason: 'safety_protected' });
});

test('automatically restores access once session endsAtEpochMs is reached', () => {
  const decision = evaluateBlockingDecision({
    foregroundPackage: 'com.instagram.android',
    session: activeSession,
    blockedPackages: new Set(['com.instagram.android']),
    nowEpochMs: 600_000,
  });

  assert.deepEqual(decision, { type: 'allow', reason: 'session_expired' });
});

test('debounces duplicate accessibility window events within 1200ms', () => {
  const decision = evaluateBlockingDecision({
    foregroundPackage: 'com.instagram.android',
    session: activeSession,
    blockedPackages: new Set(['com.instagram.android']),
    nowEpochMs: 10_800,
    lastBlockedPackage: 'com.instagram.android',
    lastBlockedAtEpochMs: 10_000,
  });

  assert.deepEqual(decision, { type: 'allow', reason: 'debounced_duplicate_event' });
});

test('formats remaining countdown millis as MM:SS and H:MM:SS', () => {
  assert.equal(formatCountdownMillis(90_000), '01:30');
  assert.equal(formatCountdownMillis(3_665_000), '1:01:05');
});

test('returns null battery warning when no focus session is active or high-power tasks are disabled', () => {
  const tasks = getDefaultBackgroundPowerTasks();
  assert.equal(
    evaluateBatteryUsageWarning({
      session: null,
      nowEpochMs: 10_000,
      tasks,
    }),
    null
  );

  const ecoTasks = tasks.map((t) => ({ ...t, enabled: false }));
  assert.equal(
    evaluateBatteryUsageWarning({
      session: activeSession,
      nowEpochMs: 10_000,
      tasks: ecoTasks,
    }),
    null
  );
});

test('emits subtle or elevated battery warning during active focus session with high-power tasks', () => {
  const tasks = getDefaultBackgroundPowerTasks();
  const subtle = evaluateBatteryUsageWarning({
    session: activeSession,
    nowEpochMs: 10_000,
    tasks,
    batteryLevelPct: 78,
    isCharging: false,
  });

  assert.ok(subtle);
  assert.equal(subtle.severity, 'subtle');
  assert.equal(subtle.estimatedExtraDrainPctPerHour, 3.4);

  const elevated = evaluateBatteryUsageWarning({
    session: activeSession,
    nowEpochMs: 10_000,
    tasks,
    batteryLevelPct: 19,
    isCharging: false,
  });

  assert.ok(elevated);
  assert.equal(elevated.severity, 'elevated');
  assert.ok(elevated.detail.includes('19% battery'));
});

test('nuclear mode locks session settings until expiration while protecting emergency dialer', () => {
  const nuclearSession: ActiveFocusSession = {
    isActive: true,
    sessionLabel: 'Nuclear Discipline Lock',
    startedAtEpochMs: 1_000,
    endsAtEpochMs: 1_800_000,
    durationMinutes: 30,
    isNuclearMode: true,
  };

  assert.equal(isNuclearLockActive(nuclearSession, 50_000), true);
  assert.equal(canModifySessionSettings(nuclearSession, 50_000), false);
  assert.equal(canModifySessionSettings(nuclearSession, 1_800_000), true);

  const dialerDecision = evaluateBlockingDecision({
    foregroundPackage: 'com.android.emergency',
    session: nuclearSession,
    blockedPackages: new Set(['com.android.emergency', 'com.instagram.android']),
    nowEpochMs: 50_000,
  });
  assert.deepEqual(dialerDecision, { type: 'allow', reason: 'safety_protected' });

  const socialDecision = evaluateBlockingDecision({
    foregroundPackage: 'com.instagram.android',
    session: nuclearSession,
    blockedPackages: new Set(['com.instagram.android']),
    nowEpochMs: 50_000,
  });
  assert.equal(socialDecision.type, 'block');
  if (socialDecision.type === 'block') {
    assert.equal(socialDecision.isNuclearMode, true);
  }
});

test('emergency override protocol enforces delay, reason length, and exact confirmation phrase', () => {
  const blockedByDelay = evaluateEmergencyOverride({
    reason: 'Urgent family hospital call logistics',
    typedPhrase: EMERGENCY_OVERRIDE_PHRASE,
    remainingDelaySeconds: 3,
  });
  assert.equal(blockedByDelay.allowed, false);
  assert.equal(blockedByDelay.delayComplete, false);

  const blockedByShortReason = evaluateEmergencyOverride({
    reason: 'bored',
    typedPhrase: EMERGENCY_OVERRIDE_PHRASE,
    remainingDelaySeconds: 0,
  });
  assert.equal(blockedByShortReason.allowed, false);
  assert.equal(blockedByShortReason.reasonValid, false);

  const blockedByWrongPhrase = evaluateEmergencyOverride({
    reason: 'Urgent family hospital call logistics',
    typedPhrase: 'cancel',
    remainingDelaySeconds: 0,
  });
  assert.equal(blockedByWrongPhrase.allowed, false);
  assert.equal(blockedByWrongPhrase.phraseMatches, false);

  const authorized = evaluateEmergencyOverride({
    reason: 'Urgent family hospital call logistics',
    typedPhrase: ' abort nuclear lock ',
    remainingDelaySeconds: 0,
  });
  assert.equal(authorized.allowed, true);
  assert.equal(authorized.delayComplete, true);
  assert.equal(authorized.reasonValid, true);
  assert.equal(authorized.phraseMatches, true);
});


