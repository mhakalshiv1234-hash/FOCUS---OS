import {
  CommandCenterState,
  calculateDisciplineScore,
  formatMinutesCompact,
} from './discipline';
import { AppUsageRecord, computeUsageAnalyticsSummary } from './usageAnalytics';

export type NdaSubject = 'Mathematics' | 'GAT' | 'English';
export type ChapterStatus = 'not_started' | 'in_progress' | 'needs_revision' | 'mastered';
export type LectureStatus = 'completed' | 'in_progress' | 'backlog';

export interface PersonalProfile {
  callsign: string;
  age: number;
  educationStage: string;
  learningMode: string;
  location: string;
  device: string;
  mathEnvironment: string;
  generalEnvironment: string;
  preferredStudyWindow: string;
  primaryAcademicTarget: string;
  secondaryAcademicTarget: string;
  priorAttemptNote: string;
  ndaExamDateIso: string; // YYYY-MM-DD
  coreValues: string[];
  militaryInterests: string[];
  techInterests: string[];
  gamingPreferences: string[];
  munDevelopingInterest: {
    enabled: boolean;
    recentCommittee: string;
    delegation: string;
    role: string;
    agenda: string;
    focusAreas: string;
  };
  characterQualities: string[];
}

export interface NdaChapterItem {
  id: string;
  subject: NdaSubject;
  title: string;
  status: ChapterStatus;
  pyqsSolved: number;
  accuracyPct: number;
  revisionCount: number;
}

export interface NdaMockTestEntry {
  id: string;
  label: string;
  dateLabel: string;
  mathScore: number; // out of 300
  gatScore: number; // out of 600
  weakChapter: string;
  mistakeAnalysis: string;
}

export interface JeeLectureItem {
  id: string;
  chapter: string;
  topic: string;
  durationMinutes: number; // ~180m (3h)
  status: LectureStatus;
  fundamentalsChecked: boolean;
  notes: string;
}

export interface JeePracticeStats {
  questionsSolvedThisWeek: number;
  weeklyQuestionTarget: number;
  totalQuestionsSolved: number;
  accuracyPct: number;
  avgMinutesPerQuestion: number;
  weakConcepts: string[];
}

export interface PersonalHabitItem {
  id: string;
  label: string;
  category: 'Physical' | 'Mental' | 'Self-Care' | 'Character';
  completedToday: boolean;
  streakDays: number;
  practicalNote: string;
}

export interface MonthlyBaselineSnapshot {
  monthLabel: string;
  productiveDays: number;
  missedDays: number;
  ndaSyllabusPct: number;
  jeeSyllabusPct: number;
  avgMockScore: number;
  backlogLectures: number;
  habitConsistencyPct: number;
}

export interface MentorMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAtEpochMs: number;
}

export interface PersonalizationState {
  profile: PersonalProfile;
  ndaChapters: NdaChapterItem[];
  ndaMocks: NdaMockTestEntry[];
  jeeLectures: JeeLectureItem[];
  jeePractice: JeePracticeStats;
  habits: PersonalHabitItem[];
  previousMonth: MonthlyBaselineSnapshot;
  characterReflectionToday: string;
}

export interface NdaSubjectSummary {
  subject: NdaSubject;
  totalChapters: number;
  masteredCount: number;
  inProgressCount: number;
  needsRevisionCount: number;
  completionPct: number;
  avgAccuracyPct: number;
  pyqsSolved: number;
}

export interface JeeMathProgressSummary {
  totalLectures: number;
  completedLectures: number;
  inProgressLectures: number;
  backlogLectures: number;
  completionPct: number;
  pendingBacklogItems: JeeLectureItem[];
  questionsSolvedThisWeek: number;
  weeklyQuestionTarget: number;
  totalQuestionsSolved: number;
  accuracyPct: number;
  avgMinutesPerQuestion: number;
  weakConcepts: string[];
}

export interface WeaknessDiagnostic {
  id: string;
  severity: 'high' | 'medium' | 'watch';
  problem: string;
  cause: string;
  solution: string;
  recoveryPlan: string;
  trackingOutcome: string;
}

export interface WeeklyIntelligenceReport {
  generatedAtIso: string;
  ndaPreparationProgress: string;
  jeeMathematicsProgress: string;
  lecturesCompletedText: string;
  questionsSolvedText: string;
  revisionCompletedText: string;
  backlogText: string;
  productivityPct: number;
  mostProductiveDay: string;
  biggestDistraction: string;
  weakestAcademicArea: string;
  personalDevelopmentProgress: string;
  recommendations: string[];
}

