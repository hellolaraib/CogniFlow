import React from 'react';

export type ScreenId = 'chat' | 'history' | 'solvers' | 'settings' | 'developer';

interface SidebarProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  onNewChat: () => void;
  recentQueries: string[];
  onSelectRecentQuery: (query: string) => void;
  historyCount: number;
  apiConnected: boolean;
  apiLatencyMs?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentScreen,
  onNavigate,
  onNewChat,
  recentQueries,
  onSelectRecentQuery,
  historyCount,
  apiConnected,
  apiLatencyMs,
}) => {
  return (
    <aside className="fixed left-0 top-0 h-full w-64 md:w-72 bg-surface-container-low border-r border-outline-variant/30 z-50 flex flex-col justify-between select-none">
      <div className="flex flex-col flex-1 min-h-0">
        {/* Top Logo & Version */}
        <div className="h-16 px-space-md border-b border-outline-variant/20 flex items-center justify-between shrink-0">
          <div
            className="flex items-center gap-space-sm cursor-pointer"
            onClick={() => onNavigate('chat')}
          >
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-mono font-bold text-sm shadow-[0_0_10px_rgba(75,226,119,0.2)]">
              CF
            </div>
            <span className="font-headline-md text-headline-md tracking-tight text-on-surface font-semibold">
              CogniFlow
            </span>
          </div>
          <span className="font-label-sm text-label-sm font-semibold uppercase px-space-xs py-0.5 rounded bg-surface-container-highest text-primary border border-primary/20">
            v0.1
          </span>
        </div>

        {/* New Chat Button */}
        <div className="p-space-md shrink-0">
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-space-xs py-2.5 px-space-md bg-surface-container-high border border-primary/40 rounded-xl text-primary font-headline-md text-sm hover:bg-primary-container hover:text-on-primary-container transition-all shadow-[0_0_12px_rgba(75,226,119,0.15)] group font-semibold"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform">
              add
            </span>
            <span>New Chat</span>
            <span className="ml-auto font-label-sm text-label-sm text-on-surface-variant group-hover:text-on-primary-container font-mono opacity-60">
              ⌘N
            </span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-col gap-1 px-space-sm shrink-0">
          {/* Chat Assistant */}
          <button
            onClick={() => onNavigate('chat')}
            className={`w-full flex items-center justify-between px-space-md py-2 rounded-lg transition-all text-left text-sm ${
              currentScreen === 'chat'
                ? 'bg-surface-container-high text-primary border border-primary/20 font-semibold shadow-inner'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              <span>Chat Assistant</span>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant/70">⌥1</span>
          </button>

          {/* Task History */}
          <button
            onClick={() => onNavigate('history')}
            className={`w-full flex items-center justify-between px-space-md py-2 rounded-lg transition-all text-left text-sm ${
              currentScreen === 'history'
                ? 'bg-surface-container-high text-primary border border-primary/20 font-semibold shadow-inner'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[18px]">history</span>
              <span>Task History</span>
            </div>
            <span className="font-code-sm text-code-sm px-1.5 py-0.5 rounded-full bg-surface-container-highest text-on-surface-variant">
              {historyCount}
            </span>
          </button>

          {/* Solver Overview */}
          <button
            onClick={() => onNavigate('solvers')}
            className={`w-full flex items-center justify-between px-space-md py-2 rounded-lg transition-all text-left text-sm ${
              currentScreen === 'solvers'
                ? 'bg-surface-container-high text-primary border border-primary/20 font-semibold shadow-inner'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[18px]">hub</span>
              <span>8 Solver Engines</span>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant/70">⌥3</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onNavigate('settings')}
            className={`w-full flex items-center justify-between px-space-md py-2 rounded-lg transition-all text-left text-sm ${
              currentScreen === 'settings'
                ? 'bg-surface-container-high text-primary border border-primary/20 font-semibold shadow-inner'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Settings</span>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant/70">⌥4</span>
          </button>

          {/* Developer Dashboard */}
          <button
            onClick={() => onNavigate('developer')}
            className={`w-full flex items-center justify-between px-space-md py-2 rounded-lg transition-all text-left text-sm ${
              currentScreen === 'developer'
                ? 'bg-surface-container-high text-amber-400 border border-amber-500/30 font-semibold shadow-inner'
                : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
            }`}
          >
            <div className="flex items-center gap-space-sm">
              <span className="material-symbols-outlined text-[18px]">terminal</span>
              <span>Dev Dashboard</span>
            </div>
            <span className="font-code-sm text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
              DEV
            </span>
          </button>
        </nav>

        {/* Recent Queries / Chat History List */}
        {recentQueries.length > 0 && (
          <div className="flex-1 overflow-y-auto px-space-sm pt-4 min-h-0">
            <div className="px-2 py-1 text-[11px] font-mono uppercase text-on-surface-variant/60 font-semibold">
              Recent Tasks
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
              {recentQueries.slice(0, 10).map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onSelectRecentQuery(q);
                    onNavigate('chat');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors truncate font-mono"
                  title={q}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Indicator */}
      <div className="p-space-md border-t border-outline-variant/15 flex items-center justify-between text-xs text-on-surface-variant font-mono bg-surface-container-lowest/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                apiConnected ? 'bg-emerald-400 opacity-75' : 'bg-amber-400 opacity-75'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                apiConnected ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            ></span>
          </span>
          <span className="font-medium text-on-surface">
            {apiConnected ? 'Engine Online' : 'Connecting...'}
          </span>
        </div>
        <span className="text-[11px] text-on-surface-variant/70">
          {apiLatencyMs ? `${apiLatencyMs}ms` : '0-Token Mode'}
        </span>
      </div>
    </aside>
  );
};
