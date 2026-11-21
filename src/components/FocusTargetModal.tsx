import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { formatMinutesCompact } from '../utils/discipline';

interface FocusTargetModalProps {
  isOpen: boolean;
  currentTargetMinutes: number;
  onClose: () => void;
  onSave: (minutes: number) => void;
}

const PRESET_TARGETS = [120, 180, 240, 300, 360];

export const FocusTargetModal: React.FC<FocusTargetModalProps> = ({
  isOpen,
  currentTargetMinutes,
  onClose,
  onSave,
}) => {
  const [minutesInput, setMinutesInput] = useState<string>(String(currentTargetMinutes));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMinutesInput(String(currentTargetMinutes));
      setError(null);
    }
  }, [isOpen, currentTargetMinutes]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(minutesInput);
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 720) {
      setError('Enter a daily focus target between 30 and 720 minutes.');
      return;
    }
    onSave(Math.round(parsed));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="target-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="target-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="target-modal-panel"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-md rounded-xl border border-[#232B3A] bg-[#141923] p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="target-modal-title" className="font-display text-2xl font-bold tracking-tight text-slate-50">
                  Daily Focus Goal
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  Saved automatically to track your daily focus progress.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close modal"
                className="rounded-lg px-2.5 py-1.5 text-xs text-slate-400 hover:bg-[#181F2C] hover:text-slate-100"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <span className="block text-xs font-medium text-slate-300">Quick Presets</span>
                <div className="mt-2 grid grid-cols-5 gap-2">
                  {PRESET_TARGETS.map((preset) => {
                    const selected = Number(minutesInput) === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setMinutesInput(String(preset));
                          setError(null);
                        }}
                        className={`rounded-lg border py-2 text-xs font-medium transition-colors tabular-nums ${
                          selected
                            ? 'border-rose-500 bg-rose-700 text-white'
                            : 'border-[#2A3346] bg-[#0F131B] text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        {preset / 60}h
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label htmlFor="focus-target-minutes" className="block text-xs font-medium text-slate-300">
                  Custom Target (minutes)
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <input
                    id="focus-target-minutes"
                    type="number"
                    min={30}
                    max={720}
                    value={minutesInput}
                    onChange={(e) => {
                      setMinutesInput(e.target.value);
                      setError(null);
                    }}
                    className="w-full rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-2 text-sm text-slate-100 tabular-nums focus:border-rose-500 focus:outline-none"
                  />
                  <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0 tabular-nums">
                    {Number.isFinite(Number(minutesInput)) && Number(minutesInput) >= 30
                      ? formatMinutesCompact(Number(minutesInput))
                      : '--'}
                  </span>
                </div>
                {error && (
                  <p className="mt-2 text-xs text-rose-400" role="alert">
                    {error}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#1E2534] pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-[#2A3346] px-4 py-2 text-xs font-medium text-slate-300 hover:text-white min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 min-h-[40px]"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