export interface MonthlyMissionReview {
  currentMonthLabel: string;
  previousMonthLabel: string;
  totalProductiveDays: number;
  prevProductiveDays: number;
  missedStudyDays: number;
  prevMissedStudyDays: number;
  ndaSyllabusPct: number;
  prevNdaSyllabusPct: number;
  jeeSyllabusPct: number;
  prevJeeSyllabusPct: number;
  avgMockScore: number;
  prevAvgMockScore: number;
  backlogCount: number;
  prevBacklogCount: number;
  habitConsistencyPct: number;
  prevHabitConsistencyPct: number;
  nda2027ReadinessNote: string;
  honestAssessment: string;
}

export const CORE_CREED_PILLARS: readonly string[] = [
  'DISCIPLINE OVER MOTIVATION',
  'CONSISTENCY OVER INTENSITY',
  'PROGRESS OVER PERFECTION',
  'CHARACTER OVER EGO',
];

export function getDefaultPersonalizationState(): PersonalizationState {
  return {
    profile: {
      callsign: 'Cadet',
      age: 17,
      educationStage: 'First-year college student',
      learningMode: 'Distance learning / flexible learning',
      location: 'India',
      device: 'Android smartphone',
      mathEnvironment: 'Library (focused Mathematics preparation)',
      generalEnvironment: 'Home (GAT, English, revision & academic work)',
      preferredStudyWindow: 'Evening / Night study blocks',
      primaryAcademicTarget: 'NDA 2027',
      secondaryAcademicTarget: 'JEE Mathematics',
      priorAttemptNote:
        'Attempted NDA 2 2026 (did not clear) — rebuilding with consistent daily blocks, PYQs, and mistake analysis.',
      ndaExamDateIso: '2027-04-18',
      coreValues: [...CORE_CREED_PILLARS],
      militaryInterests: [
        'Indian Armed Forces',
        'NDA preparation',
        'Military history',
        'Special forces',
        'Defence strategy',
        'Intelligence agencies',
        'Geopolitics',
      ],
      techInterests: [
        'Artificial intelligence',
        'Google AI Studio',
        'Android customization',
        'Productivity applications',
        'Personal AI assistants',
        'Automation',
      ],
      gamingPreferences: ['Call of Duty', 'BGMI', 'Candy Crush'],
      munDevelopingInterest: {
        enabled: true,
        recentCommittee: 'Joint Crisis Committee',
        delegation: 'USA delegation',
        role: 'Director of Central Intelligence',
        agenda: 'Cold War — USA vs USSR',
        focusAreas:
          'Intelligence gathering, strategic thinking, diplomacy, crisis management, international relations (developing interest)',
      },
      characterQualities: [
        'Calm under pressure',
        'Physically healthy',
        'Mentally strong',
        'Knowledgeable',
        'Generous & respectful',
        'Disciplined',
        'Well-groomed & confident',
        'Emotionally mature',
      ],
    },
    ndaChapters: [
      {
        id: 'nda-m-calc',
        subject: 'Mathematics',
        title: 'Differential & Integral Calculus',
        status: 'in_progress',
        pyqsSolved: 45,
        accuracyPct: 68,
        revisionCount: 2,
      },
      {
        id: 'nda-m-vec',
        subject: 'Mathematics',
        title: 'Matrices, Determinants & Vector Algebra',
        status: 'mastered',
        pyqsSolved: 60,
        accuracyPct: 81,
        revisionCount: 3,
      },
      {
        id: 'nda-m-trig',
        subject: 'Mathematics',
        title: 'Trigonometry & Heights/Distances',
        status: 'needs_revision',
        pyqsSolved: 30,
        accuracyPct: 54,
        revisionCount: 1,
      },
      {
        id: 'nda-m-prob',
        subject: 'Mathematics',
        title: 'Probability & Statistics',
        status: 'not_started',
        pyqsSolved: 0,
        accuracyPct: 0,
        revisionCount: 0,
      },
      {
        id: 'nda-g-polity',
        subject: 'GAT',
        title: 'Indian Polity, Constitution & Defence Structure',
        status: 'mastered',
        pyqsSolved: 55,
        accuracyPct: 84,
        revisionCount: 2,
      },
      {
        id: 'nda-g-geo',
        subject: 'GAT',
        title: 'Indian & World Geography + Geopolitics',
        status: 'in_progress',
        pyqsSolved: 32,
        accuracyPct: 74,
        revisionCount: 1,
      },
      {
        id: 'nda-g-phy',
        subject: 'GAT',
        title: 'General Science — Mechanics & Optics',
        status: 'needs_revision',
        pyqsSolved: 24,
        accuracyPct: 58,
        revisionCount: 1,
      },
      {
        id: 'nda-e-rc',
        subject: 'English',
        title: 'Comprehension, Ordering & Cloze Passages',
        status: 'mastered',
        pyqsSolved: 50,
        accuracyPct: 86,
        revisionCount: 2,
      },
      {
        id: 'nda-e-idiom',
        subject: 'English',
        title: 'Spotting Errors, Synonyms & Idioms',
        status: 'in_progress',
        pyqsSolved: 38,
        accuracyPct: 72,
        revisionCount: 1,
      },
    ],
    ndaMocks: [
      {
        id: 'mock-1',
        label: 'NDA Full Mock #1 (Baseline)',
        dateLabel: 'Wed',
        mathScore: 138,
        gatScore: 342,
        weakChapter: 'Trigonometry & General Science Optics',
        mistakeAnalysis: 'Rushed sign checks in inverse trig; skipped 25m post-test review.',
      },
    ],
    jeeLectures: [
      {
        id: 'jee-lec-1',
        chapter: 'Quadratic Equations',
        topic: 'Lecture 01 — Roots, Location of Roots & Fundamentals',
        durationMinutes: 180,
        status: 'completed',
        fundamentalsChecked: true,
        notes: 'Notes consolidated + basic drill completed before advanced sheet.',
      },
      {
        id: 'jee-lec-2',
        chapter: 'Sequences & Series',
        topic: 'Lecture 02 — AP/GP/AGP & Summation Methods',
        durationMinutes: 180,
        status: 'in_progress',
        fundamentalsChecked: true,
        notes: '2h 00m watched; 1h remaining + fundamentals sheet pending.',
      },
      {
        id: 'jee-lec-3',
        chapter: 'Limits & Continuity',
        topic: 'Lecture 03 — Standard Limits & L-Hopital Boundaries',
        durationMinutes: 180,
        status: 'backlog',
        fundamentalsChecked: false,
        notes: 'Unfinished lecture tracked in backlog — schedule inside evening block.',
      },
    ],
    jeePractice: {
      questionsSolvedThisWeek: 64,
      weeklyQuestionTarget: 120,
      totalQuestionsSolved: 185,
      accuracyPct: 71,
      avgMinutesPerQuestion: 3.4,
      weakConcepts: ['Location of roots edge cases', 'Trigonometric substitution speed'],
    },
    habits: [
      {
        id: 'hab-fitness',
        label: 'Physical Training / Mobility (30m+)',
        category: 'Physical',
        completedToday: true,
        streakDays: 5,
        practicalNote: 'Bodyweight + run/walk consistency for stamina and energy.',
      },
      {
        id: 'hab-calm',
        label: 'Calm Under Pressure Reset (10m)',
        category: 'Mental',
        completedToday: true,
        streakDays: 4,
        practicalNote: 'Controlled breathing + pre-study quiet reset without phone.',
      },
      {
        id: 'hab-grooming',
        label: 'Grooming, Posture & Self-Care',
        category: 'Self-Care',
        completedToday: true,
        streakDays: 6,
        practicalNote: 'Clean basics: hydration, skincare, posture, neat desk.',
      },
      {
        id: 'hab-sleep',
        label: 'Phone Curfew Before Sleep',
        category: 'Mental',
        completedToday: false,
        streakDays: 2,
        practicalNote: 'Avoid late-night scrolling or unscheduled gaming after study block.',
      },
      {
        id: 'hab-character',
        label: 'Respectful Conduct & Daily Honesty Check',
        category: 'Character',
        completedToday: true,
        streakDays: 5,
        practicalNote: 'Own mistakes directly; speak clearly and treat family/peers with respect.',
      },
    ],
    previousMonth: {
      monthLabel: 'Previous Month (Baseline)',
      productiveDays: 14,
      missedDays: 8,
      ndaSyllabusPct: 24,
      jeeSyllabusPct: 18,
      avgMockScore: 432,
      backlogLectures: 3,
      habitConsistencyPct: 56,
    },
    characterReflectionToday:
      'Handled Mathematics block calmly in the library; need to close Sequence & Series lecture before opening BGMI/COD.',
  };
}

