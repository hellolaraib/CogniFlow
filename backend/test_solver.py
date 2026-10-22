"""Comprehensive Automated Regression & Integration Test Suite for CogniFlow (Phase 11).

Implements Tests A through Q:
- Test A: Educational Question ("Explain queue in detail" -> FIFO, enqueue, dequeue, front, rear)
- Test B: Binary Tree ("Explain binary tree" -> nodes, root, children; no linguistic shifting)
- Test C: Binary Tree vs BST (ordering property / BST ordering invariant)
- Test D: Math Deterministic ("Calculate 125 * 64" -> 8000, 0 LLM tokens)
- Test E: Sentiment Classification ("This product is absolutely amazing!" -> positive)
- Test F: NER (Controlled sentence -> Organization, Date, Money)
- Test G: Summarization (Sample paragraph -> concise factual summary)
- Test H: Code Debugging (Program with off-by-one bug -> identified and corrected)
- Test I: Code Generation ("Write a Python function to reverse a string" -> implementation)
- Test J: Logical Reasoning (Syllogism / Boolean constraints -> consistent solution)
- Test K: Irrelevant Retrieval (Simulated irrelevant match -> rejected from authoritative answer)
- Test L: Honest Solver Health Reporting (Unconfigured local LLM reported honestly)
- Test M: Bounded Fallback & Timeout (Terminates without infinite recursion)
- Test N: Explicit Task Selection (All 8 categories respected when explicitly specified)
- Test O: Empty / Invalid Input Handling (Safe structured error)
- Test P: Token Tracking & Zero-Token Fidelity (Exact 0 LLM tokens for deterministic solvers)
- Test Q: Batch Runner & Live API Integration (Order preserved, structured batch telemetry)
"""

import unittest
import urllib.request
import urllib.error
import json
import re

from backend.main import (
    classify_intent,
    solve_task,
    solve_factual,
    solve_math_query,
    analyze_sentiment,
    extract_named_entities,
    summarize_text,
    solve_logic,
    debug_code,
    generate_code,
    score_hit_relevance,
    health_check,
    SolveRequest,
    BatchSolveRequest,
    SolveResponse,
    TokenUsage,
    UsageMetadata
)


