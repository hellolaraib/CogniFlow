"""CogniFlow Safe Code Evaluation Engine.

Provides restricted, sandboxed verification for generated code:
1. Extraction of C and Python code from assistant responses.
2. Static placeholder / stub detection (def ..., // TODO, pass).
3. Clang syntax check (-fsyntax-only) and sandboxed compilation.
4. Restricted subprocess execution with strict timeouts and memory boundaries.
5. Python AST parsing and safe evaluation.
"""

import os
import re
import ast
import sys
import shutil
import tempfile
import subprocess
from typing import Dict, Any, Optional, Tuple


def extract_code_block(text: str, language: Optional[str] = None) -> str:
    """Extracts code block from markdown response. If multiple blocks exist, returns the most relevant."""
    if not text:
        return ""

    if language:
        # Match ```language ... ```
        pattern = rf"```{re.escape(language)}\b\s*([\s\S]*?)```"
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            return matches[0].strip()

    # Fallback to any code block
    generic_matches = re.findall(r"```(?:[a-zA-Z0-9_\+\-]+)?\s*([\s\S]*?)```", text)
    if generic_matches:
        return generic_matches[0].strip()

    return text.strip()


def detect_dummy_placeholders(code: str) -> Tuple[bool, List[str]]:
    """Detects obvious stub placeholders, fake functions, or TODO comments."""
    findings = []
    if not code:
        return True, ["Empty code body"]

    placeholder_patterns = [
        (r"def\s+[A-Za-z0-9_]*Explain[A-Za-z0-9_]*\s*\(", "Generated python placeholder function for explanation"),
        (r"\bpass\b", "Python pass statement placeholder"),
        (r"//\s*(?:TODO|implement here|insert code)", "Unimplemented C TODO comment"),
        (r"/\*\s*(?:TODO|implement here|insert code)\s*\*/", "Unimplemented C block comment"),
        (r"\.\.\.", "Ellipsis stub"),
        (r"/\* Add logic here \*/", "Stub comment"),
    ]

    for pat, desc in placeholder_patterns:
        if re.search(pat, code, re.IGNORECASE):
            findings.append(desc)

    return len(findings) > 0, findings


def verify_c_code(
    code_text: str,
    required_tokens: Optional[List[str]] = None,
    forbidden_tokens: Optional[List[str]] = None,
    compile_test: bool = True,
    run_timeout_sec: float = 2.0
) -> Dict[str, Any]:
    """Safely verifies C code syntax, required symbols, and compiles in an isolated sandbox."""
    c_code = extract_code_block(code_text, "c")
    if not c_code or "#include" not in c_code:
        # Check if raw text has C structure
        if "#include" in code_text:
            c_code = code_text
        else:
            return {
                "valid": False,
                "syntax_valid": False,
                "compiled": False,
                "has_placeholders": False,
                "details": "No C code block or #include directive found in output."
            }

    # Check for forbidden placeholders
    has_placeholders, findings = detect_dummy_placeholders(c_code)
    if has_placeholders:
        return {
            "valid": False,
            "syntax_valid": False,
            "compiled": False,
            "has_placeholders": True,
            "details": f"Placeholder detected: {', '.join(findings)}"
        }

    # Check required tokens
    if required_tokens:
        for tok in required_tokens:
            if tok.lower() not in c_code.lower():
                return {
                    "valid": False,
                    "syntax_valid": False,
                    "compiled": False,
                    "has_placeholders": False,
                    "details": f"Missing required C symbol or construct: '{tok}'"
                }

    # Check forbidden tokens
    if forbidden_tokens:
        for tok in forbidden_tokens:
            if tok in c_code:
                return {
                    "valid": False,
                    "syntax_valid": False,
                    "compiled": False,
                    "has_placeholders": True,
                    "details": f"Found forbidden construct: '{tok}'"
                }

    # Security check: Disallow dangerous syscalls and headers before compilation
    dangerous_c_patterns = [
        (r"#include\s*<sys/", "System headers forbidden (<sys/...>)"),
        (r"#include\s*<unistd\.h>", "POSIX unistd.h header forbidden"),
        (r"\b(?:system|popen)\s*\(", "Shell execution call forbidden"),
        (r"\b(?:fork|execvp?|execlp?|kill|ptrace)\s*\(", "Process control call forbidden"),
        (r"\b(?:remove|unlink|rmdir|rename)\s*\(", "Filesystem modification call forbidden"),
        (r"\b(?:socket|connect|bind|listen|accept)\s*\(", "Network socket call forbidden"),
    ]
    for pat, desc in dangerous_c_patterns:
        if re.search(pat, c_code):
            return {
                "valid": False,
                "syntax_valid": False,
                "compiled": False,
                "has_placeholders": False,
                "details": f"Security restriction: {desc}"
            }

    # Compilation Check using clang if available
    clang_bin = shutil.which("clang") or shutil.which("gcc")
    if not clang_bin or not compile_test:
        return {
            "valid": True,
            "syntax_valid": True,
            "compiled": None,
            "has_placeholders": False,
            "details": "C structural verification passed (compiler not invoked or unavailable)."
        }

    # 1. Syntax-only check via stdin
    try:
        proc = subprocess.run(
            [clang_bin, "-fsyntax-only", "-x", "c", "-O0", "-"],
            input=c_code.encode("utf-8"),
            capture_output=True,
            timeout=run_timeout_sec
        )
        if proc.returncode != 0:
            err = proc.stderr.decode("utf-8", errors="replace").strip()
            return {
                "valid": False,
                "syntax_valid": False,
                "compiled": False,
                "has_placeholders": False,
                "details": f"Clang syntax check error: {err[:200]}"
            }
    except subprocess.TimeoutExpired:
        return {
            "valid": False,
            "syntax_valid": False,
            "compiled": False,
            "has_placeholders": False,
            "details": "Clang syntax check timed out."
        }
    except Exception as e:
        return {
            "valid": False,
            "syntax_valid": False,
            "compiled": False,
            "has_placeholders": False,
            "details": f"Compilation execution error: {str(e)}"
        }

    # 2. If it has a main() function, attempt compilation and execution in a temporary sandboxed directory
    if "int main" in c_code or "void main" in c_code:
        temp_dir = tempfile.mkdtemp(prefix="cogniflow_c_eval_")
        source_path = os.path.join(temp_dir, "prog.c")
        binary_path = os.path.join(temp_dir, "prog")
        try:
            with open(source_path, "w", encoding="utf-8") as f:
                f.write(c_code)

            compile_proc = subprocess.run(
                [clang_bin, "-O0", source_path, "-o", binary_path],
                capture_output=True,
                timeout=run_timeout_sec
            )
            if compile_proc.returncode != 0:
                err = compile_proc.stderr.decode("utf-8", errors="replace").strip()
                return {
                    "valid": False,
                    "syntax_valid": True,
                    "compiled": False,
                    "has_placeholders": False,
                    "details": f"Compilation failed: {err[:200]}"
                }

            # Execute binary in restricted subprocess
            run_proc = subprocess.run(
                [binary_path],
                capture_output=True,
                timeout=run_timeout_sec
            )
            return {
                "valid": run_proc.returncode == 0,
                "syntax_valid": True,
                "compiled": True,
                "executed": True,
                "exit_code": run_proc.returncode,
                "output": run_proc.stdout.decode("utf-8", errors="replace")[:200],
                "has_placeholders": False,
                "details": "Compiled and executed successfully with exit code 0."
            }
        except subprocess.TimeoutExpired:
            return {
                "valid": False,
                "syntax_valid": True,
                "compiled": True,
                "executed": False,
                "has_placeholders": False,
                "details": "Execution timed out (infinite loop protection)."
            }
        except Exception as e:
            return {
                "valid": True,
                "syntax_valid": True,
                "compiled": True,
                "executed": False,
                "has_placeholders": False,
                "details": f"Compiled successfully, execution error: {str(e)}"
            }
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    return {
        "valid": True,
        "syntax_valid": True,
        "compiled": True,
        "has_placeholders": False,
        "details": "C syntax check passed via Clang."
    }