export function computeNdaCountdown(
  examDateIso: string,
  nowEpochMs: number = Date.now()
): { daysRemaining: number; targetDateLabel: string } {
  const parsed = Date.parse(`${examDateIso}T09:00:00Z`);
  if (!Number.isFinite(parsed)) {
    return { daysRemaining: 0, targetDateLabel: examDateIso };
  }
  const diffDays = Math.max(0, Math.ceil((parsed - nowEpochMs) / (1000 * 60 * 60 * 24)));
  return {
    daysRemaining: diffDays,
    targetDateLabel: examDateIso,
  };
}

export function computeNdaSubjectSummaries(chapters: NdaChapterItem[]): NdaSubjectSummary[] {
  const subjects: NdaSubject[] = ['Mathematics', 'GAT', 'English'];
  return subjects.map((subject) => {
    const items = chapters.filter((c) => c.subject === subject);
    const total = items.length;
    const masteredCount = items.filter((c) => c.status === 'mastered').length;
    const inProgressCount = items.filter((c) => c.status === 'in_progress').length;
    const needsRevisionCount = items.filter((c) => c.status === 'needs_revision').length;
    // Weighted mastery: mastered = 1.0, in_progress/needs_revision = 0.45
    const weightedPoints = items.reduce((acc, item) => {
      if (item.status === 'mastered') return acc + 1;
      if (item.status === 'in_progress' || item.status === 'needs_revision') return acc + 0.45;
      return acc;
    }, 0);
    const completionPct = total > 0 ? Math.round((weightedPoints / total) * 100) : 0;
    const attempted = items.filter((c) => c.pyqsSolved > 0);
    const avgAccuracyPct =
      attempted.length > 0
        ? Math.round(attempted.reduce((acc, c) => acc + c.accuracyPct, 0) / attempted.length)
        : 0;
    const pyqsSolved = items.reduce((acc, c) => acc + c.pyqsSolved, 0);

    return {
      subject,
      totalChapters: total,
      masteredCount,
      inProgressCount,
      needsRevisionCount,
      completionPct,
      avgAccuracyPct,
      pyqsSolved,
    };
  });
}

