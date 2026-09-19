import { useState } from "react";
import FileUpload from "../components/FileUpload.jsx";
import HistoryList from "../components/HistoryList.jsx";
import { uploadCsv } from "../services/api.js";
import { loadHistory } from "../services/history.js";

export default function UploadPage({ onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [busySample, setBusySample] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState(() => loadHistory());

  async function handleFile(file) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const dataset = await uploadCsv(file);
      onUploaded(dataset);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function loadSample() {
    if (busy || busySample) return;
    setBusySample(true);
    setError("");
    try {
      const response = await fetch("/sample_data/sales_data.csv");
      if (!response.ok) throw new Error("Sample dataset is not available.");
      const blob = await response.blob();
      const file = new File([blob], "sales_data.csv", { type: "text/csv" });
      const dataset = await uploadCsv(file);
      onUploaded(dataset);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusySample(false);
    }
  }

  return (
    <div className="upload-grid">
      <section className="card upload-card">
        <div className="card-head">
          <p className="micro-label">BRING YOUR DATA</p>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#22d3ee" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </div>
        <h3>Upload a CSV dataset</h3>
        <p className="muted">CSV only · profiled automatically</p>

        <FileUpload onFile={handleFile} busy={busy || busySample} />

        <div className="divider">
          <span>OR</span>
        </div>

        <button type="button" className="btn btn-ghost btn-block" onClick={loadSample} disabled={busy || busySample}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
          </svg>
          {busySample ? "Loading sample…" : "Try Northstar sample dataset"}
        </button>

        {error && <div className="alert alert-error">{error}</div>}

        <p className="muted small upload-note">
          Schema, types, and missing values are detected automatically.
        </p>
      </section>

      <aside className="card upload-history-card">
        <div className="card-head">
          <p className="micro-label">SAVED RUNS</p>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
        </div>
        <h3>Analysis history</h3>
        <HistoryList
          items={history}
          compact
          onChange={() => setHistory(loadHistory())}
        />
      </aside>
    </div>
  );
}
