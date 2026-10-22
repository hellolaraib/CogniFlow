"""CogniFlow Version-Controlled Benchmark & Evaluation Dataset.

Defines a comprehensive dataset of 110+ diverse test cases across 14 categories:
1. Arithmetic & Percentages (deterministic AST)
2. Symbolic Mathematics (equations, factorials, statistics)
3. General Knowledge (factual Q&A)
4. Concept Explanations (educational & conceptual)
5. C Programming (data structures, algorithms, syntax & compilation)
6. Code Debugging (off-by-one, memory, syntax errors)
7. Summarization (extractive technical summaries)
8. Sentiment Analysis (lexical polarity, reviews)
9. Named Entity Recognition (entities, locations, organizations, dates)
10. Logical Reasoning (syllogisms, propositional logic, boolean SAT)
11. Multi-Intent Questions (compound multi-task dispatch)
12. Follow-Up Questions & Conversation Context (multi-turn context retention)
13. Ambiguous / Underspecified Questions (graceful clarification)
14. Provider Rate Limits & Failure Recovery (graceful error handling & honest token accounting)
"""

from typing import List, Dict, Any, Optional

BENCHMARK_CATEGORIES = [
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

BENCHMARK_DATASET: List[Dict[str, Any]] = [
    # =========================================================================
    # 1. ARITHMETIC & PERCENTAGES (Deterministic Math Engine - 0 LLM Tokens)
    # =========================================================================
    {
        "id": "tc_arith_01",
        "category": "arithmetic",
        "input": "Calculate 125 * 64",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 8000, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_arith_02",
        "category": "arithmetic",
        "input": "what is 45% of 320",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 144, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 135
    },
    {
        "id": "tc_arith_03",
        "category": "arithmetic",
        "input": "sqrt(144) + 10",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 22, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 130
    },
    {
        "id": "tc_arith_04",
        "category": "arithmetic",
        "input": "(15 - 5) * (8 + 2)",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 100, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 135
    },
    {
        "id": "tc_arith_05",
        "category": "arithmetic",
        "input": "2 to the power of 8",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 256, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 130
    },
    {
        "id": "tc_arith_06",
        "category": "arithmetic",
        "input": "what is 100 / 4?",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 25, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 130
    },
    {
        "id": "tc_arith_07",
        "category": "arithmetic",
        "input": "35% of 800",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 280, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 135
    },
    {
        "id": "tc_arith_08",
        "category": "arithmetic",
        "input": "what is 25 * 4?",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 100, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 130
    },
    {
        "id": "tc_arith_09",
        "category": "arithmetic",
        "input": "divide 1000 by 8",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 125, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 130
    },

    # =========================================================================
    # 2. SYMBOLIC MATHEMATICS & STATISTICS (Deterministic Algebra / Stats)
    # =========================================================================
    {
        "id": "tc_sym_01",
        "category": "symbolic_math",
        "input": "solve 2x + 5 = 15",
        "expected_solver": "python",
        "eval_method": "algebraic_equation",
        "eval_criteria": {"variable": "x", "expected_value": 5},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 160
    },
    {
        "id": "tc_sym_02",
        "category": "symbolic_math",
        "input": "solve 3x - 9 = 0",
        "expected_solver": "python",
        "eval_method": "algebraic_equation",
        "eval_criteria": {"variable": "x", "expected_value": 3},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 160
    },
    {
        "id": "tc_sym_03",
        "category": "symbolic_math",
        "input": "solve 4x + 12 = 36",
        "expected_solver": "python",
        "eval_method": "algebraic_equation",
        "eval_criteria": {"variable": "x", "expected_value": 6},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 160
    },
    {
        "id": "tc_sym_04",
        "category": "symbolic_math",
        "input": "factorial(6)",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 720, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sym_05",
        "category": "symbolic_math",
        "input": "5!",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 120, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 130
    },
    {
        "id": "tc_sym_06",
        "category": "symbolic_math",
        "input": "mean([10, 20, 30, 40])",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 25, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sym_07",
        "category": "symbolic_math",
        "input": "median([1, 5, 2, 8, 7])",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 5, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sym_08",
        "category": "symbolic_math",
        "input": "sum([5, 15, 25, 35])",
        "expected_solver": "python",
        "eval_method": "numeric_match",
        "eval_criteria": {"expected_value": 80, "tolerance": 0.001},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 135
    },

    # =========================================================================
    # 3. GENERAL KNOWLEDGE (Open-Ended / Fact Retrieval)
    # =========================================================================
    {
        "id": "tc_gk_01",
        "category": "general_knowledge",
        "input": "What is the capital of France?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["Paris"], "min_length": 5},
        "requires_live_llm": True,
        "offline_reference_answer": "The capital of France is Paris.",
        "baseline_tokens_estimate": 80
    },
    {
        "id": "tc_gk_02",
        "category": "general_knowledge",
        "input": "Who wrote Romeo and Juliet?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["William Shakespeare", "Shakespeare"], "min_length": 10},
        "requires_live_llm": True,
        "offline_reference_answer": "Romeo and Juliet was written by William Shakespeare.",
        "baseline_tokens_estimate": 85
    },
    {
        "id": "tc_gk_03",
        "category": "general_knowledge",
        "input": "What is the speed of light in vacuum?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["299,792", "300,000 km/s", "3 x 10^8", "300,000,000", "299792458"], "min_length": 15},
        "requires_live_llm": True,
        "offline_reference_answer": "The speed of light in a vacuum is approximately 299,792,458 meters per second (about 300,000 km/s).",
        "baseline_tokens_estimate": 95
    },
    {
        "id": "tc_gk_04",
        "category": "general_knowledge",
        "input": "What is the boiling point of water at standard atmospheric pressure?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["100", "100°C", "212°F", "373.15 K"], "min_length": 10},
        "requires_live_llm": True,
        "offline_reference_answer": "At standard atmospheric pressure (1 atm), the boiling point of water is 100°C (212°F or 373.15 K).",
        "baseline_tokens_estimate": 90
    },
    {
        "id": "tc_gk_05",
        "category": "general_knowledge",
        "input": "What is the chemical symbol for gold?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["Au", "aurum"], "min_length": 2},
        "requires_live_llm": True,
        "offline_reference_answer": "The chemical symbol for gold is Au, derived from the Latin word aurum.",
        "baseline_tokens_estimate": 80
    },
    {
        "id": "tc_gk_06",
        "category": "general_knowledge",
        "input": "Who proposed the theory of general relativity?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["Albert Einstein", "Einstein"], "min_length": 10},
        "requires_live_llm": True,
        "offline_reference_answer": "The theory of general relativity was published by Albert Einstein in 1915.",
        "baseline_tokens_estimate": 90
    },
    {
        "id": "tc_gk_07",
        "category": "general_knowledge",
        "input": "What planet is known as the Red Planet?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["Mars"], "min_length": 4},
        "requires_live_llm": True,
        "offline_reference_answer": "Mars is known as the Red Planet due to iron oxide on its surface.",
        "baseline_tokens_estimate": 80
    },
    {
        "id": "tc_gk_08",
        "category": "general_knowledge",
        "input": "In which continent is the Sahara Desert located?",
        "expected_solver": "general_llm",
        "eval_method": "contains_any_phrase",
        "eval_criteria": {"phrases": ["Africa"], "min_length": 6},
        "requires_live_llm": True,
        "offline_reference_answer": "The Sahara Desert is located on the continent of Africa.",
        "baseline_tokens_estimate": 80
    },

    # =========================================================================
    # 4. CONCEPT EXPLANATIONS (Educational & Architectural Reasoning)
    # =========================================================================
    {
        "id": "tc_exp_01",
        "category": "concept_explanation",
        "input": "Explain how a binary search tree works in simple terms",
        "expected_solver": "factual",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["root", "left", "right"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "A Binary Search Tree (BST) is a hierarchical node-based data structure with a root node. Each node has at most two children: the left subtree contains values smaller than the root, while the right subtree contains values greater than the root, enabling efficient O(log n) searches.",
        "baseline_tokens_estimate": 350
    },
    {
        "id": "tc_exp_02",
        "category": "concept_explanation",
        "input": "explain queue in details",
        "expected_solver": "factual",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["FIFO", "enqueue", "dequeue"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 320
    },
    {
        "id": "tc_exp_03",
        "category": "concept_explanation",
        "input": "Explain the concept of recursion with an example",
        "expected_solver": "general_llm",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["base case", "call", "function"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "Recursion is a programming technique where a function calls itself to solve smaller subproblems. Every recursive function requires a base case to terminate execution and prevent infinite stack growth, as well as a recursive step.",
        "baseline_tokens_estimate": 380
    },
    {
        "id": "tc_exp_04",
        "category": "concept_explanation",
        "input": "What is polymorphism in object-oriented programming?",
        "expected_solver": "general_llm",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["method", "class", "interface"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "Polymorphism allows objects of different classes to be treated through a common interface. It encompasses compile-time polymorphism (method overloading) and runtime polymorphism (method overriding via virtual functions or inheritance).",
        "baseline_tokens_estimate": 360
    },
    {
        "id": "tc_exp_05",
        "category": "concept_explanation",
        "input": "Explain the difference between stack and heap memory",
        "expected_solver": "general_llm",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["stack", "heap", "allocation"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "Stack memory is automatically managed, fast, and stores local variables and call frames in LIFO order. Heap memory is dynamically allocated at runtime (e.g., malloc or new), has a larger capacity, but requires explicit deallocation and has higher overhead.",
        "baseline_tokens_estimate": 390
    },
    {
        "id": "tc_exp_06",
        "category": "concept_explanation",
        "input": "Explain how virtual memory works in modern operating systems",
        "expected_solver": "general_llm",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["page", "address", "RAM"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "Virtual memory abstracts physical RAM by giving each process its own contiguous virtual address space. The Memory Management Unit (MMU) translates virtual addresses into physical addresses using page tables, swapping pages to secondary storage when RAM is exhausted.",
        "baseline_tokens_estimate": 400
    },
    {
        "id": "tc_exp_07",
        "category": "concept_explanation",
        "input": "What is the difference between TCP and UDP?",
        "expected_solver": "general_llm",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["connection", "reliable", "packet"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "TCP is a connection-oriented, reliable protocol that guarantees packet delivery and ordering via handshakes and acknowledgments. UDP is connectionless and lightweight, offering low latency without delivery guarantees, ideal for streaming and gaming.",
        "baseline_tokens_estimate": 380
    },
    {
        "id": "tc_exp_08",
        "category": "concept_explanation",
        "input": "Explain how hash tables achieve O(1) average lookup time",
        "expected_solver": "general_llm",
        "eval_method": "concept_completeness",
        "eval_criteria": {
            "required_concepts": ["hash function", "index", "collision"],
            "min_words": 25,
            "forbid_placeholders": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "Hash tables compute an array index from a key using a deterministic hash function. This allows direct memory addressing in O(1) average time. When different keys hash to the same bucket, collision resolution techniques such as chaining or open addressing are used.",
        "baseline_tokens_estimate": 380
    },

    # =========================================================================
    # 5. C PROGRAMMING (Syntax Verification & Clang Compilation Check)
    # =========================================================================
    {
        "id": "tc_c_01",
        "category": "c_programming",
        "input": "Write a C program for binary tree inorder traversal and explain it step by step.",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["#include <stdio.h>", "struct Node", "inorderTraversal", "main"],
            "forbid": ["def ", "Explain_binary_trees_in_simple", "// TODO"],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n"
            "#include <stdlib.h>\n\n"
            "struct Node {\n    int data;\n    struct Node* left;\n    struct Node* right;\n};\n\n"
            "struct Node* createNode(int val) {\n"
            "    struct Node* n = (struct Node*)malloc(sizeof(struct Node));\n"
            "    n->data = val; n->left = NULL; n->right = NULL;\n"
            "    return n;\n"
            "}\n\n"
            "void inorderTraversal(struct Node* root) {\n"
            "    if (root == NULL) return;\n"
            "    inorderTraversal(root->left);\n"
            "    printf(\"%d \", root->data);\n"
            "    inorderTraversal(root->right);\n"
            "}\n\n"
            "int main() {\n"
            "    struct Node* root = createNode(1);\n"
            "    root->left = createNode(2);\n"
            "    root->right = createNode(3);\n"
            "    inorderTraversal(root);\n"
            "    printf(\"\\n\");\n"
            "    free(root->left);\n    free(root->right);\n    free(root);\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 550
    },
    {
        "id": "tc_c_02",
        "category": "c_programming",
        "input": "Write a C program to reverse a singly linked list with a working main function.",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["#include <stdio.h>", "struct Node", "prev", "current", "next"],
            "forbid": ["def ", "// TODO"],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n"
            "#include <stdlib.h>\n\n"
            "struct Node {\n    int data;\n    struct Node* next;\n};\n\n"
            "struct Node* reverseList(struct Node* head) {\n"
            "    struct Node *prev = NULL, *current = head, *next = NULL;\n"
            "    while (current != NULL) {\n"
            "        next = current->next;\n"
            "        current->next = prev;\n"
            "        prev = current;\n"
            "        current = next;\n"
            "    }\n"
            "    return prev;\n"
            "}\n\n"
            "int main() {\n"
            "    struct Node a = {1, NULL}, b = {2, NULL};\n"
            "    a.next = &b;\n"
            "    struct Node* rev = reverseList(&a);\n"
            "    printf(\"Head: %d\\n\", rev->data);\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 450
    },
    {
        "id": "tc_c_03",
        "category": "c_programming",
        "input": "Write a C function to compute Fibonacci numbers iteratively",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["int", "fibonacci", "for"],
            "forbid": ["def "],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n\n"
            "int fibonacci(int n) {\n"
            "    if (n <= 1) return n;\n"
            "    int a = 0, b = 1, c;\n"
            "    for (int i = 2; i <= n; i++) {\n"
            "        c = a + b;\n"
            "        a = b;\n"
            "        b = c;\n"
            "    }\n"
            "    return b;\n"
            "}\n\n"
            "int main() {\n"
            "    printf(\"fib(7) = %d\\n\", fibonacci(7));\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 400
    },
    {
        "id": "tc_c_04",
        "category": "c_programming",
        "input": "Write a C program to check if a string is a palindrome",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["#include <stdio.h>", "#include <string.h>", "main"],
            "forbid": ["def "],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n"
            "#include <string.h>\n\n"
            "int isPalindrome(const char* s) {\n"
            "    int left = 0, right = strlen(s) - 1;\n"
            "    while (left < right) {\n"
            "        if (s[left] != s[right]) return 0;\n"
            "        left++; right--;\n"
            "    }\n"
            "    return 1;\n"
            "}\n\n"
            "int main() {\n"
            "    printf(\"%d\\n\", isPalindrome(\"racecar\"));\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 420
    },
    {
        "id": "tc_c_05",
        "category": "c_programming",
        "input": "Write a C program implementing a stack using a fixed array with push and pop operations",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["#include <stdio.h>", "push", "pop", "top"],
            "forbid": ["def "],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n"
            "#define MAX 100\n\n"
            "int stack[MAX];\n"
            "int top = -1;\n\n"
            "void push(int val) {\n"
            "    if (top < MAX - 1) stack[++top] = val;\n"
            "}\n\n"
            "int pop() {\n"
            "    if (top >= 0) return stack[top--];\n"
            "    return -1;\n"
            "}\n\n"
            "int main() {\n"
            "    push(10); push(20);\n"
            "    printf(\"%d\\n\", pop());\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 480
    },
    {
        "id": "tc_c_06",
        "category": "c_programming",
        "input": "Write a C function to find the maximum element in an integer array",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["int findMax", "for", "return"],
            "forbid": ["def "],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n\n"
            "int findMax(int arr[], int size) {\n"
            "    int max = arr[0];\n"
            "    for (int i = 1; i < size; i++) {\n"
            "        if (arr[i] > max) max = arr[i];\n"
            "    }\n"
            "    return max;\n"
            "}\n\n"
            "int main() {\n"
            "    int a[] = {3, 7, 2, 9, 5};\n"
            "    printf(\"Max: %d\\n\", findMax(a, 5));\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 380
    },
    {
        "id": "tc_c_07",
        "category": "c_programming",
        "input": "Write a C program for binary search on a sorted integer array",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["#include <stdio.h>", "binarySearch", "mid", "low", "high"],
            "forbid": ["def "],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n\n"
            "int binarySearch(int arr[], int size, int target) {\n"
            "    int low = 0, high = size - 1;\n"
            "    while (low <= high) {\n"
            "        int mid = low + (high - low) / 2;\n"
            "        if (arr[mid] == target) return mid;\n"
            "        if (arr[mid] < target) low = mid + 1;\n"
            "        else high = mid - 1;\n"
            "    }\n"
            "    return -1;\n"
            "}\n\n"
            "int main() {\n"
            "    int nums[] = {2, 5, 8, 12, 16};\n"
            "    printf(\"Index: %d\\n\", binarySearch(nums, 5, 12));\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 460
    },
    {
        "id": "tc_c_08",
        "category": "c_programming",
        "input": "Write a C program to count vowels in a string",
        "expected_solver": "general_llm",
        "eval_method": "c_code_verification",
        "eval_criteria": {
            "must_contain": ["#include <stdio.h>", "vowels", "main"],
            "forbid": ["def "],
            "compile_test": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": (
            "```c\n"
            "#include <stdio.h>\n\n"
            "int countVowels(const char* s) {\n"
            "    int count = 0;\n"
            "    for (int i = 0; s[i] != '\\0'; i++) {\n"
            "        char c = s[i];\n"
            "        if (c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u' ||\n"
            "            c == 'A' || c == 'E' || c == 'I' || c == 'O' || c == 'U') count++;\n"
            "    }\n"
            "    return count;\n"
            "}\n\n"
            "int main() {\n"
            "    printf(\"Vowels: %d\\n\", countVowels(\"hello world\"));\n"
            "    return 0;\n"
            "}\n"
            "```\n"
        ),
        "baseline_tokens_estimate": 410
    },

    # =========================================================================
    # 6. CODE DEBUGGING (Deterministic AST & Snippet Diagnostic Engine)
    # =========================================================================
    {
        "id": "tc_dbg_01",
        "category": "code_debugging",
        "input": "debug this code:\ndef sum_list(items):\n  for i in range(len(items) + 1):\n    print(items[i])",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["IndexError", "off-by-one", "range"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 240
    },
    {
        "id": "tc_dbg_02",
        "category": "code_debugging",
        "input": "fix bug in:\nfor (int i = 0; i <= n; i++) { arr[i] = 0; }",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["off-by-one", "overflow", "< n"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 220
    },
    {
        "id": "tc_dbg_03",
        "category": "code_debugging",
        "input": "debug this null pointer bug:\nint *p = NULL;\n*p = 10;",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["null pointer", "dereference", "NULL"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 230
    },
    {
        "id": "tc_dbg_04",
        "category": "code_debugging",
        "input": "debug recursion error:\ndef fib(n):\n  return fib(n - 1) + fib(n - 2)",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["base case", "recursion", "infinite"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 240
    },
    {
        "id": "tc_dbg_05",
        "category": "code_debugging",
        "input": "debug exception:\ndef divide(a, b):\n  return a / b",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["ZeroDivisionError", "division by zero", "zero"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 220
    },
    {
        "id": "tc_dbg_06",
        "category": "code_debugging",
        "input": "fix compile error:\nchar str[5] = \"hello\";",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["null terminator", "6", "\\0"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 230
    },
    {
        "id": "tc_dbg_07",
        "category": "code_debugging",
        "input": "why does this fail:\nwhile (i > 0) {\n  count++;\n}",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["infinite loop", "decrement", "i--"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 230
    },
    {
        "id": "tc_dbg_08",
        "category": "code_debugging",
        "input": "fix traceback in python:\ndef get_item(d, key):\n  return d[key]",
        "expected_solver": "code_debug",
        "eval_method": "bug_identification",
        "eval_criteria": {"must_identify": ["KeyError", "get", "dict"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 220
    },

    # =========================================================================
    # 7. SUMMARIZATION (Extractive NLP Engine)
    # =========================================================================
    {
        "id": "tc_sum_01",
        "category": "summarization",
        "input": (
            "summarize this text: Operating systems manage computer hardware resources and provide common services "
            "for application software. The kernel is the core component that controls memory, CPU scheduling, "
            "device drivers, and system calls. Without an operating system, each application would have to interact "
            "directly with the hardware, leading to massive duplication and stability problems."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.75, "min_words": 10},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 280
    },
    {
        "id": "tc_sum_02",
        "category": "summarization",
        "input": (
            "summarize the following passage: Microservices architecture structures an application as a collection "
            "of loosely coupled, independently deployable services. Each service typically implements a specific "
            "business capability and communicates via lightweight protocols such as HTTP REST or gRPC. "
            "While this architecture enhances scalability and developer velocity, it introduces complexity in "
            "distributed transaction management, network latency, and observability."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.75, "min_words": 12},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 290
    },
    {
        "id": "tc_sum_03",
        "category": "summarization",
        "input": (
            "summarize: Database indexing utilizes data structures like B-trees and hash indexes to speed up "
            "query execution times. By maintaining ordered pointers to disk blocks, queries avoid costly full table "
            "scans. However, indexes consume additional storage space and incur write overhead during insertion."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.8, "min_words": 10},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 260
    },
    {
        "id": "tc_sum_04",
        "category": "summarization",
        "input": (
            "summarize this article: Gradient descent is an optimization algorithm used to train machine learning "
            "models by iteratively minimizing a loss function. In each iteration, parameters are updated in the "
            "opposite direction of the gradient scaled by the learning rate. Stochastic gradient descent updates "
            "weights per batch, speeding up training on massive datasets."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.8, "min_words": 10},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 270
    },
    {
        "id": "tc_sum_05",
        "category": "summarization",
        "input": (
            "summarize: The TLS protocol provides privacy and data integrity between two communicating computer "
            "applications. During the initial TLS handshake, the client and server agree on cryptographic parameters "
            "and authenticate using digital certificates. Symmetric session keys are then derived for bulk encryption."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.8, "min_words": 10},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 270
    },
    {
        "id": "tc_sum_06",
        "category": "summarization",
        "input": (
            "summarize: CogniFlow is an intelligent task router that dispatches incoming queries to deterministic "
            "solvers or general AI models. By solving mathematical calculations, lexical sentiment, and logic checks "
            "locally, CogniFlow eliminates cloud token expenses while maintaining sub-millisecond execution times."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.8, "min_words": 10},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 260
    },
    {
        "id": "tc_sum_07",
        "category": "summarization",
        "input": (
            "summarize: The Raft consensus algorithm was designed for manageability and fault tolerance in "
            "distributed systems. It elects a leader to manage replicated logs and relies on term numbers and "
            "heartbeat timers to detect split-brain conditions. Leader changes require consensus from a quorum."
        ),
        "expected_solver": "summarization",
        "eval_method": "extractive_summary",
        "eval_criteria": {"max_ratio": 0.8, "min_words": 10},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 270
    },

    # =========================================================================
    # 8. SENTIMENT ANALYSIS (Lexical VADER Engine - 0 LLM Tokens)
    # =========================================================================
    {
        "id": "tc_sent_01",
        "category": "sentiment",
        "input": "This product is absolutely amazing and exceeded all expectations!",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "positive"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sent_02",
        "category": "sentiment",
        "input": "Horrible customer support, wasted three days waiting.",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "negative"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sent_03",
        "category": "sentiment",
        "input": "Analyze sentiment of this review: The software is great and fast",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "positive"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 145
    },
    {
        "id": "tc_sent_04",
        "category": "sentiment",
        "input": "sentiment analysis: Worst experience ever, completely broken.",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "negative"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sent_05",
        "category": "sentiment",
        "input": "review: works like a charm, flawless performance!",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "positive"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sent_06",
        "category": "sentiment",
        "input": "rating: waste of money, do not recommend.",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "negative"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },
    {
        "id": "tc_sent_07",
        "category": "sentiment",
        "input": "is this positive: This tool is awesome and saved me hours of manual labor!",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "positive"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_sent_08",
        "category": "sentiment",
        "input": "sentiment: terrible experience with poor shipping.",
        "expected_solver": "lightweight_nlp",
        "eval_method": "sentiment_polarity",
        "eval_criteria": {"expected_polarity": "negative"},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 140
    },

    # =========================================================================
    # 9. NAMED ENTITY RECOGNITION (Regex / Pattern Matcher - 0 LLM Tokens)
    # =========================================================================
    {
        "id": "tc_ner_01",
        "category": "ner",
        "input": "Apple was founded by Steve Jobs in California on April 1, 1976.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Apple", "Steve Jobs", "California", "1976"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 170
    },
    {
        "id": "tc_ner_02",
        "category": "ner",
        "input": "Sundar Pichai visited London yesterday for the Google AI summit.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Sundar Pichai", "London", "Google"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 165
    },
    {
        "id": "tc_ner_03",
        "category": "ner",
        "input": "extract entities: Elon Musk announced Tesla will build a Gigafactory in Texas.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Elon Musk", "Tesla", "Texas"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 165
    },
    {
        "id": "tc_ner_04",
        "category": "ner",
        "input": "find entities: Microsoft acquired GitHub in San Francisco on June 4, 2018 for $7.5B.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Microsoft", "GitHub", "San Francisco", "2018"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 175
    },
    {
        "id": "tc_ner_05",
        "category": "ner",
        "input": "ner: Satya Nadella spoke at the conference in Seattle on November 15, 2023.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Satya Nadella", "Seattle", "2023"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 165
    },
    {
        "id": "tc_ner_06",
        "category": "ner",
        "input": "extract organizations: Amazon opened its headquarters in Arlington, Virginia.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Amazon", "Arlington", "Virginia"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 165
    },
    {
        "id": "tc_ner_07",
        "category": "ner",
        "input": "extract names: Mark Zuckerberg launched Meta in Cambridge, Massachusetts in 2004.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Mark Zuckerberg", "Meta", "Cambridge", "2004"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 170
    },
    {
        "id": "tc_ner_08",
        "category": "ner",
        "input": "extract entities: Google announced Gemini in California.",
        "expected_solver": "regex_spacy",
        "eval_method": "entities_extracted",
        "eval_criteria": {"expected_entities": ["Google", "Gemini", "California"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 160
    },

    # =========================================================================
    # 10. LOGICAL REASONING (Propositional / SMT Theorem Solver - 0 LLM Tokens)
    # =========================================================================
    {
        "id": "tc_log_01",
        "category": "logical_reasoning",
        "input": "All humans are mortal. Socrates is a human. Is Socrates mortal?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "Valid", "must_contain": ["mortal"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 180
    },
    {
        "id": "tc_log_02",
        "category": "logical_reasoning",
        "input": "If A implies B and B implies C, does A imply C?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "Valid", "must_contain": ["transitive"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 170
    },
    {
        "id": "tc_log_03",
        "category": "logical_reasoning",
        "input": "Is the proposition P and not P satisfiable?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "Contradiction", "must_contain": ["unsatisfiable"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 165
    },
    {
        "id": "tc_log_04",
        "category": "logical_reasoning",
        "input": "All dogs are mammals. All mammals are animals. Are all dogs animals?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "Valid", "must_contain": ["valid", "animals"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 175
    },
    {
        "id": "tc_log_05",
        "category": "logical_reasoning",
        "input": "If it rains the ground is wet. The ground is not wet. Did it rain?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "No", "must_contain": ["tollens", "no"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 180
    },
    {
        "id": "tc_log_06",
        "category": "logical_reasoning",
        "input": "Either A or B is true. A is false. Does it follow that B is true?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "Valid", "must_contain": ["syllogism", "true"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 170
    },
    {
        "id": "tc_log_07",
        "category": "logical_reasoning",
        "input": "Is the statement P or not P a tautology?",
        "expected_solver": "smt_solver",
        "eval_method": "logical_conclusion",
        "eval_criteria": {"expected_verdict": "Tautology", "must_contain": ["tautology", "valid"]},
        "requires_live_llm": False,
        "baseline_tokens_estimate": 165
    },

    # =========================================================================
    # 11. MULTI-INTENT QUESTIONS (Compound Sub-Task Dispatch)
    # =========================================================================
    {
        "id": "tc_multi_01",
        "category": "multi_intent",
        "input": "What is 15 * 8? Also explain binary trees in simple language.",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "120",
            "part2_content": "binary tree",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "### Part 1: Mathematical Calculation\n**120**\n\n`15 * 8 = 120`\n\n---\n\n### Part 2: Response\nA binary tree is a hierarchical data structure where each node has at most two children: left and right.",
        "baseline_tokens_estimate": 450
    },
    {
        "id": "tc_multi_02",
        "category": "multi_intent",
        "input": "Calculate 125 * 64 and analyze sentiment of 'Great product!'",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "8000",
            "part2_content": "Positive",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 280
    },
    {
        "id": "tc_multi_03",
        "category": "multi_intent",
        "input": "Compute 45% of 320; extract entities from 'Apple in Cupertino'",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "144",
            "part2_content": "Apple",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 290
    },
    {
        "id": "tc_multi_04",
        "category": "multi_intent",
        "input": "Solve 2x + 5 = 15; What is the sentiment of 'Worst experience ever'?",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "5",
            "part2_content": "Negative",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 290
    },
    {
        "id": "tc_multi_05",
        "category": "multi_intent",
        "input": "Calculate sqrt(144) + 10 and explain what a queue FIFO is",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "22",
            "part2_content": "FIFO",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": False,
        "offline_reference_answer": (
            "A queue is a First-In, First-Out (FIFO) linear data structure where elements are "
            "inserted at the rear (enqueue) and removed from the front (dequeue)."
        ),
        "baseline_tokens_estimate": 350
    },
    {
        "id": "tc_multi_06",
        "category": "multi_intent",
        "input": "What is 50 divided by 2? And check if 'All humans are mortal. Socrates is a human' is valid.",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "25",
            "part2_content": "Valid",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 310
    },
    {
        "id": "tc_multi_07",
        "category": "multi_intent",
        "input": "Compute 2 to the power of 8; write a C program to reverse a string",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "256",
            "part2_content": "#include",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": True,
        "offline_reference_answer": "### Part 1: Mathematical Calculation\n**256**\n\n`2^8 = 256`\n\n---\n\n### Part 2: Response\n```c\n#include <stdio.h>\n#include <string.h>\n\nvoid reverse(char* s) {\n    int l = 0, r = strlen(s) - 1;\n    while (l < r) { char t = s[l]; s[l] = s[r]; s[r] = t; l++; r--; }\n}\n```",
        "baseline_tokens_estimate": 460
    },
    {
        "id": "tc_multi_08",
        "category": "multi_intent",
        "input": "Calculate 100 / 4 and also analyze sentiment of 'Works like a charm'",
        "expected_solver": "smart",
        "eval_method": "multi_part_verification",
        "eval_criteria": {
            "part1_content": "25",
            "part2_content": "Positive",
            "deterministic_part_handled_locally": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 270
    },

    # =========================================================================
    # 12. FOLLOW-UP QUESTIONS & CONTEXT ISOLATION (Multi-Turn Continuity)
    # =========================================================================
    {
        "id": "tc_ctx_01",
        "category": "follow_up_context",
        "input": "How do I insert a node into it?",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "What is a Binary Search Tree?"},
            {"role": "assistant", "content": "A BST is a node-based binary tree data structure where left < root < right."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["insert", "node", "BST", "tree"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "To insert a node into a BST, start at the root: if the new value is less than the current node, move to the left child; if greater, move right. When you reach a NULL position, insert the new node there.",
        "baseline_tokens_estimate": 280
    },
    {
        "id": "tc_ctx_02",
        "category": "follow_up_context",
        "input": "How do they compare to virtual machines?",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "What is Docker?"},
            {"role": "assistant", "content": "Docker is a containerization platform that packages software in lightweight containers sharing the OS kernel."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["containers", "hypervisor", "kernel", "virtual machine"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Containers share the host operating system kernel and are much more lightweight than virtual machines, which require a full guest operating system and hypervisor.",
        "baseline_tokens_estimate": 340
    },
    {
        "id": "tc_ctx_03",
        "category": "follow_up_context",
        "input": "What are its main advantages?",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "Tell me about Python"},
            {"role": "assistant", "content": "Python is a high-level, interpreted programming language known for readability."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["Python", "readability", "libraries"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Python's main advantages include readable syntax, a vast ecosystem of third-party libraries (PyPI), cross-platform portability, and rapid prototyping capabilities.",
        "baseline_tokens_estimate": 300
    },
    {
        "id": "tc_ctx_04",
        "category": "follow_up_context",
        "input": "What is its worst-case time complexity?",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "Explain Quicksort"},
            {"role": "assistant", "content": "Quicksort is a divide-and-conquer sorting algorithm based on partitioning around a pivot."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["O(n^2)", "O(n²)", "worst"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "The worst-case time complexity of Quicksort is O(n²), which occurs when the chosen pivot is repeatedly the smallest or largest element (e.g., on already sorted arrays without randomized pivots).",
        "baseline_tokens_estimate": 260
    },
    {
        "id": "tc_ctx_05",
        "category": "follow_up_context",
        "input": "Now divide that by 2",
        "expected_solver": "python",
        "conversation_history": [
            {"role": "user", "content": "Calculate 50 * 4"},
            {"role": "assistant", "content": "**200**\n\n`50 * 4 = 200`"}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["100"], "context_preserved": True},
        "requires_live_llm": False,
        "offline_reference_answer": "Dividing 200 by 2 gives **100**.",
        "baseline_tokens_estimate": 200
    },
    {
        "id": "tc_ctx_06",
        "category": "follow_up_context",
        "input": "Give an example of a REST endpoint for it",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "What is an API?"},
            {"role": "assistant", "content": "An API (Application Programming Interface) allows software applications to communicate with each other."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["GET", "POST", "/api"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "An example of a REST endpoint is `GET /api/v1/users/123` to retrieve user information or `POST /api/v1/users` to create a new user.",
        "baseline_tokens_estimate": 270
    },
    {
        "id": "tc_ctx_07",
        "category": "follow_up_context",
        "input": "Why does it cause a stack overflow if that case is missing?",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "What is recursion?"},
            {"role": "assistant", "content": "Recursion is when a function calls itself. It needs a base case to know when to stop."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["call stack", "memory", "infinite", "base case"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Without a base case, the function calls itself indefinitely, pushing new stack frames onto the call stack until all allocated stack memory is exhausted, triggering a stack overflow.",
        "baseline_tokens_estimate": 310
    },
    {
        "id": "tc_ctx_08",
        "category": "follow_up_context",
        "input": "What is the time complexity of searching in it?",
        "expected_solver": "general_llm",
        "conversation_history": [
            {"role": "user", "content": "Explain a hash table"},
            {"role": "assistant", "content": "A hash table is a data structure that maps keys to values using a hash function."}
        ],
        "eval_method": "context_followup_verification",
        "eval_criteria": {"must_address": ["O(1)", "constant", "average"], "context_preserved": True},
        "requires_live_llm": True,
        "offline_reference_answer": "The average-case time complexity for searching in a hash table is O(1) (constant time). In the worst case with excessive collisions, it degrades to O(n).",
        "baseline_tokens_estimate": 260
    },

    # =========================================================================
    # 13. AMBIGUOUS OR UNDERSPECIFIED QUESTIONS (Graceful Guidance & Clarification)
    # =========================================================================
    {
        "id": "tc_amb_01",
        "category": "ambiguous_underspecified",
        "input": "Solve the equation",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Please provide the specific equation you would like to solve (for example: `solve 2x + 5 = 15`).",
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_amb_02",
        "category": "ambiguous_underspecified",
        "input": "Which is better?",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Which options or technologies are you comparing? Please specify the items and your criteria (e.g., performance, ease of use).",
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_amb_03",
        "category": "ambiguous_underspecified",
        "input": "Debug this code",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Please share the code snippet you would like me to debug along with any error messages or unexpected behavior you observed.",
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_amb_04",
        "category": "ambiguous_underspecified",
        "input": "Analyze the sentiment",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Please provide the text or customer review whose sentiment you want analyzed.",
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_amb_05",
        "category": "ambiguous_underspecified",
        "input": "Extract entities",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Please provide the sentence or passage from which you want named entities (names, organizations, locations) extracted.",
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_amb_06",
        "category": "ambiguous_underspecified",
        "input": "Sort this",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Please provide the list of numbers or items you would like sorted, and whether you prefer ascending or descending order.",
        "baseline_tokens_estimate": 150
    },
    {
        "id": "tc_amb_07",
        "category": "ambiguous_underspecified",
        "input": "Summarize",
        "expected_solver": "general_llm",
        "eval_method": "clarification_or_guidance",
        "eval_criteria": {"must_request_clarification": True, "no_crash": True},
        "requires_live_llm": True,
        "offline_reference_answer": "Please provide the text or article you would like me to summarize.",
        "baseline_tokens_estimate": 150
    },

    # =========================================================================
    # 14. PROVIDER RATE LIMITS & FAILURE RECOVERY (Honest Error Accounting)
    # =========================================================================
    {
        "id": "tc_fail_01",
        "category": "failure_recovery",
        "input": "Simulate rate limit failure handling on general question",
        "expected_solver": "general_llm",
        "simulate_scenario": "http_429",
        "eval_method": "graceful_failure_accounting",
        "eval_criteria": {
            "expected_success": False,
            "must_contain": ["Rate Limit Exceeded", "429"],
            "zero_fake_tokens": True,
            "counting_method": "unavailable"
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 0
    },
    {
        "id": "tc_fail_02",
        "category": "failure_recovery",
        "input": "Simulate server error 503 service unavailable",
        "expected_solver": "general_llm",
        "simulate_scenario": "http_503",
        "eval_method": "graceful_failure_accounting",
        "eval_criteria": {
            "expected_success": False,
            "must_contain": ["503", "Service Unavailable"],
            "zero_fake_tokens": True,
            "counting_method": "unavailable"
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 0
    },
    {
        "id": "tc_fail_03",
        "category": "failure_recovery",
        "input": "Simulate network timeout on external provider",
        "expected_solver": "general_llm",
        "simulate_scenario": "timeout",
        "eval_method": "graceful_failure_accounting",
        "eval_criteria": {
            "expected_success": False,
            "must_contain": ["timed out", "Timeout"],
            "zero_fake_tokens": True,
            "counting_method": "unavailable"
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 0
    },
    {
        "id": "tc_fail_04",
        "category": "failure_recovery",
        "input": "Simulate invalid authentication key 401",
        "expected_solver": "general_llm",
        "simulate_scenario": "http_401",
        "eval_method": "graceful_failure_accounting",
        "eval_criteria": {
            "expected_success": False,
            "must_contain": ["Invalid API Key", "401"],
            "zero_fake_tokens": True,
            "counting_method": "unavailable"
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 0
    },
    {
        "id": "tc_fail_05",
        "category": "failure_recovery",
        "input": "Simulate empty response recovery with retry",
        "expected_solver": "general_llm",
        "simulate_scenario": "empty_first_call_success_second_call",
        "eval_method": "retry_token_aggregation",
        "eval_criteria": {
            "expected_success": True,
            "expected_llm_calls": 2,
            "aggregated_tokens": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 180
    },
    {
        "id": "tc_fail_06",
        "category": "failure_recovery",
        "input": "Simulate placeholder response rejection with retry",
        "expected_solver": "general_llm",
        "simulate_scenario": "placeholder_first_call_valid_second_call",
        "eval_method": "retry_token_aggregation",
        "eval_criteria": {
            "expected_success": True,
            "expected_llm_calls": 2,
            "no_placeholder_in_final": True
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 190
    },
    {
        "id": "tc_fail_07",
        "category": "failure_recovery",
        "input": "Simulate unconfigured provider status",
        "expected_solver": "general_llm",
        "simulate_scenario": "unconfigured_key",
        "eval_method": "graceful_failure_accounting",
        "eval_criteria": {
            "expected_success": False,
            "must_contain": ["No Groq API key configured", "How to Enable"],
            "zero_fake_tokens": True,
            "counting_method": "unavailable"
        },
        "requires_live_llm": False,
        "baseline_tokens_estimate": 0
    }
]


def get_dataset_summary() -> Dict[str, Any]:
    """Returns dataset summary statistics and category counts."""
    category_counts: Dict[str, int] = {}
    requires_llm_count = 0
    deterministic_count = 0

    for tc in BENCHMARK_DATASET:
        cat = tc["category"]
        category_counts[cat] = category_counts.get(cat, 0) + 1
        if tc.get("requires_live_llm", False):
            requires_llm_count += 1
        else:
            deterministic_count += 1

    return {
        "total_test_cases": len(BENCHMARK_DATASET),
        "categories_count": len(category_counts),
        "deterministic_cases": deterministic_count,
        "requires_live_llm_cases": requires_llm_count,
        "category_breakdown": category_counts
    }


if __name__ == "__main__":
    import json
    summary = get_dataset_summary()
    print("Benchmark Dataset Summary:")
    print(json.dumps(summary, indent=2))
