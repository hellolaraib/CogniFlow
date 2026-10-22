import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, TaskType, TASK_TYPES } from '../../types/solver';
import { ResponseUsage } from './ResponseUsage';

interface ChatViewProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSendMessage: (text: string, mode: TaskType) => void;
  onRetryMessage: (text: string, mode: TaskType) => void;
}

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  // If it's a short single-line number, render with high visibility
  if (text.length < 30 && !text.includes('\n') && /^[\d\.\,\-]+$/.test(text.trim())) {
    return (
      <div className="text-3xl md:text-4xl font-extrabold font-mono text-primary tracking-tight select-all my-1">
        {text}
      </div>
    );
  }

  // Parse markdown code blocks ```lang ... ```
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-2 text-sm md:text-base leading-relaxed">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3).trim().split('\n');
          const firstLine = lines[0].trim();
          const hasLang = /^[a-zA-Z0-9_\-]+$/.test(firstLine);
          const lang = hasLang ? firstLine : '';
          const code = hasLang ? lines.slice(1).join('\n') : lines.join('\n');

          return (
            <div
              key={index}
              className="my-3 rounded-xl bg-surface-container-lowest border border-outline-variant/20 overflow-hidden font-mono text-xs md:text-sm shadow-sm"
            >
              {lang && (
                <div className="px-3.5 py-1.5 bg-surface-container-high/60 text-[11px] text-on-surface-variant uppercase font-semibold border-b border-outline-variant/15 flex justify-between items-center font-mono">
                  <span>{lang}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">runnable snippet</span>
                </div>
              )}
              <pre className="p-4 overflow-x-auto text-emerald-300/95 leading-relaxed font-mono">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        return (
          <div key={index} className="whitespace-pre-wrap">
            {part.split(/(\*\*.*?\*\*)/g).map((sub, i) => {
              if (sub.startsWith('**') && sub.endsWith('**')) {
                return (
                  <strong key={i} className="font-semibold text-emerald-300">
                    {sub.slice(2, -2)}
                  </strong>
                );
              }
              if (sub.startsWith('`') && sub.endsWith('`') && sub.length > 2) {
                return (
                  <code
                    key={i}
                    className="px-1.5 py-0.5 rounded bg-surface-container-high font-mono text-xs text-emerald-300 border border-outline-variant/20"
                  >
                    {sub.slice(1, -1)}
                  </code>
                );
              }
              return sub;
            })}
          </div>
        );
      })}
    </div>
  );
};

