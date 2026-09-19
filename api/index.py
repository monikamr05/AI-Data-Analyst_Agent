"""Vercel serverless entry point for the AnalystOS backend.

Vercel's Python runtime imports this module and serves `app` as a WSGI
function. The Flask application lives in backend/; we add that folder to
sys.path so its absolute imports (routes.*, services.*) keep working both
here and when running `python app.py` locally.
"""

import os
import sys

BACKEND_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "backend")
)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app import create_app  # noqa: E402

app = create_app()
