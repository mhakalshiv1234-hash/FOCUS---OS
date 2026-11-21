export type UiThemeId = 'nda-khadakwasla' | 'terminal';

export interface UiThemeDefinition {
  id: UiThemeId;
  name: string;
  shortLabel: string;
  description: string;
  swatches: [string, string, string];
  chartPalette: {
    accent: string;
    secondaryAccent: string;
    track: string;
    grid: string;
    axisText: string;
    tooltipBg: string;
    tooltipBorder: string;
    heatmapRamp: [string, string, string, string, string];
    cellStroke: string;
    selectedCellStroke: string;
    lowCellText: string;
    midCellText: string;
    highCellText: string;
  };
}

export const DEFAULT_UI_THEME: UiThemeId = 'nda-khadakwasla';

export const UI_THEMES: Record<UiThemeId, UiThemeDefinition> = {
  'nda-khadakwasla': {
    id: 'nda-khadakwasla',
    name: 'NDA Khadakwasla',
    shortLabel: 'NDA Khadakwasla',
    description:
      'Soft midnight slate dark mode with warm crimson, muted gold accents, and Khadakwasla backdrop.',
    swatches: ['#0C0F14', '#E11D48', '#D4AD5A'],
    chartPalette: {
      accent: '#E11D48',
      secondaryAccent: '#D4AD5A',
      track: '#232B3A',
      grid: '#1D2432',
      axisText: '#94A3B8',
      tooltipBg: '#0F131B',
      tooltipBorder: '#2A3346',
      heatmapRamp: ['#151B26', '#4C1D2D', '#9F1239', '#E11D48', '#D4AD5A'],
      cellStroke: '#1E2534',
      selectedCellStroke: '#D4AD5A',
      lowCellText: '#94A3B8',
      midCellText: '#F8FAFC',
      highCellText: '#0C0F14',
    },
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    shortLabel: 'Terminal // CRT',
    description:
      'High-contrast phosphor green & amber on pitch black with full-screen monospace discipline telemetry.',
    swatches: ['#000000', '#00FF66', '#FFB000'],
    chartPalette: {
      accent: '#00FF66',
      secondaryAccent: '#FFB000',
      track: '#0D2918',
      grid: '#143D24',
      axisText: '#A7F3C5',
      tooltipBg: '#000000',
      tooltipBorder: '#00FF66',
      heatmapRamp: ['#041109', '#09381D', '#0B7A3B', '#00D95A', '#FFB000'],
      cellStroke: '#14532D',
      selectedCellStroke: '#FFB000',
      lowCellText: '#9AE6B4',
      midCellText: '#021208',
      highCellText: '#021208',
    },
  },
};

export const UI_THEME_OPTIONS: UiThemeDefinition[] = [
  UI_THEMES['nda-khadakwasla'],
  UI_THEMES.terminal,
];

const UI_THEME_STORAGE_KEY = 'focus_os_ui_theme_v1';

export function normalizeUiTheme(value: unknown): UiThemeId {
  if (value === 'terminal') return 'terminal';
  return 'nda-khadakwasla';
}

export function toggleUiTheme(current: UiThemeId): UiThemeId {
  return current === 'nda-khadakwasla' ? 'terminal' : 'nda-khadakwasla';
}

export function getUiThemeDefinition(themeId: UiThemeId): UiThemeDefinition {
  return UI_THEMES[normalizeUiTheme(themeId)];
}

export function loadUiTheme(): UiThemeId {
  if (typeof window === 'undefined') return DEFAULT_UI_THEME;
  try {
    const raw = window.localStorage.getItem(UI_THEME_STORAGE_KEY);
    return normalizeUiTheme(raw);
  } catch {
    return DEFAULT_UI_THEME;
  }
}

export function saveUiTheme(themeId: UiThemeId): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(UI_THEME_STORAGE_KEY, normalizeUiTheme(themeId));
  } catch {
    // Ignore storage quota errors
  }
}

export function applyThemeToDocument(themeId: UiThemeId): void {
  if (typeof document === 'undefined') return;
  const normalized = normalizeUiTheme(themeId);
  document.documentElement.setAttribute('data-theme', normalized);
}
