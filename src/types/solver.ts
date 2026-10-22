export type TaskType =
  | 'smart'
  | 'math'
  | 'sentiment'
  | 'ner'
  | 'summarization'
  | 'code_debug'
  | 'code_gen'
  | 'logical'
  | 'factual';

export interface TaskTypeOption {
  id: TaskType;
  label: string;
  badge: string;
  badgeClass: string;
  description: string;
  defaultEngine: string;
}

export const TASK_TYPES: TaskTypeOption[] = [
  {
    id: 'smart',
    label: 'Smart Mode',
    badge: 'AUTO',
    badgeClass: 'text-secondary bg-secondary/10',
    description: 'Auto-detects deterministic code and intent',
    defaultEngine: 'Deterministic / Adaptive',
  },
  {
    id: 'math',
    label: 'Mathematical',
    badge: '0-TOK',
    badgeClass: 'text-primary bg-primary/10',
    description: 'Exact symbolic algebra & arithmetic',
    defaultEngine: 'Deterministic Python (SymPy)',
  },
  {
    id: 'sentiment',
    label: 'Sentiment',
    badge: 'NLP',
    badgeClass: 'text-tertiary bg-tertiary/10',
    description: 'Polarity scoring & emotion analysis',
    defaultEngine: 'Lightweight NLP (VADER)',
  },
  {
    id: 'ner',
    label: 'Entity Extraction',
    badge: 'NLP',
    badgeClass: 'text-tertiary bg-tertiary/10',
    description: 'Organizations, money, dates, entities',
    defaultEngine: 'Pattern Matcher + SpaCy',
  },
  {
    id: 'code_debug',
    label: 'Code Debugging',
    badge: 'AST+LLM',
    badgeClass: 'text-primary bg-primary/10',
    description: 'Syntax errors, loops & recursion bugs',
    defaultEngine: 'AST + Local Code Model',
  },
  {
    id: 'code_gen',
    label: 'Code Generation',
    badge: 'LOCAL',
    badgeClass: 'text-secondary bg-secondary/10',
    description: 'APIs, SQL queries, regex patterns',
    defaultEngine: 'Local Language Model',
  },
  {
    id: 'summarization',
    label: 'Summarization',
    badge: 'EDGE-LLM',
    badgeClass: 'text-secondary bg-secondary/10',
    description: 'Condense logs, tickets & documents',
    defaultEngine: 'Extractive / Quantized LLM',
  },
  {
    id: 'logical',
    label: 'Logical Reasoning',
    badge: 'SAT/LLM',
    badgeClass: 'text-on-surface-variant bg-surface-container-highest',
    description: 'Boolean constraints & formal logic',
    defaultEngine: 'Deterministic SMT Solver (Z3)',
  },
  {
    id: 'factual',
    label: 'Factual Knowledge',
    badge: 'HYBRID',
    badgeClass: 'text-on-surface-variant bg-surface-container-highest',
    description: 'Architecture & technical lookup',
    defaultEngine: 'Vector Index + Edge LLM',
  },
];

export interface SolveRequest {
  task_type: TaskType | string;
  input: string;
}

export interface SecondaryResults {
  square_root?: number | string;
  expression?: string;
  parsed_ast?: string;
  scores?: {
    positive?: number;
    neutral?: number;
    negative?: number;
  };
  entities?: Array<{ entity: string; label: string }>;
  diff?: {
    removed?: string;
    added?: string;
  };
  [key: string]: any;
}

export interface SolverDetails {
  engine?: string;
  isolation?: string;
  deterministic?: boolean;
  tokens_consumed?: number;
  grammar?: string;
  [key: string]: any;
}

export interface TokenUsage {
  request_id: string;
  solver: string;
  model?: string | null;
  llm_calls: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  token_count_method: 'actual' | 'estimated' | 'not_applicable' | 'unavailable';
  processing_time_ms: number;
  estimated_cost?: number | null;
  fallback_used: boolean;
}

export interface UsageMetadata {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  llm_calls: number;
  model?: string | null;
  counting_method: 'actual' | 'estimated' | 'not_applicable' | 'unavailable';
  solver?: string;
  processing_time_ms?: number;
  fallback_used?: boolean;
}

export interface SolveResponse {
  success: boolean;
  task_type: string;
  answer: string;
  solver: string;
  processing_time_ms: number;
  error: string | null;
  secondary_results?: SecondaryResults;
  solver_details?: SolverDetails;
  memory_rss_mb?: number;
  token_usage?: TokenUsage;
  usage?: UsageMetadata;
}

export interface BatchSolveRequest {
  tasks: SolveRequest[];
}

export interface BatchSolveResponse {
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  processing_time_ms: number;
  results: SolveResponse[];
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  taskType?: string;
  solver?: string;
  processingTimeMs?: number;
  tokensConsumed?: number;
  tokenUsage?: TokenUsage;
  usage?: UsageMetadata;
  secondaryResults?: SecondaryResults;
  solverDetails?: SolverDetails;
  rawResponse?: SolveResponse;
  error?: string | null;
}

export interface TaskHistoryItem {
  id: string;
  query: string;
  taskType: string;
  solver: string;
  engineName: string;
  durationMs: number;
  tokens: number;
  tokenUsage?: TokenUsage;
  usage?: UsageMetadata;
  statusCode: number;
  timestamp: string;
  timeAgo: string;
  response: SolveResponse;
  reasoning?: string;
  fingerprint?: string;
}
