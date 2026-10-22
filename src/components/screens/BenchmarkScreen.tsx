import React, { useState, useEffect, useMemo } from 'react';
import {
  fetchBenchmarkSummary,
  fetchBenchmarkDataset,
  runBenchmarkSuite,
} from '../../services/api';
import {
  BenchmarkReport,
  BenchmarkCaseResult,
} from '../../types/solver';

interface BenchmarkScreenProps {
  onNavigateToChat?: () => void;
}

export const BenchmarkScreen: React.FC<BenchmarkScreenProps> = () => {
  const [report, setReport] = useState<BenchmarkReport | null>(null);
  const [datasetInfo, setDatasetInfo] = useState<{
    total_test_cases: number;
    categories_count: number;
    deterministic_cases: number;
    requires_live_llm_cases: number;
    category_breakdown: Record<string, number>;
    categories: string[];
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Runner controls
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [runLimit, setRunLimit] = useState<number | null>(null);
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);

  // Table filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'zero_tokens'>('all');
  const [activeTab, setActiveTab] = useState<'overview' | 'cases' | 'baseline' | 'categories'>('overview');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [sumRes, dsRes] = await Promise.allSettled([
        fetchBenchmarkSummary(),
        fetchBenchmarkDataset(),
      ]);

      if (sumRes.status === 'fulfilled') {
        setReport(sumRes.value);
      }
      if (dsRes.status === 'fulfilled') {
        setDatasetInfo(dsRes.value);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize benchmark screen');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunSuite = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const res = await runBenchmarkSuite({
        live: isLiveMode,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        limit: runLimit === null ? undefined : runLimit,
      });
      setReport(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute benchmark suite');
    } finally {
      setIsRunning(false);
    }
  };

  // Filtered cases
  const filteredCases = useMemo(() => {
    if (!report || !report.cases) return [];
    return report.cases.filter((c: BenchmarkCaseResult) => {
      // Category filter
      if (selectedCategory !== 'all' && c.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter === 'passed' && !c.overall_passed) return false;
      if (statusFilter === 'failed' && c.overall_passed) return false;
      if (statusFilter === 'zero_tokens' && (c.total_tokens > 0 || c.llm_calls > 0)) return false;

      // Text search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesPrompt = c.input.toLowerCase().includes(q);
        const matchesId = c.id.toLowerCase().includes(q);
        const matchesCategory = c.category.toLowerCase().includes(q);
        const matchesSolver = (c.routed_solver || '').toLowerCase().includes(q);
        return matchesPrompt || matchesId || matchesCategory || matchesSolver;
      }
      return true;
    });
  }, [report, selectedCategory, statusFilter, searchQuery]);

  const downloadJson = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniflow_benchmark_${report.mode}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCsv = () => {
    if (!report || !report.cases) return;
    const headers = [
      'ID',
      'Category',
      'Expected Solver',
      'Routed Solver',
      'Routing Correct',
      'Quality Passed',
      'Overall Passed',
      'Elapsed ms',
      'LLM Calls',
      'Total Tokens',
      'Tokens Saved',
      'Prompt',
    ];
    const rows = report.cases.map((c) => [
      c.id,
      c.category,
      c.expected_solver,
      c.routed_solver,
      c.routing_correct,
      c.quality_passed,
      c.overall_passed,
      c.elapsed_ms,
      c.llm_calls,
      c.total_tokens,
      c.tokens_saved,
      `"${c.input.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniflow_benchmark_summary_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading && !report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <span className="material-symbols-outlined text-4xl text-cyan-400 animate-spin">sync</span>
        <p className="text-sm font-mono text-on-surface-variant">Loading Benchmark Suite &amp; Report...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-surface-container-high via-surface-container to-surface-container-low border border-outline-variant/30 p-6 md:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
                <span className="material-symbols-outlined text-2xl">speed</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-headline font-bold text-on-surface tracking-tight">
                Benchmark &amp; Evaluation Engine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {report?.mode === 'live_groq' ? 'LIVE GROQ' : 'DETERMINISTIC OFFLINE'}
              </span>
            </div>
            <p className="text-sm md:text-base text-on-surface-variant max-w-2xl leading-relaxed">
              Reproducible evaluation across 14 diverse task categories measuring routing accuracy,
              sandboxed code correctness, and honest token savings against the All-to-LLM baseline.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadJson}
              disabled={!report}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium border border-outline-variant/40 hover:bg-surface-container-highest transition-colors flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
              title="Download Full JSON Report"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              JSON Report
            </button>
            <button
              onClick={downloadCsv}
              disabled={!report}
              className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium border border-outline-variant/40 hover:bg-surface-container-highest transition-colors flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface disabled:opacity-40"
              title="Download CSV Summary"
            >
              <span className="material-symbols-outlined text-[16px]">table_chart</span>
              CSV Summary
            </button>
            <button
              onClick={handleRunSuite}
              disabled={isRunning}
              className="px-5 py-2.5 rounded-xl font-headline font-semibold text-sm bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-[0_0_20px_rgba(6,182,212,0.35)] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[18px] ${isRunning ? 'animate-spin' : ''}`}>
                {isRunning ? 'sync' : 'play_arrow'}
              </span>
              <span>{isRunning ? 'Evaluating Suite...' : 'Run Benchmark'}</span>
            </button>
          </div>
        </div>

        {/* Runner Control Toolbar */}
        <div className="mt-6 pt-6 border-t border-outline-variant/20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          {/* Category Selector */}
          <div>
            <label className="block text-on-surface-variant/70 mb-1 uppercase tracking-wider text-[10px]">
              Category Filter
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-surface-container-highest/80 border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">All 14 Categories (109 cases)</option>
              {datasetInfo?.categories?.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ')} ({datasetInfo.category_breakdown[cat] || 0})
                </option>
              ))}
            </select>
          </div>

          {/* Limit Selector */}
          <div>
            <label className="block text-on-surface-variant/70 mb-1 uppercase tracking-wider text-[10px]">
              Sample Limit
            </label>
            <select
              value={runLimit === null ? 'all' : String(runLimit)}
              onChange={(e) => setRunLimit(e.target.value === 'all' ? null : Number(e.target.value))}
              className="w-full bg-surface-container-highest/80 border border-outline-variant/30 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:border-cyan-500 transition-colors"
            >
              <option value="all">Full Suite (All cases)</option>
              <option value="5">Quick Test (5 cases)</option>
              <option value="15">Sample (15 cases)</option>
              <option value="30">Extended Sample (30 cases)</option>
            </select>
          </div>

          {/* Mode Switcher */}
          <div>
            <label className="block text-on-surface-variant/70 mb-1 uppercase tracking-wider text-[10px]">
              Execution Mode
            </label>
            <label className="flex items-center gap-2 mt-1 cursor-pointer">
              <input
                type="checkbox"
                checked={isLiveMode}
                onChange={(e) => setIsLiveMode(e.target.checked)}
                className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-400 bg-surface-container border-outline-variant"
              />
              <span className={`text-xs ${isLiveMode ? 'text-amber-400 font-semibold' : 'text-on-surface-variant'}`}>
                {isLiveMode ? 'Live Groq (Consumes Quota)' : 'Offline (0 API Calls)'}
              </span>
            </label>
          </div>

          {/* Last Run Info */}
          <div>
            <label className="block text-on-surface-variant/70 mb-1 uppercase tracking-wider text-[10px]">
              Last Evaluation
            </label>
            <div className="text-on-surface-variant mt-1 truncate">
              {report?.timestamp || 'Never'} ({report?.summary.total_cases || 0} cases)
            </div>
          </div>
        </div>

        {isLiveMode && (
          <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
            <span>
              <strong>Live Mode Activated:</strong> LLM tasks will send actual HTTP requests to Groq.
              Ensure you do not exceed Groq's 1,000 OTPM rate limits. Pacing delays (1.2s) will apply automatically.
            </span>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-200 text-xs font-mono uppercase"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Core KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Metric 1: Completion Rate */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-mono uppercase tracking-wider">Completion Rate</span>
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">verified</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-headline font-bold text-emerald-400">
              {report ? `${report.summary.task_completion_rate_pct}%` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              {report ? `${report.summary.passed_cases} / ${report.summary.total_cases} passed` : 'No data'}
            </div>
          </div>
        </div>

        {/* Metric 2: Routing Accuracy */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-mono uppercase tracking-wider">Routing Accuracy</span>
            <span className="material-symbols-outlined text-cyan-400 text-[18px]">alt_route</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-headline font-bold text-cyan-400">
              {report ? `${report.summary.routing_accuracy_pct}%` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Expected solver dispatch
            </div>
          </div>
        </div>

        {/* Metric 3: Zero-Token Solves */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-mono uppercase tracking-wider">0-Token Solves</span>
            <span className="material-symbols-outlined text-primary text-[18px]">savings</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-headline font-bold text-primary">
              {report ? `${report.summary.zero_token_solve_ratio_pct}%` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              {report ? `${report.summary.deterministic_zero_token_solves} tasks at 0 tokens` : 'Deterministic'}
            </div>
          </div>
        </div>

        {/* Metric 4: Net Token Savings */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-mono uppercase tracking-wider">Tokens Saved</span>
            <span className="material-symbols-outlined text-purple-400 text-[18px]">percent</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-headline font-bold text-purple-400">
              {report ? `${report.baseline_comparison.token_savings_pct}%` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              {report ? `${report.baseline_comparison.estimated_tokens_saved.toLocaleString()} saved` : 'vs All-to-LLM'}
            </div>
          </div>
        </div>

        {/* Metric 5: Median Latency */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-mono uppercase tracking-wider">Median Latency</span>
            <span className="material-symbols-outlined text-amber-400 text-[18px]">timer</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-headline font-bold text-amber-400">
              {report ? `${report.latency_metrics_ms.median_latency_ms}ms` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Avg: {report ? `${report.latency_metrics_ms.average_latency_ms}ms` : '—'}
            </div>
          </div>
        </div>

        {/* Metric 6: P95 Latency */}
        <div className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 flex flex-col justify-between">
          <div className="flex items-center justify-between text-on-surface-variant">
            <span className="text-[11px] font-mono uppercase tracking-wider">P95 Latency</span>
            <span className="material-symbols-outlined text-rose-400 text-[18px]">insights</span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-headline font-bold text-rose-400">
              {report ? `${report.latency_metrics_ms.p95_latency_ms}ms` : '—'}
            </div>
            <div className="text-[11px] text-on-surface-variant font-mono mt-0.5">
              Max: {report ? `${report.latency_metrics_ms.max_latency_ms}ms` : '—'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-outline-variant/30 pb-3">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg text-sm font-headline font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'bg-surface-container-high text-cyan-400 border border-cyan-500/30'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">dashboard</span>
          <span>Overview &amp; Solvers</span>
        </button>
        <button
          onClick={() => setActiveTab('baseline')}
          className={`px-4 py-2 rounded-lg text-sm font-headline font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'baseline'
              ? 'bg-surface-container-high text-purple-400 border border-purple-500/30'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
          <span>Baseline Comparison</span>
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-lg text-sm font-headline font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'bg-surface-container-high text-emerald-400 border border-emerald-500/30'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">category</span>
          <span>Category Breakdown</span>
        </button>
        <button
          onClick={() => setActiveTab('cases')}
          className={`px-4 py-2 rounded-lg text-sm font-headline font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'cases'
              ? 'bg-surface-container-high text-primary border border-primary/30'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">list_alt</span>
          <span>Test Cases Explorer ({filteredCases.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Solvers */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Solver Routing Distribution */}
          <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400 text-[20px]">hub</span>
                Solver Dispatch Distribution
              </h2>
              <span className="text-xs font-mono text-on-surface-variant">
                {Object.keys(report?.solver_distribution || {}).length} Active Solvers
              </span>
            </div>
            <div className="space-y-3 pt-2">
              {report &&
                Object.entries(report.solver_distribution).map(([solver, count]) => {
                  const pct = Math.round((count / report.summary.total_cases) * 100);
                  const isZeroTok = ['python', 'sympy', 'sentiment', 'ner', 'code_debug', 'logical'].includes(solver);
                  return (
                    <div key={solver} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-on-surface font-semibold flex items-center gap-1.5">
                          {solver}
                          {isZeroTok && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/10 text-primary border border-primary/20">
                              0-TOK
                            </span>
                          )}
                        </span>
                        <span className="text-on-surface-variant">
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-surface-container-highest overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isZeroTok ? 'bg-primary' : 'bg-cyan-400'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Token Accounting Summary Card */}
          <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-headline font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-purple-400 text-[20px]">account_balance_wallet</span>
                Token Accounting Breakdown
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-container-highest text-purple-300 border border-purple-500/20">
                {report?.mode === 'live_groq' ? 'ACTUAL METERING' : 'SIMULATED REFERENCE CONTRACT'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20">
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">
                  {report?.mode === 'live_groq' ? 'Actual Input Tokens' : 'Simulated Input Tokens'}
                </div>
                <div className="text-xl font-headline font-bold text-on-surface mt-1">
                  {report?.token_accounting.total_actual_input_tokens.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20">
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">
                  {report?.mode === 'live_groq' ? 'Actual Output Tokens' : 'Simulated Output Tokens'}
                </div>
                <div className="text-xl font-headline font-bold text-on-surface mt-1">
                  {report?.token_accounting.total_actual_output_tokens.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20">
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">
                  {report?.mode === 'live_groq' ? 'Total Actual Tokens' : 'Total Simulated Tokens'}
                </div>
                <div className="text-xl font-headline font-bold text-purple-400 mt-1">
                  {report?.token_accounting.total_actual_llm_tokens.toLocaleString() || 0}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-high/60 border border-outline-variant/20">
                <div className="text-[11px] font-mono text-on-surface-variant uppercase">Cloud LLM Calls</div>
                <div className="text-xl font-headline font-bold text-cyan-400 mt-1">
                  {report?.token_accounting.total_llm_calls || 0}
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-surface-container-highest/40 border border-outline-variant/20 text-xs text-on-surface-variant space-y-1">
              <div className="font-semibold text-on-surface">Deterministic Solvers Token Usage:</div>
              <p>
                Tasks handled by SymPy, AST Arithmetic, Lexical Sentiment, SpaCy NER, and Z3 logic consume
                <strong className="text-primary font-mono"> 0 cloud tokens</strong>. No fake counts or estimated tokens are generated.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Baseline Comparison */}
      {activeTab === 'baseline' && report && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-headline font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-400">compare_arrows</span>
                  {report.baseline_comparison.baseline_name} Comparison
                </h2>
                <p className="text-xs text-on-surface-variant mt-1">
                  {report.baseline_comparison.baseline_definition}
                </p>
              </div>
              <div className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 font-mono text-xs">
                {report.baseline_comparison.token_savings_pct}% Net Reduction
              </div>
            </div>

            {/* Comparison Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                <div className="text-xs font-mono text-on-surface-variant uppercase">Baseline Consumption</div>
                <div className="text-2xl font-headline font-bold text-rose-400">
                  {report.baseline_comparison.baseline_total_tokens.toLocaleString()}
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  All 109 tasks sent directly to Groq Cloud LLM
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                <div className="text-xs font-mono text-on-surface-variant uppercase">CogniFlow Consumption</div>
                <div className="text-2xl font-headline font-bold text-primary">
                  {report.baseline_comparison.cogniflow_actual_tokens.toLocaleString()}
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  Intelligent AST &amp; deterministic routing
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-high border border-outline-variant/20 space-y-2">
                <div className="text-xs font-mono text-on-surface-variant uppercase">Tokens Saved</div>
                <div className="text-2xl font-headline font-bold text-purple-400">
                  +{report.baseline_comparison.estimated_tokens_saved.toLocaleString()}
                </div>
                <div className="text-xs text-on-surface-variant font-mono">
                  {report.baseline_comparison.token_savings_pct}% token cost reduction
                </div>
              </div>
            </div>

            {/* Formula & Latency comparison callout */}
            <div className="p-4 rounded-xl bg-surface-container-highest/40 border border-outline-variant/20 space-y-2 text-xs">
              <div className="font-semibold text-on-surface font-mono">Calculation Methodology:</div>
              <div className="font-mono text-on-surface-variant bg-surface-container-low p-2 rounded border border-outline-variant/30">
                {report.baseline_comparison.calculation_formula}
              </div>
              <div className="flex items-center gap-2 text-emerald-400 pt-1 font-mono">
                <span className="material-symbols-outlined text-[16px]">bolt</span>
                <span>{report.baseline_comparison.latency_speedup_factor}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Category Breakdown */}
      {activeTab === 'categories' && report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(report.category_metrics).map(([cat, metrics]) => {
            const passPct = Math.round((metrics.passed / metrics.total) * 100);
            const routePct = Math.round((metrics.routing_correct / metrics.total) * 100);
            return (
              <div
                key={cat}
                className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-sm text-on-surface capitalize">
                    {cat.replace(/_/g, ' ')}
                  </span>
                  <span
                    className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                      passPct >= 90
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : passPct >= 70
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}
                  >
                    {passPct}% Pass
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs font-mono text-center">
                  <div className="p-2 rounded bg-surface-container-high/60">
                    <div className="text-on-surface-variant text-[10px]">TOTAL</div>
                    <div className="font-bold text-on-surface">{metrics.total}</div>
                  </div>
                  <div className="p-2 rounded bg-surface-container-high/60">
                    <div className="text-on-surface-variant text-[10px]">PASSED</div>
                    <div className="font-bold text-emerald-400">{metrics.passed}</div>
                  </div>
                  <div className="p-2 rounded bg-surface-container-high/60">
                    <div className="text-on-surface-variant text-[10px]">ROUTED</div>
                    <div className="font-bold text-cyan-400">{routePct}%</div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-on-surface-variant flex items-center justify-between pt-1">
                  <span>Tokens Consumed:</span>
                  <span className="font-bold text-on-surface">{metrics.tokens.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Test Cases Explorer */}
      {activeTab === 'cases' && (
        <div className="space-y-4">
          {/* Table Search & Status Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface-container border border-outline-variant/30">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search test cases by prompt, ID, solver..."
                className="w-full bg-surface-container-highest/70 border border-outline-variant/30 rounded-lg pl-9 pr-3 py-1.5 text-xs text-on-surface focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-mono w-full sm:w-auto">
              {(['all', 'passed', 'failed', 'zero_tokens'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                    statusFilter === filter
                      ? 'bg-surface-container-highest text-cyan-400 border border-cyan-500/30 font-semibold'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {filter.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Cases List */}
          <div className="space-y-2">
            {filteredCases.length === 0 ? (
              <div className="p-8 text-center text-on-surface-variant text-sm font-mono bg-surface-container rounded-xl border border-outline-variant/30">
                No benchmark cases match the current filter criteria.
              </div>
            ) : (
              filteredCases.map((caseItem: BenchmarkCaseResult) => {
                const isExpanded = expandedCaseId === caseItem.id;
                return (
                  <div
                    key={caseItem.id}
                    className="p-4 rounded-xl bg-surface-container border border-outline-variant/30 space-y-3 transition-colors hover:border-outline-variant/60"
                  >
                    <div
                      className="flex items-start justify-between gap-4 cursor-pointer"
                      onClick={() => setExpandedCaseId(isExpanded ? null : caseItem.id)}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-xs text-on-surface">
                            {caseItem.id}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface-container-highest text-on-surface-variant">
                            {caseItem.category.replace(/_/g, ' ')}
                          </span>
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                              caseItem.overall_passed
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}
                          >
                            {caseItem.overall_passed ? 'PASS' : 'FAIL'}
                          </span>
                          {caseItem.total_tokens === 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                              0-TOK
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-headline text-on-surface font-medium pt-1">
                          {caseItem.input}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 text-right font-mono text-xs">
                        <div>
                          <div className="text-on-surface font-semibold">{caseItem.elapsed_ms}ms</div>
                          <div className="text-[10px] text-on-surface-variant">
                            {caseItem.total_tokens} toks
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded Case Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-outline-variant/20 space-y-3 text-xs font-mono animate-fadeIn">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="p-2.5 rounded bg-surface-container-high">
                            <span className="text-on-surface-variant text-[10px] block">EXPECTED SOLVER</span>
                            <span className="font-bold text-on-surface">{caseItem.expected_solver}</span>
                          </div>
                          <div className="p-2.5 rounded bg-surface-container-high">
                            <span className="text-on-surface-variant text-[10px] block">ROUTED SOLVER</span>
                            <span className={`font-bold ${caseItem.routing_correct ? 'text-cyan-400' : 'text-rose-400'}`}>
                              {caseItem.routed_solver} {caseItem.routing_correct ? '✓' : '✗'}
                            </span>
                          </div>
                          <div className="p-2.5 rounded bg-surface-container-high">
                            <span className="text-on-surface-variant text-[10px] block">TOKEN METHOD</span>
                            <span className="font-bold text-on-surface">{caseItem.counting_method}</span>
                          </div>
                          <div className="p-2.5 rounded bg-surface-container-high">
                            <span className="text-on-surface-variant text-[10px] block">TOKENS SAVED</span>
                            <span className="font-bold text-purple-400">+{caseItem.tokens_saved}</span>
                          </div>
                        </div>

                        <div className="p-3 rounded bg-surface-container-highest/40 space-y-1">
                          <span className="text-on-surface-variant text-[10px] uppercase font-bold block">
                            Quality Verification Verdict:
                          </span>
                          <span className="text-on-surface">{caseItem.quality_detail}</span>
                        </div>

                        <div className="p-3 rounded bg-surface-container-low border border-outline-variant/30 space-y-1">
                          <span className="text-on-surface-variant text-[10px] uppercase font-bold block">
                            Answer Preview:
                          </span>
                          <span className="text-on-surface/90 font-mono text-[11px] leading-relaxed break-words">
                            {caseItem.answer_preview}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
