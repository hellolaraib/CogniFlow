import { TaskHistoryItem } from '../types/solver';

export const INITIAL_HISTORY: TaskHistoryItem[] = [
  {
    id: 'tsk_8f99c01d',
    query: 'Calculate 125 × 64 and find its square root',
    taskType: 'math',
    solver: 'python',
    engineName: 'Python Deterministic (AST Sandbox)',
    durationMs: 2.14,
    tokens: 0,
    statusCode: 200,
    timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    timeAgo: '2m ago',
    reasoning:
      'AST parser matched purely arithmetic expressions: `(125 * 64) ** 0.5`. Direct sandbox bypass routing executed. High confidence (0.999).',
    fingerprint: 'sha256:d89e24fa889c',
    response: {
      success: true,
      task_type: 'math',
      answer: '8000',
      secondary_results: {
        square_root: 89.4427190999916,
        expression: 'sqrt(125 * 64)',
      },
      solver: 'python',
      solver_details: {
        engine: 'SymPy Sandbox v1.12',
        isolation: 'cgroups-v2',
        deterministic: true,
        tokens_consumed: 0,
      },
      processing_time_ms: 2.14,
      memory_rss_mb: 14.2,
      error: null,
    },
  },
  {
    id: 'tsk_7e44b82a',
    query: 'Extract orgs & funding rounds from tech crunch snippet',
    taskType: 'ner',
    solver: 'regex',
    engineName: 'Lightweight Regex / FastNER SpaCy',
    durationMs: 18.6,
    tokens: 0,
    statusCode: 200,
    timestamp: new Date(Date.now() - 1000 * 840).toISOString(),
    timeAgo: '14m ago',
    reasoning:
      'Pattern recognizer found explicit funding regex `(\\$\\d+M\\s(Series\\s[A-Z]|Seed))`. Fast SpaCy POS pipeline bypassed generative LLM.',
    fingerprint: 'sha256:4b910ca831e0',
    response: {
      success: true,
      task_type: 'ner',
      answer:
        'Found 3 entities: Synthetix AI (ORG), $42M Series B (FUNDING), Sequoia Capital (ORG)',
      secondary_results: {
        entities: [
          { entity: 'Synthetix AI', label: 'ORG' },
          { entity: '$42M Series B', label: 'FUNDING_ROUND' },
          { entity: 'Sequoia Capital', label: 'ORG' },
        ],
      },
      solver: 'regex',
      solver_details: {
        engine: 'spaCy en_core_web_sm',
        deterministic: false,
        tokens_consumed: 0,
      },
      processing_time_ms: 18.6,
      memory_rss_mb: 32.1,
      error: null,
    },
  },
  {
    id: 'tsk_6d33a10f',
    query: 'Customer review sentiment: "Fast delivery but packaging damaged"',
    taskType: 'sentiment',
    solver: 'distilbert',
    engineName: 'Local DistilBERT ONNX Runtime',
    durationMs: 28.2,
    tokens: 0,
    statusCode: 200,
    timestamp: new Date(Date.now() - 1000 * 3600).toISOString(),
    timeAgo: '1h ago',
    reasoning:
      'Sentence contains conjunction `but` with opposing polarity. Dispatched to quantized ONNX sentiment classification graph.',
    fingerprint: 'sha256:7f08cd1923ab',
    response: {
      success: true,
      task_type: 'sentiment',
      answer:
        'Mixed Negative (Polarity: -0.16) — delivery: positive, packaging: negative',
      secondary_results: {
        scores: {
          positive: 0.38,
          neutral: 0.08,
          negative: 0.54,
        },
      },
      solver: 'distilbert',
      solver_details: {
        engine: 'DistilBERT Mini Int8',
        deterministic: false,
        tokens_consumed: 0,
      },
      processing_time_ms: 28.2,
      memory_rss_mb: 48.5,
      error: null,
    },
  },
  {
    id: 'tsk_5c2299de',
    query: 'Def fibonacci(n): fix recursive recursion depth error',
    taskType: 'code_debug',
    solver: 'llm',
    engineName: 'Local CodeLlama 7B (GGUF Q4_K_M)',
    durationMs: 210.4,
    tokens: 142,
    statusCode: 200,
    timestamp: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
    timeAgo: '3h ago',
    reasoning:
      'AST syntax verification detected unbound recursion depth. Elevated to quantized CodeLlama instance via local llama.cpp backend.',
    fingerprint: 'sha256:91bc823da71f',
    response: {
      success: true,
      task_type: 'code_debug',
      answer:
        'def fibonacci(n, memo={}):\n    if n in memo:\n        return memo[n]\n    if n <= 1:\n        return n\n    memo[n] = fibonacci(n - 1, memo) + fibonacci(n - 2, memo)\n    return memo[n]',
      secondary_results: {
        diff: {
          removed: 'return fibonacci(n - 1) + fibonacci(n - 2)',
          added:
            'if n in memo: return memo[n]\nmemo[n] = fib(n-1, memo) + fib(n-2, memo)',
        },
      },
      solver: 'llm',
      solver_details: {
        engine: 'CodeLlama 7B Q4_K_M',
        deterministic: false,
        tokens_consumed: 142,
      },
      processing_time_ms: 210.4,
      memory_rss_mb: 812.0,
      error: null,
    },
  },
  {
    id: 'tsk_4b1188cd',
    query: 'Parse malformed JSON payload from gateway',
    taskType: 'logical',
    solver: 'python',
    engineName: 'Python Deterministic (SimdJson + Repair)',
    durationMs: 1.8,
    tokens: 0,
    statusCode: 200,
    timestamp: new Date(Date.now() - 1000 * 3600 * 5).toISOString(),
    timeAgo: '5h ago',
    reasoning:
      'Structural syntax error repair completed through dirtyjson sanitizer. Zero generative LLM inference overhead.',
    fingerprint: 'sha256:1a87c12f008e',
    response: {
      success: true,
      task_type: 'logical',
      answer:
        '{"status": "repaired", "trailing_commas_removed": 4, "escaped_chars_fixed": true, "valid_keys": 18}',
      solver: 'python',
      solver_details: {
        engine: 'SIMD JSON Evaluator',
        deterministic: true,
        tokens_consumed: 0,
      },
      processing_time_ms: 1.8,
      memory_rss_mb: 8.4,
      error: null,
    },
  },
  {
    id: 'tsk_3a0077bc',
    query: 'Summarize Kubernetes cluster incident report',
    taskType: 'summarization',
    solver: 'llm',
    engineName: 'Local LLM (Mistral 7B Instruct Int4)',
    durationMs: 340.1,
    tokens: 388,
    statusCode: 200,
    timestamp: new Date(Date.now() - 1000 * 3600 * 24).toISOString(),
    timeAgo: 'Yesterday',
    reasoning:
      'Multi-paragraph unstructured logging exceeds extractive NER threshold. Routed to local Mistral 7B context window.',
    fingerprint: 'sha256:56cc93e1104d',
    response: {
      success: true,
      task_type: 'summarization',
      answer:
        'SUMMARY:\n- Root Cause: OOMKilled event on ingress-nginx-controller pod due to memory leak in SSL cert reload daemon.\n- Blast Radius: 18 microservices experienced 502 Bad Gateway timeouts for 4m 12s.\n- Mitigation: Node pool recycled, heap limit increased to 2GiB, hotfix cherry-picked.',
      solver: 'llm',
      solver_details: {
        engine: 'Mistral 7B Instruct Int4',
        deterministic: false,
        tokens_consumed: 388,
      },
      processing_time_ms: 340.1,
      memory_rss_mb: 1240.0,
      error: null,
    },
  },
];
