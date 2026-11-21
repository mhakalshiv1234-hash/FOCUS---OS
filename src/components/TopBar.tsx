import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { UiThemeId } from '../utils/themeSettings';

export type ActiveTab = 'dashboard' | 'missions' | 'shield' | 'analytics' | 'personal';

interface TopBarProps {
  activeTab: ActiveTab;
  uiTheme: UiThemeId;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenTargetModal: () => void;
  onOpenSettingsModal: () => void;
}

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'missions', label: 'Missions' },
  { id: 'shield', label: 'App Blocker' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'personal', label: 'Personal OS' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  uiTheme,
  onSelectTab,
  onOpenTargetModal,
  onOpenSettingsModal,
}) => {
  const isTerminal = uiTheme === 'terminal';

  return (
    <header className="sticky top-0 z-30 border-b border-[#1E2534] bg-[#0E121A]/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <button
          type="button"
          onClick={() => onSelectTab('dashboard')}
          className="inline-flex items-center gap-2.5 font-display text-lg sm:text-xl font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500"
        >
          <svg
            viewBox="0 0 20 20"
            className="h-4 w-4 shrink-0"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 2L17 5.5V10.5C17 14.5 14 17.5 10 18.8C6 17.5 3 14.5 3 10.5V5.5L10 2Z"
              stroke={isTerminal ? '#FFB000' : '#D4AD5A'}
              strokeWidth="1.5"
            />
            <path
              d="M6.5 11.5L10 8L13.5 11.5"
              stroke={isTerminal ? '#00FF66' : '#E11D48'}
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>FOCUS//OS</span>
        </button>

        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-rose-500 ${
                  isActive
                    ? 'bg-[#181F2C] text-slate-50 border border-[#2A3346]'
                    : 'border border-transparent text-slate-400 hover:text-slate-100 hover:bg-[#141923]/70'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            data-testid="open-ui-settings-btn"
            aria-label="UI Settings"
            onClick={onOpenSettingsModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2A3346] bg-[#141923] px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:border-slate-500 whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#D4AD5A] shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">UI Settings</span>
          </button>

          <button
            type="button"
            onClick={onOpenTargetModal}
            className="rounded-lg bg-rose-700 px-3.5 sm:px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-600 whitespace-nowrap shrink-0 min-h-[38px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
          >
            Set Focus Target
          </button>
        </div>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="flex md:hidden items-center gap-2 overflow-x-auto border-t border-[#1E2534] px-4 py-2"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#181F2C] text-slate-50 border border-[#2A3346]'
                  : 'border border-transparent text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
