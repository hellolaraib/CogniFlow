import { SolveRequest, SolveResponse } from '../types/solver';

const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const STORAGE_KEY_API_URL = 'cogniflow_backend_url';

/**
 * Returns the currently active backend API URL (local storage override or default).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_API_URL);
    if (saved) return saved.replace(/\/+$/, '');
  }
  return DEFAULT_API_BASE_URL.replace(/\/+$/, '');
}

/**
 * Updates the backend API URL.
 */
export function setApiBaseUrl(url: string): void {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_API_URL, cleanUrl);
  }
}

/**
 * Custom error types for fine-grained error reporting
 */
export class ApiNetworkError extends Error {
  public endpoint: string;
  constructor(message: string, endpoint: string) {
    super(message);
    this.name = 'ApiNetworkError';
    this.endpoint = endpoint;
  }
}

export class ApiBackendError extends Error {
  public statusCode: number;
  public details?: any;
  constructor(message: string, statusCode: number, details?: any) {
    super(message);
    this.name = 'ApiBackendError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Call the POST /solve API endpoint
 */
export async function solveTask(
  request: SolveRequest,
  signal?: AbortSignal
): Promise<SolveResponse> {
  const trimmedInput = request.input.trim();
  if (!trimmedInput) {
    throw new Error('Input payload cannot be empty. Please enter a task query.');
  }

  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/solve`;

  let response: Response;
  const startTime = performance.now();

  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        task_type: request.task_type,
        input: trimmedInput,
        options: request.options,
        conversation_history: request.conversation_history,
        session_id: request.session_id,
      }),
      signal,
    });
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw new ApiNetworkError(
      `Cannot reach backend at ${baseUrl}. Ensure FastAPI is running on ${baseUrl}. Details: ${err.message}`,
      endpoint
    );
  }

  const roundTripMs = Math.round((performance.now() - startTime) * 10) / 10;

  let data: any;
  try {
    data = await response.json();
  } catch {
    throw new ApiBackendError(
      `Received non-JSON response from server (Status ${response.status} ${response.statusText}).`,
      response.status
    );
  }

  if (!response.ok) {
    const errorMsg =
      data.error ||
      data.detail ||
      data.message ||
      `Server returned HTTP ${response.status}: ${response.statusText}`;
    throw new ApiBackendError(errorMsg, response.status, data);
  }

  // Ensure response matches contract schema
  const solveResult: SolveResponse = {
    success: typeof data.success === 'boolean' ? data.success : true,
    task_type: data.task_type || request.task_type,
    answer: String(data.answer ?? ''),
    solver: data.solver || 'python',
    processing_time_ms:
      typeof data.processing_time_ms === 'number'
        ? data.processing_time_ms
        : roundTripMs,
    error: data.error || null,
    secondary_results: data.secondary_results,
    solver_details: data.solver_details,
    memory_rss_mb: data.memory_rss_mb,
    token_usage: data.token_usage,
    usage: data.usage,
  };

  if (!solveResult.success && solveResult.error) {
    throw new ApiBackendError(solveResult.error, response.status, solveResult);
  }

  return solveResult;
}

/**
 * Call the POST /batch API endpoint
 */
export async function batchSolve(
  request: { tasks: SolveRequest[] },
  signal?: AbortSignal
): Promise<{
  total_tasks: number;
  successful_tasks: number;
  failed_tasks: number;
  processing_time_ms: number;
  results: SolveResponse[];
}> {
  const baseUrl = getApiBaseUrl();
  const endpoint = `${baseUrl}/batch`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiBackendError(errorText, response.status);
  }

  return await response.json();
}

/**
 * Perform a live health check on the backend
 */
export async function checkBackendHealth(): Promise<{
  connected: boolean;
  latencyMs: number;
  statusCode?: number;
  error?: string;
  activeSolvers?: number;
}> {
  const baseUrl = getApiBaseUrl();
  const startTime = performance.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const res = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - startTime);

    if (res.ok) {
      let activeSolvers = 8;
      try {
        const data = await res.json();
        if (typeof data.active_solvers === 'number') {
          activeSolvers = data.active_solvers;
        }
      } catch {
        // ignore
      }
      return { connected: true, latencyMs, statusCode: res.status, activeSolvers };
    }

    return { connected: true, latencyMs, statusCode: res.status, activeSolvers: 8 };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    return {
      connected: false,
      latencyMs,
      error: err.message || 'Connection refused',
    };
  }
}

/**
 * Fetch latest benchmark evaluation report
 */
export async function fetchBenchmarkSummary(): Promise<import('../types/solver').BenchmarkReport> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/benchmark/summary`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmark summary: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch benchmark dataset summary and category list
 */
export async function fetchBenchmarkDataset(): Promise<{
  total_test_cases: number;
  categories_count: number;
  deterministic_cases: number;
  requires_live_llm_cases: number;
  category_breakdown: Record<string, number>;
  categories: string[];
}> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/benchmark/dataset`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch benchmark dataset info: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Execute benchmark run (offline or live Groq)
 */
export async function runBenchmarkSuite(params?: {
  live?: boolean;
  category?: string;
  limit?: number;
}): Promise<import('../types/solver').BenchmarkReport> {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/benchmark/run`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) {
    throw new Error(`Failed to run benchmark suite: ${res.statusText}`);
  }
  return await res.json();
}
