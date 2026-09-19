"""In-memory registry of uploaded datasets plus pandas helpers."""

import os
import tempfile
import uuid
from datetime import date, datetime

import numpy as np
import pandas as pd

try:
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "analystos_uploads")
    else:
        UPLOAD_DIR = os.path.join(
            os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
        )
    os.makedirs(UPLOAD_DIR, exist_ok=True)
except Exception:
    UPLOAD_DIR = os.path.join(tempfile.gettempdir(), "analystos_uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)


ALLOWED_EXTENSIONS = {".csv"}

# dataset_id -> {"df": DataFrame, "name": original filename, "path": saved path}
DATASETS: dict = {}


def save_upload(file_storage) -> str:
    """Persist an uploaded CSV file and register it in memory."""
    original_name = file_storage.filename or "dataset.csv"
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Only .csv files are supported.")

    dataset_id = uuid.uuid4().hex[:12]
    safe_name = f"{dataset_id}_{os.path.basename(original_name)}"
    path = os.path.join(UPLOAD_DIR, safe_name)
    file_storage.save(path)

    try:
        df = pd.read_csv(path)
    except Exception as exc:
        os.remove(path)
        raise ValueError(f"The file could not be parsed as CSV: {exc}") from exc

    if df.empty:
        os.remove(path)
        raise ValueError("The CSV file has no data rows.")

    DATASETS[dataset_id] = {"df": df, "name": original_name, "path": path}
    return dataset_id


def get_dataset(dataset_id):
    """Return the stored metadata dict for a dataset, or None."""
    return DATASETS.get(dataset_id)


def list_datasets() -> list:
    """Lightweight listing for the 'previously uploaded' picker."""
    return [
        {
            "id": dataset_id,
            "name": meta["name"],
            "rows": len(meta["df"]),
            "column_count": len(meta["df"].columns),
        }
        for dataset_id, meta in DATASETS.items()
    ]


def summarize_columns(df: pd.DataFrame) -> list:
    """Per-column profile used in prompts and in the UI sidebar."""
    summary = []
    for col in df.columns:
        series = df[col]
        entry = {
            "name": str(col),
            "dtype": str(series.dtype),
            "non_null": int(series.notna().sum()),
            "nulls": int(series.isna().sum()),
            "unique": int(series.nunique(dropna=True)),
        }
        if pd.api.types.is_numeric_dtype(series):
            entry["min"] = make_jsonable(series.min())
            entry["max"] = make_jsonable(series.max())
            entry["mean"] = make_jsonable(series.mean())
        summary.append(entry)
    return summary


def dataset_info(dataset_id):
    """Full profile of one dataset, or None if unknown."""
    meta = DATASETS.get(dataset_id)
    if meta is None:
        return None
    df = meta["df"]
    numeric = [str(c) for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
    categorical = [str(c) for c in df.columns if not pd.api.types.is_numeric_dtype(df[c])]
    return {
        "id": dataset_id,
        "name": meta["name"],
        "rows": len(df),
        "column_count": len(df.columns),
        "columns": summarize_columns(df),
        "numeric_columns": numeric,
        "categorical_columns": categorical,
        "duplicate_rows": int(df.duplicated().sum()),
    }


def preview_records(dataset_id, n: int = 20) -> dict:
    """First N rows of a dataset as JSON-safe records."""
    df = DATASETS[dataset_id]["df"]
    sample = df.head(n)
    return {
        "columns": [str(c) for c in sample.columns],
        "rows": dataframe_records(sample),
        "total_rows": len(df),
    }


def dataframe_records(df: pd.DataFrame) -> list:
    """DataFrame -> list of row dicts with JSON-safe values."""
    cleaned = df.astype(object).where(pd.notna(df), None)
    return [
        {str(k): make_jsonable(v) for k, v in row.items()}
        for row in cleaned.to_dict(orient="records")
    ]


def make_jsonable(value):
    """Convert numpy/pandas scalars to plain Python/JSON values."""
    if value is None or isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return None if np.isnan(value) else value
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.floating):
        return None if np.isnan(value) else float(value)
    if isinstance(value, np.bool_):
        return bool(value)
    if isinstance(value, (pd.Timestamp, datetime)):
        return value.isoformat()
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, np.ndarray):
        return [make_jsonable(v) for v in value.tolist()]
    return str(value)
