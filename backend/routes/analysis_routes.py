"""Endpoints for AI-powered analysis: /api/ask and /api/suggested-questions."""

from flask import Blueprint, jsonify, request

from services import data_service, execution_service, gemini_service

analysis_bp = Blueprint("analysis", __name__)


@analysis_bp.post("/ask")
def ask():
    """Answer a natural-language question about an uploaded dataset."""
    body = request.get_json(silent=True) or {}
    dataset_id = body.get("dataset_id")
    question = (body.get("question") or "").strip()
    history = body.get("history") or []

    dataset = data_service.get_dataset(dataset_id)
    if dataset is None:
        return jsonify({"error": "Dataset not found. Please upload it again."}), 404
    if not question:
        return jsonify({"error": "Question must not be empty."}), 400

    info = data_service.dataset_info(dataset_id)
    sample = data_service.preview_records(dataset_id, n=8)

    try:
        plan = gemini_service.generate_analysis(question, info, sample["rows"], history)
        result = execution_service.execute_analysis(plan["code"], dataset["df"])
    except execution_service.UnsafeCodeError as exc:
        return jsonify({"error": f"The generated code was blocked by the sandbox: {exc}."}), 400
    except gemini_service.QuotaExhaustedError as exc:
        return jsonify({
            "error": str(exc),
            "code": "quota_exhausted",
            "retry_after": exc.retry_after,
        }), 429
    except gemini_service.GeminiError as exc:
        return jsonify({"error": str(exc)}), 502
    except RuntimeError as exc:
        return jsonify({"error": str(exc)}), 500
    except Exception as exc:  # safety net - never leak a stack trace to the UI
        return jsonify({"error": f"Unexpected error while analyzing: {exc}"}), 500

    chart = plan.get("chart")
    if chart and result.get("type") == "table":
        columns = set(result.get("columns", []))
        chart_x = chart.get("x")
        chart_y = chart.get("y")
        if not chart_x or chart_x not in columns or (chart_y and chart_y not in columns):
            chart = None  # chart references columns that are not in the result
    else:
        chart = None  # charts need a table of values and valid chart config

    return jsonify({
        "answer": plan["explanation"],
        "code": plan["code"],
        "result": result,
        "chart": chart,
    })


@analysis_bp.get("/suggested-questions")
def suggested_questions():
    """Return starter questions tailored to the dataset."""
    dataset_id = request.args.get("dataset_id")
    if data_service.get_dataset(dataset_id) is None:
        return jsonify({"error": "Dataset not found."}), 404
    info = data_service.dataset_info(dataset_id)
    sample = data_service.preview_records(dataset_id, n=5)
    questions = gemini_service.suggest_questions(info, sample["rows"])
    return jsonify({"questions": questions})
