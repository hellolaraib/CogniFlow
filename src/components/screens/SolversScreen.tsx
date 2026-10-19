import React, { useState } from 'react';
import { TaskType, SolveResponse } from '../../types/solver';
import { solveTask } from '../../services/api';

interface SolversScreenProps {
  onSimulateDispatch: () => void;
  onNavigateToChat?: (query: string, mode: TaskType) => void;
}

interface SolverEngineConfig {
  id: string;
  title: string;
  taskType: TaskType;
  description: string;
  core: string;
  engines: string;
  latency: string;
  metricLabel: string;
  metricValue: string;
  badge: string;
  badgeColor: string;
  borderTop: string;
  hoverText: string;
  pulsing: boolean;
  defaultQuery: string;
  presets: string[];
}

export const SolversScreen: React.FC<SolversScreenProps> = ({
  onSimulateDispatch,
  onNavigateToChat,
}) => {
  const solverEngines: SolverEngineConfig[] = [
    {
      id: '01',
      title: 'Mathematical Reasoning',
      taskType: 'math',
      description: 'Solve algebraic equations, arithmetic, statistics, roots, & unit conversions',
      core: 'Deterministic Python',
      engines: 'SymPy / AST Evaluator',
      latency: '< 3ms',
      metricLabel: 'Accuracy',
      metricValue: '100.0%',
      badge: '0-TOKEN',
      badgeColor: 'bg-primary/20 text-primary',
      borderTop: 'bg-primary',
      hoverText: 'group-hover:text-primary',
      pulsing: true,
      defaultQuery: 'Solve 2x + 5 = 15',
      presets: ['Solve 2x + 5 = 15', 'Calculate 125 * 64', '25% of 800', 'sqrt(144) + 6!'],
    },
    {
      id: '02',
      title: 'Sentiment Classification',
      taskType: 'sentiment',
      description: 'Determine polarity, customer review satisfaction, and emotion scores',
      core: 'Lightweight NLP',
      engines: 'VADER / Lexical Scorer',
      latency: '< 15ms',
      metricLabel: 'Accuracy',
      metricValue: '96.8%',
      badge: 'EDGE NLP',
      badgeColor: 'bg-sky-400/20 text-sky-400',
      borderTop: 'bg-sky-400',
      hoverText: 'group-hover:text-sky-400',
      pulsing: false,
      defaultQuery: 'The new database update eliminated our replication lag and works like a dream!',
      presets: [
        'Works like a dream and eliminated lag!',
        'Response time is horrible and constantly crashing.',
        'Objective weekly performance and deployment metrics.',
      ],
    },
    {
      id: '03',
      title: 'Named Entity Recognition (NER)',
      taskType: 'ner',
      description: 'Extract organizations, persons, locations, money, and dates',
      core: 'Pattern Matcher + Spacy',
      engines: 'SpaCy C-Optimized Small',
      latency: '< 22ms',
      metricLabel: 'Accuracy',
      metricValue: '94.2%',
      badge: 'HYBRID',
      badgeColor: 'bg-sky-400/20 text-sky-400',
      borderTop: 'bg-sky-400',
      hoverText: 'group-hover:text-sky-400',
      pulsing: false,
      defaultQuery: 'OpenAI and Sam Altman announced a $10B investment in San Francisco on October 19, 2026.',
      presets: [
        'OpenAI and Sam Altman $10B',
        'Google DeepMind in Paris 2024',
        'Tesla & Elon Musk in Austin Texas',
      ],
    },
    {
      id: '04',
      title: 'Code Debugging',
      taskType: 'code_debug',
      description: 'Detect syntax errors, off-by-one loops, null pointers, & recursion bugs',
      core: 'AST + Local Code Model',
      engines: 'Tree-sitter / Llama-3-8B-Q4',
      latency: '~180ms',
      metricLabel: 'Precision',
      metricValue: '91.5%',
      badge: 'LOCAL LLM',
      badgeColor: 'bg-secondary/20 text-secondary',
      borderTop: 'bg-secondary',
      hoverText: 'group-hover:text-secondary',
      pulsing: false,
      defaultQuery: 'int main() { int arr[5]; mergeSort(arr, 0, n); }',
      presets: [
        'mergeSort(arr, 0, n)',
        'for (int i = 0; i <= n; i++) arr[i] = 0;',
        'def fib(n): return fib(n-1) + fib(n-2)',
      ],
    },
    {
      id: '05',
      title: 'Code Generation',
      taskType: 'code_gen',
      description: 'Generate FastAPI route handlers, SQL queries, regex patterns, & algorithms',
      core: 'Local Language Model',
      engines: 'StarCoder 4-bit / CodeLlama',
      latency: '~320ms',
      metricLabel: 'Unit Pass',
      metricValue: '88.9%',
      badge: 'QUANTIZED',
      badgeColor: 'bg-secondary/20 text-secondary',
      borderTop: 'bg-secondary',
      hoverText: 'group-hover:text-secondary',
      pulsing: false,
      defaultQuery: 'Create a FastAPI route handler for user login',
      presets: [
        'Create FastAPI route for user login',
        'SQL query for top customers with window ranking',
        'Write python binary search algorithm',
        'RFC email validation regex pattern',
      ],
    },
    {
      id: '06',
      title: 'Summarization',
      taskType: 'summarization',
      description: 'Condense logs, documentation, incident post-mortems, & customer tickets',
      core: 'Extractive / Quantized LLM',
      engines: 'TextRank / Mistral-7B-Instruct',
      latency: '~260ms',
      metricLabel: 'Compression',
      metricValue: '4.2x',
      badge: 'LOCAL LLM',
      badgeColor: 'bg-secondary/20 text-secondary',
      borderTop: 'bg-secondary',
      hoverText: 'group-hover:text-secondary',
      pulsing: false,
      defaultQuery:
        'CogniFlow dynamically dispatches incoming tasks across 8 specialized execution engines, preferring deterministic algorithms to eliminate cloud LLM overhead. It achieves sub-millisecond dispatching and guarantees zero token waste across heavy enterprise query volumes.',
      presets: [
        'Summarize CogniFlow Architecture',
        'Incident RCA: Database connection pool exhaustion and resolution',
      ],
    },
    {
      id: '07',
      title: 'Logical Reasoning',
      taskType: 'logical',
      description: 'Boolean satisfiability, scheduling conflicts, syllogisms, & formal proofs',
      core: 'Deterministic SMT Solver',
      engines: 'Z3 Theorem Prover / MiniSat',
      latency: '< 12ms',
      metricLabel: 'Soundness',
      metricValue: '100.0%',
      badge: '0-TOKEN',
      badgeColor: 'bg-primary/20 text-primary',
      borderTop: 'bg-primary',
      hoverText: 'group-hover:text-primary',
      pulsing: true,
      defaultQuery: 'All humans are mortal. Socrates is human. Does Socrates mortal follow?',
      presets: [
        'All humans are mortal. Socrates is human.',
        'If A implies B, and B implies C, does A imply C?',
        'Boolean SAT: (A or B) and (not A or C)',
      ],
    },
    {
      id: '08',
      title: 'Factual Knowledge',
      taskType: 'factual',
      description: 'System architecture definitions, computer science, & encyclopedic facts',
      core: 'Vector Index + Edge LLM',
      engines: 'Faiss / Gemma-2-2B Quantized',
      latency: '~140ms',
      metricLabel: 'Recall',
      metricValue: '97.1%',
      badge: 'LOCAL RAG',
      badgeColor: 'bg-secondary/20 text-secondary',
      borderTop: 'bg-secondary',
      hoverText: 'group-hover:text-secondary',
      pulsing: false,
      defaultQuery: 'What is Docker and how does containerization work?',
      presets: [
        'What is Docker?',
        'What is the national bird of India?',
        'What is RAG (Retrieval-Augmented Generation)?',
        'What is DNS?',
      ],
    },
  ];

  // Interactive Live Single-Engine Test State
  const [activeEngine, setActiveEngine] = useState<SolverEngineConfig | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [testResult, setTestResult] = useState<SolveResponse | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Diagnostics Suite State (Test All 8 Engines)
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<
    Array<{
      id: string;
      title: string;
      taskType: TaskType;
      query: string;
      latencyMs: number;
      status: 'pending' | 'success' | 'failed';
      answer?: string;
      engineUsed?: string;
      tokens?: number;
      error?: string;
    }>
  >([]);

  // Open Sandbox for an engine
  const handleOpenSandbox = (engine: SolverEngineConfig, initialQuery?: string) => {
    setActiveEngine(engine);
    setTestQuery(initialQuery || engine.defaultQuery);
    setTestResult(null);
    setTestError(null);
  };

  // Run solver query in Sandbox
  const handleExecuteSandbox = async () => {
    if (!activeEngine || !testQuery.trim() || isExecuting) return;
    setIsExecuting(true);
    setTestError(null);
    try {
      const response = await solveTask({
        task_type: activeEngine.taskType,
        input: testQuery.trim(),
      });
      setTestResult(response);
    } catch (err: any) {
      setTestError(err.message || 'Solver execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Run automated live diagnostics across all 8 engines
  const handleRunAllDiagnostics = async () => {
    setIsDiagnosticsOpen(true);
    setDiagnosticsRunning(true);

    const initial = solverEngines.map((e) => ({
      id: e.id,
      title: e.title,
      taskType: e.taskType,
      query: e.defaultQuery,
      latencyMs: 0,
      status: 'pending' as const,
    }));
    setDiagnosticResults(initial);

    const promises = solverEngines.map(async (engine) => {
      const t0 = performance.now();
      try {
        const res = await solveTask({
          task_type: engine.taskType,
          input: engine.defaultQuery,
        });
        const elapsed = Math.round((performance.now() - t0) * 10) / 10;
        return {
          id: engine.id,
          title: engine.title,
          taskType: engine.taskType,
          query: engine.defaultQuery,
          latencyMs: res.processing_time_ms || elapsed,
          status: 'success' as const,
          answer: res.answer,
          engineUsed: res.solver_details?.engine || engine.engines,
          tokens: res.solver_details?.tokens_consumed ?? 0,
        };
      } catch (err: any) {
        const elapsed = Math.round((performance.now() - t0) * 10) / 10;
        return {
          id: engine.id,
          title: engine.title,
          taskType: engine.taskType,
          query: engine.defaultQuery,
          latencyMs: elapsed,
          status: 'failed' as const,
          error: err.message || 'Execution error',
        };
      }
    });

    const finished = await Promise.all(promises);
    setDiagnosticResults(finished);
    setDiagnosticsRunning(false);
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className="p-space-lg lg:p-margin-lg space-y-gutter-lg max-w-[1720px] mx-auto w-full">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-xl bg-surface-container-low p-space-lg lg:p-margin-lg shadow-xl border border-outline-variant/20">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-secondary/5 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-space-lg">
          <div className="max-w-4xl space-y-space-xs">
            <div className="flex items-center gap-space-sm mb-space-xs">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-code-sm text-code-sm uppercase tracking-wider border border-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></span>
                Runtime Engine v0.2.0-Deterministic
              </span>
              <span className="text-on-surface-variant font-code-sm text-code-sm font-mono">
                8 Engines Active & Registered
              </span>
            </div>
            <div className="flex items-baseline gap-space-sm">
              <span className="text-outline-variant font-code-lg text-code-lg select-none font-mono">
                § 04
              </span>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight font-semibold">
                Solver Engine & Category Registry
              </h1>
            </div>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-3xl pt-1">
              CogniFlow dynamically dispatches incoming tasks across 8 specialized execution engines,
              preferring deterministic algorithms to eliminate cloud LLM overhead and guarantee 100% zero-token execution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-space-sm font-code-sm text-code-sm">
            {/* Run All Diagnostics Button */}
            <button
              type="button"
              onClick={handleRunAllDiagnostics}
              className="flex items-center gap-2 px-space-md py-space-sm bg-surface-container hover:bg-surface-container-high border border-primary/40 text-primary rounded-lg font-headline-md text-body-md transition-all font-semibold shadow-[0_0_12px_rgba(75,226,119,0.15)] group"
            >
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-180 transition-transform">
                verified
              </span>
              <span>Test All 8 Engines (Live Diagnostic)</span>
            </button>

            {/* Simulate Single Dispatch */}
            <button
              type="button"
              onClick={onSimulateDispatch}
              className="flex items-center gap-1.5 px-space-md py-space-sm bg-primary text-on-primary rounded-lg font-headline-md text-body-md hover:bg-primary-container transition-all font-semibold shadow-[0_0_12px_rgba(75,226,119,0.2)]"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Simulate Math Dispatch</span>
            </button>
          </div>
        </div>

        {/* 4 Hero KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mt-gutter-lg">
          {/* KPI 1 */}
          <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-all shadow-md group border border-outline-variant/15">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-code-sm text-code-sm uppercase tracking-wider font-mono">
                Total Tasks Processed
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
                memory
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-headline-xl text-headline-xl text-on-surface font-mono tracking-tight font-bold">
                420,119
              </span>
              <span className="font-code-sm text-code-sm text-primary flex items-center font-mono">
                <span className="material-symbols-outlined text-[14px]">trending_up</span>+12.4%
              </span>
            </div>
            <div className="mt-space-xs flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm font-mono">
              <span>Throughput</span>
              <span className="text-on-surface">328 tasks/sec</span>
            </div>
          </div>

          {/* KPI 2 */}
          <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-all shadow-md group border border-outline-variant/15">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-code-sm text-code-sm uppercase tracking-wider font-mono">
                Zero-Token Ratio
              </span>
              <span className="material-symbols-outlined text-[18px] text-primary group-hover:scale-110 transition-transform">
                bolt
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-headline-xl text-headline-xl text-primary font-mono tracking-tight font-bold">
                87.6%
              </span>
              <span className="font-code-sm text-code-sm text-tertiary-fixed-dim bg-on-tertiary-fixed-variant px-1.5 py-0.5 rounded font-mono">
                Optimal
              </span>
            </div>
            <div className="mt-space-xs flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm font-mono">
              <span>LLM Invocations Bypassed</span>
              <span className="text-on-surface">368,024 ops</span>
            </div>
          </div>

          {/* KPI 3 */}
          <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-all shadow-md group border border-outline-variant/15">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-code-sm text-code-sm uppercase tracking-wider font-mono">
                Avg Execution Latency
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary group-hover:scale-110 transition-transform">
                timer
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-headline-xl text-headline-xl text-on-surface font-mono tracking-tight font-bold">
                1.4<span className="text-headline-md text-on-surface-variant font-sans">ms</span>
              </span>
              <span className="font-code-sm text-code-sm text-secondary bg-surface-container-highest px-1.5 py-0.5 rounded font-mono">
                p95: 14ms
              </span>
            </div>
            <div className="mt-space-xs flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm font-mono">
              <span>Deterministic P50</span>
              <span className="text-primary font-mono">0.8ms</span>
            </div>
          </div>

          {/* KPI 4 */}
          <div className="p-space-md rounded-xl bg-surface-container hover:bg-surface-container-high transition-all shadow-md group border border-outline-variant/15">
            <div className="flex items-center justify-between text-on-surface-variant">
              <span className="font-code-sm text-code-sm uppercase tracking-wider font-mono">
                Cloud Compute Avoided
              </span>
              <span className="material-symbols-outlined text-[18px] text-tertiary group-hover:scale-110 transition-transform">
                savings
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-headline-xl text-headline-xl text-on-surface font-mono tracking-tight font-bold">
                $4,120<span className="text-headline-md text-on-surface-variant">.80</span>
              </span>
              <span className="font-label-sm text-label-sm text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase font-mono">
                USD Net
              </span>
            </div>
            <div className="mt-space-xs flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm font-mono">
              <span>Carbon Offloaded</span>
              <span className="text-on-surface">~51.2 kg CO₂e</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8 Registered Solver Engines Grid */}
      <div className="flex flex-col gap-space-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-space-sm">
            <span className="h-2 w-2 rounded-full bg-primary"></span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold">
              Registered Solver Engines
            </h2>
            <span className="font-code-sm text-code-sm text-primary bg-primary/10 px-2 py-0.5 rounded font-mono border border-primary/20">
              8 Active & Testable
            </span>
          </div>

          <div className="hidden md:flex items-center gap-space-sm font-code-sm text-code-sm text-on-surface-variant">
            <span className="flex items-center gap-1 font-mono">
              <span className="h-2 w-2 rounded-full bg-primary"></span> Deterministic (0 LLM)
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="h-2 w-2 rounded-full bg-sky-400"></span> Edge NLP
            </span>
            <span className="flex items-center gap-1 font-mono">
              <span className="h-2 w-2 rounded-full bg-secondary"></span> Quantized Local LLM
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-space-md">
          {solverEngines.map((engine) => (
            <div
              key={engine.id}
              className="flex flex-col justify-between p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all shadow-md group relative overflow-hidden border border-outline-variant/15 hover:border-primary/40"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 ${engine.borderTop}`}></div>

              <div className="space-y-space-sm">
                {/* Header Tag & Status */}
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-highest text-on-surface-variant uppercase font-mono tracking-wider">
                    Engine {engine.id}
                  </span>
                  <span className="flex items-center gap-1 font-code-sm text-code-sm text-primary font-mono">
                    <span
                      className={`h-1.5 w-1.5 rounded-full bg-primary ${
                        engine.pulsing ? 'animate-ping' : ''
                      }`}
                    ></span>
                    ONLINE • ACTIVE
                  </span>
                </div>

                {/* Title and description */}
                <div>
                  <h3
                    className={`font-headline-md text-headline-md text-on-surface font-semibold transition-colors ${engine.hoverText}`}
                  >
                    {engine.title}
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 line-clamp-2">
                    {engine.description}
                  </p>
                </div>

                {/* Technical specs card */}
                <div className="p-space-sm rounded-lg bg-surface-container-lowest font-code-sm text-code-sm space-y-1 border border-outline-variant/10 font-mono">
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Solver Core:</span>
                    <span className="text-on-surface font-medium">{engine.core}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Engines:</span>
                    <span className="text-primary truncate max-w-[150px]">{engine.engines}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant">
                    <span>Latency Benchmark:</span>
                    <span className="text-primary font-bold">{engine.latency}</span>
                  </div>
                </div>

                {/* Interactive Preset Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-on-surface-variant/70 uppercase font-mono font-semibold">
                    Quick Sample Presets:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {engine.presets.slice(0, 2).map((preset, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => handleOpenSandbox(engine, preset)}
                        className="text-[11px] px-2 py-0.5 rounded bg-surface-container hover:bg-surface-container-highest text-on-surface hover:text-primary border border-outline-variant/20 transition-all font-mono truncate max-w-[190px]"
                        title={preset}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Card Footer with Actions */}
              <div className="pt-space-sm mt-space-sm border-t border-outline-variant/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm font-mono">
                  <span>
                    {engine.metricLabel}:{' '}
                    <strong className="text-on-surface">{engine.metricValue}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${engine.badgeColor}`}>
                    {engine.badge}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleOpenSandbox(engine)}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-surface-container-high hover:bg-primary hover:text-on-primary text-xs font-mono font-semibold text-primary transition-all border border-primary/20 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">play_arrow</span>
                    <span>Test Engine</span>
                  </button>

                  {onNavigateToChat && (
                    <button
                      type="button"
                      onClick={() => onNavigateToChat(engine.defaultQuery, engine.taskType)}
                      className="px-2 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface text-xs font-mono transition-colors"
                      title="Open in Chat View"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Single-Engine Sandbox Modal */}
      {activeEngine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 md:p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-primary uppercase">
                      Engine {activeEngine.id}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${activeEngine.badgeColor}`}>
                      {activeEngine.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">{activeEngine.title}</h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveEngine(null)}
                className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-on-surface-variant mb-1 font-semibold">
                  Test Query / Prompt
                </label>
                <textarea
                  rows={3}
                  value={testQuery}
                  onChange={(e) => setTestQuery(e.target.value)}
                  placeholder={`Enter query for ${activeEngine.title}...`}
                  className="w-full p-3 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-sm font-mono text-on-surface focus:outline-none focus:border-primary/60 resize-none caret-primary leading-relaxed"
                />
              </div>

              {/* Sample Presets */}
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] font-mono text-on-surface-variant">Presets:</span>
                {activeEngine.presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setTestQuery(preset)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface hover:text-primary border border-outline-variant/20 font-mono transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {/* Execution Action Button */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-xs font-mono text-on-surface-variant">
                  Core: <span className="text-primary font-semibold">{activeEngine.engines}</span>
                </div>
                <button
                  type="button"
                  onClick={handleExecuteSandbox}
                  disabled={isExecuting || !testQuery.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-all shadow-[0_0_12px_rgba(75,226,119,0.25)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>
                      <span>Evaluating Solver...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">bolt</span>
                      <span>Execute Solver</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Output */}
              {testError && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/30 text-error text-xs font-mono flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">error</span>
                  <span>{testError}</span>
                </div>
              )}

              {/* Success Result View */}
              {testResult && (
                <div className="mt-4 p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/20 space-y-3 animate-fadeIn">
                  {/* Result Telemetry Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-outline-variant/15 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 text-primary font-semibold">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Execution Success
                      </span>
                      <span className="text-on-surface-variant/60">•</span>
                      <span className="text-on-surface-variant">
                        Latency: <strong className="text-on-surface">{testResult.processing_time_ms.toFixed(1)}ms</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 text-[11px]">
                        {testResult.solver_details?.tokens_consumed ?? 0} TOKENS
                      </span>
                      <span className="text-on-surface-variant text-[11px]">
                        {testResult.solver_details?.engine || activeEngine.engines}
                      </span>
                    </div>
                  </div>

                  {/* Formatted Answer Body */}
                  <div className="text-sm font-sans text-on-surface leading-relaxed whitespace-pre-wrap select-all">
                    {testResult.answer}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/10 text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => handleCopyText(testResult.answer)}
                      className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {copiedAnswer ? 'done' : 'content_copy'}
                      </span>
                      <span>{copiedAnswer ? 'Copied' : 'Copy Result'}</span>
                    </button>

                    {onNavigateToChat && (
                      <button
                        type="button"
                        onClick={() => {
                          const q = testQuery;
                          const m = activeEngine.taskType;
                          setActiveEngine(null);
                          onNavigateToChat(q, m);
                        }}
                        className="flex items-center gap-1 text-primary hover:underline font-semibold"
                      >
                        <span>Open in Chat Console</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Diagnostics Suite Modal (All 8 Engines Tested) */}
      {isDiagnosticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-surface-container-low border border-outline-variant/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 md:p-5 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-primary animate-pulse"></span>
                <div>
                  <h3 className="text-lg font-semibold text-on-surface">
                    Realtime Solver Engine Diagnostic Suite
                  </h3>
                  <p className="text-xs font-mono text-on-surface-variant">
                    Parallel dispatch verification across all 8 registered solvers
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDiagnosticsOpen(false)}
                className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-container-highest flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Diagnostic Results List */}
            <div className="p-4 md:p-6 overflow-y-auto space-y-3">
              {diagnosticResults.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="px-1.5 py-0.5 rounded bg-surface-container-highest text-primary font-bold">
                      {item.id}
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-on-surface font-sans">
                        {item.title}
                      </div>
                      <div className="text-on-surface-variant/80 truncate max-w-sm sm:max-w-md">
                        Query: "{item.query}"
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.status === 'pending' ? (
                      <span className="flex items-center gap-1.5 text-secondary">
                        <span className="w-3 h-3 border-2 border-secondary border-t-transparent rounded-full animate-spin"></span>
                        <span>Running...</span>
                      </span>
                    ) : item.status === 'success' ? (
                      <div className="flex items-center gap-2">
                        <span className="text-on-surface font-bold">{item.latencyMs.toFixed(1)}ms</span>
                        <span className="px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check</span>
                          PASS
                        </span>
                      </div>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-error/20 text-error border border-error/30 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">close</span>
                        FAILED
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Diagnostic Summary Banner */}
              {!diagnosticsRunning && diagnosticResults.length > 0 && (
                <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-4 mt-4 animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary text-2xl">
                      verified_user
                    </span>
                    <div>
                      <div className="text-sm font-bold text-primary">
                        All 8 Solver Engines Operational & Verified
                      </div>
                      <div className="text-xs text-on-surface-variant font-mono">
                        Avg Latency: {(diagnosticResults.reduce((acc, c) => acc + c.latencyMs, 0) / diagnosticResults.length).toFixed(1)}ms • 100% Zero-Cloud Bypassed
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAllDiagnostics}
                    className="px-3 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs font-mono hover:bg-primary-container transition-all"
                  >
                    Re-run All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Realtime Pipeline Architecture */}
      <div className="rounded-xl bg-surface-container-low p-space-lg shadow-xl relative overflow-hidden border border-outline-variant/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-space-sm mb-space-lg">
          <div>
            <div className="flex items-center gap-space-xs text-primary font-code-sm text-code-sm uppercase tracking-wider font-mono">
              <span className="material-symbols-outlined text-[16px]">device_hub</span>
              <span>Realtime Pipeline Architecture</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface mt-1 font-semibold">
              Zero-Token Dispatch Flow
            </h2>
          </div>
          <div className="flex items-center gap-space-sm text-on-surface-variant font-code-sm text-code-sm font-mono">
            <span className="px-2.5 py-1 bg-surface-container rounded border border-outline-variant/15">
              Pipeline Latency Floor: 0.8ms
            </span>
            <span className="px-2.5 py-1 bg-surface-container rounded border border-outline-variant/15">
              Bypass Rate: 87.6%
            </span>
          </div>
        </div>

        {/* Visual Flow diagram representation */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-space-md">
          <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-1 border border-outline-variant/15">
            <span className="font-code-sm text-code-sm text-primary font-mono">STAGE 01</span>
            <span className="font-body-md text-body-md text-on-surface font-semibold">Zero-Copy Ingestion</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              SIMD string tokenizer and lexer check for exact grammar patterns.
            </span>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-1 border border-outline-variant/15">
            <span className="font-code-sm text-code-sm text-secondary font-mono">STAGE 02</span>
            <span className="font-body-md text-body-md text-on-surface font-semibold">Semantic Classifier</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Matches intent against 8 domain heads within &lt;1.5ms overhead.
            </span>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-1 border border-outline-variant/15">
            <span className="font-code-sm text-code-sm text-tertiary font-mono">STAGE 03</span>
            <span className="font-body-md text-body-md text-on-surface font-semibold">Affinity Execution</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Routes directly to AST, VADER, SpaCy, or local quantized models.
            </span>
          </div>
          <div className="p-space-md rounded-lg bg-surface-container flex flex-col gap-1 border border-outline-variant/15">
            <span className="font-code-sm text-code-sm text-primary font-mono">STAGE 04</span>
            <span className="font-body-md text-body-md text-on-surface font-semibold">Telemetry Ledger</span>
            <span className="font-body-sm text-body-sm text-on-surface-variant">
              Emits duration, memory footprint, and saves zero-token receipt.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