export function computeOverallNdaSyllabusPct(chapters: NdaChapterItem[]): number {
  if (chapters.length === 0) return 0;
  const weighted = chapters.reduce((acc, item) => {
    if (item.status === 'mastered') return acc + 1;
    if (item.status === 'in_progress' || item.status === 'needs_revision') return acc + 0.45;
    return acc;
  }, 0);
  return Math.round((weighted / chapters.length) * 100);
}

export function computeJeeMathProgress(
  lectures: JeeLectureItem[],
  practice: JeePracticeStats
): JeeMathProgressSummary {
  const totalLectures = lectures.length;
  const completedLectures = lectures.filter((l) => l.status === 'completed').length;
  const inProgressLectures = lectures.filter((l) => l.status === 'in_progress').length;
  const backlogLectures = lectures.filter((l) => l.status === 'backlog').length;
  const pendingBacklogItems = lectures.filter((l) => l.status !== 'completed');
  const weighted = lectures.reduce((acc, l) => {
    if (l.status === 'completed') return acc + 1;
    if (l.status === 'in_progress') return acc + 0.5;
    return acc;
  }, 0);
  const completionPct = totalLectures > 0 ? Math.round((weighted / totalLectures) * 100) : 0;

  return {
    totalLectures,
    completedLectures,
    inProgressLectures,
    backlogLectures,
    completionPct,
    pendingBacklogItems,
    questionsSolvedThisWeek: practice.questionsSolvedThisWeek,
    weeklyQuestionTarget: practice.weeklyQuestionTarget,
    totalQuestionsSolved: practice.totalQuestionsSolved,
    accuracyPct: practice.accuracyPct,
    avgMinutesPerQuestion: practice.avgMinutesPerQuestion,
    weakConcepts: practice.weakConcepts,
  };
}

