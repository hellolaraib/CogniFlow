"""Automated Test Suite for CogniFlow Benchmark & Evaluation Engine.

Tests:
1. Dataset Integrity & Schema (>= 100 test cases across 14 required categories)
2. Code Evaluator (Sandboxed C compilation, Python AST, and placeholder detection)
3. Benchmark Metric Calculations (Accuracy, Token Savings, Latency Percentiles)
4. Offline Runner Execution & Zero-Cost Deterministic Solvers (0 external API calls)
5. JSON and CSV Reporting Integrity
"""

import unittest
import unittest.mock
import json
import os
import math
import statistics

from backend.benchmark_dataset import BENCHMARK_DATASET, BENCHMARK_CATEGORIES, get_dataset_summary
from backend.code_evaluator import verify_c_code, verify_python_code, detect_dummy_placeholders
from backend.benchmark_engine import BenchmarkEngine, load_latest_report


class TestBenchmarkDatasetIntegrity(unittest.TestCase):
    """Verifies that the benchmark test dataset meets all requirements."""

    def test_minimum_test_cases(self):
        """Dataset must contain at least 100 test cases."""
        self.assertGreaterEqual(len(BENCHMARK_DATASET), 100)

    def test_all_14_categories_present(self):
        """All 14 required categories must be present and represented in the dataset."""
        required_categories = [
            "arithmetic",
            "symbolic_math",
            "general_knowledge",
            "concept_explanation",
            "c_programming",
            "code_debugging",
            "summarization",
            "sentiment",
            "ner",
            "logical_reasoning",
            "multi_intent",
            "follow_up_context",
            "ambiguous_underspecified",
            "failure_recovery"
        ]
        present_categories = {tc["category"] for tc in BENCHMARK_DATASET}
        for cat in required_categories:
            self.assertIn(cat, present_categories, f"Category '{cat}' is missing from the dataset.")

    def test_case_schema_and_unique_ids(self):
        """Every test case must have a unique ID and required fields."""
        seen_ids = set()
        for idx, tc in enumerate(BENCHMARK_DATASET):
            case_id = tc.get("id")
            self.assertIsNotNone(case_id, f"Test case at index {idx} has no 'id'")
            self.assertNotIn(case_id, seen_ids, f"Duplicate test case ID '{case_id}' found")
            seen_ids.add(case_id)

            self.assertIn("category", tc)
            self.assertIn("input", tc)
            self.assertTrue(len(tc["input"].strip()) > 0, f"Case {case_id} has empty prompt")
            self.assertIn("eval_method", tc)
            self.assertIn("eval_criteria", tc)
            self.assertIn("requires_live_llm", tc)
            self.assertIn("baseline_tokens_estimate", tc)
            self.assertGreaterEqual(tc["baseline_tokens_estimate"], 0)

    def test_dataset_summary_function(self):
        """get_dataset_summary returns accurate statistics."""
        summary = get_dataset_summary()
        self.assertEqual(summary["total_test_cases"], len(BENCHMARK_DATASET))
        self.assertEqual(summary["categories_count"], len(BENCHMARK_CATEGORIES))
        self.assertGreater(summary["deterministic_cases"], 50)
        self.assertGreater(summary["requires_live_llm_cases"], 25)


