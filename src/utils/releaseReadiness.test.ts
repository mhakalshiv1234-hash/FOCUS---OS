import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDefaultCommandState } from './discipline';
import { getDefaultAppUsageRecords } from './usageAnalytics';
import {
  buildReleaseVerificationReportJson,
  evaluateAndroidReleaseGates,
  runInBrowserDomainVerification,
} from './releaseReadiness';

function loadRealAndroidFilesForTest() {
  const root = process.cwd();
  const paths = [
    'android/app/build.gradle.kts',
    'android/app/proguard-rules.pro',
    'android/app/src/main/AndroidManifest.xml',
    'android/app/src/main/java/com/focusos/app/data/local/FocusOsDatabase.kt',
    'android/app/src/androidTest/java/com/focusos/app/FocusOsDatabaseMigrationTest.kt',
    'android/app/src/androidTest/java/com/focusos/app/FocusOsComposeUiTest.kt',
    'android/app/src/test/java/com/focusos/app/DisciplineCalculatorTest.kt',
    'android/app/src/test/java/com/focusos/app/AppSelectionFilterTest.kt',
    'android/app/src/test/java/com/focusos/app/BlockingEvaluatorTest.kt',
    'android/app/src/test/java/com/focusos/app/NuclearModePolicyTest.kt',
    'android/app/src/test/java/com/focusos/app/ScheduleEvaluatorTest.kt',
    'android/app/src/test/java/com/focusos/app/UsageAnalyticsEvaluatorTest.kt',
    'android/verify_and_build_apk.sh',
  ];

  return paths.map((p) => ({
    path: p,
    stage: 'Stage 7',
    layer: 'Tests & Docs',
    content: readFileSync(resolve(root, p), 'utf-8'),
  }));
}

test('evaluateAndroidReleaseGates verifies real Android Stage 7 project files pass all gates', () => {
  const files = loadRealAndroidFilesForTest();
  const summary = evaluateAndroidReleaseGates({
    files,
    blockedPackages: ['com.zhiliaoapp.musically', 'com.google.android.youtube'],
  });

  assert.equal(summary.versionCode, 7);
  assert.equal(summary.versionName, '1.0.0-stage7');
  assert.equal(summary.isMinifyEnabled, true);
  assert.equal(summary.isShrinkResources, true);
  assert.equal(summary.jvmTestCount, 6);
  assert.equal(summary.instrumentedTestCount, 2);
  assert.equal(summary.allGatesPassed, true);
});

test('evaluateAndroidReleaseGates detects missing safety exemption or missing ProGuard rules', () => {
  const files = loadRealAndroidFilesForTest().map((f) =>
    f.path.endsWith('proguard-rules.pro') ? { ...f, content: '' } : f
  );
  const summary = evaluateAndroidReleaseGates({
    files,
    blockedPackages: ['com.android.dialer'],
  });

  assert.equal(summary.allGatesPassed, false);
  const proguardGate = summary.gates.find((g) => g.id === 'proguard-r8');
  const safetyGate = summary.gates.find((g) => g.id === 'manifest-safety');
  assert.equal(proguardGate?.passed, false);
  assert.equal(safetyGate?.passed, false);
});

test('runInBrowserDomainVerification executes live assertions across all 5 core modules', () => {
  const results = runInBrowserDomainVerification({
    usageRecords: getDefaultAppUsageRecords(),
    blockedPackages: ['com.zhiliaoapp.musically', 'com.google.android.youtube'],
  });

  assert.equal(results.length, 5);
  assert.equal(
    results.every((r) => r.passed && r.assertionsPassed >= 2),
    true
  );
});

test('buildReleaseVerificationReportJson produces structured Stage 7 manifest JSON', () => {
  const files = loadRealAndroidFilesForTest();
  const releaseSummary = evaluateAndroidReleaseGates({
    files,
    blockedPackages: ['com.zhiliaoapp.musically'],
  });
  const domainSuites = runInBrowserDomainVerification({
    usageRecords: getDefaultAppUsageRecords(),
    blockedPackages: ['com.zhiliaoapp.musically'],
  });
  const jsonText = buildReleaseVerificationReportJson({
    releaseSummary,
    domainSuites,
    state: getDefaultCommandState(),
    blockedPackages: ['com.zhiliaoapp.musically'],
    usageAccessGranted: true,
    generatedAtIso: '2026-11-21T09:05:00.000Z',
  });

  const parsed = JSON.parse(jsonText);
  assert.equal(parsed.stageCompleted, 7);
  assert.equal(parsed.androidBuildTarget.versionName, '1.0.0-stage7');
  assert.equal(parsed.verificationGates.length, 4);
  assert.equal(parsed.inBrowserDomainSuites.length, 5);
});
