"""Google Gemini integration: natural language question -> analysis plan.

The model is asked for strict JSON containing:
  - explanation: plain-language answer for the user
  - code:         pandas code (assign final answer to `result`)
  - chart:        optional Recharts chart spec (type/x/y/title)
"""

import json
import os
import re
import time

from google import genai
from google.genai import types

_client = None

MAX_HISTORY_TURNS = 6
# Auto-retry a 429 once when Google asks us to wait less than this many seconds.
MAX_AUTO_RETRY_AFTER = 30


class GeminiError(Exception):
    """Raised when the Gemini API is unavailable or returns garbage."""


class QuotaExhaustedError(GeminiError):
    """Raised when the Gemini free-tier quota / rate limit is exhausted."""

    def __init__(self, message: str, retry_after: float = 0):
        super().__init__(message)
        self.retry_after = retry_after


def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise GeminiError(
                "GEMINI_API_KEY is not set. Copy backend/.env.example to backend/.env "
                "and paste your Gemini API key (get one at https://aistudio.google.com/apikey)."
            )
        _client = genai.Client(api_key=api_key)
    return _client


def model_name() -> str:
    return os.getenv("GEMINI_MODEL", "gemini-2.5-flash")


def _schema_block(info: dict) -> str:
    lines = []
    for col in info.get("columns", []):
        extra = ""
        if "mean" in col:
            extra = f" | min={col['min']}, max={col['max']}, mean={col['mean']}"
        lines.append(f"- {col['name']} ({col['dtype']}, {col['nulls']} nulls, {col['unique']} unique{extra})")
    return "\n".join(lines) if lines else "(no columns)"


def _sample_block(sample_rows: list, columns: list) -> str:
    lines = [",".join(columns)]
    for row in sample_rows[:8]:
        lines.append(",".join("" if row.get(c) is None else str(row.get(c)) for c in columns))
    return "\n".join(lines)


def _history_block(history: list) -> str:
    if not history:
        return "(none)"
    turns = history[-MAX_HISTORY_TURNS:]
    return "\n".join(f"Q: {h.get('question', '')}\nA: {h.get('answer', '')[:300]}" for h in turns)


def build_prompt(question: str, info: dict, sample_rows: list, history: list) -> str:
    columns = [c["name"] for c in info.get("columns", [])]
    return f"""You are an expert data analyst inside a web app. The user uploaded a CSV file
that has been loaded into a pandas DataFrame named `df`. Answer the user's question
by writing pandas code.

DATASET: {info.get("name", "dataset")} ({info.get("rows", "?")} rows, {len(columns)} columns)

SCHEMA:
{_schema_block(info)}

SAMPLE ROWS (first rows of the file):
{_sample_block(sample_rows, columns)}

RULES:
1. Write short pandas/numpy code that answers the question and assign the final answer
   to a variable named `result`.
2. `result` must be a pandas DataFrame or Series when the answer is a table
   (aggregations, rankings, filters, crosstabs, groupbys). Use a plain number or string
   only when the answer is a single simple fact.
3. Reset the index of grouped/aggregated results so the group keys become columns.
4. Use ONLY pandas and numpy. Never read/write files or access the network.
5. Column names must match the schema exactly, including spaces and capitalization.
6. If the question is ambiguous, answer the most reasonable interpretation and state
   the assumption in `explanation`.
7. `explanation`: 2-5 sentences of plain, insightful language that mentions concrete
   numbers from the result. No code in the explanation.
8. `chart`: include a chart spec only when a visual makes the answer clearer, otherwise
   null. The x/y values must be column names that exist in `result`.

PREVIOUS TURNS (context only; answer the latest question):
{_history_block(history)}

LATEST QUESTION:
{question}

ANSWER FORMAT - strict JSON only, no markdown fences:
{{
  "explanation": "string",
  "code": "python code as a single string that assigns `result`",
  "chart": null | {{"type": "bar|line|pie|scatter|area", "x": "column in result", "y": "column in result", "title": "string"}}
}}"""


def _generate(prompt: str, temperature: float) -> str:
    """Send a prompt to Gemini and return the response text."""
    response = get_client().models.generate_content(
        model=model_name(),
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            temperature=temperature,
        ),
    )
    return response.text


def _is_quota_error(exc: Exception) -> bool:
    text = str(exc).lower()
    return "429" in text or "resource_exhausted" in text or "quota" in text


