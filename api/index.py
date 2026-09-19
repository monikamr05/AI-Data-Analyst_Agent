"""Vercel serverless entry point for the AnalystOS backend.

Vercel's Python runtime imports this module and serves `app` as a WSGI
function. The Flask application lives in backend/; we add that folder to
sys.path so its absolute imports (routes.*, services.*) keep working both
here and when running `python app.py` locally. vercel.json's includeFiles
makes sure backend/ ships inside the function bundle.

If startup ever fails in the serverless environment, we expose a tiny
diagnostic app instead of crashing opaquely, so the traceback can be read
from any route.
"""

import os
import sys
import traceback

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend")
)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

try:
    from app import create_app  # noqa: E402

    app = create_app()
except Exception:  # pragma: no cover - diagnostic fallback on Vercel
    from flask import Flask, jsonify

    _startup_error = traceback.format_exc()
    app = Flask(__name__)

    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def startup_failure(path):
        return jsonify({"error": "startup failed", "traceback": _startup_error}), 500
