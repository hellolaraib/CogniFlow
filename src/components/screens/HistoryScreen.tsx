import React, { useState, useMemo } from 'react';
import { TaskHistoryItem, TaskType } from '../../types/solver';

interface HistoryScreenProps {
  history: TaskHistoryItem[];
  onClearHistory: () => void;
  onRerunTask: (query: string, taskType: TaskType) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onClearHistory,
  onRerunTask,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [solverFilter, setSolverFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    history[0]?.id || 'tsk_8f99c01d'
  );
  const [copiedId, setCopiedId] = useState(false);

  // Filter logic
  const filteredTasks = useMemo(() => {
    return history.filter((task) => {
      const matchesSearch =
        searchTerm === '' ||
        task.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.engineName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' ||
        task.taskType.toLowerCase() === categoryFilter.toLowerCase();

      const matchesSolver =
        solverFilter === 'all' ||
        task.solver.toLowerCase() === solverFilter.toLowerCase();

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === '200' && task.statusCode === 200) ||
        (statusFilter === 'error' && task.statusCode !== 200);

      return matchesSearch && matchesCategory && matchesSolver && matchesStatus;
    });
  }, [history, searchTerm, categoryFilter, solverFilter, statusFilter]);

  const selectedTask =
    history.find((t) => t.id === selectedTaskId) || filteredTasks[0] || history[0];

  const handleExportJsonl = () => {
    const jsonlContent = filteredTasks
      .map((t) => JSON.stringify(t))
      .join('\n');
    const blob = new Blob([jsonlContent], { type: 'application/x-ndjson' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogniflow_history_${new Date().toISOString().slice(0, 10)}.jsonl`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyTraceId = () => {
    if (selectedTask) {
      navigator.clipboard.writeText(selectedTask.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setSolverFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className="relative w-full overflow-hidden px-space-lg py-space-lg bg-surface">
      {/* Glow effects */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] rounded-full bg-secondary/5 blur-[100px] pointer-events-none"></div>

      <div className="max-w-[1720px] mx-auto flex flex-col gap-space-lg relative z-10">
        {/* Top Metric Banner & Header Block */}
        <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-space-md bg-surface-container-low p-space-md rounded-xl border border-outline-variant/20 shadow-md">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-space-sm">
              <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold">
                Task Execution History
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-highest text-primary font-code-sm text-code-sm border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                LIVE LOG STREAM
              </span>
            </div>
            <p className="font-code-md text-code-md text-on-surface-variant flex items-center gap-2 font-mono">
              <span>{history.length} Executed Tasks</span>
              <span className="text-outline-variant">•</span>
              <span className="text-primary font-medium">89.2% Local / Zero-Token Deterministic</span>
              <span className="text-outline-variant">•</span>
              <span className="text-on-surface-variant/80">Avg Latency: 44.8ms</span>
            </p>
          </div>

          {/* Telemetry Pill Indicators */}
          <div className="flex items-center flex-wrap gap-space-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/20">
              <span className="material-symbols-outlined text-[16px] text-primary">memory</span>
              <div className="flex flex-col leading-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant">ENGINE CACHE</span>
                <span className="font-code-sm text-code-sm text-on-surface font-semibold font-mono">
                  94.1% HIT
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/20">
              <span className="material-symbols-outlined text-[16px] text-secondary">token</span>
              <div className="flex flex-col leading-none">
                <span className="font-label-sm text-label-sm text-on-surface-variant">SAVED TOKENS</span>
                <span className="font-code-sm text-code-sm text-secondary font-semibold font-mono">
                  418.5k tk
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleExportJsonl}
                className="h-9 px-3 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface flex items-center gap-1.5 font-code-sm text-code-sm transition-all border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export JSONL</span>
              </button>
              <button
                type="button"
                onClick={onClearHistory}
                className="h-9 px-3 rounded-lg bg-surface-container-highest hover:bg-error-container hover:text-on-error-container text-on-surface-variant flex items-center gap-1.5 font-code-sm text-code-sm transition-all border border-outline-variant/20"
              >
                <span className="material-symbols-outlined text-[16px]">mop</span>
                <span>Clear Cache</span>
              </button>
            </div>
          </div>
        </section>

        {/* Advanced Filter & Search Terminal Bar */}
        <section className="flex flex-col gap-space-sm bg-surface-container p-space-md rounded-xl border border-outline-variant/20">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center">
            {/* Search Input */}
            <div className="md:col-span-4 relative flex items-center">
              <span className="material-symbols-outlined absolute left-3 text-[18px] text-on-surface-variant/70">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search prompt, query ID (e.g. tsk_8f99c01d)..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-surface-container-lowest text-on-surface font-code-md text-code-md placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary caret-primary border border-outline-variant/20"
              />
            </div>

            {/* Category Filter */}
            <div className="md:col-span-2 relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-code-sm text-code-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary pr-8 border border-outline-variant/20 font-mono"
              >
                <option value="all">Category: All</option>
                <option value="math">Mathematical</option>
                <option value="ner">Entity Recognition</option>
                <option value="sentiment">Sentiment Analysis</option>
                <option value="code_debug">Code Debugging</option>
                <option value="logical">Logical Reasoning</option>
                <option value="summarization">Summarization</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[16px] text-on-surface-variant">
                expand_more
              </span>
            </div>

            {/* Solver Filter */}
            <div className="md:col-span-2 relative">
              <select
                value={solverFilter}
                onChange={(e) => setSolverFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-code-sm text-code-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary pr-8 border border-outline-variant/20 font-mono"
              >
                <option value="all">Solver: All Engines</option>
                <option value="python">Python Deterministic</option>
                <option value="regex">Lightweight Regex/Spacy</option>
                <option value="distilbert">Local DistilBERT</option>
                <option value="llm">Local LLM</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[16px] text-on-surface-variant">
                tune
              </span>
            </div>

            {/* Status Filter */}
            <div className="md:col-span-2 relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-code-sm text-code-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary pr-8 border border-outline-variant/20 font-mono"
              >
                <option value="all">Status: All (200, Cached, Err)</option>
                <option value="200">200 OK (Clean)</option>
                <option value="error">Error Only</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[16px] text-on-surface-variant">
                filter_list
              </span>
            </div>

            {/* Time Filter */}
            <div className="md:col-span-2 relative">
              <select className="w-full h-10 px-3 bg-surface-container-lowest text-on-surface font-code-sm text-code-sm rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary pr-8 border border-outline-variant/20 font-mono">
                <option value="24h">Range: Last 24 Hours</option>
                <option value="6h">Last 6 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="all">Full Retention (30d)</option>
              </select>
              <span className="material-symbols-outlined pointer-events-none absolute right-2.5 top-2.5 text-[16px] text-on-surface-variant">
                schedule
              </span>
            </div>
          </div>

          {/* Filter Tags Row */}
          <div className="flex items-center justify-between pt-1 flex-wrap gap-2 text-on-surface-variant">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant/60">
                ACTIVE FILTERS:
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high font-code-sm text-code-sm text-primary border border-outline-variant/20 font-mono">
                route:{categoryFilter}
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-surface-container-high font-code-sm text-code-sm text-on-surface border border-outline-variant/20 font-mono">
                window:24h
              </span>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-code-sm text-primary underline underline-offset-2 ml-1 hover:text-primary-fixed"
              >
                Reset Filters
              </button>
            </div>
            <span className="font-code-sm text-code-sm text-on-surface-variant/70 font-mono">
              Showing <span className="text-on-surface font-bold">{filteredTasks.length}</span> of{' '}
              {history.length} executions
            </span>
          </div>
        </section>

        {/* Main Layout: Table Area & Inspector split-panel view */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg items-start">
          {/* Table Column (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-space-sm">
            {/* Table Header Strip */}
            <div className="grid grid-cols-12 px-space-md py-2 text-on-surface-variant/70 font-label-sm text-label-sm uppercase tracking-wider bg-surface-container-low rounded-t-lg select-none border border-outline-variant/20">
              <div className="col-span-5 flex items-center gap-1">Task Query & Trace ID</div>
              <div className="col-span-3 flex items-center gap-1">Target Engine</div>
              <div className="col-span-2 text-right">Metrics</div>
              <div className="col-span-2 text-right">Time & Code</div>
            </div>

            {/* Execution Rows Container */}
            <div className="flex flex-col gap-1.5">
              {filteredTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-space-xl bg-surface-container-low rounded-xl text-center border border-outline-variant/20">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
                    manage_search
                  </span>
                  <span className="font-headline-md text-headline-md text-on-surface">
                    No matching execution traces
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface-variant/70 max-w-sm mt-1">
                    Adjust your filters or search keywords to view execution logs.
                  </p>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isSelected = selectedTask?.id === task.id;
                  const isMath = task.taskType === 'math';
                  const isLLM = task.solver === 'llm';

                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className={`task-row group cursor-pointer p-space-md rounded-xl bg-surface-container-low hover:bg-surface-container transition-all relative overflow-hidden border ${
                        isSelected
                          ? 'border-primary/40 bg-surface-container shadow-[0_0_12px_rgba(75,226,119,0.1)]'
                          : 'border-outline-variant/15'
                      }`}
                    >
                      {/* Left color bar */}
                      <div
                        className={`absolute left-0 top-0 bottom-0 w-1 ${
                          isMath
                            ? 'bg-primary'
                            : isLLM
                            ? 'bg-secondary'
                            : 'bg-tertiary'
                        }`}
                      ></div>

                      <div className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-12 md:col-span-5 flex flex-col min-w-0 pr-2">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-code-sm text-code-sm font-semibold text-primary font-mono">
                              {task.id}
                            </span>
                            <span className="inline-flex px-1.5 py-0.2 rounded bg-secondary-container/20 text-secondary font-label-sm text-label-sm uppercase font-mono">
                              {task.taskType}
                            </span>
                          </div>
                          <span className="font-body-md text-body-md text-on-surface truncate group-hover:text-primary transition-colors">
                            {task.query}
                          </span>
                        </div>

                        <div className="col-span-6 md:col-span-3 flex flex-col justify-center">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high text-on-surface font-code-sm text-code-sm font-medium w-max border border-outline-variant/15">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isMath ? 'bg-primary' : isLLM ? 'bg-secondary' : 'bg-tertiary'
                              }`}
                            ></span>
                            {task.solver === 'python'
                              ? 'Python Deterministic'
                              : task.solver.toUpperCase()}
                          </span>
                          <span className="font-code-sm text-code-sm text-on-surface-variant/70 mt-0.5 font-mono">
                            {task.engineName.split('(')[0].trim()}
                          </span>
                        </div>

                        <div className="col-span-3 md:col-span-2 text-right flex flex-col">
                          <span className="font-code-sm text-code-sm text-on-surface font-semibold font-mono">
                            {task.durationMs.toFixed(2)} ms
                          </span>
                          <span className="font-code-sm text-code-sm text-primary font-mono">
                            {task.tokens} Tokens
                          </span>
                        </div>

                        <div className="col-span-3 md:col-span-2 text-right flex flex-col items-end">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-label-sm text-label-sm font-mono border border-primary/20">
                            {task.statusCode} OK
                          </span>
                          <span className="font-code-sm text-code-sm text-on-surface-variant/60 mt-0.5 font-mono">
                            {task.timeAgo}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Pagination Bar */}
            <div className="flex items-center justify-between px-space-md py-space-sm bg-surface-container-low rounded-b-xl text-on-surface-variant border border-outline-variant/20 font-mono text-xs">
              <span>Showing 1 to {filteredTasks.length} logs</span>
              <div className="flex items-center gap-1">
                <button
                  disabled
                  className="h-8 px-2.5 rounded bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed flex items-center"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                </button>
                <button className="h-8 w-8 rounded bg-primary text-on-primary font-bold flex items-center justify-center">
                  1
                </button>
                <button
                  disabled
                  className="h-8 px-2.5 rounded bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed flex items-center"
                >
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>

          {/* Sticky Inspector & Execution Drawer (Right Column: 5 Cols) */}
          <aside className="xl:col-span-5 sticky top-20 flex flex-col gap-space-md bg-surface-container p-space-md rounded-xl border border-outline-variant/20 shadow-xl">
            {selectedTask ? (
              <>
                {/* Inspector Header */}
                <div className="flex items-center justify-between pb-space-sm border-b border-outline-variant/15">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-primary text-[20px]">troubleshoot</span>
                    <span className="font-headline-md text-headline-md text-on-surface font-semibold">
                      Execution Trace Inspector
                    </span>
                  </div>
                  <span className="font-code-sm text-code-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary font-mono font-medium border border-primary/20">
                    {selectedTask.id}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-space-sm">
                  <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/15">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
                      ROUTED SOLVER
                    </span>
                    <span className="font-code-sm text-code-sm text-on-surface font-semibold truncate mt-0.5 font-mono">
                      {selectedTask.engineName}
                    </span>
                  </div>
                  <div className="flex flex-col p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/15">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
                      EXECUTION DURATION
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-code-sm text-code-sm text-primary font-semibold font-mono">
                        {selectedTask.durationMs.toFixed(2)} ms
                      </span>
                      <span className="font-label-sm text-label-sm px-1.5 py-0.2 rounded bg-surface-container-high text-on-surface-variant font-mono">
                        {selectedTask.tokens} tk
                      </span>
                    </div>
                  </div>
                </div>

                {/* Routing Decision Flow Card */}
                <div className="flex flex-col gap-2 p-space-sm rounded-lg bg-surface-container-lowest border border-outline-variant/15">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">route</span>
                      ROUTING DECISION AUDIT
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-mono font-bold">
                      Confidence &gt; 0.98
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    {selectedTask.reasoning ||
                      'Automated intent classifier routed payload to optimized local engine.'}
                  </p>
                  {selectedTask.fingerprint && (
                    <div className="pt-1 flex items-center justify-between text-on-surface-variant font-code-sm text-code-sm border-t border-outline-variant/10">
                      <span>Fingerprint:</span>
                      <span className="text-on-surface font-mono">{selectedTask.fingerprint}</span>
                    </div>
                  )}
                </div>

                {/* Raw Output Payload View */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-mono">
                      OUTPUT ANSWER
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        onRerunTask(selectedTask.query, selectedTask.taskType as TaskType)
                      }
                      className="text-primary hover:underline text-xs flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                      <span>Run in Workspace</span>
                    </button>
                  </div>
                  <pre className="p-space-sm bg-surface-container-lowest rounded-lg font-code-sm text-code-sm text-on-surface font-mono overflow-x-auto max-h-48 border border-outline-variant/15 leading-relaxed">
                    {selectedTask.response.answer}
                  </pre>
                </div>

                {/* Footer Trace Actions */}
                <div className="flex items-center justify-between pt-space-xs border-t border-outline-variant/15">
                  <button
                    type="button"
                    onClick={handleCopyTraceId}
                    className="flex items-center gap-1 text-on-surface-variant hover:text-on-surface text-xs font-mono"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedId ? 'done' : 'content_copy'}
                    </span>
                    <span>{copiedId ? 'Copied ID' : 'Copy Trace ID'}</span>
                  </button>
                  <span className="font-code-sm text-code-sm text-on-surface-variant/60 font-mono">
                    Logged: {selectedTask.timestamp.slice(0, 19).replace('T', ' ')}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-on-surface-variant">
                Select a task to inspect trace
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
};
