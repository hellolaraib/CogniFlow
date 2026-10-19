import React from 'react';
import { ScreenId } from './Sidebar';

interface HeaderProps {
  currentScreen: ScreenId;
  onOpenSettings: () => void;
  onClearChat?: () => void;
  hasMessages?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onOpenSettings,
  onClearChat,
  hasMessages,
}) => {
  const getScreenTitle = () => {
    switch (currentScreen) {
      case 'chat':
        return 'Chat Assistant';
      case 'solvers':
        return '8 Registered Solver Engines';
      case 'history':
        return 'Task Execution History';
      case 'settings':
        return 'User Settings & Preferences';
      case 'developer':
        return 'Developer & Engineering Dashboard';
    }
  };

  return (
    <header className="fixed top-0 left-64 md:left-72 right-0 h-16 bg-surface/90 backdrop-blur-xl border-b border-outline-variant/20 z-40 px-4 md:px-6 flex items-center justify-between">
      {/* Title */}
      <div className="flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        <h1 className="text-sm md:text-base font-semibold text-on-surface tracking-tight">
          {getScreenTitle()}
        </h1>
      </div>

      {/* Right HUD Widgets */}
      <div className="flex items-center gap-space-sm md:gap-space-md">
        {/* Smart Mode Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container border border-outline-variant/30 text-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
          <span className="font-mono text-xs text-on-surface">Smart Auto-Route</span>
        </div>

        {/* Clear Current Chat Button */}
        {currentScreen === 'chat' && hasMessages && onClearChat && (
          <button
            type="button"
            onClick={onClearChat}
            className="flex items-center gap-1 h-8 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-error text-xs font-mono transition-colors"
            title="Clear conversation"
          >
            <span className="material-symbols-outlined text-[15px]">delete_sweep</span>
            <span>Clear</span>
          </button>
        )}

        {/* Settings Button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="h-8 px-2.5 flex items-center gap-1 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:text-on-surface text-xs font-mono transition-colors"
          title="System Settings"
        >
          <span className="material-symbols-outlined text-[16px]">settings</span>
          <span className="hidden sm:inline">Settings</span>
        </button>
      </div>
    </header>
  );
};
