"""Automated Regression Test Suite for CogniFlow Solver Backend.

Tests cover:
- Test A: 'Explain a binary tree' (nodes, root, children, no linguistic shifting)
- Test B: 'What is the difference between a binary tree and BST?' (ordering property)
- Test C: 'Calculate 125 * 64' (8000 via deterministic solver)
- Test D: 'This product is absolutely amazing!' (positive sentiment)
- Test E: 'Explain a binary tree' routing (factual knowledge route)
- Test F: Query with no relevant document (no unrelated hallucination / proper fallback)
- Integration tests against live backend /solve endpoint
"""

import unittest
import urllib.request
import json
import re

from backend.main import (
    classify_intent,
    solve_task,
    solve_factual,
    solve_math_query,
    analyze_sentiment,
    fetch_online_knowledge,
    score_hit_relevance,
    SolveRequest
)


class TestCogniFlowRegression(unittest.TestCase):
    """Regression test cases verifying root-cause fixes for routing and retrieval."""

    def test_a_explain_binary_tree(self):
        """Test A:
        Input: 'Explain a binary tree' (and 'explain me binary tree')
        Expected: Explanation of binary trees, nodes, root, and children.
        MUST NOT discuss linguistic shifting.
        """
        for query in ["Explain a binary tree", "explain me binary tree"]:
            with self.subTest(query=query):
                req = SolveRequest(task_type="smart", input=query)
                res = solve_task(req)

                self.assertTrue(res.success, "Request should succeed")
                self.assertEqual(res.task_type, "factual", "Should route to factual knowledge")

                ans_lower = res.answer.lower()
                # Verify core binary tree concepts are present
                self.assertIn("binary tree", ans_lower)
                self.assertIn("node", ans_lower)
                self.assertIn("root", ans_lower)
                self.assertTrue("child" in ans_lower or "children" in ans_lower)

                # CRITICAL: Verify linguistic shifting bug is eliminated
                self.assertNotIn("linguistic", ans_lower, "Must not discuss linguistics")
                self.assertNotIn("shifting (syntax)", ans_lower, "Must not discuss shifting (syntax)")
                self.assertNotIn("non-canonical order", ans_lower)

    def test_b_difference_between_binary_tree_and_bst(self):
        """Test B:
        Input: 'What is the difference between a binary tree and BST?'
        Expected: Explain that a binary search tree follows an ordering property
        that a general binary tree does not necessarily follow.
        """
        query = "What is the difference between a binary tree and BST?"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "factual")

        ans = res.answer
        ans_lower = ans.lower()

        # Must discuss ordering property
        self.assertTrue(
            "ordering property" in ans_lower or "ordering invariant" in ans_lower or "ordered" in ans_lower,
            "Must explicitly explain the ordering property requirement"
        )
        self.assertIn("binary tree", ans_lower)
        self.assertIn("binary search tree", ans_lower)

        # Must mention search complexity differences (O(N) vs O(log N))
        self.assertIn("log", ans_lower, "Must mention logarithmic complexity for BST")

    def test_c_calculate_multiplication(self):
        """Test C:
        Input: 'Calculate 125 * 64'
        Expected: 8000, using an appropriate deterministic solver.
        """
        query = "Calculate 125 * 64"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "math", "Should route to math solver")
        self.assertEqual(res.solver, "python", "Deterministic Python/AST solver expected")
        self.assertIn("8000", res.answer, "Result must contain 8000")

    def test_d_sentiment_classification(self):
        """Test D:
        Input: 'This product is absolutely amazing!'
        Expected: A positive sentiment classification.
        """
        query = "This product is absolutely amazing!"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "sentiment", "Should route to sentiment solver")
        ans_lower = res.answer.lower()
        self.assertTrue(
            "positive" in ans_lower,
            "Must classify sentiment as positive"
        )

    def test_e_routing_educational_explanation(self):
        """Test E:
        Input: 'Explain a binary tree'
        Expected routing: Factual knowledge or the equivalent supported educational-question route.
        Also verifies all 8 task categories can still be routed explicitly.
        """
        # Educational explanation routing in smart mode
        self.assertEqual(classify_intent("Explain a binary tree"), "factual")
        self.assertEqual(classify_intent("explain me binary tree"), "factual")
        self.assertEqual(classify_intent("What is a binary tree?"), "factual")
        self.assertEqual(classify_intent("Can you explain binary tree?"), "factual")

        # Verify all 8 categories are supported and respected
        categories = [
            "math", "sentiment", "ner", "code_debug",
            "code_gen", "summarization", "logical", "factual"
        ]
        sample_prompt = "Test prompt for category routing"
        for cat in categories:
            with self.subTest(category=cat):
                req = SolveRequest(task_type=cat, input=sample_prompt)
                res = solve_task(req)
                self.assertTrue(res.success)
                self.assertEqual(res.task_type, cat, f"Explicit mode '{cat}' must be preserved")

    def test_f_no_relevant_document_fallback(self):
        """Test F:
        Use a query for which the knowledge base has no relevant document.
        Expected: Do not confidently return an unrelated retrieved document as the answer.
        """
        # Test relevance scoring directly
        query_tokens = ["quantum", "flibbertygibber", "9988xyz"]
        unrelated_title = "Kevin Hart: Let Me Explain"
        unrelated_snippet = "Kevin Hart: Let Me Explain is a 2013 American stand-up comedy concert film."
        score = score_hit_relevance(unrelated_title, unrelated_snippet, query_tokens, "quantum flibbertygibber 9988xyz")
        self.assertLess(score, 0.55, "Unrelated document must score below relevance threshold")

        # Full solver test with nonsensical query
        query = "xyzqwe12345nonexistent"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        ans = res.answer
        ans_lower = ans.lower()

        # Must NOT return an unrelated Wikipedia article as confident answer
        self.assertNotIn("kevin hart", ans_lower)
        self.assertNotIn("shifting (syntax)", ans_lower)

        # Must clearly indicate that verified reference data was not found
        self.assertTrue(
            "not found" in ans_lower or "supported domains" in ans_lower,
            "Must present transparent fallback rather than hallucinated unrelated content"
        )


class TestLiveApiIntegration(unittest.TestCase):
    """End-to-end integration tests sending HTTP requests to the live FastAPI backend."""

    BASE_URL = "http://127.0.0.1:8000"

    def test_live_solve_binary_tree(self):
        payload = json.dumps({"input": "explain me binary tree", "task_type": "smart"}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.BASE_URL}/solve",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))

            self.assertTrue(data.get("success"))
            self.assertEqual(data.get("task_type"), "factual")
            self.assertEqual(data.get("solver"), "vector_rag")
            self.assertGreater(data.get("processing_time_ms", 0), 0)

            ans = data.get("answer", "")
            ans_lower = ans.lower()
            self.assertIn("binary tree", ans_lower)
            self.assertIn("root", ans_lower)
            self.assertIn("left child", ans_lower)
            self.assertNotIn("shifting (syntax)", ans_lower)

    def test_live_solve_math(self):
        payload = json.dumps({"input": "Calculate 125 * 64", "task_type": "smart"}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.BASE_URL}/solve",
            data=payload,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))
            self.assertTrue(data.get("success"))
            self.assertIn("8000", data.get("answer"))


if __name__ == "__main__":
    unittest.main()