export function detectWeaknessPatterns(
  commandState: CommandCenterState,
  usageRecords: AppUsageRecord[],
  usageAccessGranted: boolean,
  personalization: PersonalizationState
): WeaknessDiagnostic[] {
  const diagnostics: WeaknessDiagnostic[] = [];
  const jee = computeJeeMathProgress(personalization.jeeLectures, personalization.jeePractice);

  if (jee.pendingBacklogItems.length > 0) {
    diagnostics.push({
      id: 'weak-jee-backlog',
      severity: jee.backlogLectures > 0 ? 'high' : 'medium',
      problem: `${jee.pendingBacklogItems.length} unfinished JEE Mathematics lecture(s) sitting in active queue (${jee.backlogLectures} backlog, ${jee.inProgressLectures} in progress).`,
      cause:
        'Long 3-hour JEE lectures feel heavy when started late or split without a clear completion checkpoint.',
      solution:
        'Split the next 3-hour lecture into two 90m Library blocks with App Blocker active, then immediately solve 15 foundational problems before touching advanced sheets.',
      recoveryPlan: `Finish "${jee.pendingBacklogItems[0].chapter}" first before starting any new lecture topic.`,
      trackingOutcome: `Tracked directly in Backlog Guard: ${jee.completedLectures}/${jee.totalLectures} lectures closed.`,
    });
  }

  const analytics = computeUsageAnalyticsSummary({
    records: usageRecords,
    blockedPackages: [],
    usageAccessGranted,
    focusMinutesToday: commandState.focusMinutesToday,
    rangeDays: 1,
  });

  if (usageAccessGranted && commandState.distractingMinutesToday > 15) {
    const topDistractor = analytics.topDistractingApp?.appName ?? 'video/social apps';
    diagnostics.push({
      id: 'weak-phone-leakage',
      severity: commandState.distractingMinutesToday >= 35 ? 'high' : 'medium',
      problem: `Excessive smartphone distraction (${commandState.distractingMinutesToday}m today vs 15m allowance), led by ${topDistractor}.`,
      cause:
        'Context switching during breaks or before starting evening blocks pulls attention into short-form feeds or quick matches.',
      solution:
        'Keep Call of Duty / BGMI / YouTube inside an evening reward window *after* hitting your 1st study block, and turn on Strict Lock during Library Math blocks.',
      recoveryPlan:
        'Launch a 60m Intensive Block right now with YouTube, Instagram, and TikTok sealed.',
      trackingOutcome: `Currently ${commandState.blockedAttemptsToday} distraction attempt(s) blocked today.`,
    });
  }

  const weakChapters = personalization.ndaChapters.filter(
    (c) => c.status === 'needs_revision' || (c.pyqsSolved > 0 && c.accuracyPct < 60)
  );
  if (weakChapters.length > 0) {
    diagnostics.push({
      id: 'weak-nda-revision',
      severity: 'medium',
      problem: `Revision gap on ${weakChapters.length} NDA chapter(s): ${weakChapters
        .map((c) => c.title)
        .slice(0, 2)
        .join(', ')}.`,
      cause:
        'Moving forward to new topics without spaced PYQ revision lowers accuracy under exam time pressure.',
      solution:
        'Dedicate 45 minutes of tonight’s Home study block exclusively to PYQ error review on flagged chapters.',
      recoveryPlan:
        'Solve 20 timed PYQs per weak chapter and log accuracy before marking it Mastered.',
      trackingOutcome: `Target: lift lowest accuracy (${Math.min(
        ...weakChapters.map((c) => c.accuracyPct)
      )}%) above 70%.`,
    });
  }

  const lowDays = commandState.weeklyHistory.filter(
    (d) => d.focusMinutes < commandState.dailyFocusTargetMinutes * 0.65
  );
  if (lowDays.length > 0) {
    diagnostics.push({
      id: 'weak-momentum-dip',
      severity: 'watch',
      problem: `Inconsistent momentum across ${lowDays.length} day(s) this week (lowest: ${lowDays[0].dayLabel} at ${formatMinutesCompact(
        lowDays[0].focusMinutes
      )}).`,
      cause:
        'Trying to compensate with oversized plans after an off day triggers hesitation and delays starting.',
      solution:
        'Use a realistic recovery block (30m Deep Work + 15 problems) to restart consistency without guilt.',
      recoveryPlan:
        'Lock 1 realistic evening block tonight rather than overloading tomorrow’s schedule.',
      trackingOutcome: `Consistency benchmark: ${
        commandState.weeklyHistory.filter((d) => d.focusMinutes >= commandState.dailyFocusTargetMinutes * 0.75).length
      }/7 steady days this week.`,
    });
  }

  if (diagnostics.length === 0) {
    diagnostics.push({
      id: 'weak-none-steady',
      severity: 'watch',
      problem: 'No acute slippage flagged from current recorded metrics.',
      cause: 'Focus blocks, lecture closures, and phone hygiene are currently within target bands.',
      solution: 'Protect consistency by maintaining evening revision and keeping backlog at zero.',
      recoveryPlan: 'Log today’s mock mistakes or next 3h lecture block proactively.',
      trackingOutcome: 'All weekly telemetry checks balanced.',
    });
  }

  return diagnostics;
}

