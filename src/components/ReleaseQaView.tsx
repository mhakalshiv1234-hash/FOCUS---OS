import React, { useState } from 'react';
import { CheckCircle2, Copy, Download, Play, ShieldCheck, Terminal, XCircle } from 'lucide-react';
import {
  AndroidReleaseSummary,
  DomainSuiteExecutionResult,
  buildReleaseVerificationReportJson,
  runInBrowserDomainVerification,
} from '../utils/releaseReadiness';
import { AppUsageRecord } from '../utils/usageAnalytics';
import { CommandCenterState } from '../utils/discipline';

interface ReleaseQaViewProps {
  releaseSummary: AndroidReleaseSummary;
  usageRecords: AppUsageRecord[];
  state: CommandCenterState;
  blockedPackages: string[];
  usageAccessGranted: boolean;
  onInspectAndroidSource: () => void;
}

const APK_BUILD_COMMANDS = `cd android
chmod +x verify_and_build_apk.sh
./verify_and_build_apk.sh

# Or invoke Gradle targets individually (requires JDK 17 + Android SDK 35):
./gradlew testDebugUnitTest lintDebug assembleDebug assembleRelease
./gradlew connectedDebugAndroidTest`;

export const ReleaseQaView: React.FC<ReleaseQaViewProps> = ({
  releaseSummary,
  usageRecords,
  state,
  blockedPackages,
  usageAccessGranted,
  onInspectAndroidSource,
}) => {
  const [domainSuites, setDomainSuites] = useState<DomainSuiteExecutionResult[]>(() =>
    runInBrowserDomainVerification({
      usageRecords,
      blockedPackages,
    })
  );
  const [lastRunAt, setLastRunAt] = useState<string>(() => new Date().toLocaleTimeString());
  const [copiedCommands, setCopiedCommands] = useState(false);

  const handleRerunVerification = () => {
    const freshResults = runInBrowserDomainVerification({
      usageRecords,
      blockedPackages,
    });
    setDomainSuites(freshResults);
    setLastRunAt(new Date().toLocaleTimeString());
  };

  const handleDownloadReport = () => {
    const json = buildReleaseVerificationReportJson({
      releaseSummary,
      domainSuites,
      state,
      blockedPackages,
      usageAccessGranted,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `focusos-stage7-qa-report-v${releaseSummary.versionName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyCommands = async () => {
    try {
      await navigator.clipboard.writeText(APK_BUILD_COMMANDS);
      setCopiedCommands(true);
      window.setTimeout(() => setCopiedCommands(false), 1800);
    } catch {
      // Clipboard unavailable in headless browser contexts
    }
  };

  const passedGatesCount = releaseSummary.gates.filter((g) => g.passed).length;
  const passedSuitesCount = domainSuites.filter((s) => s.passed).length;
  const totalAssertions = domainSuites.reduce((sum, s) => sum + s.assertionsPassed, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1D2421] pb-5">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-slate-50 text-balance">
            Testing &amp; APK Release
          </h1>
          <p className="mt-1 font-mono text-xs text-slate-400 tabular-nums">
            com.focusos.app · v{releaseSummary.versionName} (versionCode {releaseSummary.versionCode}
            ) · minSdk {releaseSummary.minSdk} / targetSdk {releaseSummary.targetSdk}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="run-verification-suite-btn"
            onClick={handleRerunVerification}
            className="inline-flex items-center gap-2 rounded-md bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-600 whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Play className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Run Verification Suite</span>
          </button>

          <button
            type="button"
            data-testid="download-qa-report-btn"
            onClick={handleDownloadReport}
            className="inline-flex items-center gap-2 rounded-md border border-[#2A2F3D] bg-[#0B0E0D] px-3.5 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[40px]"
          >
            <Download className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>Download QA Report</span>
          </button>
        </div>
      </div>

      {/* Honest Toolchain Constraint Notice */}
      <aside
        role="status"
        aria-label="Android APK build environment status"
        className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[#C59B43]">
            Container Toolchain Boundary: APK Compilation Requires Local Android SDK 35 + JDK 17
          </p>
          <p className="text-xs leading-relaxed text-slate-400">
            This cloud container provides Node.js and Chromium without JDK 17, Gradle, or Android
            SDK 35, so APK binaries cannot be compiled in-browser. Below, FOCUS//OS runs live
            in-browser TypeScript domain verification ({totalAssertions} assertions) and inspects
            all real <span className="font-mono text-slate-200">/android/</span> release gates,
            Room migrations, ProGuard R8 rules, and instrumented tests.
          </p>
        </div>
        <button
          type="button"
          onClick={onInspectAndroidSource}
          className="rounded-md border border-[#2A2F3D] bg-black px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px]"
        >
          Inspect Stage 7 Files
        </button>
      </aside>

      {/* 4-KPI Strip */}
      <section aria-label="Stage 7 release KPIs" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm p-5">
          <p className="text-xs text-slate-400">Android Release Gates</p>
          <p
            data-testid="qa-release-gates-kpi"
            className={`mt-2 font-mono text-xl sm:text-2xl font-semibold tabular-nums whitespace-nowrap ${
              releaseSummary.allGatesPassed ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {passedGatesCount}/{releaseSummary.gates.length} Passed
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
            {releaseSummary.totalAndroidFiles} cataloged project files
          </p>
        </div>

        <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm p-5">
          <p className="text-xs text-slate-400">In-Browser Domain Suites</p>
          <p
            data-testid="qa-domain-suites-kpi"
            className={`mt-2 font-mono text-xl sm:text-2xl font-semibold tabular-nums whitespace-nowrap ${
              passedSuitesCount === domainSuites.length ? 'text-emerald-400' : 'text-red-500'
            }`}
          >
            {passedSuitesCount}/{domainSuites.length} Passed
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500 tabular-nums">
            Last run {lastRunAt}
          </p>
        </div>

        <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm p-5">
          <p className="text-xs text-slate-400">JVM &amp; Instrumented Tests</p>
          <p className="mt-2 font-mono text-xl sm:text-2xl font-semibold text-slate-50 tabular-nums whitespace-nowrap">
            {releaseSummary.jvmTestCount} JVM · {releaseSummary.instrumentedTestCount} UI/DB
          </p>
          <p className="mt-1 text-xs text-slate-500">JUnit4 + Room Migration + Compose</p>
        </div>

        <div className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm p-5">
          <p className="text-xs text-slate-400">Release Minification</p>
          <p
            className={`mt-2 font-mono text-xl sm:text-2xl font-semibold whitespace-nowrap ${
              releaseSummary.isMinifyEnabled && releaseSummary.isShrinkResources
                ? 'text-[#C59B43]'
                : 'text-red-500'
            }`}
          >
            {releaseSummary.isMinifyEnabled && releaseSummary.isShrinkResources
              ? 'R8 + Shrink'
              : 'Disabled'}
          </p>
          <p className="mt-1 font-mono text-xs text-slate-500">
            ProGuard rules + release signing hook
          </p>
        </div>
      </section>

      {/* Dual Verification Matrices */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live In-Browser Domain Verification */}
        <section
          aria-label="In-browser domain verification suite"
          className="lg:col-span-6 rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[#1C2320] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Live In-Browser Domain Suites
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Mirrors Kotlin domain logic executed live against current telemetry state.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400 tabular-nums">
              {totalAssertions} checks
            </span>
          </div>

          <div className="divide-y divide-[#1C2320]">
            {domainSuites.map((suite) => (
              <div
                key={suite.id}
                data-testid={`domain-suite-row-${suite.id}`}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {suite.passed ? (
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="h-4 w-4 text-red-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100">{suite.suiteName}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500 truncate">
                      {suite.modulePath}
                    </p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{suite.summary}</p>
                  </div>
                </div>

                <div className="text-right shrink-0 font-mono text-xs tabular-nums">
                  <span className={suite.passed ? 'text-emerald-400' : 'text-red-400'}>
                    {suite.passed ? 'PASS' : 'FAIL'}
                  </span>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {suite.assertionsPassed} assert · {suite.durationMs}ms
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Android Release Gates */}
        <section
          aria-label="Android build and release gates"
          className="lg:col-span-6 rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[#1C2320] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Android Source &amp; APK Release Gates
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Audited directly from <span className="font-mono">/android/</span> Gradle, Room,
                ProGuard, and Test files.
              </p>
            </div>
            <ShieldCheck className="h-4 w-4 text-[#C59B43] shrink-0" aria-hidden="true" />
          </div>

          <div className="divide-y divide-[#1C2320]">
            {releaseSummary.gates.map((gate) => (
              <div
                key={gate.id}
                data-testid={`release-gate-row-${gate.id}`}
                className="flex items-start justify-between gap-4 px-5 py-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {gate.passed ? (
                    <CheckCircle2
                      className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  ) : (
                    <XCircle
                      className="h-4 w-4 text-red-500 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0">
                    <span className="font-mono text-[11px] text-[#C59B43]">{gate.category}</span>
                    <p className="mt-0.5 text-sm font-medium text-slate-100">{gate.title}</p>
                    <p className="mt-1 text-xs text-slate-400 leading-relaxed">{gate.detail}</p>
                  </div>
                </div>

                <span
                  className={`font-mono text-xs shrink-0 ${
                    gate.passed ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {gate.passed ? 'VERIFIED' : 'BLOCKED'}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Reproducible APK Generation Block */}
      <section
        aria-label="APK generation script and Gradle commands"
        className="rounded-lg border border-[#222926] bg-[#0B0E0D]/88 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1C2320] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Local / CI APK Generation Script
              </h2>
              <p className="text-xs text-slate-400">
                Runs JVM unit tests, Android Lint, Debug APK, and R8-minified Release APK builds
                with SHA-256 verification.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyCommands}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#2A2F3D] bg-black px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[36px]"
          >
            <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{copiedCommands ? 'Copied' : 'Copy Build Commands'}</span>
          </button>
        </div>

        <div className="bg-black p-5 overflow-x-auto">
          <pre className="font-mono text-xs leading-relaxed text-slate-200 whitespace-pre">
            <code>{APK_BUILD_COMMANDS}</code>
          </pre>
        </div>
      </section>
    </div>
  );
};
