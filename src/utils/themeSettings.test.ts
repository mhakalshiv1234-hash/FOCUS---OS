import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_UI_THEME,
  UI_THEME_OPTIONS,
  getUiThemeDefinition,
  normalizeUiTheme,
  toggleUiTheme,
} from './themeSettings';

test('normalizeUiTheme defaults safely to nda-khadakwasla for unknown values', () => {
  assert.equal(normalizeUiTheme(undefined), DEFAULT_UI_THEME);
  assert.equal(normalizeUiTheme(null), 'nda-khadakwasla');
  assert.equal(normalizeUiTheme('solarized'), 'nda-khadakwasla');
  assert.equal(normalizeUiTheme('terminal'), 'terminal');
  assert.equal(normalizeUiTheme('nda-khadakwasla'), 'nda-khadakwasla');
});

test('toggleUiTheme alternates cleanly between nda-khadakwasla and terminal', () => {
  assert.equal(toggleUiTheme('nda-khadakwasla'), 'terminal');
  assert.equal(toggleUiTheme('terminal'), 'nda-khadakwasla');
});

test('UI_THEME_OPTIONS exposes NDA Khadakwasla and high-contrast Terminal palettes', () => {
  assert.equal(UI_THEME_OPTIONS.length, 2);

  const nda = getUiThemeDefinition('nda-khadakwasla');
  const terminal = getUiThemeDefinition('terminal');

  assert.equal(nda.name, 'NDA Khadakwasla');
  assert.deepEqual(nda.swatches, ['#0C0F14', '#E11D48', '#D4AD5A']);

  assert.equal(terminal.name, 'Terminal');
  assert.deepEqual(terminal.swatches, ['#000000', '#00FF66', '#FFB000']);
  assert.equal(terminal.chartPalette.accent, '#00FF66');
  assert.equal(terminal.chartPalette.secondaryAccent, '#FFB000');
});