export function buildWeeklyIntelligenceReport(
  commandState: CommandCenterState,
  usageRecords: AppUsageRecord[],
  usageAccessGranted: boolean,
  personalization: PersonalizationState,
  nowEpochMs: number = Date.now()
): WeeklyIntelligenceReport {
  const ndaPct = computeOverallNdaSyllabusPct(personalization.ndaChapters);
  const ndaSubjects = computeNdaSubjectSummaries(personalization.ndaChapters);
  const jee = computeJeeMathProgress(personalization.jeeLectures, personalization.jeePractice);

  const totalWeeklyFocus = commandState.weeklyHistory.reduce((acc, d) => acc + d.focusMinutes, 0);
  const totalWeeklyTarget = Math.max(1, commandState.dailyFocusTargetMinutes * commandState.weeklyHistory.length);
  const productivityPct = Math.min(100, Math.round((totalWeeklyFocus / totalWeeklyTarget) * 100));

  const sortedDays = [...commandState.weeklyHistory].sort((a, b) => {
    const scoreA = calculateDisciplineScore({
      focusMinutesToday: a.focusMinutes,
      focusTargetMinutes: commandState.dailyFocusTargetMinutes,
      distractingMinutesToday: a.distractingMinutes,
      blockedAttemptsResisted: a.blockedAttempts ?? 4,
      completedMissionsToday: a.missionsCompleted ?? 2,
      plannedMissionsToday: Math.max(1, commandState.missions.length),
    }).totalScore;
    const scoreB = calculateDisciplineScore({
      focusMinutesToday: b.focusMinutes,
      focusTargetMinutes: commandState.dailyFocusTargetMinutes,
      distractingMinutesToday: b.distractingMinutes,
      blockedAttemptsResisted: b.blockedAttempts ?? 4,
      completedMissionsToday: b.missionsCompleted ?? 2,
      plannedMissionsToday: Math.max(1, commandState.missions.length),
    }).totalScore;
    return scoreB - scoreA;
  });
  const bestDay = sortedDays[0];

  const analytics = computeUsageAnalyticsSummary({
    records: usageRecords,
    blockedPackages: [],
    usageAccessGranted,
    focusMinutesToday: commandState.focusMinutesToday,
    rangeDays: 7,
  });

  const totalRevisions = personalization.ndaChapters.reduce((acc, c) => acc + c.revisionCount, 0);
  const totalPyqs = personalization.ndaChapters.reduce((acc, c) => acc + c.pyqsSolved, 0);

  const sortedWeakChapters = [...personalization.ndaChapters]
    .filter((c) => c.pyqsSolved > 0 || c.status === 'needs_revision')
    .sort((a, b) => a.accuracyPct - b.accuracyPct);
  const weakestChapter = sortedWeakChapters[0];

  const habitsCompleted = personalization.habits.filter((h) => h.completedToday).length;
  const avgHabitStreak =
    personalization.habits.length > 0
      ? (
          personalization.habits.reduce((acc, h) => acc + h.streakDays, 0) /
          personalization.habits.length
        ).toFixed(1)
      : '0';

  const recs: string[] = [];
  if (jee.pendingBacklogItems.length > 0) {
    recs.push(
      `Clear "${jee.pendingBacklogItems[0].chapter}" (${jee.pendingBacklogItems[0].status.replace('_', ' ')}) in your next Library Math block before adding new JEE chapters.`
    );
  }
  if (weakestChapter) {
    recs.push(
      `Schedule a 45m Home revision block for ${weakestChapter.subject}: ${weakestChapter.title} (recorded accuracy ${weakestChapter.accuracyPct}%).`
    );
  }
  if (jee.questionsSolvedThisWeek < jee.weeklyQuestionTarget) {
    recs.push(
      `Solve ${jee.weeklyQuestionTarget - jee.questionsSolvedThisWeek} more foundational JEE Math problems to hit your ${jee.weeklyQuestionTarget}-question weekly target.`
    );
  }
  if (analytics.topDistractingApp) {
    recs.push(
      `Keep ${analytics.topDistractingApp.appName} blocked during evening study windows to trim weekly distraction below grace.`
    );
  }
  if (recs.length === 0) {
    recs.push('Maintain current evening study blocks and log a full NDA timed mock this weekend.');
  }

  return {
    generatedAtIso: new Date(nowEpochMs).toISOString().slice(0, 10),
    ndaPreparationProgress: `${ndaPct}% syllabus weighted (${ndaSubjects
      .map((s) => `${s.subject} ${s.completionPct}%`)
      .join(' · ')}) · ${totalPyqs} PYQs logged`,
    jeeMathematicsProgress: `${jee.completionPct}% lecture track (${jee.completedLectures}/${jee.totalLectures} 3h lectures complete) · ${jee.accuracyPct}% problem accuracy`,
    lecturesCompletedText: `${jee.completedLectures} completed, ${jee.inProgressLectures} in progress (${jee.totalLectures} tracked)`,
    questionsSolvedText: `${jee.questionsSolvedThisWeek} solved this week (target ${jee.weeklyQuestionTarget}) · ${jee.totalQuestionsSolved} cumulative · ${jee.avgMinutesPerQuestion} min/Q`,
    revisionCompletedText: `${totalRevisions} chapter revision cycles logged across ${personalization.ndaChapters.length} NDA chapters`,
    backlogText:
      jee.pendingBacklogItems.length > 0
        ? `${jee.backlogLectures} queued backlog + ${jee.inProgressLectures} unfinished lecture(s): ${jee.pendingBacklogItems
            .map((l) => l.chapter)
            .join(', ')}`
        : '0 unfinished lectures in backlog',
    productivityPct,
    mostProductiveDay: bestDay
      ? `${bestDay.dayLabel} (${formatMinutesCompact(bestDay.focusMinutes)} focus · ${bestDay.distractingMinutes}m distraction)`
      : 'No weekly days recorded yet',
    biggestDistraction: usageAccessGranted
      ? analytics.topDistractingApp
        ? `${analytics.topDistractingApp.appName} (${formatMinutesCompact(
            analytics.topDistractingApp.weeklyTotalMinutes
          )} over 7d)`
        : 'Within grace (<15m distracting)'
      : 'Usage Access not enabled — turn on tracking in Analytics for app-level breakdown',
    weakestAcademicArea: weakestChapter
      ? `${weakestChapter.subject}: ${weakestChapter.title} (${weakestChapter.accuracyPct}% accuracy)`
      : jee.weakConcepts[0] ?? 'Not flagged yet',
    personalDevelopmentProgress: `${habitsCompleted}/${personalization.habits.length} daily habits checked today · ${avgHabitStreak}d avg streak`,
    recommendations: recs,
  };
}

