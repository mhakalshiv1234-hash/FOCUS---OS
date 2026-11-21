import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Compass,
  Copy,
  FileText,
  Flame,
  Plus,
  Send,
  ShieldAlert,
  Sparkles,
  Target,
  UserCheck,
} from 'lucide-react';
import { CommandCenterState, formatMinutesCompact } from '../utils/discipline';
import { AppUsageRecord } from '../utils/usageAnalytics';
import {
  CORE_CREED_PILLARS,
  ChapterStatus,
  JeeLectureItem,
  LectureStatus,
  MentorMessage,
  NdaChapterItem,
  NdaMockTestEntry,
  NdaSubject,
  PersonalizationState,
  buildMonthlyMissionReview,
  buildWeeklyIntelligenceReport,
  computeJeeMathProgress,
  computeNdaCountdown,
  computeNdaSubjectSummaries,
  computeOverallNdaSyllabusPct,
  detectWeaknessPatterns,
  formatWeeklyReportMarkdown,
} from '../utils/personalization';

export type PersonalSubTab = 'mentor' | 'academics' | 'intel' | 'profile';

interface PersonalOsViewProps {
  personalization: PersonalizationState;
  commandState: CommandCenterState;
  usageRecords: AppUsageRecord[];
  usageAccessGranted: boolean;
  mentorMessages: MentorMessage[];
  onUpdatePersonalization: (updater: (prev: PersonalizationState) => PersonalizationState) => void;
  onResetPersonalization: () => void;
  onAppendMentorMessage: (msg: MentorMessage) => void;
  onClearMentorMessages: () => void;
  initialSubTab?: PersonalSubTab;
}

const CHAPTER_STATUS_ORDER: ChapterStatus[] = [
  'not_started',
  'in_progress',
  'needs_revision',
  'mastered',
];

const CHAPTER_STATUS_LABELS: Record<ChapterStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  needs_revision: 'Needs Revision',
  mastered: 'Mastered',
};

const LECTURE_STATUS_ORDER: LectureStatus[] = ['backlog', 'in_progress', 'completed'];

const LECTURE_STATUS_LABELS: Record<LectureStatus, string> = {
  backlog: 'Backlog',
  in_progress: 'In Progress',
  completed: 'Completed',
};

const QUICK_MENTOR_PROMPTS = [
  'Audit my NDA 2027 & JEE Mathematics weak spots honestly.',
  'Build a realistic evening study plan for tonight based on my pending backlog.',
  'Analyze my distraction & phone usage today and give me a recovery plan.',
  'Summarize my Weekly Intelligence Report and tell me what to fix next week.',
];

