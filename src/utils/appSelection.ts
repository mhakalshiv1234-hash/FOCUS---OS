export type AppCategory = 'Social' | 'Video' | 'Games' | 'Browser' | 'Productivity' | 'Other';
export type BlockFilterMode = 'All' | 'Blocked' | 'Allowed';

export interface InstalledAppRecord {
  packageName: string;
  appName: string;
  category: AppCategory;
  isSystemApp: boolean;
  isProtectedSafetyApp: boolean;
  accentHex: string;
  monogram: string;
}

export interface InstalledAppViewModel extends InstalledAppRecord {
  isBlocked: boolean;
}

const PROTECTED_PREFIXES = [
  'com.android.dialer',
  'com.google.android.dialer',
  'com.samsung.android.dialer',
  'com.android.phone',
  'com.android.server.telecom',
  'com.android.emergency',
  'com.android.settings',
];

const SOCIAL_KEYWORDS = [
  'instagram',
  'whatsapp',
  'snapchat',
  'facebook',
  'orca',
  'twitter',
  'x.android',
  'reddit',
  'discord',
  'telegram',
  'threads',
  'linkedin',
];

const VIDEO_KEYWORDS = [
  'youtube',
  'netflix',
  'twitch',
  'musically',
  'tiktok',
  'primevideo',
  'disney',
  'vimeo',
];

const GAME_KEYWORDS = [
  'supercell',
  'roblox',
  'pubg',
  'garena',
  'riotgames',
  'minecraft',
  'activision',
  'mojang',
  'candycrush',
];

const BROWSER_KEYWORDS = ['chrome', 'firefox', 'brave', 'opera', 'duckduckgo', 'edge', 'browser'];

const PRODUCTIVITY_KEYWORDS = [
  'docs',
  'sheets',
  'notion',
  'obsidian',
  'anki',
  'khanacademy',
  'coursera',
  'duolingo',
  'quizlet',
  'calendar',
];

export function isProtectedSafetyPackage(packageName: string, selfPackageName = 'com.focusos.app'): boolean {
  if (packageName === selfPackageName) return true;
  const lower = packageName.toLowerCase();
  return PROTECTED_PREFIXES.some((prefix) => lower === prefix || lower.startsWith(`${prefix}.`));
}

export function categorizePackage(packageName: string, appName: string): AppCategory {
  const target = `${packageName.toLowerCase()} ${appName.toLowerCase()}`;
  if (SOCIAL_KEYWORDS.some((kw) => target.includes(kw))) return 'Social';
  if (VIDEO_KEYWORDS.some((kw) => target.includes(kw))) return 'Video';
  if (GAME_KEYWORDS.some((kw) => target.includes(kw))) return 'Games';
  if (BROWSER_KEYWORDS.some((kw) => target.includes(kw))) return 'Browser';
  if (PRODUCTIVITY_KEYWORDS.some((kw) => target.includes(kw))) return 'Productivity';
  return 'Other';
}

export function filterAndSortApps(
  apps: InstalledAppViewModel[],
  query: string,
  selectedCategory: AppCategory | null,
  filterMode: BlockFilterMode
): InstalledAppViewModel[] {
  const q = query.trim().toLowerCase();
  return apps
    .filter((app) => {
      const matchesQuery =
        !q || app.appName.toLowerCase().includes(q) || app.packageName.toLowerCase().includes(q);
      const matchesCategory = selectedCategory === null || app.category === selectedCategory;
      const matchesMode =
        filterMode === 'All'
          ? true
          : filterMode === 'Blocked'
          ? app.isBlocked
          : !app.isBlocked;
      return matchesQuery && matchesCategory && matchesMode;
    })
    .sort((a, b) => {
      if (a.isBlocked !== b.isBlocked) {
        return a.isBlocked ? -1 : 1;
      }
      return a.appName.localeCompare(b.appName);
    });
}

export function getDistractingPresetPackages(apps: InstalledAppRecord[]): string[] {
  return apps
    .filter(
      (app) =>
        !app.isProtectedSafetyApp &&
        (app.category === 'Social' || app.category === 'Video' || app.category === 'Games')
    )
    .map((app) => app.packageName);
}