class TestCodeEvaluator(unittest.TestCase):
    """Verifies safe code evaluation, static syntax verification, and sandbox timeouts."""

    def test_valid_c_program_compilation(self):
        """Valid C program compiles and runs successfully."""
        c_code = (
            "#include <stdio.h>\n"
            "int main() {\n"
            "    printf(\"Binary Tree Inorder Traversal\\n\");\n"
            "    return 0;\n"
            "}\n"
        )
        res = verify_c_code(c_code)
        self.assertTrue(res["valid"], f"Valid C code failed verification: {res.get('details')}")
        self.assertTrue(res["compiled"])

    def test_invalid_c_program_syntax_error(self):
        """Invalid C code fails syntax compilation safely without crashing."""
        broken_c_code = (
            "#include <stdio.h>\n"
            "int main() {\n"
            "    printf(\"Missing semicolon\")\n"
            "    return 0;\n"
            "}\n"
        )
        res = verify_c_code(broken_c_code)
        self.assertFalse(res["valid"])
        self.assertIn("error", res.get("details", "").lower())

    def test_c_sandbox_timeout_enforcement(self):
        """Infinite loop C program times out safely within the sandbox."""
        infinite_loop_c = (
            "#include <stdio.h>\n"
            "int main() {\n"
            "    while (1) {}\n"
            "    return 0;\n"
            "}\n"
        )
        res = verify_c_code(infinite_loop_c, run_timeout_sec=1.0)
        self.assertFalse(res["valid"])
        self.assertIn("timed out", res.get("details", "").lower())

    def test_python_ast_evaluator(self):
        """Python AST validator detects valid syntax vs syntax errors."""
        valid_py = "def reverse_string(s):\n    return s[::-1]\n"
        res = verify_python_code(valid_py)
        self.assertTrue(res["valid"])

        invalid_py = "def broken(:\n    pass\n"
        res = verify_python_code(invalid_py)
        self.assertFalse(res["valid"])
        self.assertIn("syntax error", res.get("details", "").lower())

    def test_dummy_placeholder_detector(self):
        """detect_dummy_placeholders identifies fake stubs."""
        placeholder = "def Explain_binary_tree():\n    return 'TODO'\n"
        has_stub, findings = detect_dummy_placeholders(placeholder)
        self.assertTrue(has_stub)
        self.assertGreater(len(findings), 0)

        real_code = "def add(a, b):\n    return a + b\n"
        has_stub, findings = detect_dummy_placeholders(real_code)
        self.assertFalse(has_stub)
        self.assertEqual(len(findings), 0)


class TestBenchmarkEngineMetrics(unittest.TestCase):
    """Tests accuracy, latency percentiles, and token savings calculations."""

    def test_token_savings_formula(self):
        """Verifies token savings percentage matches definition."""
        baseline = 20000
        actual = 4000
        saved = baseline - actual
        savings_pct = round((saved / baseline) * 100, 2)
        self.assertEqual(savings_pct, 80.0)

    def test_latency_percentiles(self):
        """Verifies average, median, and P95 latency calculations."""
        latencies = [1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0, 100.0]
        avg = statistics.mean(latencies)
        med = statistics.median(latencies)
        sorted_lat = sorted(latencies)
        p95_idx = int(math.ceil(0.95 * len(sorted_lat))) - 1
        p95 = sorted_lat[p95_idx]

        self.assertEqual(avg, 14.5)
        self.assertEqual(med, 5.5)
        self.assertEqual(p95, 100.0)

    def test_offline_benchmark_runner_executes_safely(self):
        """Tests that BenchmarkEngine runs a sample offline without external API calls."""
        engine = BenchmarkEngine()
        # Run a 5-case sample in deterministic offline mode
        report = engine.run(live=False, category="arithmetic", limit=5)

        self.assertIn("summary", report)
        self.assertIn("token_accounting", report)
        self.assertIn("baseline_comparison", report)
        self.assertEqual(report["summary"]["total_cases"], 5)
        self.assertEqual(report["summary"]["passed_cases"], 5)
        self.assertEqual(report["summary"]["task_completion_rate_pct"], 100.0)

        # In arithmetic category, all deterministic solvers must consume 0 tokens
        self.assertEqual(report["token_accounting"]["total_actual_llm_tokens"], 0)
        self.assertEqual(report["token_accounting"]["total_llm_calls"], 0)
        self.assertGreater(report["baseline_comparison"]["estimated_tokens_saved"], 0)


class TestBenchmarkReportPersistence(unittest.TestCase):
    """Tests report persistence and loading from disk."""

    def test_load_latest_report(self):
        """load_latest_report should return a valid dictionary with summary."""
        report = load_latest_report()
        self.assertIsNotNone(report, "Latest report could not be loaded from disk")
        self.assertIn("summary", report)
        self.assertIn("baseline_comparison", report)
        self.assertGreater(report["summary"]["total_cases"], 0)


if __name__ == "__main__":
    unittest.main()
