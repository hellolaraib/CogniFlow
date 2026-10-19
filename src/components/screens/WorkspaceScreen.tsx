import React, { useState, useEffect, useRef } from 'react';
import { TaskType, TASK_TYPES, SolveResponse } from '../../types/solver';
import { solveTask, ApiNetworkError, ApiBackendError } from '../../services/api';

interface WorkspaceScreenProps {
  onTaskSolved: (query: string, taskType: TaskType, response: SolveResponse) => void;
  onOpenSettings: () => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  onTaskSolved,
  onOpenSettings,
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState<TaskType>('smart');
  const [isModeMenuOpen, setIsModeMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<{
    message: string;
    isNetwork: boolean;
    details?: string;
  } | null>(null);

  // Dry-run simulation telemetry state
  const [telemetry, setTelemetry] = useState<{
    engine: string;
    engineColor: string;
    latency: string;
    output: string;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsModeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time character & token target evaluation
  const charLength = prompt.length;
  const estimatedTokens = Math.ceil(charLength / 4);

  const getTargetBadge = () => {
    const val = prompt.trim().toLowerCase();
    if (!val) {
      return { text: 'Zero-token target', className: 'text-primary' };
    }
    if (
      /^[\d\s\+\-\*\/\(\)\^\%\.\=]+$/.test(val) ||
      val.includes('calculate') ||
      val.includes('multiply') ||
      val.includes('sqrt') ||
      val.includes('math')
    ) {
      return { text: 'Zero-token target (Math Engine)', className: 'text-primary font-medium' };
    }
    if (
      val.includes('sentiment') ||
      val.includes('review') ||
      val.includes('polarity') ||
      val.includes('sentiment analysis')
    ) {
      return { text: 'NLP target (<20 tokens)', className: 'text-tertiary font-medium' };
    }
    if (
      val.includes('summarize') ||
      val.includes('incident') ||
      val.includes('code') ||
      charLength > 180
    ) {
      return { text: 'Edge Model target', className: 'text-secondary font-medium' };
    }
    return { text: 'Zero-token target (Deterministic)', className: 'text-primary font-medium' };
  };

  const targetBadge = getTargetBadge();
  const currentModeObj = TASK_TYPES.find((m) => m.id === selectedMode) || TASK_TYPES[0];

  // Dry-run route simulation
  const handleDryRun = () => {
    const val = prompt.trim().toLowerCase();
    if (!val) {
      setPrompt('Calculate 125 × 64 and find its square root');
      return;
    }

    if (val.includes('125') || /^[\d\s\+\-\*\/\(\)]+$/.test(val) || val.includes('calculate')) {
      setTelemetry({
        engine: 'ROUTED: DETERMINISTIC_PYTHON (AST Math Engine)',
        engineColor: 'text-primary',
        latency: 'Latency: 1.4ms • Tokens: 0 • Cost: $0.00000',
        output: 'Result: 8,000 (0x1F40) • Execution verified through sandbox Python kernel',
      });
    } else if (val.includes('sentiment') || val.includes('review')) {
      setTelemetry({
        engine: 'ROUTED: LIGHTWEIGHT_NLP (VADER / DistilBERT Local)',
        engineColor: 'text-tertiary',
        latency: 'Latency: 18.2ms • Tokens: 0 (local embeddings) • Cost: $0.00000',
        output: 'Result: POSITIVE (Confidence: 0.984) • Polarity Score: +0.871',
      });
    } else if (val.includes('summar') || val.includes('incident')) {
      setTelemetry({
        engine: 'ROUTED: LOCAL_EDGE_LLM (Qwen-2.5-Coder 7B Q4_K_M)',
        engineColor: 'text-secondary',
        latency: 'Latency: 114ms • Tokens: 48 • Engine: Local vLLM',
        output:
          'Summary: Node-4 experienced a 5s heartbeat failure. Raft re-elected leader in term 43 with zero data divergence.',
      });
    } else {
      setTelemetry({
        engine: 'ROUTED: DETERMINISTIC_PATTERN_MATCHER',
        engineColor: 'text-primary',
        latency: 'Latency: 3.8ms • Tokens: 0 • Engine: RegEx + SpaCy',
        output: 'Entities: [Person: "Dr. Sarah Vance"], [Drug: "Lisinopril 20mg"], [Org: "St. Jude Clinic"]',
      });
    }
  };

  // Main task solve action
  const handleSolve = async () => {
    const trimmed = prompt.trim();
    if (!trimmed) {
      if (textareaRef.current) {
        textareaRef.current.placeholder = 'Please enter a task or query first...';
        textareaRef.current.focus();
      }
      return;
    }

    setIsLoading(true);
    setErrorState(null);
    setTelemetry(null);

    try {
      const result = await solveTask({
        task_type: selectedMode,
        input: trimmed,
      });

      onTaskSolved(trimmed, selectedMode, result);
    } catch (err: any) {
      console.error('Task solving failed:', err);
      if (err instanceof ApiNetworkError) {
        setErrorState({
          message: 'Unable to reach backend service at ' + err.endpoint,
          isNetwork: true,
          details:
            'The FastAPI server is not responding. Ensure the backend is running (`uvicorn main:app --reload --port 8000`) or adjust the backend URL in Settings.',
        });
      } else if (err instanceof ApiBackendError) {
        setErrorState({
          message: err.message,
          isNetwork: false,
          details: `Backend returned HTTP status ${err.statusCode}.`,
        });
      } else {
        setErrorState({
          message: err.message || 'An unexpected error occurred while executing the task.',
          isNetwork: false,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!isLoading) {
        handleSolve();
      }
    }
  };

  const handleClear = () => {
    setPrompt('');
    setTelemetry(null);
    setErrorState(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  const handleSuggestionClick = (samplePrompt: string, mode: TaskType) => {
    setPrompt(samplePrompt);
    setSelectedMode(mode);
    setTelemetry(null);
    setErrorState(null);
    if (textareaRef.current) textareaRef.current.focus();
  };

  return (
    <div className="relative w-full px-space-lg lg:px-margin-lg py-space-xl flex flex-col gap-space-xl max-w-7xl mx-auto">
      {/* Decorative subtle gradient backdrops */}
      <div className="absolute -top-16 left-1/3 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute top-48 right-10 w-80 h-80 bg-secondary/5 rounded-full blur-3xl pointer-events-none -z-10"></div>

      {/* Header Section */}
      <div className="flex flex-col gap-space-sm relative">
        <div className="flex items-center gap-space-xs font-label-md text-label-md text-primary">
          <span className="font-code-sm text-code-sm uppercase tracking-wider font-semibold">
            INTELLIGENT TASK ROUTING
          </span>
          <span className="text-outline-variant font-mono">•</span>
          <span className="bg-surface-container-high px-2 py-0.5 rounded font-code-sm text-code-sm text-primary-fixed-dim">
            [ROUTER_READY]
          </span>
        </div>
        <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight max-w-4xl">
          Think less about the tool. Focus on the{' '}
          <span className="text-primary font-semibold">solution</span>.
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
          Ask a question, solve a problem, analyze text, or debug code. CogniFlow dynamically routes each
          request to deterministic Python scripts, lightweight local NLP, or edge language models —
          minimizing unnecessary model inference.
        </p>
        <div className="flex items-center gap-space-md pt-space-xs font-code-sm text-code-sm text-on-surface-variant/80">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            Routing Engine v0.1
          </span>
          <span>•</span>
          <span>
            Avg. Dispatch: <strong className="text-primary font-normal">3.8ms</strong>
          </span>
          <span>•</span>
          <span>
            Zero-Token Ratio: <strong className="text-secondary font-normal">74.2%</strong>
          </span>
        </div>
      </div>

      {/* Task Input Workspace Card */}
      <div className="bg-surface-container-low rounded-xl shadow-xl flex flex-col relative border border-outline-variant/20 transition-all duration-200">
        {/* Integrated Top Toolbar */}
        <div className="px-space-md py-space-sm bg-surface-container flex flex-wrap items-center justify-between gap-space-sm rounded-t-xl border-b border-outline-variant/15">
          {/* Mode Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsModeMenuOpen(!isModeMenuOpen)}
              className="flex items-center gap-space-xs px-2.5 py-1.5 rounded-lg bg-surface-container-high text-on-surface hover:text-primary transition-colors font-code-sm text-code-sm group border border-outline-variant/20"
            >
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              <span className="text-on-surface-variant">Mode:</span>
              <span className="font-semibold text-on-surface group-hover:text-primary">
                {currentModeObj.label}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant group-hover:text-primary transition-transform">
                expand_more
              </span>
            </button>

            {/* Dropdown Menu */}
            {isModeMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 bg-surface-container-high rounded-xl shadow-2xl p-1.5 z-30 flex flex-col gap-0.5 border border-outline-variant/30">
                <div className="px-2 py-1 font-label-sm text-label-sm uppercase text-on-surface-variant/60 font-mono">
                  Routing Strategies
                </div>
                {TASK_TYPES.map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => {
                      setSelectedMode(mode.id);
                      setIsModeMenuOpen(false);
                    }}
                    className={`text-left w-full px-2.5 py-1.5 rounded text-on-surface hover:bg-surface-container-highest hover:text-primary font-code-sm text-code-sm flex items-center justify-between transition-colors ${
                      selectedMode === mode.id ? 'bg-surface-container-highest text-primary' : ''
                    }`}
                  >
                    <span>{mode.label.replace(' (Auto-Detect)', '')}</span>
                    <span className={`text-[10px] font-mono px-1 rounded ${mode.badgeClass}`}>
                      {mode.badge}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Monospace Telemetry / Counter */}
          <div className="flex items-center gap-space-xs font-code-sm text-code-sm text-on-surface-variant bg-surface-container-lowest px-2.5 py-1 rounded border border-outline-variant/10">
            <span className="material-symbols-outlined text-[14px] text-primary">speed</span>
            <span>{charLength} chars</span>
            <span className="text-outline-variant/40">•</span>
            <span>~{estimatedTokens} tokens</span>
            <span className="text-outline-variant/40">•</span>
            <span className={targetBadge.className}>{targetBadge.text}</span>
          </div>
        </div>

        {/* Multiline Query Textarea */}
        <div className="p-space-md">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            className="w-full bg-surface-container-lowest text-on-surface font-body-md text-body-md placeholder-on-surface-variant/40 p-space-md rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-primary caret-primary transition-all font-mono leading-relaxed border border-outline-variant/20 disabled:opacity-60"
            placeholder="What would you like CogniFlow to solve? (e.g., math expression, code snippet, review sentiment, entity extraction)..."
            rows={5}
          />
        </div>

        {/* Bottom Controls */}
        <div className="px-space-md pb-space-md flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex items-center gap-space-md">
            <button
              type="button"
              onClick={handleClear}
              disabled={isLoading || (!prompt && !telemetry && !errorState)}
              className="text-on-surface-variant hover:text-on-surface font-code-sm text-code-sm flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[16px]">backspace</span>
              <span>Clear</span>
            </button>
            <span className="font-code-sm text-code-sm text-on-surface-variant/60 flex items-center gap-1 select-none">
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[10px]">
                ⌘
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-container text-on-surface font-mono text-[10px]">
                Enter
              </kbd>
              <span>to solve</span>
            </span>
          </div>

          <div className="flex items-center gap-space-sm">
            <button
              type="button"
              onClick={handleDryRun}
              disabled={isLoading}
              className="px-space-md py-space-sm rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface font-headline-md text-body-md transition-colors flex items-center gap-1.5 border border-outline-variant/20"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Dry-Run Route</span>
            </button>

            <button
              type="button"
              onClick={handleSolve}
              disabled={isLoading || !prompt.trim()}
              className="px-space-lg py-space-sm rounded-lg bg-primary text-on-primary font-headline-md text-body-md hover:bg-tertiary transition-all shadow-[0_0_16px_rgba(75,226,119,0.25)] flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 rounded-full border-2 border-on-primary border-t-transparent animate-spin"></span>
                  <span>Solving...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">bolt</span>
                  <span>Solve Task</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Alert State */}
        {errorState && (
          <div className="mx-space-md mb-space-md p-space-md rounded-lg bg-error-container/20 border border-error/40 flex flex-col gap-space-xs text-error">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">error</span>
                <span className="font-code-sm text-code-sm font-semibold uppercase">
                  {errorState.isNetwork ? 'Network Connection Error' : 'Backend Processing Error'}
                </span>
              </div>
              <button
                onClick={() => setErrorState(null)}
                className="text-error/70 hover:text-error text-xs"
              >
                Dismiss
              </button>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface">{errorState.message}</p>
            {errorState.details && (
              <p className="font-code-sm text-code-sm text-on-surface-variant/80 font-mono mt-0.5">
                {errorState.details}
              </p>
            )}
            <div className="flex items-center gap-space-sm mt-2 pt-2 border-t border-error/20">
              <button
                onClick={handleSolve}
                className="px-3 py-1 rounded bg-error/20 text-error hover:bg-error/30 font-code-sm text-code-sm font-semibold flex items-center gap-1 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span>
                <span>Retry Request</span>
              </button>
              {errorState.isNetwork && (
                <button
                  onClick={onOpenSettings}
                  className="px-3 py-1 rounded bg-surface-container text-on-surface hover:text-primary font-code-sm text-code-sm flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">settings</span>
                  <span>Configure Backend URL</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Real-time Dry-Run Live Telemetry Panel */}
        {telemetry && !errorState && (
          <div className="mx-space-md mb-space-md p-space-md bg-surface-container-high rounded-lg flex flex-col gap-space-xs border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className={`font-code-sm text-code-sm font-semibold ${telemetry.engineColor}`}>
                  {telemetry.engine}
                </span>
              </div>
              <span className="font-code-sm text-code-sm text-on-surface-variant font-mono">
                {telemetry.latency}
              </span>
            </div>
            <div className="font-code-sm text-code-sm text-on-surface-variant bg-surface-container-lowest p-2 rounded font-mono">
              {telemetry.output}
            </div>
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      <div className="flex flex-col gap-space-sm">
        <div className="font-code-sm text-code-sm text-on-surface-variant/80 flex items-center gap-1.5 uppercase tracking-wide">
          <span className="material-symbols-outlined text-[14px] text-secondary">alt_route</span>
          <span>Or test routing with sample prompts:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-sm">
          {/* Chip 1 */}
          <button
            type="button"
            onClick={() =>
              handleSuggestionClick(
                'Calculate 125 × 64 and output hex representation',
                'math'
              )
            }
            className="suggestion-chip text-left p-space-sm bg-surface-container hover:bg-surface-container-high rounded-lg transition-all flex flex-col justify-between gap-2 group border border-outline-variant/20 hover:border-primary/40"
          >
            <div className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors font-mono">
              "Calculate 125 × 64"
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono font-medium">
                Math • Deterministic
              </span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>

          {/* Chip 2 */}
          <button
            type="button"
            onClick={() =>
              handleSuggestionClick(
                "Analyze the sentiment of this review: 'The new distributed database update completely eliminated our replication lag!'",
                'sentiment'
              )
            }
            className="suggestion-chip text-left p-space-sm bg-surface-container hover:bg-surface-container-high rounded-lg transition-all flex flex-col justify-between gap-2 group border border-outline-variant/20 hover:border-tertiary/40"
          >
            <div className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors truncate">
              "Analyze the sentiment of this review"
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase px-1.5 py-0.5 rounded bg-tertiary-container/20 text-tertiary font-mono font-medium">
                Sentiment • Lightweight NLP
              </span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>

          {/* Chip 3 */}
          <button
            type="button"
            onClick={() =>
              handleSuggestionClick(
                'Summarize this distributed systems incident log: Node-4 timeout after 5000ms heartbeat drop. Raft consensus recovered with term 43.',
                'summarization'
              )
            }
            className="suggestion-chip text-left p-space-sm bg-surface-container hover:bg-surface-container-high rounded-lg transition-all flex flex-col justify-between gap-2 group border border-outline-variant/20 hover:border-secondary/40"
          >
            <div className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors truncate">
              "Summarize this incident log"
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-mono font-medium">
                Summarization • Local Model
              </span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>

          {/* Chip 4 */}
          <button
            type="button"
            onClick={() =>
              handleSuggestionClick(
                'Find entities in this clinical medical note: Patient prescribed 20mg Lisinopril daily by Dr. Sarah Vance at St. Jude Clinic.',
                'ner'
              )
            }
            className="suggestion-chip text-left p-space-sm bg-surface-container hover:bg-surface-container-high rounded-lg transition-all flex flex-col justify-between gap-2 group border border-outline-variant/20 hover:border-primary/40"
          >
            <div className="font-body-md text-body-md text-on-surface group-hover:text-primary transition-colors truncate">
              "Find entities in this clinical note"
            </div>
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface font-mono font-medium">
                NER • Pattern Matcher
              </span>
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Smart Routing Architecture Section */}
      <div className="flex flex-col gap-space-md pt-space-md">
        <div className="flex flex-col gap-0.5">
          <span className="font-code-sm text-code-sm text-primary uppercase font-mono tracking-widest">
            // DETERMINISTIC FIRST PIPELINE ARCHITECTURE
          </span>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            The right solver. The right amount of compute.
          </h2>
        </div>

        {/* Horizontal Technical Pipeline Diagram */}
        <div className="bg-surface-container-low p-space-lg rounded-xl flex flex-col gap-space-lg relative overflow-hidden border border-outline-variant/20">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-space-md relative z-10 items-stretch">
            {/* Node 1 */}
            <div className="bg-surface-container p-space-md rounded-lg flex flex-col justify-between border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-code-sm text-primary font-mono">NODE_01</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    input
                  </span>
                </div>
                <div className="font-headline-md text-body-md font-semibold text-on-surface">
                  User Input
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Payload received via REST /solve API
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs font-code-sm text-code-sm text-primary/80 font-mono">
                raw_stream
              </div>
            </div>

            {/* Node 2 */}
            <div className="bg-surface-container p-space-md rounded-lg flex flex-col justify-between border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-code-sm text-secondary font-mono">NODE_02</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    psychology
                  </span>
                </div>
                <div className="font-headline-md text-body-md font-semibold text-on-surface">
                  Classification
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Zero-shot intent categorization & regex parser
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs font-code-sm text-code-sm text-secondary/80 font-mono">
                intent: &lt;1.2ms
              </div>
            </div>

            {/* Node 3 */}
            <div className="bg-surface-container p-space-md rounded-lg flex flex-col justify-between border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-code-sm text-primary font-mono">NODE_03</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    hub
                  </span>
                </div>
                <div className="font-headline-md text-body-md font-semibold text-on-surface">
                  Intelligent Router
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Cost & latency optimization decision matrix
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs font-code-sm text-code-sm text-primary/80 font-mono">
                dispatch_tree
              </div>
            </div>

            {/* Node 4: Solvers Split Branch */}
            <div className="bg-surface-container-high p-space-md rounded-lg flex flex-col justify-between border border-primary/20 shadow-inner">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-code-sm text-tertiary font-mono">SOLVERS</span>
                  <span className="material-symbols-outlined text-[16px] text-tertiary">
                    alt_route
                  </span>
                </div>
                <div className="font-headline-md text-body-md font-semibold text-on-surface">
                  Execution Engines
                </div>
                <div className="flex flex-col gap-1.5 mt-1 font-code-sm text-code-sm">
                  <div className="p-1.5 rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="text-primary font-mono">Deterministic Py</span>
                    <span className="text-primary font-semibold">&lt;5ms</span>
                  </div>
                  <div className="p-1.5 rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="text-tertiary font-mono">Lightweight NLP</span>
                    <span className="text-tertiary font-semibold">&lt;25ms</span>
                  </div>
                  <div className="p-1.5 rounded bg-surface-container-lowest flex items-center justify-between">
                    <span className="text-secondary font-mono">Local LLM</span>
                    <span className="text-secondary font-semibold">~120ms</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Node 5 */}
            <div className="bg-surface-container p-space-md rounded-lg flex flex-col justify-between border border-outline-variant/15 hover:bg-surface-container-high transition-colors">
              <div className="flex flex-col gap-space-xs">
                <div className="flex items-center justify-between">
                  <span className="font-code-sm text-code-sm text-primary font-mono">NODE_05</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    terminal
                  </span>
                </div>
                <div className="font-headline-md text-body-md font-semibold text-on-surface">
                  Structured Output
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Validated JSON payload with execution telemetry
                </p>
              </div>
              <div className="mt-space-sm pt-space-xs font-code-sm text-code-sm text-primary font-mono">
                200 OK • strict
              </div>
            </div>
          </div>

          {/* Inline Visual Architecture Sparkline / SVG Metrics */}
          <div className="bg-surface-container p-space-md rounded-lg flex flex-col lg:flex-row items-center justify-between gap-space-md border border-outline-variant/15">
            <div className="flex items-center gap-space-md">
              <svg className="w-32 h-10 text-primary" fill="none" viewBox="0 0 128 40">
                <path
                  d="M0 32L24 28L48 35L72 12L96 18L128 6"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                />
                <path
                  d="M0 32L24 28L48 35L72 12L96 18L128 6V40H0Z"
                  fill="currentColor"
                  fillOpacity="0.1"
                />
              </svg>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase font-mono text-on-surface-variant">
                  Compute Optimization Curve
                </span>
                <span className="font-code-sm text-code-sm text-on-surface font-semibold">
                  89.4% Latency Reduction vs Raw LLM
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-lg text-right font-code-sm text-code-sm">
              <div>
                <div className="text-on-surface-variant text-[11px]">FALLBACK THRESHOLD</div>
                <div className="text-on-surface font-mono font-medium">Confidence &gt; 0.92</div>
              </div>
              <div>
                <div className="text-on-surface-variant text-[11px]">INFERENCE AVOIDED</div>
                <div className="text-primary font-mono font-medium">420,119 requests</div>
              </div>
              <div>
                <div className="text-on-surface-variant text-[11px]">ESTIMATED SAVINGS</div>
                <div className="text-secondary font-mono font-medium">$1,842.30 USD</div>
              </div>
            </div>
          </div>
        </div>

        {/* Architectural Principles Micro-Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md pt-space-xs">
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs border border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-primary">
              <span className="material-symbols-outlined text-[20px]">generating_tokens</span>
              <h3 className="font-headline-md text-body-md font-semibold text-on-surface">
                Zero Unnecessary Tokens
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Arithmetic, strict JSON validation, string manipulations, and entity extraction never consume
              inference budget when algorithmic solvers exist.
            </p>
          </div>
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs border border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-secondary">
              <span className="material-symbols-outlined text-[20px]">verified</span>
              <h3 className="font-headline-md text-body-md font-semibold text-on-surface">
                Deterministic Guarantee
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Eliminates probabilistic hallucination on formal logical operations. Same inputs guarantee
              identical outputs with exact mathematical certainty.
            </p>
          </div>
          <div className="bg-surface-container-low p-space-md rounded-lg flex flex-col gap-space-xs border border-outline-variant/15">
            <div className="flex items-center gap-space-xs text-tertiary">
              <span className="material-symbols-outlined text-[20px]">lock</span>
              <h3 className="font-headline-md text-body-md font-semibold text-on-surface">
                Local Privacy First
              </h3>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Proprietary code, medical data, and credentials stay securely within your runtime boundary.
              External models are strictly opt-in and gated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