export const SAMPLE_ANDROID_APPS: InstalledAppRecord[] = [
  {
    packageName: 'com.instagram.android',
    appName: 'Instagram',
    category: categorizePackage('com.instagram.android', 'Instagram'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.instagram.android'),
    accentHex: '#C13584',
    monogram: 'IG',
  },
  {
    packageName: 'com.google.android.youtube',
    appName: 'YouTube',
    category: categorizePackage('com.google.android.youtube', 'YouTube'),
    isSystemApp: true,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.google.android.youtube'),
    accentHex: '#DC2626',
    monogram: 'YT',
  },
  {
    packageName: 'com.zhiliaoapp.musically',
    appName: 'TikTok',
    category: categorizePackage('com.zhiliaoapp.musically', 'TikTok'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.zhiliaoapp.musically'),
    accentHex: '#E11D48',
    monogram: 'TT',
  },
  {
    packageName: 'com.reddit.frontpage',
    appName: 'Reddit',
    category: categorizePackage('com.reddit.frontpage', 'Reddit'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.reddit.frontpage'),
    accentHex: '#EA580C',
    monogram: 'RD',
  },
  {
    packageName: 'com.twitter.android',
    appName: 'X',
    category: categorizePackage('com.twitter.android', 'X'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.twitter.android'),
    accentHex: '#475569',
    monogram: 'X',
  },
  {
    packageName: 'com.discord',
    appName: 'Discord',
    category: categorizePackage('com.discord', 'Discord'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.discord'),
    accentHex: '#4F46E5',
    monogram: 'DC',
  },
  {
    packageName: 'com.supercell.clashroyale',
    appName: 'Clash Royale',
    category: categorizePackage('com.supercell.clashroyale', 'Clash Royale'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.supercell.clashroyale'),
    accentHex: '#2563EB',
    monogram: 'CR',
  },
  {
    packageName: 'com.pubg.imobile',
    appName: 'BGMI',
    category: categorizePackage('com.pubg.imobile', 'BGMI'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.pubg.imobile'),
    accentHex: '#D97706',
    monogram: 'BG',
  },
  {
    packageName: 'com.activision.callofduty.shooter',
    appName: 'Call of Duty: Mobile',
    category: categorizePackage('com.activision.callofduty.shooter', 'Call of Duty: Mobile'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.activision.callofduty.shooter'),
    accentHex: '#B45309',
    monogram: 'CD',
  },
  {
    packageName: 'com.king.candycrushsaga',
    appName: 'Candy Crush Saga',
    category: categorizePackage('com.king.candycrushsaga', 'Candy Crush Saga'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.king.candycrushsaga'),
    accentHex: '#DB2777',
    monogram: 'CC',
  },
  {
    packageName: 'com.android.chrome',
    appName: 'Chrome',
    category: categorizePackage('com.android.chrome', 'Chrome'),
    isSystemApp: true,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.android.chrome'),
    accentHex: '#0284C7',
    monogram: 'CH',
  },
  {
    packageName: 'com.whatsapp',
    appName: 'WhatsApp',
    category: categorizePackage('com.whatsapp', 'WhatsApp'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.whatsapp'),
    accentHex: '#16A34A',
    monogram: 'WA',
  },
  {
    packageName: 'com.ichi2.anki',
    appName: 'AnkiDroid',
    category: categorizePackage('com.ichi2.anki', 'AnkiDroid'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.ichi2.anki'),
    accentHex: '#0EA5E9',
    monogram: 'AK',
  },
  {
    packageName: 'md.obsidian',
    appName: 'Obsidian',
    category: categorizePackage('md.obsidian', 'Obsidian'),
    isSystemApp: false,
    isProtectedSafetyApp: isProtectedSafetyPackage('md.obsidian'),
    accentHex: '#7C3AED',
    monogram: 'OB',
  },
  {
    packageName: 'com.google.android.dialer',
    appName: 'Phone / Dialer',
    category: categorizePackage('com.google.android.dialer', 'Phone / Dialer'),
    isSystemApp: true,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.google.android.dialer'),
    accentHex: '#15803D',
    monogram: 'PH',
  },
  {
    packageName: 'com.android.settings',
    appName: 'System Settings',
    category: categorizePackage('com.android.settings', 'System Settings'),
    isSystemApp: true,
    isProtectedSafetyApp: isProtectedSafetyPackage('com.android.settings'),
    accentHex: '#475569',
    monogram: 'ST',
  },
];

const BLOCKLIST_STORAGE_KEY = 'focus_os_stage2_blocklist_v1';
const DEFAULT_BLOCKLIST = ['com.zhiliaoapp.musically', 'com.google.android.youtube'];

export function loadBlocklistPackages(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_BLOCKLIST;
  }
  try {
    const raw = window.localStorage.getItem(BLOCKLIST_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_BLOCKLIST;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return DEFAULT_BLOCKLIST;
    }
    return parsed.filter(
      (pkg): pkg is string => typeof pkg === 'string' && !isProtectedSafetyPackage(pkg)
    );
  } catch {
    return DEFAULT_BLOCKLIST;
  }
}

export function saveBlocklistPackages(packages: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    const sanitized = packages.filter((pkg) => !isProtectedSafetyPackage(pkg));
    window.localStorage.setItem(BLOCKLIST_STORAGE_KEY, JSON.stringify(sanitized));
  } catch {
    // Ignore storage quota errors
  }
}
