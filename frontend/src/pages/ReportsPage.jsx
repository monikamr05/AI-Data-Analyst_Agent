import { useState } from "react";
import {
  exportHistoryJson,
  exportRunCsv,
  exportRunReport,
} from "../services/exporters.js";
import { formatRunDate, loadHistory } from "../services/history.js";

export default function ReportsPage({ refreshKey }) {
  const [items, setItems] = useState(() => loadHistory());
  const [selectedId, setSelectedId] = useState(null);
  const [notice, setNotice] = useState("");

  const [seenKey, setSeenKey] = useState(refreshKey);
  if (seenKey !== refreshKey) {
    setSeenKey(refreshKey);
    setItems(loadHistory());
  }

  const selected = items.find((item) => item.id === selectedId) || items[0] || null;

  function flash(message) {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  }

  return (
    <div className="page-stack">
      <section className="page-head">
        <h2>
          Reports &amp; <span className="grad-text">export</span>
        </h2>
        <p className="muted">
          Package any saved run as a shareable markdown report, or export the
          raw result table as CSV.
        </p>
      </section>

      <div className="reports-grid">
        <section className="card">
          <div className="card-head">
            <p className="micro-label">SAVED RUNS</p>
            <span className="chip chip-static">{items.length} total</span>
          </div>
          {items.length === 0 ? (
            <div className="history-empty">
              <p>Nothing to export yet.</p>
              <p className="muted small">Run an analysis first — it will show up here.</p>
            </div>
          ) : (
            <ul className="run-picker">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`run-pick ${selected?.id === item.id ? "run-pick-active" : ""}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <span className="history-question">{item.question}</span>
                    <span className="history-meta">
                      {item.datasetName || "dataset"} · {formatRunDate(item.date)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <p className="micro-label">EXPORT OPTIONS</p>
          </div>
          {selected ? (
            <>
              <h3 className="report-title">{selected.question}</h3>
              <p className="muted small">
                {selected.datasetName} · {formatRunDate(selected.date)} ·{" "}
                {selected.result?.type === "table"
                  ? `${selected.result.row_count ?? selected.result.rows?.length ?? 0} result rows`
                  : "single value result"}
              </p>

              <div className="export-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    exportRunReport(selected);
                    flash("Report downloaded.");
                  }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3v12" />
                    <path d="m7 10 5 5 5-5" />
                    <path d="M5 21h14" />
                  </svg>
                  Download report (.md)
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  disabled={selected.result?.type !== "table"}
                  onClick={() => {
                    exportRunCsv(selected);
                    flash("CSV downloaded.");
                  }}
                >
                  Export table (.csv)
                </button>
              </div>

              <div className="divider">
                <span>BULK</span>
              </div>

              <button
                type="button"
                className="btn btn-ghost btn-block"
                onClick={() => {
                  exportHistoryJson(loadHistory());
                  flash("History exported as JSON.");
                }}
              >
                Export full history (.json)
              </button>

              {notice && <div className="alert alert-success">{notice}</div>}
            </>
          ) : (
            <div className="history-empty">
              <p>Select a run to configure its export.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
