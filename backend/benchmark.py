#!/usr/bin/env python3
"""CogniFlow Benchmark Runner CLI.

Usage:
    python -m backend.benchmark                # Run all 109+ tests in reproducible offline mode
    python -m backend.benchmark --live         # Run with live Groq requests (paced rate-limiting)
    python -m backend.benchmark --category c_programming   # Run specific category
    python -m backend.benchmark --limit 20     # Run subset
"""

import sys
import os
import argparse
import json

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(CURRENT_DIR)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from backend.benchmark_engine import BenchmarkEngine
from backend.benchmark_dataset import BENCHMARK_CATEGORIES


def print_banner():
    print("=" * 80)
    print("  CogniFlow Empirical Benchmark & Quality Evaluation Engine")
    print("  Sole Cloud Provider: Groq (qwen/qwen3.8-27b) | 8 Local Deterministic Engines")
    print("=" * 80)


def print_report_summary(report: Dict[str, Any]):
    summary = report["summary"]
    tokens = report["token_accounting"]
    lat = report["latency_metrics_ms"]
    base = report["baseline_comparison"]

    print("\n" + "-" * 80)
    print("  EXECUTIVE SUMMARY")
    print("-" * 80)
    print(f"  Execution Mode:               {report['mode'].upper()}")
    print(f"  Total Test Cases:             {summary['total_cases']}")
    print(f"  Cases Passed:                 {summary['passed_cases']} / {summary['total_cases']}")
    print(f"  Overall Completion Rate:      {summary['task_completion_rate_pct']}%")
    print(f"  Deterministic Correctness:    {summary.get('deterministic_correctness_pct', 'N/A')}% ({summary.get('deterministic_passed_cases', 0)}/{summary.get('deterministic_total_cases', 0)})")
    print(f"  Routing Accuracy:             {summary['routing_accuracy_pct']}%")
    print(f"  AI Answer Quality:            {summary.get('ai_answer_quality_pct', 'N/A')}% ({summary.get('ai_evaluation_status', 'N/A')})")
    print(f"  Zero-Token Solves:            {summary['deterministic_zero_token_solves']} ({summary['zero_token_solve_ratio_pct']}%)")
    print(f"  Error / Failure Rate:         {summary['error_rate_pct']}%")

    print("\n" + "-" * 80)
    print("  TOKEN ACCOUNTING & BASELINE SAVINGS")
    print("-" * 80)
    is_live = report.get("mode") == "live_groq"
    token_label = "Actual Groq LLM Tokens" if is_live else "Simulated Contract Tokens (Offline)"
    print(f"  {token_label:28}: {tokens['total_actual_llm_tokens']} (Input: {tokens['total_actual_input_tokens']}, Output: {tokens['total_actual_output_tokens']})")
    print(f"  Total Provider Calls:         {tokens['total_llm_calls']}")
    print(f"  Deterministic Solver Tokens:  {tokens['deterministic_tokens_consumed']} (Strict Zero-Token Guarantee)")
    print(f"  All-to-LLM Baseline Tokens:   {base['baseline_total_tokens']} (Theoretical Estimate)")
    print(f"  Estimated Tokens Saved:       {base['estimated_tokens_saved']}")
    print(f"  Estimated Token Savings:      {base['token_savings_pct']}% (vs Theoretical Baseline)")
    print(f"  Baseline Speedup Factor:      {base['latency_speedup_factor']}")

    print("\n" + "-" * 80)
    print("  RUNTIME LATENCY & PERFORMANCE (ms)")
    print("-" * 80)
    print(f"  Deterministic Solver Avg:     {lat.get('deterministic_solver_average_latency_ms', 'N/A')} ms (measured local)")
    print(f"  LLM Latency Avg:              {lat.get('llm_average_latency_ms', 'N/A')} ms ({lat.get('llm_latency_measurement', 'N/A')})")
    print(f"  Overall Average Latency:      {lat.get('average_latency_ms', 'N/A')} ms")
    print(f"  Overall Median Latency:       {lat.get('median_latency_ms', 'N/A')} ms")
    print(f"  Overall P95 Latency:          {lat.get('p95_latency_ms', 'N/A')} ms")
    print(f"  Min / Max Latency:            {lat.get('min_latency_ms', 'N/A')} ms / {lat.get('max_latency_ms', 'N/A')} ms")
    print(f"  Peak RAM Usage:               {report['resource_usage']['peak_ram_mb']} MB")
    print(f"  Total Suite Duration:         {lat.get('total_suite_elapsed_sec', 'N/A')}s")

    print("\n" + "-" * 80)
    print("  SOLVER ENGINE DISPATCH DISTRIBUTION")
    print("-" * 80)
    for solver, count in report["solver_distribution"].items():
        pct = round(count / summary["total_cases"] * 100, 1)
        print(f"    • {solver:22}: {count:3} cases ({pct:5.1f}%)")

    print("\n" + "-" * 80)
    print("  CATEGORY BREAKDOWN")
    print("-" * 80)
    print(f"  {'Category':26} | {'Total':5} | {'Passed':6} | {'Routing %':9} | {'LLM Tokens':10}")
    print("  " + "-" * 66)
    for cat, m in report["category_metrics"].items():
        rt_pct = round(m["routing_correct"] / m["total"] * 100, 1) if m["total"] > 0 else 0
        print(f"  {cat:26} | {m['total']:5} | {m['passed']:6} | {rt_pct:8.1f}% | {m['tokens']:10}")
    print("=" * 80)


def main():
    parser = argparse.ArgumentParser(description="CogniFlow Benchmark and Evaluation Engine")
    parser.add_argument("--live", action="store_true", help="Execute with live Groq LLM requests (paced to stay within quotas)")
    parser.add_argument("--category", choices=BENCHMARK_CATEGORIES, help="Run only test cases in this category")
    parser.add_argument("--limit", type=int, help="Limit number of test cases to run")
    parser.add_argument("--json", action="store_true", help="Print raw JSON report to stdout")
    args = parser.parse_args()

    if not args.json:
        print_banner()

    engine = BenchmarkEngine()
    report = engine.run(live=args.live, category=args.category, limit=args.limit)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        print_report_summary(report)
        print(f"\n[+] Saved detailed JSON report: {os.path.join(CURRENT_DIR, 'benchmark_report.json')}")
        print(f"[+] Saved summary CSV:         {os.path.join(CURRENT_DIR, 'benchmark_summary.csv')}")
        print(f"[+] Synced root results:       {os.path.join(PROJECT_ROOT, 'benchmark_results.json')}\n")


if __name__ == "__main__":
    main()
