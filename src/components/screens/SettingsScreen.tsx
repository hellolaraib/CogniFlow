import React, { useState } from 'react';
import { TaskType, TASK_TYPES, ChatMessage } from '../../types/solver';

interface SettingsScreenProps {
  messagesCount: number;
  historyCount: number;
  messages: ChatMessage[];
  onPurgeMessages: () => void;
  onPurgeHistory: () => void;
  onNavigateToDeveloper: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  messagesCount,
  historyCount,
  messages,
  onPurgeMessages,
  onPurgeHistory,
  onNavigateToDeveloper,
}) => {
  // 1. Default Task Mode Preference
  const [defaultMode, setDefaultMode] = useState<TaskType>(() => {
    const saved = localStorage.getItem('cogniflow_default_mode');
    if (saved && TASK_TYPES.some((t) => t.id === saved)) {
      return saved as TaskType;
    }
    return 'smart';
  });

  // 2. Theme Preference
  const [themePref, setThemePref] = useState<'emerald' | 'oled' | 'slate'>(() => {
    return (localStorage.getItem('cogniflow_theme') as any) || 'emerald';
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showClearChatConfirm, setShowClearChatConfirm] = useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleModeChange = (mode: TaskType) => {
    setDefaultMode(mode);
    localStorage.setItem('cogniflow_default_mode', mode);
    showToast(`Default solver mode set to ${TASK_TYPES.find((t) => t.id === mode)?.label || mode}.`);
  };

  const handleThemeChange = (theme: 'emerald' | 'oled' | 'slate') => {
    setThemePref(theme);
    localStorage.setItem('cogniflow_theme', theme);
    showToast(`Theme updated to ${theme === 'emerald' ? 'Dark Emerald' : theme === 'oled' ? 'OLED Pure Black' : 'Midnight Slate'}.`);
  };

  // Export Chat as JSON
  const handleExportJson = () => {
    if (messages.length === 0) {
      showToast('No messages in active chat to export.');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(messages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `cogniflow_chat_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Chat history exported as JSON.');
  };

  // Export Chat as Markdown
  const handleExportMarkdown = () => {
    if (messages.length === 0) {
      showToast('No messages in active chat to export.');
      return;
    }
    let md = `# CogniFlow Conversation Transcript\n*Exported on ${new Date().toLocaleString()}*\n\n---\n\n`;
    messages.forEach((m) => {
      if (m.sender === 'user') {
        md += `### User\n${m.text}\n\n`;
      } else {
        const solverInfo = m.solverDetails?.engine || m.solver || 'Standard';
        md += `### CogniFlow (${solverInfo} • ${m.processingTimeMs?.toFixed(1) || 1.0}ms)\n${m.text}\n\n---\n\n`;
      }
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniflow_chat_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Chat history exported as Markdown transcript.');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 max-w-4xl mx-auto w-full space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-surface-container-highest text-primary border border-primary/30 text-xs font-mono shadow-2xl flex items-center gap-2 animate-fadeIn">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-outline-variant/20">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">
            Settings & Preferences
          </h1>
          <p className="text-xs md:text-sm text-on-surface-variant mt-1">
            Customize your workspace, solver defaults, and manage chat history.
          </p>
        </div>

        {/* Developer Dashboard Shortcut */}
        <button
          type="button"
          onClick={onNavigateToDeveloper}
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-on-surface hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">developer_mode</span>
          <span>Developer Dashboard →</span>
        </button>
      </div>

      {/* CARD 1: Workspace Preferences */}
      <div className="rounded-2xl p-5 bg-surface-container-low border border-outline-variant/20 space-y-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            tune
          </span>
          <h2 className="text-base font-semibold text-on-surface font-sans">
            Workspace Preferences
          </h2>
        </div>

        {/* Default Task Mode */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-on-surface uppercase tracking-wider font-mono">
            Default Solver Mode
          </label>
          <p className="text-xs text-on-surface-variant">
            Select which routing mode activates when you launch CogniFlow or open a new conversation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            {TASK_TYPES.map((t) => {
              const isSelected = defaultMode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleModeChange(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                    isSelected
                      ? 'bg-surface-container-high border-primary text-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/50 text-on-surface'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-xs font-mono">{t.label}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${t.badgeClass}`}>
                      {t.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed">
                    {t.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Preference */}
        <div className="space-y-2 pt-3 border-t border-outline-variant/15">
          <label className="text-xs font-semibold text-on-surface uppercase tracking-wider font-mono">
            Theme Style
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'emerald', label: 'Dark Emerald', desc: 'Default technical aesthetic with emerald green highlights' },
              { id: 'oled', label: 'OLED Pure Black', desc: 'Maximum contrast deep pitch-black background' },
              { id: 'slate', label: 'Midnight Slate', desc: 'Subtle charcoal graphite tones for prolonged reading' },
            ].map((theme) => {
              const isSelected = themePref === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => handleThemeChange(theme.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-surface-container-high border-primary text-primary shadow-sm ring-1 ring-primary/40'
                      : 'bg-surface-container border-outline-variant/20 hover:border-outline-variant/50 text-on-surface'
                  }`}
                >
                  <div className="font-semibold text-xs font-mono">{theme.label}</div>
                  <p className="text-[11px] text-on-surface-variant mt-1 leading-relaxed">
                    {theme.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* CARD 2: Chat History & Storage */}
      <div className="rounded-2xl p-5 bg-surface-container-low border border-outline-variant/20 space-y-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">
            folder_open
          </span>
          <h2 className="text-base font-semibold text-on-surface font-sans">
            Chat History & Data Storage
          </h2>
        </div>

        <p className="text-xs text-on-surface-variant">
          Your tasks and conversations are stored locally in your browser storage. You can export or clear them at any time.
        </p>

        {/* Storage Stats */}
        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 font-mono">
            <span className="text-[10px] text-on-surface-variant uppercase block">Active Messages</span>
            <span className="text-lg font-bold text-on-surface">{messagesCount}</span>
            <span className="text-[10px] text-on-surface-variant/70 block">Stored in local session</span>
          </div>

          <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/20 font-mono">
            <span className="text-[10px] text-on-surface-variant uppercase block">Execution History</span>
            <span className="text-lg font-bold text-primary">{historyCount}</span>
            <span className="text-[10px] text-on-surface-variant/70 block">Saved task solutions</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <button
            type="button"
            onClick={handleExportJson}
            disabled={messagesCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-on-surface transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={handleExportMarkdown}
            disabled={messagesCount === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-xs font-mono text-on-surface transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">description</span>
            <span>Export Markdown</span>
          </button>

          {/* Clear Active Chat */}
          {!showClearChatConfirm ? (
            <button
              type="button"
              onClick={() => setShowClearChatConfirm(true)}
              disabled={messagesCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-red-950/30 border border-outline-variant/30 hover:border-red-500/40 text-xs font-mono text-on-surface-variant hover:text-red-400 transition-colors disabled:opacity-50 ml-auto"
            >
              <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
              <span>Clear Current Chat</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 ml-auto animate-fadeIn">
              <span className="text-xs font-mono text-red-400">Confirm delete chat?</span>
              <button
                type="button"
                onClick={() => {
                  onPurgeMessages();
                  setShowClearChatConfirm(false);
                  showToast('Active chat cleared.');
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-mono font-semibold"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowClearChatConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-mono text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Clear History Ledger */}
          {!showClearHistoryConfirm ? (
            <button
              type="button"
              onClick={() => setShowClearHistoryConfirm(true)}
              disabled={historyCount === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-red-950/30 border border-outline-variant/30 hover:border-red-500/40 text-xs font-mono text-on-surface-variant hover:text-red-400 transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px]">auto_delete</span>
              <span>Clear Task Ledger</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="text-xs font-mono text-red-400">Confirm delete history?</span>
              <button
                type="button"
                onClick={() => {
                  onPurgeHistory();
                  setShowClearHistoryConfirm(false);
                  showToast('Task history ledger cleared.');
                }}
                className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-mono font-semibold"
              >
                Yes, Delete
              </button>
              <button
                type="button"
                onClick={() => setShowClearHistoryConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-surface-container text-xs font-mono text-on-surface-variant"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CARD 3: About CogniFlow */}
      <div className="rounded-2xl p-5 bg-surface-container-low border border-outline-variant/20 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">
              info
            </span>
            <h2 className="text-base font-semibold text-on-surface font-sans">
              About CogniFlow
            </h2>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-primary/10 text-primary border border-primary/20">
            v0.1-preview
          </span>
        </div>

        <div className="space-y-3 text-xs leading-relaxed text-on-surface-variant">
          <p>
            <strong className="text-on-surface">CogniFlow</strong> is an intelligent adaptive execution platform designed to route tasks to the most efficient solver engine—combining deterministic symbolic kernels, Tree-sitter AST analysis, and specialized NLP models.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col gap-1">
              <span className="font-semibold text-on-surface font-mono text-xs flex items-center gap-1.5 text-emerald-400">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>Zero-Token Architecture</span>
              </span>
              <p className="text-[11px] text-on-surface-variant/80">
                Mathematical queries, logic proofs, sentiment analysis, and code debugging execute using local deterministic algorithms with zero token overhead and &lt; 2.0ms latency.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-surface-container border border-outline-variant/15 flex flex-col gap-1">
              <span className="font-semibold text-on-surface font-mono text-xs flex items-center gap-1.5 text-emerald-400">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                <span>100% Localhost Privacy</span>
              </span>
              <p className="text-[11px] text-on-surface-variant/80">
                All executions run directly on your workstation via Python and local browser storage. No user prompts or code snippets are transmitted to external servers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CARD 4: Developer Diagnostics Portal Banner */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low border border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-primary text-xs font-mono font-semibold uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">terminal</span>
            <span>Developer & Engineering Suite</span>
          </div>
          <h3 className="text-sm md:text-base font-semibold text-on-surface">
            Looking for backend health, solver telemetry, or API specifications?
          </h3>
          <p className="text-xs text-on-surface-variant">
            Inspect raw latency benchmarks, OpenAPI documentation, routing thresholds, and memory footprint.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateToDeveloper}
          className="self-start sm:self-auto shrink-0 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 font-mono text-xs font-semibold transition-all shadow-[0_0_12px_rgba(75,226,119,0.2)] flex items-center gap-1.5"
        >
          <span>Open Developer Dashboard</span>
          <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
        </button>
      </div>
    </div>
  );
};