export const PersonalOsView: React.FC<PersonalOsViewProps> = ({
  personalization,
  commandState,
  usageRecords,
  usageAccessGranted,
  mentorMessages,
  onUpdatePersonalization,
  onResetPersonalization,
  onAppendMentorMessage,
  onClearMentorMessages,
  initialSubTab = 'mentor',
}) => {
  const [subTab, setSubTab] = useState<PersonalSubTab>(initialSubTab);

  // Mentor chat state
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [mentorError, setMentorError] = useState<string | null>(null);

  // NDA Chapter add form
  const [newChapterSubject, setNewChapterSubject] = useState<NdaSubject>('Mathematics');
  const [newChapterTitle, setNewChapterTitle] = useState('');

  // NDA Mock add form
  const [newMockLabel, setNewMockLabel] = useState('');
  const [newMockMath, setNewMockMath] = useState('145');
  const [newMockGat, setNewMockGat] = useState('355');
  const [newMockWeak, setNewMockWeak] = useState('');
  const [newMockAnalysis, setNewMockAnalysis] = useState('');

  // JEE Lecture add form
  const [newLecChapter, setNewLecChapter] = useState('');
  const [newLecTopic, setNewLecTopic] = useState('');
  const [newLecStatus, setNewLecStatus] = useState<LectureStatus>('backlog');

  // Copy feedback for Weekly Intelligence Report
  const [copiedReport, setCopiedReport] = useState(false);

  // Editable Profile draft + goal-change confirmation guard (Rule 11)
  const [profileDraft, setProfileDraft] = useState(personalization.profile);
  const [pendingGoalConfirm, setPendingGoalConfirm] = useState(false);
  const [profileSavedNotice, setProfileSavedNotice] = useState<string | null>(null);

  const ndaCountdown = useMemo(
    () => computeNdaCountdown(personalization.profile.ndaExamDateIso),
    [personalization.profile.ndaExamDateIso]
  );
  const ndaPct = useMemo(
    () => computeOverallNdaSyllabusPct(personalization.ndaChapters),
    [personalization.ndaChapters]
  );
  const ndaSubjects = useMemo(
    () => computeNdaSubjectSummaries(personalization.ndaChapters),
    [personalization.ndaChapters]
  );
  const jeeSummary = useMemo(
    () => computeJeeMathProgress(personalization.jeeLectures, personalization.jeePractice),
    [personalization.jeeLectures, personalization.jeePractice]
  );
  const weaknesses = useMemo(
    () =>
      detectWeaknessPatterns(
        commandState,
        usageRecords,
        usageAccessGranted,
        personalization
      ),
    [commandState, usageRecords, usageAccessGranted, personalization]
  );
  const weeklyReport = useMemo(
    () =>
      buildWeeklyIntelligenceReport(
        commandState,
        usageRecords,
        usageAccessGranted,
        personalization
      ),
    [commandState, usageRecords, usageAccessGranted, personalization]
  );
  const monthlyReview = useMemo(
    () => buildMonthlyMissionReview(commandState, personalization),
    [commandState, personalization]
  );

  const buildLiveContextPayload = () => ({
    profile: personalization.profile,
    coreCreed: CORE_CREED_PILLARS,
    todayTelemetry: {
      focusMinutesToday: commandState.focusMinutesToday,
      dailyFocusTargetMinutes: commandState.dailyFocusTargetMinutes,
      screenTimeMinutesToday: usageAccessGranted ? commandState.screenTimeMinutesToday : null,
      distractingMinutesToday: usageAccessGranted ? commandState.distractingMinutesToday : null,
      blockedAttemptsToday: commandState.blockedAttemptsToday,
    },
    nda2027: {
      daysRemaining: ndaCountdown.daysRemaining,
      overallSyllabusPct: ndaPct,
      subjects: ndaSubjects,
      weakChapters: personalization.ndaChapters
        .filter((c) => c.status === 'needs_revision' || (c.pyqsSolved > 0 && c.accuracyPct < 65))
        .map((c) => `${c.subject}: ${c.title} (${c.accuracyPct}%)`),
      recentMocks: personalization.ndaMocks.slice(0, 3),
    },
    jeeMathematics: jeeSummary,
    habits: personalization.habits,
    characterReflectionToday: personalization.characterReflectionToday,
    weeklyIntelligenceReport: weeklyReport,
    monthlyMissionReview: monthlyReview,
    weaknessDiagnostics: weaknesses,
  });

  const handleSendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed || isSending) return;

    setMentorError(null);
    const userMsg: MentorMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
      createdAtEpochMs: Date.now(),
    };

    const nextThread = [...mentorMessages, userMsg];
    onAppendMentorMessage(userMsg);
    setChatInput('');
    setIsSending(true);

    try {
      const res = await fetch('/api/mentor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: nextThread.map((m) => ({ role: m.role, text: m.text })),
          contextSnapshot: buildLiveContextPayload(),
        }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (!res.ok || !data.reply) {
        setMentorError(data.error || 'Unable to reach your Personal AI Mentor right now.');
        return;
      }
      onAppendMentorMessage({
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        createdAtEpochMs: Date.now(),
      });
    } catch {
      setMentorError('Network error while contacting /api/mentor. Check server status.');
    } finally {
      setIsSending(false);
    }
  };

  const handleCycleChapterStatus = (chapterId: string) => {
    onUpdatePersonalization((prev) => ({
      ...prev,
      ndaChapters: prev.ndaChapters.map((c) => {
        if (c.id !== chapterId) return c;
        const idx = CHAPTER_STATUS_ORDER.indexOf(c.status);
        const nextStatus = CHAPTER_STATUS_ORDER[(idx + 1) % CHAPTER_STATUS_ORDER.length];
        return { ...c, status: nextStatus };
      }),
    }));
  };

  const handleIncrementChapterPyq = (chapterId: string) => {
    onUpdatePersonalization((prev) => ({
      ...prev,
      ndaChapters: prev.ndaChapters.map((c) =>
        c.id === chapterId
          ? {
              ...c,
              pyqsSolved: c.pyqsSolved + 10,
              revisionCount: c.revisionCount + 1,
              accuracyPct: c.accuracyPct === 0 ? 65 : c.accuracyPct,
            }
          : c
      ),
    }));
  };

  const handleAddNdaChapter = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newChapterTitle.trim();
    if (!title) return;
    const item: NdaChapterItem = {
      id: `nda-${Date.now()}`,
      subject: newChapterSubject,
      title,
      status: 'not_started',
      pyqsSolved: 0,
      accuracyPct: 0,
      revisionCount: 0,
    };
    onUpdatePersonalization((prev) => ({
      ...prev,
      ndaChapters: [...prev.ndaChapters, item],
    }));
    setNewChapterTitle('');
  };

  const handleAddNdaMock = (e: React.FormEvent) => {
    e.preventDefault();
    const label = newMockLabel.trim();
    if (!label) return;
    const math = Math.min(300, Math.max(0, Number(newMockMath) || 0));
    const gat = Math.min(600, Math.max(0, Number(newMockGat) || 0));
    const entry: NdaMockTestEntry = {
      id: `mock-${Date.now()}`,
      label,
      dateLabel: 'Today',
      mathScore: math,
      gatScore: gat,
      weakChapter: newMockWeak.trim() || 'General Review Needed',
      mistakeAnalysis: newMockAnalysis.trim() || 'Logged for post-test mistake review.',
    };
    onUpdatePersonalization((prev) => ({
      ...prev,
      ndaMocks: [entry, ...prev.ndaMocks],
    }));
    setNewMockLabel('');
    setNewMockWeak('');
    setNewMockAnalysis('');
  };

  const handleCycleLectureStatus = (lectureId: string) => {
    onUpdatePersonalization((prev) => ({
      ...prev,
      jeeLectures: prev.jeeLectures.map((l) => {
        if (l.id !== lectureId) return l;
        const idx = LECTURE_STATUS_ORDER.indexOf(l.status);
        const nextStatus = LECTURE_STATUS_ORDER[(idx + 1) % LECTURE_STATUS_ORDER.length];
        return { ...l, status: nextStatus };
      }),
    }));
  };

  const handleToggleLectureFundamentals = (lectureId: string) => {
    onUpdatePersonalization((prev) => ({
      ...prev,
      jeeLectures: prev.jeeLectures.map((l) =>
        l.id === lectureId ? { ...l, fundamentalsChecked: !l.fundamentalsChecked } : l
      ),
    }));
  };

  const handleAddJeeLecture = (e: React.FormEvent) => {
    e.preventDefault();
    const chapter = newLecChapter.trim();
    const topic = newLecTopic.trim();
    if (!chapter || !topic) return;
    const entry: JeeLectureItem = {
      id: `jee-${Date.now()}`,
      chapter,
      topic,
      durationMinutes: 180,
      status: newLecStatus,
      fundamentalsChecked: false,
      notes: '3h lecture block + fundamentals check before advanced problems.',
    };
    onUpdatePersonalization((prev) => ({
      ...prev,
      jeeLectures: [entry, ...prev.jeeLectures],
    }));
    setNewLecChapter('');
    setNewLecTopic('');
  };

  const handleAddPracticeQuestions = (count: number) => {
    onUpdatePersonalization((prev) => ({
      ...prev,
      jeePractice: {
        ...prev.jeePractice,
        questionsSolvedThisWeek: prev.jeePractice.questionsSolvedThisWeek + count,
        totalQuestionsSolved: prev.jeePractice.totalQuestionsSolved + count,
      },
    }));
  };

  const handleToggleHabit = (habitId: string) => {
    onUpdatePersonalization((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const nextDone = !h.completedToday;
        return {
          ...h,
          completedToday: nextDone,
          streakDays: nextDone ? h.streakDays + 1 : Math.max(0, h.streakDays - 1),
        };
      }),
    }));
  };

  const handleSaveProfile = (confirmedImportantGoalChange = false) => {
    const importantGoalChanged =
      profileDraft.primaryAcademicTarget.trim() !==
        personalization.profile.primaryAcademicTarget.trim() ||
      profileDraft.secondaryAcademicTarget.trim() !==
        personalization.profile.secondaryAcademicTarget.trim() ||
      profileDraft.ndaExamDateIso !== personalization.profile.ndaExamDateIso;

    if (importantGoalChanged && !confirmedImportantGoalChange) {
      setPendingGoalConfirm(true);
      return;
    }

    onUpdatePersonalization((prev) => ({
      ...prev,
      profile: {
        ...profileDraft,
        age: Math.min(99, Math.max(12, Number(profileDraft.age) || 17)),
      },
    }));
    setPendingGoalConfirm(false);
    setProfileSavedNotice('Personal profile saved and synced to FOCUS//OS.');
    window.setTimeout(() => setProfileSavedNotice(null), 3500);
  };

  const handleCopyWeeklyReport = async () => {
    const text = formatWeeklyReportMarkdown(weeklyReport, personalization.profile);
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReport(true);
      window.setTimeout(() => setCopiedReport(false), 2500);
    } catch {
      setCopiedReport(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1E2534] pb-5">
        <div>
          <h1 className="font-display text-3xl sm:text-[34px] font-bold tracking-tight text-slate-50">
            Personal OS &amp; Academic Mentor
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">
            <span className="font-medium text-[#D4AD5A]">
              {personalization.profile.primaryAcademicTarget} ({ndaCountdown.daysRemaining}d left)
            </span>
            {' · '}
            {personalization.profile.secondaryAcademicTarget}
            {' · '}
            <span className="text-slate-300">{personalization.profile.preferredStudyWindow}</span>
          </p>
        </div>

        {/* Sub-navigation */}
        <div
          role="tablist"
          aria-label="Personal OS sections"
          className="inline-flex flex-wrap gap-1.5 rounded-xl border border-[#232B3A] bg-[#141923] p-1 shrink-0"
        >
          {(
            [
              { id: 'mentor', label: 'AI Mentor' },
              { id: 'academics', label: 'NDA & JEE' },
              { id: 'intel', label: 'Intel Reports' },
              { id: 'profile', label: 'Profile & Habits' },
            ] as { id: PersonalSubTab; label: string }[]
          ).map((tab) => {
            const active = subTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`personal-subtab-${tab.id}`}
                onClick={() => setSubTab(tab.id)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-rose-700 text-white'
                    : 'text-slate-300 hover:bg-[#181F2C] hover:text-slate-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Creed Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {CORE_CREED_PILLARS.map((pillar) => (
          <div
            key={pillar}
            className="rounded-xl border border-[#232B3A] bg-[#141923] px-4 py-3 text-center"
          >
            <span className="font-display text-xs font-semibold tracking-wide text-[#D4AD5A]">
              {pillar}
            </span>
          </div>
        ))}
      </div>

      {/* SUB-TAB 1: AI MENTOR */}
      {subTab === 'mentor' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <section
            aria-label="Personal AI Mentor conversation"
            className="lg:col-span-8 rounded-xl border border-[#232B3A] bg-[#141923] p-5 flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1E2534] pb-3.5">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-4 w-4 text-[#D4AD5A] shrink-0" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-100">
                    Direct Mentor &amp; Strategist
                  </h2>
                  <p className="text-xs text-slate-400">
                    Grounded in your actual study telemetry, NDA/JEE backlog, and habits — no generic fluff.
                  </p>
                </div>
              </div>
              {mentorMessages.length > 0 && (
                <button
                  type="button"
                  onClick={onClearMentorMessages}
                  className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white"
                >
                  Clear Thread
                </button>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="flex flex-wrap gap-2">
              {QUICK_MENTOR_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={isSending}
                  onClick={() => handleSendPrompt(prompt)}
                  className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-left text-xs font-medium text-slate-200 hover:border-rose-500 hover:text-white transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Chat Feed */}
            <div
              data-testid="mentor-chat-feed"
              className="min-h-[260px] max-h-[460px] overflow-y-auto space-y-3 rounded-xl border border-[#1E2534] bg-[#0F131B] p-4"
            >
              {mentorMessages.length === 0 ? (
                <div className="space-y-2 py-6 text-sm text-slate-300">
                  <p className="font-semibold text-slate-100">
                    Ready when you are, {personalization.profile.callsign}.
                  </p>
                  <p className="text-xs leading-relaxed text-slate-400">
                    Ask for a realistic tonight study block (Library Math or Home GAT/English), an honest audit of your{' '}
                    <span className="text-slate-200 font-medium tabular-nums">
                      {jeeSummary.pendingBacklogItems.length} unfinished JEE Math lecture(s)
                    </span>
                    , or a recovery plan if today slipped. I read your real numbers directly—no fake hype.
                  </p>
                </div>
              ) : (
                mentorMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-xl px-4 py-3 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'ml-auto max-w-[85%] border border-rose-500/40 bg-[#181F2C] text-slate-50'
                        : 'mr-auto max-w-[92%] border border-[#232B3A] bg-[#141923] text-slate-200'
                    }`}
                  >
                    <span className="mb-1 block text-xs font-semibold text-[#D4AD5A]">
                      {msg.role === 'user' ? personalization.profile.callsign : 'FOCUS//OS Mentor'}
                    </span>
                    {msg.text}
                  </div>
                ))
              )}
              {isSending && (
                <div className="mr-auto max-w-[75%] rounded-xl border border-[#232B3A] bg-[#141923] px-4 py-3 text-xs text-slate-400">
                  Analyzing your recorded focus blocks, NDA chapters, and JEE backlog...
                </div>
              )}
            </div>

            {mentorError && (
              <div
                role="alert"
                className="rounded-lg border border-rose-500/50 bg-rose-950/30 px-3.5 py-2.5 text-xs text-rose-200"
              >
                {mentorError}
              </div>
            )}

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendPrompt(chatInput);
              }}
              className="flex gap-2.5"
            >
              <label htmlFor="mentor-chat-input" className="sr-only">
                Message FOCUS//OS Mentor
              </label>
              <input
                id="mentor-chat-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask directly (e.g., Plan tonight's Math + GAT block or call out today's excuse)..."
                className="flex-1 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3.5 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none min-h-[42px]"
              />
              <button
                type="submit"
                disabled={isSending || !chatInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition-colors disabled:opacity-45 disabled:cursor-not-allowed min-h-[42px]"
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Send</span>
              </button>
            </form>
          </section>

          {/* Right Rail: Live Context Snapshot */}
          <aside className="lg:col-span-4 space-y-4">
            <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#D4AD5A]" aria-hidden="true" />
                <h3 className="font-display text-base font-semibold text-slate-100">
                  Live Context Synced
                </h3>
              </div>
              <dl className="space-y-2.5 text-xs">
                <div className="flex justify-between gap-2 border-b border-[#1E2534] pb-2">
                  <dt className="text-slate-400">NDA 2027 Countdown</dt>
                  <dd className="font-semibold text-[#D4AD5A] tabular-nums">
                    {ndaCountdown.daysRemaining} days
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#1E2534] pb-2">
                  <dt className="text-slate-400">NDA Syllabus Weighted</dt>
                  <dd className="font-semibold text-slate-100 tabular-nums">{ndaPct}%</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#1E2534] pb-2">
                  <dt className="text-slate-400">JEE Math Backlog</dt>
                  <dd className="font-semibold text-rose-400 tabular-nums">
                    {jeeSummary.pendingBacklogItems.length} pending lecture(s)
                  </dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#1E2534] pb-2">
                  <dt className="text-slate-400">Today&apos;s Focus</dt>
                  <dd className="font-semibold text-slate-100 tabular-nums">
                    {formatMinutesCompact(commandState.focusMinutesToday)} /{' '}
                    {formatMinutesCompact(commandState.dailyFocusTargetMinutes)}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-400">Habits Checked Today</dt>
                  <dd className="font-semibold text-emerald-400 tabular-nums">
                    {personalization.habits.filter((h) => h.completedToday).length} /{' '}
                    {personalization.habits.length}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-2.5">
              <h3 className="font-display text-base font-semibold text-slate-100">
                Top Priority Callout
              </h3>
              <p className="text-xs leading-relaxed text-slate-300">
                {weaknesses[0]?.problem}
              </p>
              <p className="text-xs leading-relaxed text-[#D4AD5A]">
                Recovery step: {weaknesses[0]?.recoveryPlan}
              </p>
              <button
                type="button"
                onClick={() => setSubTab('academics')}
                className="mt-1 inline-flex items-center gap-1.5 rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500"
              >
                Open NDA &amp; JEE Trackers
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* SUB-TAB 2: NDA 2027 & JEE MATHEMATICS TRACKERS */}
      {subTab === 'academics' && (
        <div className="space-y-6">
          {/* Mission A: NDA 2027 */}
          <section
            aria-label="Mission A NDA 2027 tracker"
            className="rounded-xl border border-[#232B3A] bg-[#141923] p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2534] pb-4">
              <div>
                <span className="text-xs font-semibold text-[#D4AD5A]">
                  Mission A · Primary Academic Target
                </span>
                <h2 className="font-display text-2xl font-bold text-slate-50">
                  NDA 2027 Preparation Command
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  {personalization.profile.priorAttemptNote}
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-4 py-2.5 text-right">
                  <span className="block text-xs text-slate-400">Exam Countdown</span>
                  <span className="font-display text-xl font-bold text-[#D4AD5A] tabular-nums">
                    {ndaCountdown.daysRemaining} Days
                  </span>
                </div>
                <div className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-4 py-2.5 text-right">
                  <span className="block text-xs text-slate-400">Syllabus Weighted</span>
                  <span className="font-display text-xl font-bold text-slate-50 tabular-nums">
                    {ndaPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Subject Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {ndaSubjects.map((sub) => (
                <div
                  key={sub.subject}
                  className="rounded-xl border border-[#1E2534] bg-[#0F131B] p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-semibold text-slate-100">
                      {sub.subject}
                    </span>
                    <span className="text-xs font-semibold text-[#D4AD5A] tabular-nums">
                      {sub.completionPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#232B3A]">
                    <div
                      className="h-full bg-rose-600 transition-all"
                      style={{ width: `${sub.completionPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {sub.masteredCount}/{sub.totalChapters} mastered · {sub.pyqsSolved} PYQs · Avg{' '}
                    {sub.avgAccuracyPct}%
                  </p>
                </div>
              ))}
            </div>

            {/* Chapter Checklist */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-slate-100">
                  Syllabus Chapters &amp; Revision Queue
                </h3>
                <span className="text-xs text-slate-400">
                  Click status pill to cycle mastery · Log +10 PYQs &amp; revision cycles
                </span>
              </div>

              <div className="divide-y divide-[#1E2534] rounded-xl border border-[#1E2534] bg-[#0F131B]">
                {personalization.ndaChapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[#D4AD5A]">
                          {chapter.subject}
                        </span>
                        <span className="text-sm font-medium text-slate-100">
                          {chapter.title}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
                        {chapter.pyqsSolved} PYQs · Accuracy {chapter.accuracyPct}% ·{' '}
                        {chapter.revisionCount} revision(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleIncrementChapterPyq(chapter.id)}
                        className="rounded-lg border border-[#2A3346] bg-[#141923] px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white tabular-nums"
                      >
                        +10 PYQs
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCycleChapterStatus(chapter.id)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          chapter.status === 'mastered'
                            ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                            : chapter.status === 'needs_revision'
                            ? 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                            : chapter.status === 'in_progress'
                            ? 'border-[#D4AD5A]/45 bg-[#181F2C] text-[#D4AD5A]'
                            : 'border-[#2A3346] bg-[#141923] text-slate-400'
                        }`}
                      >
                        {CHAPTER_STATUS_LABELS[chapter.status]}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNdaChapter} className="flex flex-wrap gap-2.5 pt-1">
                <select
                  aria-label="NDA chapter subject"
                  value={newChapterSubject}
                  onChange={(e) => setNewChapterSubject(e.target.value as NdaSubject)}
                  className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 min-h-[38px]"
                >
                  <option value="Mathematics">Mathematics</option>
                  <option value="GAT">GAT</option>
                  <option value="English">English</option>
                </select>
                <input
                  type="text"
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(e.target.value)}
                  placeholder="Add NDA chapter (e.g., 3D Geometry & Conic Sections)..."
                  className="flex-1 min-w-[200px] rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[38px]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-rose-600 min-h-[38px]"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Add Chapter</span>
                </button>
              </form>
            </div>

            {/* Mock Tests & Mistake Log */}
            <div className="border-t border-[#1E2534] pt-4 space-y-3">
              <h3 className="font-display text-base font-semibold text-slate-100">
                NDA Mock Test Scores &amp; Mistake Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {personalization.ndaMocks.map((mock) => (
                  <div
                    key={mock.id}
                    className="rounded-xl border border-[#1E2534] bg-[#0F131B] p-4 space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-100">{mock.label}</span>
                      <span className="text-xs font-bold text-[#D4AD5A] tabular-nums">
                        {mock.mathScore + mock.gatScore} / 900
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 tabular-nums">
                      Math {mock.mathScore}/300 · GAT {mock.gatScore}/600 · {mock.dateLabel}
                    </p>
                    <p className="text-xs text-rose-300">Weak Chapter: {mock.weakChapter}</p>
                    <p className="text-xs text-slate-300">Mistake Note: {mock.mistakeAnalysis}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddNdaMock} className="grid grid-cols-1 sm:grid-cols-5 gap-2.5 pt-1">
                <input
                  type="text"
                  value={newMockLabel}
                  onChange={(e) => setNewMockLabel(e.target.value)}
                  placeholder="Mock name (e.g., NDA PYQ 2025-II)"
                  className="sm:col-span-2 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[38px]"
                />
                <input
                  type="number"
                  min={0}
                  max={300}
                  aria-label="Math score out of 300"
                  value={newMockMath}
                  onChange={(e) => setNewMockMath(e.target.value)}
                  placeholder="Math /300"
                  className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 min-h-[38px]"
                />
                <input
                  type="number"
                  min={0}
                  max={600}
                  aria-label="GAT score out of 600"
                  value={newMockGat}
                  onChange={(e) => setNewMockGat(e.target.value)}
                  placeholder="GAT /600"
                  className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 min-h-[38px]"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-2 text-xs font-semibold text-slate-100 hover:border-rose-500 min-h-[38px]"
                >
                  Log Mock
                </button>
                <input
                  type="text"
                  value={newMockWeak}
                  onChange={(e) => setNewMockWeak(e.target.value)}
                  placeholder="Weak chapter identified..."
                  className="sm:col-span-2 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[38px]"
                />
                <input
                  type="text"
                  value={newMockAnalysis}
                  onChange={(e) => setNewMockAnalysis(e.target.value)}
                  placeholder="Mistake analysis (why marks dropped)..."
                  className="sm:col-span-3 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[38px]"
                />
              </form>
            </div>
          </section>

          {/* Mission B: JEE Mathematics */}
          <section
            aria-label="Mission B JEE Mathematics tracker"
            className="rounded-xl border border-[#232B3A] bg-[#141923] p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1E2534] pb-4">
              <div>
                <span className="text-xs font-semibold text-[#D4AD5A]">
                  Mission B · Secondary Academic Target (~3h Lecture Blocks)
                </span>
                <h2 className="font-display text-2xl font-bold text-slate-50">
                  JEE Mathematics &amp; Backlog Guard
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Strong fundamentals before advanced problems. Unfinished lectures never vanish silently.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-4 py-2.5 text-right">
                  <span className="block text-xs text-slate-400">Pending Queue</span>
                  <span
                    className={`font-display text-xl font-bold tabular-nums ${
                      jeeSummary.pendingBacklogItems.length > 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {jeeSummary.pendingBacklogItems.length} Lecture(s)
                  </span>
                </div>
                <div className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-4 py-2.5 text-right">
                  <span className="block text-xs text-slate-400">Questions Solved</span>
                  <span className="font-display text-xl font-bold text-slate-50 tabular-nums">
                    {jeeSummary.totalQuestionsSolved}
                  </span>
                </div>
              </div>
            </div>

            {/* Backlog Guard Alert */}
            {jeeSummary.pendingBacklogItems.length > 0 && (
              <div
                data-testid="jee-backlog-guard"
                className="flex items-start gap-3 rounded-xl border border-rose-500/45 bg-[#0F131B] px-4 py-3 text-xs"
              >
                <ShieldAlert className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="font-semibold text-rose-300">
                    Backlog Guard Active — {jeeSummary.pendingBacklogItems.length} unfinished lecture(s) pinned
                  </p>
                  <p className="mt-0.5 text-slate-300">
                    Next up: {jeeSummary.pendingBacklogItems.map((l) => l.chapter).join(' · ')}. Finish active
                    lectures &amp; fundamentals before starting new topics.
                  </p>
                </div>
              </div>
            )}

            {/* Practice Counter & Speed/Accuracy */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-[#1E2534] bg-[#0F131B] p-4 space-y-2">
                <span className="text-xs text-slate-400">Weekly Practice Counter</span>
                <p className="font-display text-2xl font-bold text-slate-50 tabular-nums">
                  {jeeSummary.questionsSolvedThisWeek} / {jeeSummary.weeklyQuestionTarget} Qs
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddPracticeQuestions(10)}
                    className="rounded-lg border border-[#2A3346] bg-[#141923] px-2.5 py-1 text-xs font-medium text-slate-200 hover:border-rose-500 tabular-nums"
                  >
                    +10 Qs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPracticeQuestions(25)}
                    className="rounded-lg bg-rose-700 px-2.5 py-1 text-xs font-semibold text-white hover:bg-rose-600 tabular-nums"
                  >
                    +25 Qs
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-[#1E2534] bg-[#0F131B] p-4 space-y-2">
                <span className="text-xs text-slate-400">Accuracy &amp; Speed</span>
                <p className="font-display text-2xl font-bold text-[#D4AD5A] tabular-nums">
                  {jeeSummary.accuracyPct}% · {jeeSummary.avgMinutesPerQuestion}m/Q
                </p>
                <div className="flex items-center gap-2">
                  <label htmlFor="jee-accuracy-input" className="text-xs text-slate-400">
                    Update Accuracy %
                  </label>
                  <input
                    id="jee-accuracy-input"
                    type="number"
                    min={0}
                    max={100}
                    value={personalization.jeePractice.accuracyPct}
                    onChange={(e) =>
                      onUpdatePersonalization((prev) => ({
                        ...prev,
                        jeePractice: {
                          ...prev.jeePractice,
                          accuracyPct: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        },
                      }))
                    }
                    className="w-16 rounded border border-[#232B3A] bg-[#141923] px-2 py-1 text-xs text-slate-100 tabular-nums"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-[#1E2534] bg-[#0F131B] p-4 space-y-1.5">
                <span className="text-xs text-slate-400">Flagged Conceptual Gaps</span>
                <ul className="space-y-1 text-xs text-slate-200">
                  {jeeSummary.weakConcepts.map((gap) => (
                    <li key={gap} className="flex items-start gap-1.5">
                      <span className="text-rose-400">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Lectures List */}
            <div className="divide-y divide-[#1E2534] rounded-xl border border-[#1E2534] bg-[#0F131B]">
              {personalization.jeeLectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-[#D4AD5A] shrink-0" aria-hidden="true" />
                      <span className="text-sm font-semibold text-slate-100">
                        {lecture.chapter}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">
                        ({formatMinutesCompact(lecture.durationMinutes)})
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-300">{lecture.topic}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{lecture.notes}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleLectureFundamentals(lecture.id)}
                      className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                        lecture.fundamentalsChecked
                          ? 'border-emerald-500/40 bg-emerald-950/25 text-emerald-300'
                          : 'border-[#2A3346] bg-[#141923] text-slate-400'
                      }`}
                    >
                      {lecture.fundamentalsChecked ? 'Fundamentals OK' : 'Verify Basics'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCycleLectureStatus(lecture.id)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                        lecture.status === 'completed'
                          ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                          : lecture.status === 'backlog'
                          ? 'border-rose-500/50 bg-rose-950/30 text-rose-300'
                          : 'border-[#D4AD5A]/45 bg-[#181F2C] text-[#D4AD5A]'
                      }`}
                    >
                      {LECTURE_STATUS_LABELS[lecture.status]}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddJeeLecture} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              <input
                type="text"
                value={newLecChapter}
                onChange={(e) => setNewLecChapter(e.target.value)}
                placeholder="Chapter (e.g., Definite Integration)"
                className="sm:col-span-3 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[38px]"
              />
              <input
                type="text"
                value={newLecTopic}
                onChange={(e) => setNewLecTopic(e.target.value)}
                placeholder="3h Lecture topic & sheet..."
                className="sm:col-span-5 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 min-h-[38px]"
              />
              <select
                aria-label="Lecture status"
                value={newLecStatus}
                onChange={(e) => setNewLecStatus(e.target.value as LectureStatus)}
                className="sm:col-span-2 rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 min-h-[38px]"
              >
                <option value="backlog">Backlog</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <button
                type="submit"
                className="sm:col-span-2 rounded-lg bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 min-h-[38px]"
              >
                Add Lecture
              </button>
            </form>
          </section>
        </div>
      )}

      {/* SUB-TAB 3: INTEL REPORTS & WEAKNESS MANAGEMENT */}
      {subTab === 'intel' && (
        <div className="space-y-6">
          {/* 12-Point Weekly Intelligence Report */}
          <section
            aria-label="Weekly Intelligence Report"
            data-testid="weekly-intelligence-report"
            className="rounded-xl border border-[#232B3A] bg-[#141923] p-6 space-y-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E2534] pb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[#D4AD5A]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-xl font-bold text-slate-50">
                    Weekly Intelligence Report
                  </h2>
                  <p className="text-xs text-slate-400">
                    12-point tactical audit generated strictly from recorded data · {weeklyReport.generatedAtIso}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyWeeklyReport}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 min-h-[36px]"
                >
                  {copiedReport ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-[#D4AD5A]" aria-hidden="true" />
                  )}
                  <span>{copiedReport ? 'Copied' : 'Copy Brief'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubTab('mentor');
                    handleSendPrompt(
                      'Review my 12-point Weekly Intelligence Report and tell me honestly what my single highest-leverage fix for next week is.'
                    );
                  }}
                  className="rounded-lg bg-rose-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 min-h-[36px]"
                >
                  Debrief with Mentor
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                ['1. NDA Preparation Progress', weeklyReport.ndaPreparationProgress],
                ['2. JEE Mathematics Progress', weeklyReport.jeeMathematicsProgress],
                ['3. Lectures Completed', weeklyReport.lecturesCompletedText],
                ['4. Questions Solved', weeklyReport.questionsSolvedText],
                ['5. Revision Completed', weeklyReport.revisionCompletedText],
                ['6. Backlog', weeklyReport.backlogText],
                ['7. Productivity Percentage', `${weeklyReport.productivityPct}% of weekly focus goal`],
                ['8. Most Productive Day', weeklyReport.mostProductiveDay],
                ['9. Biggest Distraction', weeklyReport.biggestDistraction],
                ['10. Weakest Academic Area', weeklyReport.weakestAcademicArea],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-lg border border-[#1E2534] bg-[#0F131B] px-4 py-3 space-y-1"
                >
                  <span className="block font-semibold text-[#D4AD5A]">{label}</span>
                  <span className="block text-slate-200 leading-relaxed tabular-nums">{value}</span>
                </div>
              ))}
              <div className="md:col-span-2 rounded-lg border border-[#1E2534] bg-[#0F131B] px-4 py-3 space-y-1">
                <span className="block font-semibold text-[#D4AD5A]">
                  11. Personal Development Progress
                </span>
                <span className="block text-slate-200 leading-relaxed tabular-nums">
                  {weeklyReport.personalDevelopmentProgress}
                </span>
              </div>
              <div className="md:col-span-2 rounded-lg border border-[#1E2534] bg-[#0F131B] px-4 py-3 space-y-1.5">
                <span className="block font-semibold text-[#D4AD5A]">
                  12. Recommendations for Next Week
                </span>
                <ul className="space-y-1 text-slate-200">
                  {weeklyReport.recommendations.map((rec) => (
                    <li key={rec} className="flex items-start gap-2">
                      <span className="text-rose-400">→</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Monthly Mission Review */}
          <section
            aria-label="Monthly Mission Review"
            className="rounded-xl border border-[#232B3A] bg-[#141923] p-6 space-y-4"
          >
            <div className="border-b border-[#1E2534] pb-3.5">
              <h2 className="font-display text-xl font-bold text-slate-50">
                Monthly Mission Review
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                {monthlyReview.nda2027ReadinessNote}
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {[
                [
                  'Productive Days',
                  `${monthlyReview.totalProductiveDays}d`,
                  `vs ${monthlyReview.prevProductiveDays}d prior`,
                ],
                [
                  'Missed Study Days',
                  `${monthlyReview.missedStudyDays}d`,
                  `vs ${monthlyReview.prevMissedStudyDays}d prior`,
                ],
                [
                  'NDA / JEE Syllabus',
                  `${monthlyReview.ndaSyllabusPct}% / ${monthlyReview.jeeSyllabusPct}%`,
                  `vs ${monthlyReview.prevNdaSyllabusPct}% / ${monthlyReview.prevJeeSyllabusPct}%`,
                ],
                [
                  'Avg Mock & Habits',
                  `${monthlyReview.avgMockScore}/900 · ${monthlyReview.habitConsistencyPct}%`,
                  `vs ${monthlyReview.prevAvgMockScore}/900 · ${monthlyReview.prevHabitConsistencyPct}%`,
                ],
              ].map(([title, current, prev]) => (
                <div
                  key={title}
                  className="rounded-lg border border-[#1E2534] bg-[#0F131B] p-3.5 space-y-1"
                >
                  <span className="block text-slate-400">{title}</span>
                  <span className="block font-display text-lg font-bold text-slate-50 tabular-nums">
                    {current}
                  </span>
                  <span className="block text-slate-400 tabular-nums">{prev}</span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-[#D4AD5A]/30 bg-[#0F131B] px-4 py-3 text-xs text-slate-200 leading-relaxed">
              <strong className="text-[#D4AD5A]">Honest Assessment:</strong> {monthlyReview.honestAssessment}
            </div>
          </section>

          {/* Weakness Management & Recovery System */}
          <section
            aria-label="Weakness Management System"
            className="rounded-xl border border-[#232B3A] bg-[#141923] p-6 space-y-4"
          >
            <div className="flex items-center gap-2.5 border-b border-[#1E2534] pb-3.5">
              <AlertTriangle className="h-4 w-4 text-rose-400" aria-hidden="true" />
              <div>
                <h2 className="font-display text-xl font-bold text-slate-50">
                  Weakness Management &amp; Recovery Plan
                </h2>
                <p className="text-xs text-slate-400">
                  5-step practical diagnostics — identifies patterns &amp; recovery actions without blaming.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {weaknesses.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-[#1E2534] bg-[#0F131B] p-4 space-y-2 text-xs"
                >
                  <p className="font-semibold text-rose-300">1. Problem: {w.problem}</p>
                  <p className="text-slate-300">
                    <span className="font-semibold text-slate-200">2. Cause:</span> {w.cause}
                  </p>
                  <p className="text-slate-300">
                    <span className="font-semibold text-slate-200">3. Practical Fix:</span> {w.solution}
                  </p>
                  <p className="text-[#D4AD5A]">
                    <span className="font-semibold">4. Recovery Plan:</span> {w.recoveryPlan}
                  </p>
                  <p className="text-emerald-400 tabular-nums">
                    <span className="font-semibold">5. Tracking:</span> {w.trackingOutcome}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* SUB-TAB 4: PROFILE & PERSONAL DEVELOPMENT HABITS */}
      {subTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Personal Development & Character Habits */}
          <section
            aria-label="Personal Development Habits"
            className="lg:col-span-5 rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-4"
          >
            <div className="flex items-center gap-2 border-b border-[#1E2534] pb-3.5">
              <Flame className="h-4 w-4 text-[#D4AD5A]" aria-hidden="true" />
              <div>
                <h2 className="font-display text-lg font-semibold text-slate-100">
                  Character &amp; Self-Care Habits
                </h2>
                <p className="text-xs text-slate-400">
                  Practical daily consistency — fitness, calm, grooming, and character.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {personalization.habits.map((habit) => (
                <button
                  key={habit.id}
                  type="button"
                  onClick={() => handleToggleHabit(habit.id)}
                  aria-pressed={habit.completedToday}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    habit.completedToday
                      ? 'border-emerald-500/40 bg-[#0F131B]'
                      : 'border-[#232B3A] bg-[#0F131B]/70 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-100">
                      <CheckCircle2
                        className={`h-4 w-4 shrink-0 ${
                          habit.completedToday ? 'text-emerald-400' : 'text-slate-600'
                        }`}
                        aria-hidden="true"
                      />
                      <span>{habit.label}</span>
                    </span>
                    <span className="text-xs font-semibold text-[#D4AD5A] tabular-nums shrink-0">
                      {habit.streakDays}d streak
                    </span>
                  </div>
                  <p className="mt-1 pl-6 text-xs text-slate-400">{habit.practicalNote}</p>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 border-t border-[#1E2534] pt-3">
              <label
                htmlFor="character-reflection-input"
                className="block text-xs font-semibold text-slate-200"
              >
                Today&apos;s Character &amp; Pressure Reflection
              </label>
              <textarea
                id="character-reflection-input"
                rows={3}
                value={personalization.characterReflectionToday}
                onChange={(e) =>
                  onUpdatePersonalization((prev) => ({
                    ...prev,
                    characterReflectionToday: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 focus:border-rose-500 focus:outline-none"
              />
            </div>
          </section>

          {/* Editable Personal Profile */}
          <section
            aria-label="Editable Personal Profile"
            className="lg:col-span-7 rounded-xl border border-[#232B3A] bg-[#141923] p-5 space-y-4"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#1E2534] pb-3.5">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-[#D4AD5A]" aria-hidden="true" />
                <div>
                  <h2 className="font-display text-lg font-semibold text-slate-100">
                    Editable Personal Profile
                  </h2>
                  <p className="text-xs text-slate-400">
                    Stored locally on your device. Important goal edits ask for confirmation first.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onResetPersonalization();
                  setProfileSavedNotice('Reset to Master Personalization defaults.');
                }}
                className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500"
              >
                Restore Defaults
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label htmlFor="prof-callsign" className="block mb-1 font-medium text-slate-300">
                  Name / Callsign
                </label>
                <input
                  id="prof-callsign"
                  type="text"
                  value={profileDraft.callsign}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, callsign: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-age" className="block mb-1 font-medium text-slate-300">
                  Age
                </label>
                <input
                  id="prof-age"
                  type="number"
                  min={12}
                  max={99}
                  value={profileDraft.age}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, age: Number(e.target.value) || 17 }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-edu" className="block mb-1 font-medium text-slate-300">
                  Education Stage
                </label>
                <input
                  id="prof-edu"
                  type="text"
                  value={profileDraft.educationStage}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, educationStage: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-learning-mode" className="block mb-1 font-medium text-slate-300">
                  Learning Mode
                </label>
                <input
                  id="prof-learning-mode"
                  type="text"
                  value={profileDraft.learningMode}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, learningMode: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-window" className="block mb-1 font-medium text-slate-300">
                  Preferred Study Window
                </label>
                <input
                  id="prof-window"
                  type="text"
                  value={profileDraft.preferredStudyWindow}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, preferredStudyWindow: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-secondary-goal" className="block mb-1 font-medium text-slate-300">
                  Secondary Academic Target
                </label>
                <input
                  id="prof-secondary-goal"
                  type="text"
                  value={profileDraft.secondaryAcademicTarget}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, secondaryAcademicTarget: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-math-env" className="block mb-1 font-medium text-slate-300">
                  Mathematics Environment
                </label>
                <input
                  id="prof-math-env"
                  type="text"
                  value={profileDraft.mathEnvironment}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, mathEnvironment: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-gen-env" className="block mb-1 font-medium text-slate-300">
                  GAT / English / Revision Environment
                </label>
                <input
                  id="prof-gen-env"
                  type="text"
                  value={profileDraft.generalEnvironment}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, generalEnvironment: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-primary-goal" className="block mb-1 font-medium text-slate-300">
                  Primary Academic Target
                </label>
                <input
                  id="prof-primary-goal"
                  type="text"
                  value={profileDraft.primaryAcademicTarget}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, primaryAcademicTarget: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
              <div>
                <label htmlFor="prof-exam-date" className="block mb-1 font-medium text-slate-300">
                  NDA Target Exam Date
                </label>
                <input
                  id="prof-exam-date"
                  type="date"
                  value={profileDraft.ndaExamDateIso}
                  onChange={(e) =>
                    setProfileDraft((p) => ({ ...p, ndaExamDateIso: e.target.value }))
                  }
                  className="w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-slate-100"
                />
              </div>
            </div>

            {/* Interests & MUN Developing Interest Card */}
            <div className="space-y-3 border-t border-[#1E2534] pt-3 text-xs">
              <div className="rounded-lg border border-[#1E2534] bg-[#0F131B] p-3.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#D4AD5A]">
                    Geopolitics &amp; MUN (Developing Interest — Non-Daily)
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setProfileDraft((p) => ({
                        ...p,
                        munDevelopingInterest: {
                          ...p.munDevelopingInterest,
                          enabled: !p.munDevelopingInterest.enabled,
                        },
                      }))
                    }
                    className="rounded border border-[#2A3346] bg-[#141923] px-2.5 py-1 text-xs text-slate-200"
                  >
                    {profileDraft.munDevelopingInterest.enabled ? 'Enabled' : 'Paused'}
                  </button>
                </div>
                <p className="text-slate-300">
                  {profileDraft.munDevelopingInterest.recentCommittee} ·{' '}
                  {profileDraft.munDevelopingInterest.delegation} ({profileDraft.munDevelopingInterest.role}) ·{' '}
                  Agenda: {profileDraft.munDevelopingInterest.agenda}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="rounded-lg border border-[#1E2534] bg-[#0F131B] p-3">
                  <span className="block font-semibold text-slate-200">Military &amp; Defence</span>
                  <p className="mt-1 text-slate-400">{profileDraft.militaryInterests.join(', ')}</p>
                </div>
                <div className="rounded-lg border border-[#1E2534] bg-[#0F131B] p-3">
                  <span className="block font-semibold text-slate-200">Tech &amp; AI</span>
                  <p className="mt-1 text-slate-400">{profileDraft.techInterests.join(', ')}</p>
                </div>
                <div className="rounded-lg border border-[#1E2534] bg-[#0F131B] p-3">
                  <span className="block font-semibold text-slate-200">Gaming Balance</span>
                  <p className="mt-1 text-slate-400">{profileDraft.gamingPreferences.join(', ')}</p>
                </div>
              </div>
            </div>

            {/* Goal Change Confirmation Guard (Rule 11) */}
            {pendingGoalConfirm && (
              <div
                role="alert"
                className="rounded-lg border border-[#D4AD5A]/50 bg-[#0F131B] p-3.5 text-xs space-y-2"
              >
                <p className="font-semibold text-[#D4AD5A]">
                  Confirm Important Goal Update
                </p>
                <p className="text-slate-300">
                  You modified your primary academic target or NDA 2027 target date. Save this core mission change?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleSaveProfile(true)}
                    className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600"
                  >
                    Confirm Goal Change
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDraft(personalization.profile);
                      setPendingGoalConfirm(false);
                    }}
                    className="rounded-lg border border-[#2A3346] bg-[#141923] px-3 py-1.5 text-xs text-slate-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {profileSavedNotice && (
              <p className="text-xs font-medium text-emerald-400">{profileSavedNotice}</p>
            )}

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => handleSaveProfile(false)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 min-h-[38px]"
              >
                <Target className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Save Personal Profile</span>
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