export const ChatView: React.FC<ChatViewProps> = ({
  messages,
  isLoading,
  onSendMessage,
  onRetryMessage,
}) => {
  const [input, setInput] = useState('');
  const [selectedMode, setSelectedMode] = useState<TaskType>(() => {
    const saved = localStorage.getItem('cogniflow_default_mode');
    if (saved && TASK_TYPES.some((t) => t.id === saved)) {
      return saved as TaskType;
    }
    return 'smart';
  });
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedSolvedId, setExpandedSolvedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        180
      )}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed, selectedMode);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentModeOption =
    TASK_TYPES.find((t) => t.id === selectedMode) || TASK_TYPES[0];

  const quickPrompts = [
    {
      title: 'Merge Sort in Python',
      prompt: 'give merge sort code',
      mode: 'code_gen' as TaskType,
      tag: 'Algorithm Code',
    },
    {
      title: 'Solve Equations & Math',
      prompt: 'Solve 2x + 5 = 15 and calculate 65 * 9',
      mode: 'math' as TaskType,
      tag: 'Deterministic Math',
    },
    {
      title: 'Analyze Sentiment',
      prompt: 'Analyze sentiment: "The new database update eliminated our replication lag and works like a dream!"',
      mode: 'sentiment' as TaskType,
      tag: 'NLP Classifier',
    },
    {
      title: 'Technical Knowledge',
      prompt: 'What is Docker and how does it work?',
      mode: 'factual' as TaskType,
      tag: 'Knowledge Base',
    },
  ];

  const getTaskLabel = (type?: string) => {
    switch (type) {
      case 'code_gen':
        return 'Code Generator';
      case 'code_debug':
        return 'Code Debugger';
      case 'math':
        return 'Math Solver';
      case 'sentiment':
        return 'Sentiment';
      case 'ner':
        return 'Entity Extraction';
      case 'summarization':
        return 'Summarizer';
      case 'logical':
        return 'Logic Theorem';
      case 'factual':
        return 'Knowledge Base';
      default:
        return 'Solver Engine';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full relative bg-surface">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          // Welcome / Empty State
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center pt-8">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-mono font-bold text-xl mb-4 shadow-[0_0_20px_rgba(75,226,119,0.2)]">
              CF
            </div>
            <h1 className="text-2xl md:text-3xl font-semibold text-on-surface tracking-tight">
              What can CogniFlow solve for you?
            </h1>
            <p className="text-on-surface-variant text-sm md:text-base max-w-lg mt-2 leading-relaxed">
              Ask for programming algorithms, solve mathematical equations, analyze sentiment, or lookup technical concepts.
            </p>

            {/* Quick Prompt Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInput(q.prompt);
                    setSelectedMode(q.mode);
                    if (textareaRef.current) textareaRef.current.focus();
                  }}
                  className="p-3.5 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 hover:border-primary/40 text-left transition-all group flex flex-col justify-between gap-2 shadow-sm"
                >
                  <div className="text-sm font-medium text-on-surface group-hover:text-primary transition-colors">
                    {q.title}
                  </div>
                  <div className="text-xs text-on-surface-variant/80 font-mono truncate">
                    "{q.prompt}"
                  </div>
                  <div className="text-[10px] text-primary font-mono uppercase tracking-wider">
                    {q.tag}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Message Thread
          messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex gap-3 md:gap-4 ${
                  isUser ? 'justify-end' : 'justify-start'
                } animate-fadeIn`}
              >
                {/* Assistant Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary font-mono font-bold text-xs shrink-0 mt-0.5 shadow-sm">
                    CF
                  </div>
                )}

                {/* Message Content Container */}
                <div
                  className={`flex flex-col max-w-[85%] md:max-w-[78%] ${
                    isUser ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Clean Assistant Header */}
                  {!isUser && (
                    <div className="flex items-center gap-2 mb-1.5 text-xs text-on-surface-variant font-mono">
                      <span className="font-semibold text-emerald-400">CogniFlow</span>
                      <span className="text-outline-variant/40">•</span>
                      <span className="text-[11px] text-on-surface-variant/80">
                        {getTaskLabel(msg.taskType)}
                      </span>
                      {msg.processingTimeMs && (
                        <>
                          <span className="text-outline-variant/40">•</span>
                          <span className="text-[11px] text-on-surface-variant/60">
                            {msg.processingTimeMs.toFixed(1)}ms
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm md:text-base leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600/90 text-white font-medium rounded-tr-sm shadow-md border border-emerald-500/30'
                        : 'bg-surface-container-low text-on-surface rounded-tl-sm border border-outline-variant/20 shadow-sm w-full'
                    }`}
                  >
                    {msg.error ? (
                      <div className="flex flex-col gap-1 text-error">
                        <div className="flex items-center gap-1 font-semibold text-xs uppercase font-mono">
                          <span className="material-symbols-outlined text-[16px]">error</span>
                          <span>Execution Error</span>
                        </div>
                        <p className="text-on-surface">{msg.error}</p>
                      </div>
                    ) : (
                      <>
                        <FormattedMessage text={msg.text} />
                        {!isUser && (
                          <ResponseUsage
                            usage={msg.usage || msg.tokenUsage}
                            tokenUsage={msg.tokenUsage}
                            solver={msg.solver}
                            processingTimeMs={msg.processingTimeMs}
                            engineName={msg.solverDetails?.engine}
                          />
                        )}
                      </>
                    )}
                  </div>

                  {/* Clean Assistant Message Actions */}
                  {!isUser && !msg.error && (
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-on-surface-variant">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.text)}
                        className="flex items-center gap-1 hover:text-primary transition-colors py-0.5 px-2 rounded hover:bg-surface-container font-mono text-[11px]"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedId === msg.id ? 'done' : 'content_copy'}
                        </span>
                        <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          const prevUserMsg = messages
                            .slice(0, messages.indexOf(msg))
                            .reverse()
                            .find((m) => m.sender === 'user');
                          if (prevUserMsg) {
                            onRetryMessage(
                              prevUserMsg.text,
                              (msg.taskType as TaskType) || 'smart'
                            );
                          }
                        }}
                        className="flex items-center gap-1 hover:text-primary transition-colors py-0.5 px-2 rounded hover:bg-surface-container font-mono text-[11px]"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          refresh
                        </span>
                        <span>Retry</span>
                      </button>

                      {/* Collapsible 'How was this solved?' */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSolvedId(expandedSolvedId === msg.id ? null : msg.id)
                        }
                        className={`flex items-center gap-1 transition-colors py-0.5 px-2 rounded font-mono text-[11px] ${
                          expandedSolvedId === msg.id
                            ? 'text-primary bg-surface-container'
                            : 'hover:text-primary hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {expandedSolvedId === msg.id ? 'expand_less' : 'tune'}
                        </span>
                        <span>How was this solved?</span>
                      </button>

                      {/* Real-time token badge */}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container/80 border border-outline-variant/20 text-on-surface-variant flex items-center gap-1.5 ml-auto">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          (msg.tokenUsage?.total_tokens ?? 0) === 0 ? 'bg-primary' : 'bg-secondary'
                        }`}></span>
                        <span>
                          {(msg.tokenUsage?.total_tokens ?? 0) === 0
                            ? '0 Tokens (Deterministic)'
                            : `${msg.tokenUsage?.total_tokens ?? msg.tokensConsumed ?? 0} Tokens (${msg.tokenUsage?.token_count_method || 'actual'})`}
                        </span>
                      </span>
                    </div>
                  )}

                  {/* Collapsible Telemetry Card */}
                  {!isUser && !msg.error && expandedSolvedId === msg.id && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-surface-container border border-outline-variant/30 text-xs font-mono space-y-3 w-full animate-fadeIn shadow-sm">
                      <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center justify-between border-b border-outline-variant/20 pb-2">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[15px]">psychology</span>
                          <span>Execution & Real-Time Token Telemetry</span>
                        </span>
                        <span className="text-[10px] text-on-surface-variant/70 font-normal">
                          Request ID: {msg.tokenUsage?.request_id ? msg.tokenUsage.request_id.slice(0, 13) + '...' : 'live-local'}
                        </span>
                      </div>

                      {/* Section 1: Dispatch & Routing */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                        <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                          <span className="text-[10px] text-on-surface-variant uppercase">Detected Category</span>
                          <span className="font-semibold text-on-surface truncate">
                            {getTaskLabel(msg.taskType) || 'General Solver'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                          <span className="text-[10px] text-on-surface-variant uppercase">Solver Engine</span>
                          <span className="font-semibold text-emerald-300 truncate">
                            {msg.solverDetails?.engine || msg.solver || 'Standard Kernel'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                          <span className="text-[10px] text-on-surface-variant uppercase">Processing Time</span>
                          <span className="font-semibold text-on-surface">
                            {msg.processingTimeMs !== undefined ? `${msg.processingTimeMs.toFixed(2)} ms` : 'Unavailable'}
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col gap-0.5">
                          <span className="text-[10px] text-on-surface-variant uppercase">Fallback Routing</span>
                          <span className={`font-semibold ${msg.tokenUsage?.fallback_used ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {msg.tokenUsage?.fallback_used ? 'Invoked Fallback' : 'Primary Solved'}
                          </span>
                        </div>
                      </div>

                      {/* Section 2: Real-Time Token Consumption */}
                      <div className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/20 space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">toll</span>
                            <span>Token Accounting</span>
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] uppercase font-mono ${
                            msg.tokenUsage?.token_count_method === 'not_applicable' || (msg.tokenUsage?.total_tokens ?? 0) === 0
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : msg.tokenUsage?.token_count_method === 'estimated'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {msg.tokenUsage?.token_count_method === 'not_applicable' || (msg.tokenUsage?.total_tokens ?? 0) === 0
                              ? 'Not Applicable (Zero LLM)'
                              : msg.tokenUsage?.token_count_method === 'estimated'
                              ? 'Estimated Count'
                              : 'Actual Token Count'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-on-surface-variant block">Input Tokens</span>
                            <span className="font-bold text-on-surface font-mono">
                              {msg.tokenUsage?.input_tokens ?? 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block">Output Tokens</span>
                            <span className="font-bold text-on-surface font-mono">
                              {msg.tokenUsage?.output_tokens ?? 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block">Total LLM Tokens</span>
                            <span className="font-bold text-primary font-mono">
                              {msg.tokenUsage?.total_tokens ?? (msg.solverDetails?.deterministic ? 0 : (msg.tokensConsumed ?? 0))}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] text-on-surface-variant block">LLM Invocations</span>
                            <span className="font-bold text-on-surface font-mono">
                              {msg.tokenUsage?.llm_calls ?? 0}
                            </span>
                          </div>
                        </div>

                        <div className="pt-1.5 border-t border-outline-variant/15 flex flex-wrap items-center justify-between text-[10px] text-on-surface-variant">
                          <span>
                            Model: <strong className="text-on-surface">{msg.tokenUsage?.model || (msg.solverDetails?.deterministic ? 'None (Deterministic Kernel)' : 'Local Pipeline')}</strong>
                          </span>
                          <span>
                            Paid API Cost: <strong className="text-emerald-400">{msg.tokenUsage?.estimated_cost ? `$${msg.tokenUsage.estimated_cost.toFixed(4)}` : '$0.00 (Zero External API)'}</strong>
                          </span>
                        </div>
                      </div>

                      {/* Secondary Results from backend (if present) */}
                      {msg.secondaryResults && Object.keys(msg.secondaryResults).length > 0 && (
                        <div className="pt-2 border-t border-outline-variant/15 text-[11px]">
                          <span className="text-[10px] text-on-surface-variant uppercase font-semibold block mb-1">
                            Structured Engine Output
                          </span>
                          <div className="p-2 rounded-lg bg-surface-container-lowest text-on-surface-variant/90 border border-outline-variant/15 overflow-x-auto">
                            {msg.secondaryResults.scores && (
                              <div className="flex gap-4">
                                <span>Positive: <strong className="text-emerald-400">{msg.secondaryResults.scores.positive}</strong></span>
                                <span>Neutral: <strong className="text-on-surface">{msg.secondaryResults.scores.neutral}</strong></span>
                                <span>Negative: <strong className="text-rose-400">{msg.secondaryResults.scores.negative}</strong></span>
                              </div>
                            )}
                            {msg.secondaryResults.entities && (
                              <div className="flex flex-wrap gap-1.5">
                                {msg.secondaryResults.entities.map((e, idx) => (
                                  <span key={idx} className="px-1.5 py-0.5 rounded bg-surface-container text-emerald-300 border border-outline-variant/20">
                                    {e.entity} ({e.label})
                                  </span>
                                ))}
                              </div>
                            )}
                            {msg.secondaryResults.expression && (
                              <div>Expression: <code className="text-emerald-300">{msg.secondaryResults.expression}</code></div>
                            )}
                            {msg.secondaryResults.percent && (
                              <div>Percent: {msg.secondaryResults.percent}% of {msg.secondaryResults.base} = {msg.secondaryResults.result}</div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/30 flex items-center justify-center text-on-surface font-semibold text-xs shrink-0 mt-0.5 shadow-sm">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex gap-3 md:gap-4 justify-start animate-fadeIn">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-primary/30 flex items-center justify-center text-primary font-mono font-bold text-xs shrink-0 shadow-sm">
              CF
            </div>
            <div className="rounded-2xl px-4 py-3 bg-surface-container-low text-on-surface border border-outline-variant/20 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-sm font-mono text-on-surface-variant">
                Evaluating via {currentModeOption.label}...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Clean Bottom Input Bar */}
      <div className="p-4 md:p-5 bg-surface/95 backdrop-blur-xl border-t border-outline-variant/15">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {/* Solver Mode Pill */}
          <div className="flex items-center justify-between px-1">
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-mono text-on-surface border border-outline-variant/20 transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-on-surface-variant">Mode:</span>
                <span className="font-semibold">{currentModeOption.label}</span>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">
                  expand_more
                </span>
              </button>

              {/* Mode Dropdown Menu */}
              {isModeDropdownOpen && (
                <div className="absolute bottom-full left-0 mb-1.5 w-60 bg-surface-container-high rounded-xl shadow-2xl p-1.5 z-50 flex flex-col gap-0.5 border border-outline-variant/30">
                  <div className="px-2 py-1 text-[10px] uppercase text-on-surface-variant/60 font-mono font-semibold">
                    Routing Engine
                  </div>
                  {TASK_TYPES.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        setSelectedMode(mode.id);
                        setIsModeDropdownOpen(false);
                      }}
                      className={`text-left w-full px-2.5 py-1.5 rounded text-xs text-on-surface hover:bg-surface-container-highest hover:text-primary font-mono flex items-center justify-between transition-colors ${
                        selectedMode === mode.id
                          ? 'bg-surface-container-highest text-primary font-bold'
                          : ''
                      }`}
                    >
                      <span>{mode.label}</span>
                      <span className={`text-[9px] px-1 rounded ${mode.badgeClass}`}>
                        {mode.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Textarea Input Container */}
          <form
            onSubmit={handleSubmit}
            className="flex items-end gap-2 bg-surface-container-low rounded-2xl p-2 md:p-2.5 border border-outline-variant/30 focus-within:border-emerald-400/60 shadow-lg transition-all"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything, request code, calculate math, or ask questions..."
              disabled={isLoading}
              className="flex-1 bg-transparent text-on-surface placeholder-on-surface-variant/40 text-sm md:text-base resize-none focus:outline-none px-2 py-1 max-h-44 font-sans leading-relaxed disabled:opacity-50 caret-emerald-400"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center transition-all shadow-[0_0_12px_rgba(16,185,129,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none shrink-0"
              title="Send task"
            >
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
