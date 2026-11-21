import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SAMPLE_ANDROID_APPS,
  categorizePackage,
  filterAndSortApps,
  getDistractingPresetPackages,
  isProtectedSafetyPackage,
} from './appSelection';

test('categorizes social, video, games, browser, and productivity apps accurately', () => {
  assert.equal(categorizePackage('com.instagram.android', 'Instagram'), 'Social');
  assert.equal(categorizePackage('com.google.android.youtube', 'YouTube'), 'Video');
  assert.equal(categorizePackage('com.supercell.clashroyale', 'Clash Royale'), 'Games');
  assert.equal(categorizePackage('com.android.chrome', 'Chrome'), 'Browser');
  assert.equal(categorizePackage('md.obsidian', 'Obsidian'), 'Productivity');
});

test('protects dialer, emergency, settings, and focusos itself from blocklisting', () => {
  assert.equal(isProtectedSafetyPackage('com.focusos.app'), true);
  assert.equal(isProtectedSafetyPackage('com.google.android.dialer'), true);
  assert.equal(isProtectedSafetyPackage('com.android.emergency'), true);
  assert.equal(isProtectedSafetyPackage('com.android.settings'), true);
  assert.equal(isProtectedSafetyPackage('com.instagram.android'), false);
});

test('filters apps by search query, category, and block status while sorting blocked first', () => {
  const blockedSet = new Set(['com.discord']);
  const vms = SAMPLE_ANDROID_APPS.map((app) => ({
    ...app,
    isBlocked: blockedSet.has(app.packageName),
  }));

  const blockedOnly = filterAndSortApps(vms, '', null, 'Blocked');
  assert.equal(blockedOnly.length, 1);
  assert.equal(blockedOnly[0].appName, 'Discord');

  const socialSearch = filterAndSortApps(vms, 'insta', 'Social', 'All');
  assert.equal(socialSearch.length, 1);
  assert.equal(socialSearch[0].packageName, 'com.instagram.android');
});

test('distracting preset includes social, video, and games while excluding safety and productivity apps', () => {
  const preset = getDistractingPresetPackages(SAMPLE_ANDROID_APPS);
  assert.equal(preset.includes('com.instagram.android'), true);
  assert.equal(preset.includes('com.google.android.youtube'), true);
  assert.equal(preset.includes('com.supercell.clashroyale'), true);
  assert.equal(preset.includes('md.obsidian'), false);
  assert.equal(preset.includes('com.google.android.dialer'), false);
});