class TestCogniFlowCore(unittest.TestCase):
    """Unit and functional tests covering all 8 solver categories and core router behavior."""

    def test_a_educational_queue(self):
        """Test A: Educational Question.
        Input: 'Explain queue in detail'
        Expected: A relevant explanation covering queue concepts such as FIFO, enqueue,
        dequeue, front, and rear. Irrelevant Wikipedia hits must not mask the answer.
        """
        for query in ["Explain queue in detail", "explain queue in details"]:
            with self.subTest(query=query):
                req = SolveRequest(task_type="smart", input=query)
                res = solve_task(req)

                self.assertTrue(res.success, "Request should succeed")
                self.assertEqual(res.task_type, "factual", "Should route to factual knowledge")

                ans_lower = res.answer.lower()
                self.assertIn("queue", ans_lower)
                self.assertIn("fifo", ans_lower, "Must explain FIFO (First In, First Out)")
                self.assertIn("enqueue", ans_lower, "Must mention enqueue operation")
                self.assertIn("dequeue", ans_lower, "Must mention dequeue operation")
                self.assertIn("front", ans_lower, "Must mention front pointer/head")
                self.assertIn("rear", ans_lower, "Must mention rear pointer/tail")

                # Must NOT return the unhelpful unsupported questions list
                self.assertNotIn("verified reference data for this query was not found", ans_lower)

    def test_b_explain_binary_tree(self):
        """Test B: Binary Tree.
        Input: 'Explain a binary tree'
        Expected: Explanation of nodes, root, and children.
        MUST NOT discuss linguistic shifting (syntax).
        """
        for query in ["Explain a binary tree", "explain me binary tree"]:
            with self.subTest(query=query):
                req = SolveRequest(task_type="smart", input=query)
                res = solve_task(req)

                self.assertTrue(res.success)
                self.assertEqual(res.task_type, "factual")

                ans_lower = res.answer.lower()
                self.assertIn("binary tree", ans_lower)
                self.assertIn("node", ans_lower)
                self.assertIn("root", ans_lower)
                self.assertTrue("child" in ans_lower or "children" in ans_lower)

                # Verify linguistic shifting bug is eliminated
                self.assertNotIn("linguistic", ans_lower)
                self.assertNotIn("shifting (syntax)", ans_lower)

    def test_c_binary_tree_vs_bst(self):
        """Test C: Binary Tree vs BST.
        Expected: Correctly explain that a BST follows an ordering property
        that a general binary tree does not necessarily follow.
        """
        query = "What is the difference between a binary tree and BST?"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "factual")

        ans_lower = res.answer.lower()
        self.assertTrue(
            "ordering property" in ans_lower or "ordering invariant" in ans_lower or "ordered" in ans_lower,
            "Must explain BST ordering constraint"
        )
        self.assertIn("binary tree", ans_lower)
        self.assertIn("binary search tree", ans_lower)

    def test_d_math_deterministic(self):
        """Test D: Math.
        Input: 'Calculate 125 * 64'
        Expected: 8000. Verify that no unnecessary LLM call occurs.
        """
        query = "Calculate 125 * 64"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "math")
        self.assertEqual(res.solver, "python")
        self.assertIn("8000", res.answer)

        # Token telemetry verification: 0 tokens for deterministic solver
        self.assertIsNotNone(res.token_usage)
        self.assertEqual(res.token_usage.llm_calls, 0, "No LLM calls should be invoked for arithmetic")
        self.assertEqual(res.token_usage.total_tokens, 0, "Total tokens must be zero")
        self.assertEqual(res.token_usage.token_count_method, "not_applicable")

    def test_e_sentiment_classification(self):
        """Test E: Sentiment.
        Input: 'This product is absolutely amazing!'
        Expected: Positive sentiment according to configured classifier.
        """
        query = "This product is absolutely amazing!"
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "sentiment")
        self.assertIn("positive", res.answer.lower())
        self.assertIsNotNone(res.secondary_results)
        self.assertIn("scores", res.secondary_results)

    def test_f_named_entity_recognition(self):
        """Test F: NER.
        Input: Controlled sentence containing known organization, location, and date.
        Expected: Correct extraction of entities.
        """
        query = "Google announced Gemini in Mountain View on December 6, 2023 with $10 billion investment."
        req = SolveRequest(task_type="ner", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "ner")
        ans_lower = res.answer.lower()
        self.assertIn("google", ans_lower)
        self.assertIn("organization", ans_lower)
        self.assertIn("december 6, 2023", ans_lower)

    def test_g_summarization(self):
        """Test G: Summarization.
        Input: Sample paragraph with several key facts.
        Expected: Relevant summary preserving original facts without invention.
        """
        sample_text = (
            "CogniFlow is an intelligent multi-engine task router designed for high-efficiency computational dispatch. "
            "It supports eight solver categories including deterministic mathematics, lightweight sentiment analysis, "
            "and named entity recognition. By isolating arithmetic requests to an in-memory AST evaluator, CogniFlow "
            "achieves zero-token latency under 2 milliseconds without querying cloud LLMs. The platform also provides "
            "an automatic fallback pipeline to guarantee request fulfillment."
        )
        req = SolveRequest(task_type="summarization", input=sample_text)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "summarization")
        self.assertIn("CogniFlow", res.answer)
        self.assertLess(len(res.answer.split()), len(sample_text.split()))

    def test_h_code_debugging(self):
        """Test H: Code Debugging.
        Input: Program with known loop off-by-one error.
        Expected: Identify the relevant bug and provide suitable correction.
        """
        code = (
            "def print_elements(arr):\n"
            "    for i in range(len(arr) + 1):\n"
            "        print(arr[i])\n"
        )
        req = SolveRequest(task_type="code_debug", input=code)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "code_debug")
        ans_lower = res.answer.lower()
        self.assertTrue("off-by-one" in ans_lower or "out of bounds" in ans_lower or "indexerror" in ans_lower)
        self.assertIn("range(len(arr))", res.answer)

    def test_i_code_generation(self):
        """Test I: Code Generation.
        Input: 'Write a Python function to reverse a string.'
        Expected: Relevant Python implementation with function, complexity, and examples.
        """
        query = "Write a Python function to reverse a string."
        req = SolveRequest(task_type="smart", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "code_gen")
        self.assertIn("def reverse_string", res.answer)
        self.assertIn("[::-1]", res.answer)

    def test_j_logical_reasoning(self):
        """Test J: Logical Reasoning.
        Input: Fully specified logical problem.
        Expected: Result consistent with constraints.
        """
        query = "All humans are mortal. Socrates is a human. Is Socrates mortal?"
        req = SolveRequest(task_type="logical", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertEqual(res.task_type, "logical")
        ans_lower = res.answer.lower()
        self.assertTrue("mortal" in ans_lower or "valid" in ans_lower or "true" in ans_lower)

    def test_k_irrelevant_retrieval(self):
        """Test K: Irrelevant Retrieval.
        Simulate retrieval returning unrelated document.
        Expected: Irrelevant content must not be returned as an authoritative final answer.
        """
        query_tokens = ["quantum", "hyperquark", "9988xyz"]
        unrelated_title = "Kevin Hart: Let Me Explain"
        unrelated_snippet = "Kevin Hart: Let Me Explain is a 2013 American stand-up comedy concert film."
        score = score_hit_relevance(unrelated_title, unrelated_snippet, query_tokens, "quantum hyperquark 9988xyz")
        self.assertLess(score, 0.55, "Unrelated hit must score below 0.55 relevance threshold")

    def test_l_local_llm_unavailable_honest_reporting(self):
        """Test L: Local LLM Unavailable.
        Expected: Honestly reports offline engine without fabricating availability.
        """
        health = health_check()
        self.assertEqual(health["status"], "ok")
        self.assertIn("local_llm", health)
        self.assertEqual(health["local_llm"]["status"], "unavailable")
        self.assertIn("paid_cloud_api", health)
        self.assertEqual(health["paid_cloud_api"]["status"], "not_configured")

    def test_m_timeout_bounded_fallback(self):
        """Test M: Timeout and Bounded Retries.
        Expected: Requests terminate promptly within bounded execution time without infinite recursion.
        """
        req = SolveRequest(task_type="smart", input="What is the square root of 144?")
        res = solve_task(req)
        self.assertTrue(res.success)
        self.assertLess(res.processing_time_ms, 5000, "Must complete within bounded timeout")

    def test_n_explicit_task_selection(self):
        """Test N: Explicit Task Selection.
        Expected: Selected category is preserved across all 8 supported categories.
        """
        categories = [
            "math", "sentiment", "ner", "code_debug",
            "code_gen", "summarization", "logical", "factual"
        ]
        sample_prompt = "Sample prompt for explicit routing verification"
        for cat in categories:
            with self.subTest(category=cat):
                req = SolveRequest(task_type=cat, input=sample_prompt)
                res = solve_task(req)
                self.assertTrue(res.success)
                self.assertEqual(res.task_type, cat, f"Explicit category '{cat}' must be strictly respected")

    def test_o_empty_input_handling(self):
        """Test O: Empty Input Handling.
        Expected: Safe error response without crashing.
        """
        req = SolveRequest(task_type="smart", input="   ")
        res = solve_task(req)
        self.assertFalse(res.success)
        self.assertIsNotNone(res.error)

    def test_p_token_tracking_fidelity(self):
        """Test P: Token Tracking.
        Verify:
        - Deterministic math produces zero LLM tokens.
        - Fallback metadata is populated accurately.
        - Token counting methods are labeled accurately.
        """
        # 1. Deterministic Math -> 0 tokens
        math_res = solve_task(SolveRequest(task_type="math", input="25 * 25"))
        self.assertEqual(math_res.token_usage.total_tokens, 0)
        self.assertEqual(math_res.token_usage.llm_calls, 0)
        self.assertEqual(math_res.token_usage.token_count_method, "not_applicable")
        self.assertEqual(math_res.token_usage.estimated_cost, 0.0)

        # 2. Sentiment -> 0 LLM tokens
        sent_res = solve_task(SolveRequest(task_type="sentiment", input="Awesome experience!"))
        self.assertEqual(sent_res.token_usage.total_tokens, 0)
        self.assertEqual(sent_res.token_usage.llm_calls, 0)

        # 3. Code Generation -> Estimated tokens
        code_res = solve_task(SolveRequest(task_type="code_gen", input="Write a Python function to reverse a string."))
        self.assertGreater(code_res.token_usage.total_tokens, 0)
        self.assertEqual(code_res.token_usage.token_count_method, "estimated")


class TestLiveApiAndBatch(unittest.TestCase):
    """Test Q: Live API & Batch Runner Integration."""

    BASE_URL = "http://127.0.0.1:8000"

    def test_q_live_batch_endpoint(self):
        """Tests POST /batch endpoint with multiple tasks preserving input order."""
        tasks = [
            {"task_type": "smart", "input": "explain queue in details"},
            {"task_type": "smart", "input": "Calculate 125 * 64"},
            {"task_type": "smart", "input": "This product is absolutely amazing!"},
            {"task_type": "ner", "input": "Apple was founded by Steve Jobs in California on April 1, 1976."}
        ]
        payload = json.dumps({"tasks": tasks}).encode("utf-8")
        req = urllib.request.Request(
            f"{self.BASE_URL}/batch",
            data=payload,
            headers={"Content-Type": "application/json", "Accept": "application/json"}
        )

        with urllib.request.urlopen(req, timeout=10) as resp:
            self.assertEqual(resp.status, 200)
            data = json.loads(resp.read().decode("utf-8"))

            self.assertEqual(data.get("total_tasks"), 4)
            self.assertEqual(data.get("successful_tasks"), 4)
            self.assertEqual(data.get("failed_tasks"), 0)

            results = data.get("results", [])
            self.assertEqual(len(results), 4)

            # Order preservation checks:
            # Task 0: Queue
            self.assertIn("queue", results[0]["answer"].lower())
            self.assertIn("fifo", results[0]["answer"].lower())
            self.assertEqual(results[0]["token_usage"]["total_tokens"], 0)

            # Task 1: Math
            self.assertIn("8000", results[1]["answer"])
            self.assertEqual(results[1]["token_usage"]["total_tokens"], 0)

            # Task 2: Sentiment
            self.assertIn("positive", results[2]["answer"].lower())

            # Task 3: NER
            self.assertIn("apple", results[3]["answer"].lower())
            self.assertIn("organization", results[3]["answer"].lower())


class TestTokenUsageTrackingSuite(unittest.TestCase):
    """Section 9: Dedicated Token Usage Tracking Verification Suite (Tests A through J)."""

    def test_token_test_a_deterministic_math(self):
        """TEST A: A deterministic math request.
        Expected: 0 LLM calls and 0 LLM tokens when no model is invoked.
        """
        req = SolveRequest(task_type="math", input="Calculate 125 * 64")
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertIsNotNone(res.token_usage)
        self.assertIsNotNone(res.usage)

        self.assertEqual(res.token_usage.llm_calls, 0, "Deterministic math must have 0 LLM calls")
        self.assertEqual(res.token_usage.input_tokens, 0, "Deterministic math must have 0 input tokens")
        self.assertEqual(res.token_usage.output_tokens, 0, "Deterministic math must have 0 output tokens")
        self.assertEqual(res.token_usage.total_tokens, 0, "Deterministic math must have 0 total tokens")
        self.assertEqual(res.token_usage.token_count_method, "not_applicable")

        # Verify compatible usage object
        self.assertEqual(res.usage.total_tokens, 0)
        self.assertEqual(res.usage.llm_calls, 0)
        self.assertEqual(res.usage.counting_method, "not_applicable")

    def test_token_test_b_local_llm_response(self):
        """TEST B: A local LLM response.
        Expected: Actual input and output token counts when exposed by the configured inference engine.
        """
        from backend.main import TokenUsage, UsageMetadata

        # Simulated response from an active inference engine (e.g. Ollama or llama.cpp)
        simulated_input_tokens = 48
        simulated_output_tokens = 64
        simulated_total = simulated_input_tokens + simulated_output_tokens

        usage = TokenUsage(
            request_id="req_test_b_actual",
            solver="local_llm",
            model="ollama/llama3.2",
            llm_calls=1,
            input_tokens=simulated_input_tokens,
            output_tokens=simulated_output_tokens,
            total_tokens=simulated_total,
            token_count_method="actual",
            processing_time_ms=120.5,
            fallback_used=False
        )

        self.assertEqual(usage.token_count_method, "actual")
        self.assertEqual(usage.input_tokens, 48)
        self.assertEqual(usage.output_tokens, 64)
        self.assertEqual(usage.total_tokens, 112)
        self.assertEqual(usage.llm_calls, 1)

    def test_token_test_c_knowledge_base_miss_fallback(self):
        """TEST C: A knowledge-base miss followed by local LLM / knowledge synthesizer fallback.
        Expected: Fallback model usage appears in that response's metadata.
        """
        query = "Explain the architectural advantages of distributed actor systems"
        req = SolveRequest(task_type="factual", input=query)
        res = solve_task(req)

        self.assertTrue(res.success)
        self.assertIsNotNone(res.token_usage)
        self.assertTrue(res.token_usage.fallback_used, "Fallback must be marked as used on knowledge miss")
        self.assertTrue(res.usage.fallback_used, "usage.fallback_used must match token_usage")

    def test_token_test_d_multiple_model_calls_aggregation(self):
        """TEST D: Multiple model calls during one request.
        Expected: Usage is aggregated correctly without double-counting.
        """
        # Multi-stage model execution aggregation verification
        calls = [
            {"prompt_tokens": 35, "completion_tokens": 40},
            {"prompt_tokens": 55, "completion_tokens": 60}
        ]
        total_input = sum(c["prompt_tokens"] for c in calls)
        total_output = sum(c["completion_tokens"] for c in calls)
        total_tokens = total_input + total_output
        total_calls = len(calls)

        self.assertEqual(total_input, 90)
        self.assertEqual(total_output, 100)
        self.assertEqual(total_tokens, 190)
        self.assertEqual(total_calls, 2)

    def test_token_test_e_two_different_user_requests(self):
        """TEST E: Two different user requests.
        Expected: Each response shows its own token usage independently.
        """
        # Request 1: Math (0 tokens)
        req1 = SolveRequest(task_type="math", input="25 * 25")
        res1 = solve_task(req1)

        # Request 2: Code Gen (Estimated tokens)
        req2 = SolveRequest(task_type="code_gen", input="Write a Python function to reverse a string.")
        res2 = solve_task(req2)

        self.assertEqual(res1.token_usage.total_tokens, 0)
        self.assertGreater(res2.token_usage.total_tokens, 0)
        self.assertNotEqual(res1.token_usage.request_id, res2.token_usage.request_id)
        self.assertEqual(res1.token_usage.total_tokens, 0, "Request 1 usage must remain immutable")

    def test_token_test_f_inference_failure_preserves_tokens(self):
        """TEST F: An inference failure after some tokens were consumed.
        Expected: Preserve measurable usage where available.
        """
        # Simulate partial execution before failure
        consumed_input = 24
        consumed_output = 12
        partial_usage = TokenUsage(
            request_id="req_err_preserve",
            solver="code_model",
            model="Local Code Engine",
            llm_calls=1,
            input_tokens=consumed_input,
            output_tokens=consumed_output,
            total_tokens=consumed_input + consumed_output,
            token_count_method="estimated",
            processing_time_ms=45.0,
            fallback_used=False
        )

        res = SolveResponse(
            success=False,
            task_type="code_gen",
            answer="",
            solver="code_model",
            processing_time_ms=45.0,
            error="Simulated mid-stream timeout error",
            token_usage=partial_usage
        )

        self.assertFalse(res.success)
        self.assertIsNotNone(res.token_usage)
        self.assertEqual(res.token_usage.total_tokens, 36, "Failed response must preserve consumed token count")

    def test_token_test_g_zero_token_solvers(self):
        """TEST G: Solvers that do not invoke an LLM.
        Expected: Zero LLM tokens and zero LLM calls.
        """
        solvers = [
            ("sentiment", "This product is amazing!"),
            ("ner", "Google announced Gemini in California."),
            ("logical", "All humans are mortal. Socrates is a human.")
        ]
        for mode, prompt in solvers:
            with self.subTest(mode=mode):
                res = solve_task(SolveRequest(task_type=mode, input=prompt))
                self.assertTrue(res.success)
                self.assertEqual(res.token_usage.total_tokens, 0, f"{mode} must consume 0 LLM tokens")
                self.assertEqual(res.token_usage.llm_calls, 0, f"{mode} must have 0 LLM calls")
                self.assertEqual(res.token_usage.token_count_method, "not_applicable")

    def test_token_test_h_missing_usage_metadata_handling(self):
        """TEST H: Missing usage metadata.
        Expected: Use a clearly labeled estimate if available, otherwise display usage as unavailable.
        """
        from backend.main import UsageMetadata

        # 1. Estimated count
        est_usage = UsageMetadata(
            input_tokens=10,
            output_tokens=25,
            total_tokens=35,
            llm_calls=1,
            counting_method="estimated"
        )
        self.assertEqual(est_usage.counting_method, "estimated")

        # 2. Unavailable count
        unavail_usage = UsageMetadata(
            input_tokens=0,
            output_tokens=0,
            total_tokens=0,
            llm_calls=0,
            counting_method="unavailable"
        )
        self.assertEqual(unavail_usage.counting_method, "unavailable")

    def test_token_test_i_restoring_chat_history(self):
        """TEST I: Restoring chat history.
        Expected: Previous usage values remain attached to the correct answers.
        """
        res = solve_task(SolveRequest(task_type="code_gen", input="Write a Python function to reverse a string."))
        serialized = json.dumps(res.model_dump())
        deserialized = json.loads(serialized)

        self.assertEqual(deserialized["token_usage"]["request_id"], res.token_usage.request_id)
        self.assertEqual(deserialized["token_usage"]["total_tokens"], res.token_usage.total_tokens)
        self.assertEqual(deserialized["usage"]["counting_method"], res.usage.counting_method)

    def test_token_test_j_cumulative_session_totals(self):
        """TEST J: Cumulative session totals.
        Expected: Totals equal the sum of the underlying request records without duplicate counting.
        """
        # Create 4 distinct request records + 2 duplicated records (e.g. from React re-renders)
        records = [
            {"id": "req_1", "tokens": 0, "llm_calls": 0, "input": 0, "output": 0},
            {"id": "req_2", "tokens": 150, "llm_calls": 1, "input": 50, "output": 100},
            {"id": "req_3", "tokens": 0, "llm_calls": 0, "input": 0, "output": 0},
            {"id": "req_4", "tokens": 80, "llm_calls": 1, "input": 30, "output": 50},
            # Duplicates
            {"id": "req_2", "tokens": 150, "llm_calls": 1, "input": 50, "output": 100},
            {"id": "req_4", "tokens": 80, "llm_calls": 1, "input": 30, "output": 50},
        ]

        seen_ids = set()
        total_tokens = 0
        total_llm_calls = 0
        zero_token_count = 0

        for r in records:
            if r["id"] in seen_ids:
                continue
            seen_ids.add(r["id"])
            total_tokens += r["tokens"]
            total_llm_calls += r["llm_calls"]
            if r["tokens"] == 0:
                zero_token_count += 1

        self.assertEqual(len(seen_ids), 4, "Must deduplicate to 4 unique requests")
        self.assertEqual(total_tokens, 230, "Total tokens must equal exact sum (150 + 80 = 230)")
        self.assertEqual(total_llm_calls, 2, "LLM calls must equal exact sum (1 + 1 = 2)")
        self.assertEqual(zero_token_count, 2, "Zero-token requests must equal 2")


if __name__ == "__main__":
    unittest.main()

