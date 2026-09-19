import { useEffect, useState } from "react";
import { fetchHealth } from "../services/api.js";
import { clearHistory, loadHistory } from "../services/history.js";

export default function SettingsPage({ dataset, onUnloadDataset, onHistoryChange }) {
  const [health, setHealth] = useState(null);
  const [healthError, setHealthError] = useState("");
  const [runCount, setRunCount] = useState(() => loadHistory().length);

  useEffect(() => {
    fetchHealth()
      .then((h) => {
        setHealth(h);
        setHealthError("");
      })
      .catch((err) => setHealthError(err.message));
  }, []);

  return (
    <div className="page-stack">
      <section className="page-head">
        <h2>
          Settings <span className="grad-text">&amp; status</span>
        </h2>
        <p className="muted">
          Backend connection, session state, and local data management.
        </p>
      </section>

      <div className="settings-grid">
        <section className="card">
          <div className="card-head">
            <p className="micro-label">BACKEND</p>
            {health && (
              <span className={`badge ${health.status === "ok" ? "badge-success" : "badge-warn"}`}>
                {health.status === "ok" ? "Connected" : "Degraded"}
              </span>
            )}
          </div>

          {healthError && <div className="alert alert-error">{healthError}</div>}

          {health && (
            <dl className="settings-list">
              <div>
                <dt>API status</dt>
                <dd>{health.status}</dd>
              </div>
              <div>
                <dt>Gemini API key</dt>
                <dd>
                  {health.gemini_configured ? (
                    <span className="stat-ok">Configured</span>
                  ) : (
                    <span className="stat-warn">Missing — add it to backend/.env</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Execution model</dt>
                <dd>gemini-2.5-flash</dd>
              </div>
              <div>
                <dt>Code execution</dt>
                <dd>Sandboxed pandas only</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <p className="micro-label">SESSION</p>
          </div>
          <dl className="settings-list">
            <div>
              <dt>Attached dataset</dt>
              <dd>{dataset ? dataset.name : "None"}</dd>
            </div>
            <div>
              <dt>Rows in memory</dt>
              <dd>{dataset ? dataset.rows.toLocaleString() : "—"}</dd>
            </div>
          </dl>
          {dataset && (
            <button type="button" className="btn btn-ghost" onClick={onUnloadDataset}>
              Unload dataset
            </button>
          )}
          <p className="muted small settings-note">
            Datasets live in server memory. After a restart or redeploy,
            re-upload your CSV.
          </p>
        </section>

        <section className="card">
          <div className="card-head">
            <p className="micro-label">LOCAL DATA</p>
          </div>
          <dl className="settings-list">
            <div>
              <dt>Saved analysis runs</dt>
              <dd>{runCount}</dd>
            </div>
            <div>
              <dt>Storage</dt>
              <dd>This browser only</dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn btn-danger"
            disabled={runCount === 0}
            onClick={() => {
              clearHistory();
              setRunCount(0);
              onHistoryChange?.();
            }}
          >
            Clear analysis history
          </button>
        </section>

        <section className="card">
          <div className="card-head">
            <p className="micro-label">ABOUT</p>
          </div>
          <p className="muted small">
            AnalystOS — an AI data analyst that profiles your CSV, plans a
            pandas analysis, executes it safely, and explains the result.
            Built with React, Flask, Pandas, and Google Gemini.
          </p>
        </section>
      </div>
    </div>
  );
}
