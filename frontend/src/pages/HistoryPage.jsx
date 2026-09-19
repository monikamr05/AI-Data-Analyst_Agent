import { useState } from "react";
import ChartBoundary from "../components/ChartBoundary.jsx";
import ChartView from "../components/ChartView.jsx";
import DataTable from "../components/DataTable.jsx";
import {
  exportRunCsv,
  exportRunReport,
} from "../services/exporters.js";
import { formatRunDate, loadHistory, removeRun } from "../services/history.js";

export default function HistoryPage({ refreshKey }) {
  const [items, setItems] = useState(() => loadHistory());
  const [openId, setOpenId] = useState(null);

  // Re-read when a new run is saved elsewhere (refreshKey bumps).
  const [seenKey, setSeenKey] = useState(refreshKey);
  if (seenKey !== refreshKey) {
    setSeenKey(refreshKey);
    setItems(loadHistory());
  }

  function refresh() {
    setItems(loadHistory());
  }

  return (
    <div className="page-stack">
      <section className="page-head">
        <h2>
          Analysis <span className="grad-text">history</span>
        </h2>
        <p className="muted">
          Every answer you generate is saved locally in this browser. Expand a
          run to review it, or export it as a report.
        </p>
      </section>

      <section className="card">
        {items.length === 0 ? (
          <div className="history-empty">
            <p>No saved runs yet.</p>
            <p className="muted small">
              Ask a question in the workspace and it will appear here.
            </p>
          </div>
        ) : (
          <ul className="run-list">
            {items.map((item) => {
              const open = openId === item.id;
              return (
                <li key={item.id} className={`run-item ${open ? "run-open" : ""}`}>
                  <button
                    type="button"
                    className="run-row"
                    onClick={() => setOpenId(open ? null : item.id)}
                  >
                    <span className="history-icon" aria-hidden="true">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                    </span>
                    <span className="run-row-body">
                      <span className="history-question">{item.question}</span>
                      <span className="history-meta">
                        {item.datasetName || "dataset"} · {formatRunDate(item.date)}
                      </span>
                    </span>
                    <svg
                      className="run-chevron"
                      viewBox="0 0 24 24"
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m9 18 6-6-6-6" />
                    </svg>
                  </button>

                  {open && (
                    <div className="run-detail">
                      <p className="bubble-text">{item.answer}</p>
                      {item.chart && item.result?.type === "table" && (
                        <ChartBoundary>
                          <ChartView
                            chart={item.chart}
                            columns={item.result.columns}
                            rows={item.result.rows}
                          />
                        </ChartBoundary>
                      )}
                      {item.result?.type === "table" && (
                        <DataTable
                          columns={item.result.columns}
                          rows={item.result.rows}
                          maxRows={50}
                        />
                      )}
                      {item.code && (
                        <details className="code-details">
                          <summary>View the code used for this answer</summary>
                          <pre>
                            <code>{item.code}</code>
                          </pre>
                        </details>
                      )}
                      <div className="run-actions">
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => exportRunReport(item)}
                        >
                          Download report (.md)
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={item.result?.type !== "table"}
                          onClick={() => exportRunCsv(item)}
                        >
                          Export table (.csv)
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            removeRun(item.id);
                            setOpenId(null);
                            refresh();
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
