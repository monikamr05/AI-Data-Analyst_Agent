const BASE = "/api";

async function request(path, options = {}) {
  const res = await fetch(BASE + path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    err.code = data.code || null;
    err.retryAfter = data.retry_after || 0;
    throw err;
  }
  return data;
}

export function uploadCsv(file) {
  const form = new FormData();
  form.append("file", file);
  return request("/upload", { method: "POST", body: form });
}

export function fetchDatasets() {
  return request("/datasets");
}

export function fetchHealth() {
  return request("/health");
}

export function fetchDatasetInfo(datasetId) {
  return request(`/datasets/${datasetId}`);
}

export function fetchPreview(datasetId, n = 20) {
  return request(`/datasets/${datasetId}/preview?n=${n}`);
}

export function askQuestion(datasetId, question, history = []) {
  return request("/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataset_id: datasetId, question, history }),
  });
}

export function fetchSuggestedQuestions(datasetId) {
  return request(`/suggested-questions?dataset_id=${datasetId}`);
}