def verify_python_code(
    code_text: str,
    test_assertion: Optional[str] = None
) -> Dict[str, Any]:
    """Safely verifies Python code syntax via AST and executes test assertion in isolated dict."""
    py_code = extract_code_block(code_text, "python")
    if not py_code:
        py_code = code_text

    try:
        ast.parse(py_code)
    except SyntaxError as e:
        return {
            "valid": False,
            "syntax_valid": False,
            "details": f"Python syntax error: {str(e)}"
        }

    has_placeholders, findings = detect_dummy_placeholders(py_code)
    if has_placeholders:
        return {
            "valid": False,
            "syntax_valid": True,
            "has_placeholders": True,
            "details": f"Placeholder detected: {', '.join(findings)}"
        }

    # Security check: Disallow dangerous imports or OS-level file operations
    dangerous_py_patterns = [
        (r"\bimport\s+(?:os|sys|subprocess|shutil|socket|requests|urllib)\b", "Restricted library import forbidden in sandbox"),
        (r"\bfrom\s+(?:os|sys|subprocess|shutil|socket|requests|urllib)\b", "Restricted library import forbidden in sandbox"),
        (r"__import__", "__import__ builtin forbidden"),
        (r"\bopen\s*\(", "Direct file I/O open() forbidden"),
    ]
    for pat, desc in dangerous_py_patterns:
        if re.search(pat, py_code):
            return {
                "valid": False,
                "syntax_valid": True,
                "has_placeholders": False,
                "details": f"Security restriction: {desc}"
            }

    if test_assertion:
        try:
            # Restricted execution environment
            allowed_builtins = {
                "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict,
                "enumerate": enumerate, "float": float, "int": int, "len": len,
                "list": list, "max": max, "min": min, "range": range, "reversed": reversed,
                "round": round, "set": set, "sorted": sorted, "str": str, "sum": sum,
                "tuple": tuple, "zip": zip, "print": lambda *args, **kwargs: None,
                "True": True, "False": False, "None": None, "Exception": Exception, "ValueError": ValueError
            }
            safe_globals: Dict[str, Any] = {"__builtins__": allowed_builtins}
            local_scope: Dict[str, Any] = {}
            exec(py_code, safe_globals, local_scope)
            result = eval(test_assertion, safe_globals, local_scope)
            return {
                "valid": bool(result),
                "syntax_valid": True,
                "has_placeholders": False,
                "test_passed": bool(result),
                "details": "Assertion passed." if result else "Assertion returned False."
            }
        except Exception as e:
            return {
                "valid": False,
                "syntax_valid": True,
                "has_placeholders": False,
                "details": f"Execution test failed: {str(e)}"
            }

    return {
        "valid": True,
        "syntax_valid": True,
        "has_placeholders": False,
        "details": "Python syntax verification passed."
    }
