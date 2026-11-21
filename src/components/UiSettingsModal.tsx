import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Monitor, SlidersHorizontal, Terminal, Volume2, VolumeX } from 'lucide-react';
import { formatMinutesCompact } from '../utils/discipline';
import { UI_THEME_OPTIONS, UiThemeId } from '../utils/themeSettings';

interface UiSettingsModalProps {
  isOpen: boolean;
  activeTheme: UiThemeId;
  audioEnabled: boolean;
  dailyFocusTargetMinutes: number;
  onSelectTheme: (theme: UiThemeId) => void;
  onToggleAudio: () => void;
  onOpenFocusTargetModal: () => void;
  onClose: () => void;
}

export const UiSettingsModal: React.FC<UiSettingsModalProps> = ({
  isOpen,
  activeTheme,
  audioEnabled,
  dailyFocusTargetMinutes,
  onSelectTheme,
  onToggleAudio,
  onOpenFocusTargetModal,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ui-settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.14 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ui-settings-title"
          data-testid="ui-settings-modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            key="ui-settings-panel"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="w-full max-w-lg rounded-xl border border-[#232B3A] bg-[#141923] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#1E2534] pb-4">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="h-4 w-4 text-[#D4AD5A] shrink-0" aria-hidden="true" />
                <div>
                  <h2 id="ui-settings-title" className="font-display text-2xl font-bold tracking-tight text-slate-50">
                    UI Settings
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Choose your display theme, alert sound, and daily goal preferences.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close UI settings"
                className="rounded-lg border border-[#2A3346] bg-[#0F131B] px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-slate-500 hover:text-white min-h-[34px]"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-6">
              {/* Theme Switcher */}
              <div className="space-y-2.5">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-200">
                    Display Theme
                  </span>
                  <span
                    data-testid="active-theme-readout"
                    className="text-xs font-medium text-[#D4AD5A]"
                  >
                    Active: {UI_THEME_OPTIONS.find((t) => t.id === activeTheme)?.name}
                  </span>
                </div>

                <div
                  role="radiogroup"
                  aria-label="Interface theme"
                  className="grid grid-cols-1 sm:grid-cols-2 gap-3"
                >
                  {UI_THEME_OPTIONS.map((option) => {
                    const selected = activeTheme === option.id;
                    const Icon = option.id === 'terminal' ? Terminal : Monitor;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        data-testid={`theme-option-${option.id}`}
                        onClick={() => onSelectTheme(option.id)}
                        className={`flex flex-col justify-between rounded-xl border p-4 text-left transition-colors ${
                          selected
                            ? 'border-rose-500 bg-[#0F131B] text-slate-50'
                            : 'border-[#232B3A] bg-[#0F131B]/60 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-2 font-display text-sm font-semibold text-slate-100">
                              <Icon className="h-4 w-4 text-[#D4AD5A] shrink-0" aria-hidden="true" />
                              <span>{option.name}</span>
                            </span>
                            {selected && (
                              <span
                                aria-hidden="true"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-700 text-white shrink-0"
                              >
                                <Check className="h-3 w-3" />
                              </span>
                            )}
                          </div>

                          <p className="text-xs leading-relaxed text-slate-400">
                            {option.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#1E2534] pt-3">
                          <div className="flex items-center gap-1.5" aria-hidden="true">
                            {option.swatches.map((hex) => (
                              <span
                                key={hex}
                                className="h-3.5 w-5 rounded-[3px] border border-[#2A3346]"
                                style={{ backgroundColor: hex }}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-medium text-slate-400">
                            {selected ? 'Selected' : 'Switch'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Focus Preferences */}
              <div className="space-y-3 border-t border-[#1E2534] pt-4">
                <span className="block text-xs font-semibold text-slate-200">
                  Focus Preferences
                </span>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-[#232B3A] bg-[#0F131B] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100">Mission Completion Chime</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Gentle audio chime when a study mission reaches its target duration.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleAudio}
                    aria-pressed={audioEnabled}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3346] bg-[#141923] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[34px]"
                  >
                    {audioEnabled ? (
                      <Volume2 className="h-3.5 w-3.5 text-[#D4AD5A]" aria-hidden="true" />
                    ) : (
                      <VolumeX className="h-3.5 w-3.5 text-slate-500" aria-hidden="true" />
                    )}
                    <span>{audioEnabled ? 'On' : 'Muted'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-[#232B3A] bg-[#0F131B] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-100">Daily Focus Goal</p>
                    <p className="mt-0.5 text-xs text-slate-400 tabular-nums">
                      Current goal: {formatMinutesCompact(dailyFocusTargetMinutes)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFocusTargetModal();
                    }}
                    className="rounded-lg border border-[#2A3346] bg-[#141923] px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[34px]"
                  >
                    Edit Goal
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end border-t border-[#1E2534] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-rose-700 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition-colors min-h-[38px]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
