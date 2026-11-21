import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { formatCountdownMillis } from '../utils/blockingEngine';

interface BlockingShieldOverlayProps {
  blockedApp: {
    appName: string;
    packageName: string;
    sessionLabel: string;
    isNuclearMode?: boolean;
  } | null;
  remainingMillis: number;
  onDismiss: () => void;
}

export const BlockingShieldOverlay: React.FC<BlockingShieldOverlayProps> = ({
  blockedApp,
  remainingMillis,
  onDismiss,
}) => {
  return (
    <AnimatePresence>
      {blockedApp && (
        <motion.div
          key="blocking-shield-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="blocking-shield-title"
          data-testid="blocking-shield-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/82 p-4"
        >
          <motion.div
            key="blocking-shield-card"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.16 }}
            className={`w-full max-w-md rounded-xl border bg-[#141923] p-7 text-center shadow-2xl ${
              blockedApp.isNuclearMode ? 'border-[#D4AD5A]' : 'border-rose-500'
            }`}
          >
            <p
              className={`text-xs font-semibold tracking-wide ${
                blockedApp.isNuclearMode ? 'text-[#D4AD5A]' : 'text-rose-400'
              }`}
            >
              {blockedApp.isNuclearMode
                ? 'Strict Lock Active · Settings Sealed'
                : 'Focus Blocker Active'}
            </p>
            <h2
              id="blocking-shield-title"
              className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-50"
            >
              {blockedApp.appName} is Paused
            </h2>
            <p className="mt-1 text-xs text-slate-400">
              Distracting app temporarily blocked during focus
            </p>

            <div className="my-6 rounded-lg border border-[#232B3A] bg-[#0F131B] py-5">
              <p className="font-mono text-4xl font-bold text-slate-50 tabular-nums">
                {formatCountdownMillis(remainingMillis)}
              </p>
              <p className="mt-1.5 text-xs text-slate-400">
                Remaining in {blockedApp.sessionLabel}
              </p>
              {blockedApp.isNuclearMode && (
                <p className="mt-2 text-xs text-emerald-400">
                  Emergency calls &amp; phone dialer remain accessible
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onDismiss}
              className="w-full rounded-lg bg-rose-700 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-600 min-h-[44px]"
            >
              Return to Focus
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
