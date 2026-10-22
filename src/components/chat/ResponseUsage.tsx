import React from 'react';
import { TokenUsage, UsageMetadata } from '../../types/solver';

export interface ResponseUsageProps {
  usage?: UsageMetadata | TokenUsage;
  tokenUsage?: TokenUsage;
  solver?: string;
  processingTimeMs?: number;
  engineName?: string;
}

/**
 * Reusable compact Token Usage component rendered directly below every assistant response.
 * Follows the CogniFlow technical dark aesthetic and accurately distinguishes:
 * - 0 LLM tokens for deterministic solvers (Python AST, VADER, Regex NER, SMT logic)
 * - Actual token counts when provided by local inference engines (Ollama, llama.cpp)
 * - Estimated token counts when modeled or approximated (labeled clearly as Estimated)
 * - Explicit Unavailable status if usage data is absent.
 */
export const ResponseUsage: React.FC<ResponseUsageProps> = ({
  usage,
  tokenUsage,
  solver: propSolver,
  processingTimeMs: propTimeMs,
  engineName,
}) => {
  const activeUsage = usage || tokenUsage;

  // If usage metadata is completely absent or marked unavailable
  if (!activeUsage) {
    return (
      <div className="mt-2.5 pt-2 border-t border-outline-variant/15 font-mono text-[11px] text-on-surface-variant flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-on-surface-variant/70">
          <span className="material-symbols-outlined text-[13px]">toll</span>
          <span>Token Usage:</span>
        </span>
        <span className="px-2 py-0.5 rounded text-[10px] bg-red-950/30 text-red-400 border border-red-500/30 font-semibold">
          Unavailable
        </span>
      </div>
    );
  }

  const inputTokens = activeUsage.input_tokens ?? 0;
  const outputTokens = activeUsage.output_tokens ?? 0;
  const totalTokens = activeUsage.total_tokens ?? (inputTokens + outputTokens);
  const llmCalls = activeUsage.llm_calls ?? 0;
  const solver = (activeUsage as any).solver || propSolver || 'Python';
  const model = activeUsage.model;
  const durationMs = activeUsage.processing_time_ms ?? propTimeMs ?? 0;

  // Determine method label
  const rawMethod =
    (activeUsage as any).counting_method ||
    (activeUsage as any).token_count_method ||
    'not_applicable';

  const isDeterministic = totalTokens === 0 && llmCalls === 0;

  let methodLabel = 'Actual';
  let badgeStyle = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30';

  if (rawMethod === 'not_applicable' || isDeterministic) {
    methodLabel = 'Not Applicable';
    badgeStyle = 'text-primary bg-primary/10 border-primary/20';
  } else if (rawMethod === 'estimated') {
    methodLabel = 'Estimated';
    badgeStyle = 'text-amber-400 bg-amber-950/40 border-amber-500/30';
  } else if (rawMethod === 'unavailable') {
    methodLabel = 'Unavailable';
    badgeStyle = 'text-red-400 bg-red-950/30 border-red-500/30';
  }

  return (
    <div className="mt-2.5 pt-2 border-t border-outline-variant/20 font-mono text-[11px] text-on-surface-variant space-y-1.5 select-text">
      {/* Header Bar */}
      <div className="flex items-center justify-between text-[10px] uppercase font-semibold">
        <span className="flex items-center gap-1 text-emerald-400/90 tracking-wider">
          <span className="material-symbols-outlined text-[13px]">toll</span>
          <span>Token Usage</span>
        </span>
        <span className={`px-1.5 py-0.5 rounded border ${badgeStyle}`}>
          Token Count: {methodLabel}
        </span>
      </div>

      {/* Main Metric Banner */}
      <div className="p-2 rounded-lg bg-surface-container-lowest/90 border border-outline-variant/15 flex flex-wrap items-center justify-between gap-2">
        {isDeterministic ? (
          <div className="flex flex-wrap items-center justify-between w-full gap-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span>0 LLM tokens | 0 LLM calls</span>
            </div>
            <div className="text-on-surface-variant/70 text-[10px]">
              Input: 0 | Output: 0 | Total: 0
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-on-surface">
            <span>
              Input: <strong className="text-on-surface font-bold">{inputTokens}</strong>
            </span>
            <span className="text-outline-variant/50">|</span>
            <span>
              Output: <strong className="text-on-surface font-bold">{outputTokens}</strong>
            </span>
            <span className="text-outline-variant/50">|</span>
            <span>
              Total: <strong className="text-primary font-bold">{totalTokens}</strong>
            </span>
            <span className="text-outline-variant/50">|</span>
            <span>
              LLM Calls: <strong className="text-on-surface font-bold">{llmCalls}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Secondary Execution Details: Solver, Model, Processing Time */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-on-surface-variant/80 px-0.5 pt-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span>
            Solver: <span className="text-emerald-300 font-medium">{engineName || solver}</span>
          </span>
          {model && (
            <>
              <span className="text-outline-variant/60">•</span>
              <span>
                Model: <span className="text-on-surface font-medium">{model}</span>
              </span>
            </>
          )}
        </div>
        <div>
          Processing Time: <span className="text-on-surface font-medium">{durationMs.toFixed(2)} ms</span>
        </div>
      </div>
    </div>
  );
};
