"""AI Data Analyst Agent - Flask application entry point."""

import os

from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS

from routes.analysis_routes import analysis_bp
from routes.dataset_routes import dataset_bp

load_dotenv()

MAX_UPLOAD_MB = 4 if os.getenv("VERCEL") else 50


def create_app():
    app = Flask(__name__)
    CORS(app)

    app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024

    app.register_blueprint(dataset_bp, url_prefix="/api")
    app.register_blueprint(analysis_bp, url_prefix="/api")

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
