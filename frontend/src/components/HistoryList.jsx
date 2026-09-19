import { formatRunDate, removeRun } from "../services/history.js";

export default function HistoryList({ items, onChange, compact = false }) {
  if (!items.length) {
    return (
      <div className="history-empty">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
        <p>No saved runs yet.</p>
        <p className="muted small">Answers you generate in the workspace are stored here.</p>
      </div>
    );
  }

  return (
    <ul className={`history-list ${compact ? "history-compact" : ""}`}>
      {items.map((item) => (
        <li key={item.id} className="history-item">
          <span className="history-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <div className="history-body">
            <p className="history-question" title={item.question}>
              {item.question}
            </p>
            <p className="history-meta">
              {item.datasetName || "dataset"} · {formatRunDate(item.date)}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn history-delete"
            title="Remove run"
            onClick={() => {
              removeRun(item.id);
              onChange?.();
            }}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  );
}