export function buildMonthlyMissionReview(
  commandState: CommandCenterState,
  personalization: PersonalizationState,
  nowEpochMs: number = Date.now()
): MonthlyMissionReview {
  const prev = personalization.previousMonth;
  const ndaSyllabusPct = computeOverallNdaSyllabusPct(personalization.ndaChapters);
  const jee = computeJeeMathProgress(personalization.jeeLectures, personalization.jeePractice);
  const countdown = computeNdaCountdown(personalization.profile.ndaExamDateIso, nowEpochMs);

  // Project conservatively from real recorded 7-day cadence (never invent completed targets)
  const steadyDaysThisWeek = commandState.weeklyHistory.filter(
    (d) => d.focusMinutes >= commandState.dailyFocusTargetMinutes * 0.65
  ).length;
  const missedThisWeek = Math.max(0, commandState.weeklyHistory.length - steadyDaysThisWeek);
  const totalProductiveDays = Math.min(30, steadyDaysThisWeek * 3 + Math.round(steadyDaysThisWeek * 0.5));
  const missedStudyDays = Math.max(0, 28 - totalProductiveDays - Math.max(0, 4 - missedThisWeek));

  const avgMockScore =
    personalization.ndaMocks.length > 0
      ? Math.round(
          personalization.ndaMocks.reduce((acc, m) => acc + m.mathScore + m.gatScore, 0) /
            personalization.ndaMocks.length
        )
      : 0;

  const backlogCount = jee.backlogLectures + jee.inProgressLectures;
  const habitConsistencyPct =
    personalization.habits.length > 0
      ? Math.round(
          (personalization.habits.filter((h) => h.completedToday).length /
            personalization.habits.length) *
            100
        )
      : 0;

  const syllabusDelta = ndaSyllabusPct - prev.ndaSyllabusPct;
  const backlogDelta = backlogCount - prev.backlogLectures;

  let honestAssessment = '';
  if (backlogCount > 0 && syllabusDelta >= 0) {
    honestAssessment = `NDA syllabus moved +${syllabusDelta}% vs ${prev.monthLabel}, and mock baseline sits at ${avgMockScore}/900. However, ${backlogCount} unfinished JEE Math lecture(s) still carry forward — close that queue before expanding daily volume.`;
  } else if (syllabusDelta < 0) {
    honestAssessment = `Syllabus pace is behind ${prev.monthLabel}. Tighten evening study blocks and prioritize weak NDA chapters plus fundamentals first.`;
  } else {
    honestAssessment = `Steady improvement (+${syllabusDelta}% NDA syllabus, backlog trimmed by ${Math.abs(
      backlogDelta
    )}). Stay consistent rather than chasing burst days.`;
  }

  return {
    currentMonthLabel: 'Current Month (Recorded Pace)',
    previousMonthLabel: prev.monthLabel,
    totalProductiveDays,
    prevProductiveDays: prev.productiveDays,
    missedStudyDays,
    prevMissedStudyDays: prev.missedDays,
    ndaSyllabusPct,
    prevNdaSyllabusPct: prev.ndaSyllabusPct,
    jeeSyllabusPct: jee.completionPct,
    prevJeeSyllabusPct: prev.jeeSyllabusPct,
    avgMockScore,
    prevAvgMockScore: prev.avgMockScore,
    backlogCount,
    prevBacklogCount: prev.backlogLectures,
    habitConsistencyPct,
    prevHabitConsistencyPct: prev.habitConsistencyPct,
    nda2027ReadinessNote: `${countdown.daysRemaining} days to NDA 2027 target (${countdown.targetDateLabel}) · ${steadyDaysThisWeek}/7 steady days logged in current 7-day window.`,
    honestAssessment,
  };
}

