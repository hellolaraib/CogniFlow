#!/usr/bin/env python3
"""CogniFlow Standalone Batch JSON Runner (Phase 10).

Executes a batch of solver tasks sequentially from a JSON file, preserving order,
accumulating genuine token metrics, and outputting structured results according
to the CogniFlow and Hackathon Batch Specification.

Usage:
    python -m backend.batch_runner input_tasks.json [--output output_results.json] [--api-url http://127.0.0.1:8000]
"""

import sys
import os
import json
import time
import argparse
import urllib.request
import urllib.error
from typing import List, Dict, Any

# Ensure workspace root is in sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.main import solve_task, SolveRequest, BatchSolveRequest, BatchSolveResponse


def load_tasks(filepath: str) -> List[Dict[str, Any]]:
    """Loads tasks from a JSON file, accepting either a list of tasks or an object with a 'tasks' list."""
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Input file not found: {filepath}")

    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    if isinstance(data, list):
        return data
    elif isinstance(data, dict) and "tasks" in data and isinstance(data["tasks"], list):
        return data["tasks"]
    else:
        raise ValueError("JSON file must contain an array of tasks or an object with a 'tasks' array.")


def run_batch_direct(tasks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Runs the batch directly in-process using the central router solve_task."""
    start_batch = time.perf_counter()
    results = []
    successful = 0
    failed = 0
    total_tokens = 0
    zero_token_count = 0

    for idx, item in enumerate(tasks_data):
        task_type = item.get("task_type", "smart")
        task_input = item.get("input", "")

        try:
            req = SolveRequest(task_type=task_type, input=task_input)
            res = solve_task(req)
            res_dict = res.model_dump()
            results.append(res_dict)

            if res.success:
                successful += 1
            else:
                failed += 1

            if res.token_usage:
                tokens = res.token_usage.total_tokens
                total_tokens += tokens
                if tokens == 0:
                    zero_token_count += 1
            else:
                zero_token_count += 1

        except Exception as e:
            failed += 1
            results.append({
                "success": False,
                "task_type": task_type,
                "answer": "",
                "solver": "router",
                "processing_time_ms": 0.0,
                "error": str(e),
                "token_usage": {
                    "request_id": f"batch_err_{idx}",
                    "solver": "router",
                    "model": None,
                    "llm_calls": 0,
                    "input_tokens": 0,
                    "output_tokens": 0,
                    "total_tokens": 0,
                    "token_count_method": "not_applicable",
                    "processing_time_ms": 0.0,
                    "estimated_cost": None,
                    "fallback_used": False
                }
            })

    total_batch_ms = round((time.perf_counter() - start_batch) * 1000, 2)

    return {
        "total_tasks": len(tasks_data),
        "successful_tasks": successful,
        "failed_tasks": failed,
        "processing_time_ms": total_batch_ms,
        "total_tokens_consumed": total_tokens,
        "zero_token_tasks": zero_token_count,
        "results": results
    }


def run_batch_via_http(tasks_data: List[Dict[str, Any]], api_url: str) -> Dict[str, Any]:
    """Submits the batch to the live FastAPI /batch endpoint."""
    endpoint = f"{api_url.rstrip('/')}/batch"
    payload = json.dumps({"tasks": tasks_data}).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"}
    )

    with urllib.request.urlopen(req, timeout=30) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} from {endpoint}: {resp.read().decode('utf-8')}")
        data = json.loads(resp.read().decode("utf-8"))
        return data


def main():
    parser = argparse.ArgumentParser(description="CogniFlow Batch JSON Runner")
    parser.add_argument("input", help="Path to input JSON file containing tasks")
    parser.add_argument("--output", "-o", help="Optional path to output JSON file (defaults to stdout)")
    parser.add_argument("--api-url", "-u", help="Optional FastAPI endpoint to execute via HTTP (defaults to in-memory core router)")
    args = parser.parse_args()

    try:
        tasks = load_tasks(args.input)
        print(f"[CogniFlow Batch] Loaded {len(tasks)} tasks from {args.input}", file=sys.stderr)

        if args.api_url:
            print(f"[CogniFlow Batch] Executing via HTTP endpoint: {args.api_url}/batch", file=sys.stderr)
            result = run_batch_via_http(tasks, args.api_url)
        else:
            print("[CogniFlow Batch] Executing via in-memory central solver router", file=sys.stderr)
            result = run_batch_direct(tasks)

        formatted_json = json.dumps(result, indent=2)

        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(formatted_json)
            print(f"[CogniFlow Batch] Results written to {args.output}", file=sys.stderr)
        else:
            print(formatted_json)

        print(
            f"[CogniFlow Batch] Summary: Total={result.get('total_tasks', len(tasks))} | "
            f"Successful={result.get('successful_tasks')} | "
            f"Failed={result.get('failed_tasks')} | "
            f"Time={result.get('processing_time_ms')}ms",
            file=sys.stderr
        )

    except Exception as e:
        print(f"[CogniFlow Batch ERROR] {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
