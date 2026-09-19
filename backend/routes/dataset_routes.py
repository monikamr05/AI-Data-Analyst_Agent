"""API endpoints for uploading and inspecting datasets."""

from flask import Blueprint, jsonify, request

from services import data_service

dataset_bp = Blueprint("datasets", __name__)


@dataset_bp.post("/upload")
def upload_file():
    """Accept a CSV upload, store it, and return the dataset profile."""
    if "file" not in request.files:
        return jsonify({"error": "No file provided. Submit the file in the 'file' form field."}), 400

    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No file selected."}), 400

    try:
        dataset_id = data_service.save_upload(file)
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(data_service.dataset_info(dataset_id)), 201


@dataset_bp.get("/datasets")
def list_datasets():
    """List all datasets currently loaded in memory."""
    return jsonify({"datasets": data_service.list_datasets()})


@dataset_bp.get("/datasets/<dataset_id>")
def get_info(dataset_id):
    """Return the profile (schema, stats) of one dataset."""
    info = data_service.dataset_info(dataset_id)
    if info is None:
        return jsonify({"error": "Dataset not found."}), 404
    return jsonify(info)


@dataset_bp.get("/datasets/<dataset_id>/preview")
def get_preview(dataset_id):
    """Return the first N rows of a dataset."""
    if data_service.get_dataset(dataset_id) is None:
        return jsonify({"error": "Dataset not found."}), 404
    n = request.args.get("n", default=20, type=int)
    n = max(1, min(n, 200))
    return jsonify(data_service.preview_records(dataset_id, n=n))