const PERSONALIZATION_STORAGE_KEY = 'focus_os_personalization_v1';
const MENTOR_CHAT_STORAGE_KEY = 'focus_os_mentor_chat_v1';

export function loadPersonalizationState(): PersonalizationState {
  if (typeof window === 'undefined') return getDefaultPersonalizationState();
  try {
    const raw = window.localStorage.getItem(PERSONALIZATION_STORAGE_KEY);
    if (!raw) return getDefaultPersonalizationState();
    const parsed = JSON.parse(raw) as Partial<PersonalizationState>;
    const defaults = getDefaultPersonalizationState();
    return {
      ...defaults,
      ...parsed,
      profile: {
        ...defaults.profile,
        ...(parsed.profile ?? {}),
        munDevelopingInterest: {
          ...defaults.profile.munDevelopingInterest,
          ...(parsed.profile?.munDevelopingInterest ?? {}),
        },
      },
      ndaChapters:
        Array.isArray(parsed.ndaChapters) && parsed.ndaChapters.length > 0
          ? parsed.ndaChapters
          : defaults.ndaChapters,
      ndaMocks: Array.isArray(parsed.ndaMocks) ? parsed.ndaMocks : defaults.ndaMocks,
      jeeLectures: Array.isArray(parsed.jeeLectures) ? parsed.jeeLectures : defaults.jeeLectures,
      jeePractice: {
        ...defaults.jeePractice,
        ...(parsed.jeePractice ?? {}),
      },
      habits:
        Array.isArray(parsed.habits) && parsed.habits.length > 0 ? parsed.habits : defaults.habits,
      previousMonth: {
        ...defaults.previousMonth,
        ...(parsed.previousMonth ?? {}),
      },
    };
  } catch {
    return getDefaultPersonalizationState();
  }
}

export function savePersonalizationState(state: PersonalizationState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PERSONALIZATION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadMentorMessages(): MentorMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(MENTOR_CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMentorMessages(messages: MentorMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(MENTOR_CHAT_STORAGE_KEY, JSON.stringify(messages.slice(-24)));
  } catch {
    // Ignore storage quota errors
  }
}

export function formatWeeklyReportMarkdown(
  report: WeeklyIntelligenceReport,
  profile: PersonalProfile
): string {
  return [
    `FOCUS//OS — WEEKLY INTELLIGENCE REPORT (${report.generatedAtIso})`,
    `Profile: ${profile.primaryAcademicTarget} + ${profile.secondaryAcademicTarget} | ${profile.preferredStudyWindow}`,
    `1. NDA Preparation Progress: ${report.ndaPreparationProgress}`,
    `2. JEE Mathematics Progress: ${report.jeeMathematicsProgress}`,
    `3. Lectures Completed: ${report.lecturesCompletedText}`,
    `4. Questions Solved: ${report.questionsSolvedText}`,
    `5. Revision Completed: ${report.revisionCompletedText}`,
    `6. Backlog: ${report.backlogText}`,
    `7. Productivity Percentage: ${report.productivityPct}%`,
    `8. Most Productive Day: ${report.mostProductiveDay}`,
    `9. Biggest Distraction: ${report.biggestDistraction}`,
    `10. Weakest Academic Area: ${report.weakestAcademicArea}`,
    `11. Personal Development Progress: ${report.personalDevelopmentProgress}`,
    `12. Recommendations for Next Week:`,
    ...report.recommendations.map((r, i) => `   ${i + 1}. ${r}`),
  ].join('\n');
}