def _retry_after_seconds(exc: Exception) -> float:
    match = re.search(r"retry in ([\d.]+)\s*s", str(exc), re.IGNORECASE)
    if match:
        return min(float(match.group(1)), 300)
    return 0


def _quota_error(exc: Exception) -> QuotaExhaustedError:
    delay = _retry_after_seconds(exc)
    wait = int(max(30, round(delay)))
    return QuotaExhaustedError(
        "The Gemini free-tier quota for this API key is temporarily exhausted "
        f"(rate limit of the free plan). Wait about {wait} seconds and try again. "
        "If this error keeps appearing, today's free allowance is used up: create "
        "a new key at https://aistudio.google.com/apikey, or enable billing on the "
        "Google Cloud project for this key.",
        retry_after=delay,
    )


def generate_analysis(question: str, info: dict, sample_rows: list, history: list = None) -> dict:
    """Ask Gemini for an analysis plan (explanation + code + optional chart)."""
    prompt = build_prompt(question, info, sample_rows, history or [])

    try:
        text = _generate(prompt, temperature=0.2)
    except GeminiError:
        raise
    except Exception as exc:
        if not _is_quota_error(exc):
            raise GeminiError(f"Gemini request failed: {exc}") from exc
        delay = _retry_after_seconds(exc)
        if 0 < delay <= MAX_AUTO_RETRY_AFTER:
            # Free-tier minute windows clear quickly: wait it out once, transparently.
            time.sleep(delay + 1)
            try:
                text = _generate(prompt, temperature=0.2)
            except Exception as exc2:
                raise _quota_error(exc2) from exc2
        else:
            raise _quota_error(exc) from exc

    return _parse_plan(text)


def _parse_plan(text: str) -> dict:
    text = (text or "").strip()
    if not text:
        raise GeminiError("Gemini returned an empty response.")

    try:
        plan = json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise GeminiError("Gemini did not return valid JSON.")
        try:
            plan = json.loads(match.group(0))
        except json.JSONDecodeError as exc:
            raise GeminiError(f"Could not parse the Gemini response as JSON: {exc}") from exc

    code = str(plan.get("code") or "").strip()
    if not code:
        raise GeminiError("Gemini did not produce any code for this question.")

    return {
        "code": code,
        "explanation": str(plan.get("explanation") or "").strip(),
        "chart": _validate_chart(plan.get("chart")),
    }


def _validate_chart(chart) -> dict | None:
    if not isinstance(chart, dict):
        return None
    ctype = str(chart.get("type", "")).lower()
    if ctype not in {"bar", "line", "pie", "scatter", "area"}:
        return None
    return {
        "type": ctype,
        "x": str(chart.get("x") or ""),
        "y": str(chart.get("y") or ""),
        "title": str(chart.get("title") or ""),
    }


def suggest_questions(info: dict, sample_rows: list) -> list:
    """Return ~6 starter questions tailored to the dataset (AI-generated, with fallback)."""
    columns = [c["name"] for c in info.get("columns", [])]
    prompt = f"""A user just uploaded a dataset with these columns: {", ".join(columns)}.
Suggest 6 short, natural questions a business user might ask about this data.
Return strict JSON only: {{"questions": ["...", "..."]}}"""

    try:
        data = json.loads(_generate(prompt, temperature=0.7))
        questions = [str(q).strip() for q in data.get("questions", []) if str(q).strip()]
        if questions:
            return questions[:6]
    except Exception:
        pass
    return _fallback_questions(info)


def _fallback_questions(info: dict) -> list:
    def is_id_like(col: str) -> bool:
        return col.lower() == "id" or col.lower().endswith("_id")

    numerics = [c for c in info.get("numeric_columns", []) if not is_id_like(c)]
    categoricals = info.get("categorical_columns", [])
    questions = ["Give me an overview of this dataset with key statistics for every column."]
    if numerics:
        questions.append(f"What is the average {numerics[0]} and how does it vary?")
    if categoricals and numerics:
        questions.append(f"Which {categoricals[0]} has the highest total {numerics[0]}? Show the top 5.")
    if len(numerics) >= 2:
        questions.append(f"How are {numerics[0]} and {numerics[1]} related?")
    if len(categoricals) >= 2 and numerics:
        questions.append(f"Break down total {numerics[0]} by {categoricals[0]} and {categoricals[1]}.")
    questions.append("Are there any missing values or duplicate rows I should worry about?")
    return questions[:6]
