import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';
import {
  EMERGENCY_OVERRIDE_PHRASE,
  MINIMUM_OVERRIDE_REASON_LENGTH,
  NUCLEAR_OVERRIDE_DELAY_SECONDS,
  evaluateEmergencyOverride,
  formatCountdownMillis,
} from '../utils/blockingEngine';

interface EmergencyOverrideModalProps {
  isOpen: boolean;
  sessionLabel: string;
  remainingMillis: number;
  onClose: () => void;
  onConfirmOverride: (reason: string) => void;
}

export const EmergencyOverrideModal: React.FC<EmergencyOverrideModalProps> = ({
  isOpen,
  sessionLabel,
  remainingMillis,
  onClose,
  onConfirmOverride,
}) => {
  const [reason, setReason] = useState('');
  const [typedPhrase, setTypedPhrase] = useState('');
  const [remainingDelaySeconds, setRemainingDelaySeconds] = useState(
    NUCLEAR_OVERRIDE_DELAY_SECONDS
  );

  useEffect(() => {
    if (!isOpen) return;
    setReason('');
    setTypedPhrase('');
    setRemainingDelaySeconds(NUCLEAR_OVERRIDE_DELAY_SECONDS);

    const timer = window.setInterval(() => {
      setRemainingDelaySeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  const evaluation = evaluateEmergencyOverride({
    reason,
    typedPhrase,
    remainingDelaySeconds,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evaluation.allowed) return;
    onConfirmOverride(reason.trim());
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="emergency-override-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="emergency-override-title"
          data-testid="emergency-override-modal"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/78 p-4"
        >
          <motion.div
            key="emergency-override-card"
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-lg rounded-xl border border-rose-500/70 bg-[#141923] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#1E2534] pb-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-xs font-semibold tracking-wide text-[#D4AD5A]">
                    Emergency Override
                  </p>
                  <h2
                    id="emergency-override-title"
                    className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-50"
                  >
                    End Active Strict Lock?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 whitespace-nowrap shrink-0"
              >
                Keep Locked
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-xs text-slate-400">Active Session</span>
                  <span className="text-xs font-medium text-slate-100">{sessionLabel}</span>
                </div>
                <div className="text-right">
                  <span className="block text-xs text-slate-400">Time Remaining</span>
                  <span className="font-mono text-base font-semibold text-rose-400 tabular-nums">
                    {formatCountdownMillis(remainingMillis)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-3.5 py-2.5 text-xs text-slate-300 flex items-center justify-between gap-3">
                <span>1. Reflection Pause</span>
                <span
                  data-testid="override-delay-status"
                  className={`font-semibold tabular-nums ${
                    evaluation.delayComplete ? 'text-emerald-400' : 'text-[#D4AD5A]'
                  }`}
                >
                  {evaluation.delayComplete
                    ? 'Ready'
                    : `Wait ${remainingDelaySeconds}s`}
                </span>
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor="override-reason" className="block text-xs font-medium text-slate-200">
                    2. Reason for ending lock early (min {MINIMUM_OVERRIDE_REASON_LENGTH} chars)
                  </label>
                  <span className="text-xs text-slate-400 tabular-nums">
                    {reason.trim().length}/{MINIMUM_OVERRIDE_REASON_LENGTH}
                  </span>
                </div>
                <textarea
                  id="override-reason"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Need messaging access for urgent family travel..."
                  className="mt-1.5 w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="override-phrase" className="block text-xs font-medium text-slate-200">
                  3. Type confirmation phrase:{' '}
                  <span className="font-mono text-[#D4AD5A]">{EMERGENCY_OVERRIDE_PHRASE}</span>
                </label>
                <input
                  id="override-phrase"
                  type="text"
                  autoComplete="off"
                  value={typedPhrase}
                  onChange={(e) => setTypedPhrase(e.target.value)}
                  placeholder={EMERGENCY_OVERRIDE_PHRASE}
                  className="mt-1.5 w-full rounded-lg border border-[#232B3A] bg-[#0F131B] px-3 py-2 font-mono text-xs text-slate-100 placeholder:text-slate-500 focus:border-rose-500 focus:outline-none"
                />
              </div>

              <p
                data-testid="override-validation-message"
                className={`text-xs ${
                  evaluation.allowed ? 'text-emerald-400' : 'text-slate-400'
                }`}
              >
                {evaluation.message}
              </p>

              <p className="border-t border-[#1E2534] pt-3 text-xs leading-relaxed text-slate-400">
                Emergency calls and contacts always stay reachable without overriding.
                Confirmed overrides are saved locally in your session history.
              </p>

              <div className="flex items-center justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#232B3A] bg-[#0F131B] px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-500 min-h-[40px]"
                >
                  Return to Focus Lock
                </button>
                <button
                  type="submit"
                  disabled={!evaluation.allowed}
                  data-testid="confirm-emergency-override-btn"
                  className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-600 disabled:bg-[#1E2534] disabled:text-slate-500 min-h-[40px]"
                >
                  Confirm Override
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
