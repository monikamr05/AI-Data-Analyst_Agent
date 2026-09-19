"""Guarded execution of AI-generated pandas code.

The AI writes plain pandas code against a DataFrame named `df` and assigns its
final answer to `result`. Before anything runs, the code is statically checked
with the `ast` module: only pandas/numpy imports are allowed, dunder access and
dangerous builtins are rejected, and the code then executes with a minimal
builtin scope against a copy of the data.
"""

import ast

import numpy as np
import pandas as pd

from services.data_service import dataframe_records, make_jsonable

MAX_RESULT_ROWS = 500


class UnsafeCodeError(Exception):
    """Raised when generated code breaks the sandbox rules."""


ALLOWED_IMPORTS = {"pandas", "numpy", "pd", "np"}

BLOCKED_NAMES = {
    "open", "exec", "eval", "compile", "globals", "locals", "vars",
    "getattr", "setattr", "delattr", "__import__", "breakpoint",
    "exit", "quit", "input", "help", "memoryview",
    "os", "sys", "subprocess", "shutil", "pathlib", "io", "socket",
    "requests", "urllib", "http", "ftplib", "pickle", "marshal",
    "builtins", "importlib",
}

SAFE_BUILTINS = {
    "abs": abs, "all": all, "any": any, "bool": bool, "dict": dict,
    "enumerate": enumerate, "filter": filter, "float": float, "int": int,
    "isinstance": isinstance, "len": len, "list": list, "map": map,
    "max": max, "min": min, "pow": pow, "print": lambda *a, **k: None,
    "range": range, "repr": repr, "round": round, "set": set, "slice": slice,
    "sorted": sorted, "str": str, "sum": sum, "tuple": tuple, "zip": zip,
}


def validate_code(source: str) -> None:
    """Parse the code and reject anything outside the allow-list."""
    try:
        tree = ast.parse(source)
    except SyntaxError as exc:
        raise UnsafeCodeError(f"generated code has a syntax error: {exc}") from exc

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            for alias in node.names:
                if alias.name.split(".")[0] not in ALLOWED_IMPORTS:
                    raise UnsafeCodeError(f"import of '{alias.name}' is not allowed")
        elif isinstance(node, ast.ImportFrom):
            module_root = (node.module or "").split(".")[0]
            if module_root not in ALLOWED_IMPORTS:
                raise UnsafeCodeError(f"import of '{node.module}' is not allowed")
        elif isinstance(node, ast.Attribute):
            if node.attr.startswith("__"):
                raise UnsafeCodeError("access to private (dunder) attributes is not allowed")
        elif isinstance(node, ast.Name) and node.id in BLOCKED_NAMES:
            raise UnsafeCodeError(f"use of '{node.id}' is not allowed")
        elif isinstance(node, (ast.Global, ast.Nonlocal)):
            raise UnsafeCodeError("global/nonlocal statements are not allowed")


def execute_analysis(code: str, df: pd.DataFrame) -> dict:
    """Run generated code against a copy of the DataFrame.

    The code must assign its final answer to a variable named `result`.
    Returns a JSON-safe payload describing a table or a single value.
    """
    validate_code(code)

    namespace = {"pd": pd, "np": np, "df": df.copy()}
    scope = {"__builtins__": SAFE_BUILTINS}

    try:
        exec(compile(code, "<ai-analysis>", "exec"), scope, namespace)
    except UnsafeCodeError:
        raise
    except Exception as exc:
        raise RuntimeError(f"generated code failed while running: {exc}") from exc

    if "result" not in namespace:
        raise RuntimeError("generated code did not produce a `result` variable.")

    return serialize_result(namespace["result"])


def serialize_result(result) -> dict:
    """Normalize the `result` object into a JSON-friendly structure."""
    if isinstance(result, pd.DataFrame):
        out = result.copy()
        out.columns = [str(c) for c in out.columns]
        truncated = len(out) > MAX_RESULT_ROWS
        out = out.head(MAX_RESULT_ROWS)
        return {
            "type": "table",
            "columns": list(out.columns),
            "rows": dataframe_records(out),
            "row_count": len(result),
            "truncated": truncated,
        }
    if isinstance(result, pd.Series):
        name = str(result.name) if result.name is not None else "value"
        return serialize_result(result.to_frame(name=name))

    return {"type": "value", "value": make_jsonable(result)}
