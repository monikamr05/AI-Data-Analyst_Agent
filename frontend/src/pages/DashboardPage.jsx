import { useEffect, useMemo, useState } from "react";
import SuggestedQuestions from "../components/SuggestedQuestions.jsx";
import {
  fetchDatasetInfo,
  fetchPreview,
  fetchSuggestedQuestions,
} from "../services/api.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const PIPELINE_STEPS = [
  { label: "Profile", hint: "Schema & data quality" },
  { label: "Plan", hint: "Intent to pandas plan" },
  { label: "Execute", hint: "Sandboxed run" },
  { label: "Visualize", hint: "Chart from results" },
  { label: "Explain", hint: "Plain-English answer" },
];

export default function DashboardPage({ dataset, onUpload, onAsk }) {
  const [info, setInfo] = useState(null);
  const [examples, setExamples] = useState({});
  const [suggested, setSuggested] = useState([]);
  const [question, setQuestion] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!dataset) return;
    setInfo(null);
    setExamples({});
    setLoadError("");

    fetchDatasetInfo(dataset.id)
      .then(setInfo)
      .catch((err) => setLoadError(err.message));
    fetchPreview(dataset.id, 1)
      .then((preview) => {
        const firstRow = preview?.rows?.[0] || {};
        setExamples(firstRow);
      })
      .catch(() => setExamples({}));
    fetchSuggestedQuestions(dataset.id)
      .then((data) => setSuggested(data.questions || []))
      .catch(() => setSuggested([]));
  }, [dataset]);

  const missingTotal = useMemo(() => {
    if (!info?.columns) return 0;
    return info.columns.reduce((sum, col) => sum + (col.nulls || 0), 0);
  }, [info]);

  if (!dataset) {
    return (
      <div className="page-stack">
        <section className="hero-empty card">
          <span className="badge badge-outline">INTELLIGENCE FOR EVERY TABLE</span>
          <h2>
            {greeting()}, <span className="grad-text">Analyst.</span>
          </h2>
          <p className="muted">
            Attach a CSV dataset to start asking questions. The agent will
            profile, plan, execute, visualize, and explain.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={onUpload}>
              Upload a dataset
            </button>
          </div>
        </section>
      </div>
    );
  }

  function analyze(event) {
    event?.preventDefault();
    const text = question.trim();
    if (!text) return;
    setQuestion("");
    onAsk(text);
  }

  return (
    <div className="page-stack">
      <section className="page-head">
        <p className="live-line">
          <span className="status-dot" aria-hidden="true" /> Live analysis workspace
        </p>
        <h2>
          {greeting()}, <span className="grad-text">Analyst.</span>
        </h2>
        <p className="muted">
          Ask sharper questions of your data. The agent will profile, plan,
          execute, visualize, and explain.
        </p>
      </section>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <section className="card ask-card">
            <div className="card-head">
              <p className="micro-label ask-label">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 3v3M18.4 5.6 16 8M21 12h-3M5.6 5.6 8 8M3 12h3M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4m-7-3-1-1m7 1 1-1" />
                </svg>
                ASK AI
              </p>
              <span className="chip chip-static">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                context-aware
              </span>
            </div>

            <h3 className="ask-title">What would you like to know?</h3>

            <SuggestedQuestions
              questions={suggested}
              onPick={(q) => {
                setQuestion(q);
              }}
              disabled={false}
            />

            <form className="ask-box" onSubmit={analyze}>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    analyze();
                  }
                }}
                placeholder="Ask about totals, trends, segments, outliers..."
                rows={3}
              />
              <div className="ask-box-foot">
                <span className="muted small">Context: {dataset.name}</span>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={!question.trim()}
                >
                  Analyze
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M7 17 17 7" />
                    <path d="M8 7h9v9" />
                  </svg>
                </button>
              </div>
            </form>
            {loadError && <div className="alert alert-error">{loadError}</div>}
          </section>

          <section className="card telemetry-card">
            <div className="card-head">
              <p className="micro-label">PIPELINE TELEMETRY</p>
              <span className="chip chip-static chip-ready">Ready</span>
            </div>
            <h3 className="telemetry-title">From question to insight</h3>
            <ol className="pipeline">
              {PIPELINE_STEPS.map((step, i) => (
                <li key={step.label} className="pipeline-step">
                  <span className="pipeline-num">{i + 1}</span>
                  <div>
                    <strong>{step.label}</strong>
                    <small>{step.hint}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="dashboard-side">
          <section className="card profile-card">
            <div className="card-head">
              <p className="micro-label">DATASET PROFILE</p>
              <span className="badge badge-success">
                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                Profiled
              </span>
            </div>
            <h3 className="profile-name" title={dataset.name}>
              {dataset.name}
            </h3>

            <div className="stat-tiles">
              <div className="stat-tile">
                <small>ROWS</small>
                <strong>{info ? info.rows.toLocaleString() : "—"}</strong>
              </div>
              <div className="stat-tile">
                <small>COLUMNS</small>
                <strong>{info ? info.column_count : "—"}</strong>
              </div>
              <div className="stat-tile">
                <small>MISSING</small>
                <strong className={missingTotal ? "stat-warn" : "stat-ok"}>
                  {info ? missingTotal.toLocaleString() : "—"}
                </strong>
              </div>
            </div>

            {info && (
              <div className="field-table-wrap">
                <table className="field-table">
                  <thead>
                    <tr>
                      <th>FIELD</th>
                      <th>TYPE</th>
                      <th>MISSING</th>
                      <th>EXAMPLE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {info.columns.map((col) => (
                      <tr key={col.name}>
                        <td className="field-name" title={col.name}>
                          {col.name}
                        </td>
                        <td>
                          <span className={`type-pill type-${col.dtype}`}>{col.dtype}</span>
                        </td>
                        <td>{col.nulls}</td>
                        <td className="field-example" title={String(examples[col.name] ?? "")}>
                          {formatExample(examples[col.name])}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function formatExample(value) {
  if (value === null || value === undefined || value === "") return "—";
  const text = String(value);
  return text.length > 14 ? text.slice(0, 13) + "…" : text;
}
