"""AI Data Analyst Agent - Flask application entry point."""

import os

from dotenv import load_dotenv
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS

from routes.analysis_routes import analysis_bp
from routes.dataset_routes import dataset_bp

load_dotenv()

MAX_UPLOAD_MB = 4 if os.getenv("VERCEL") else 50


def _find_frontend_dist():
    """Locate the built frontend bundle, if present."""
    candidates = [
        os.path.join(os.getcwd(), "frontend", "dist"),
        os.path.abspath(
            os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
        ),
    ]
    for path in candidates:
        if os.path.isfile(os.path.join(path, "index.html")):
            return path
    return None


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024

    app.register_blueprint(dataset_bp, url_prefix="/api")
    app.register_blueprint(analysis_bp, url_prefix="/api")

    dist = _find_frontend_dist()
    if dist:
        @app.route("/", defaults={"path": ""})
        @app.route("/<path:path>")
        def serve_frontend(path):
            if path.startswith("api/"):
                return jsonify({"error": "Not found."}), 404
            if path and os.path.isfile(os.path.join(dist, path)):
                return send_from_directory(dist, path)
            return send_from_directory(dist, "index.html")

    @app.get("/api/health")
    def health():
        return jsonify({
            "status": "ok",
            "gemini_configured": bool(os.getenv("GEMINI_API_KEY")),
        })

    @app.errorhandler(413)
    def too_large(_error):
        return jsonify({"error": f"File is too large (max {MAX_UPLOAD_MB} MB)."}), 413

    return app


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", "5000"))
    create_app().run(host="127.0.0.1", port=port, debug=True)
