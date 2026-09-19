import ChartBoundary from "./ChartBoundary.jsx";
import ChartView from "./ChartView.jsx";
import DataTable from "./DataTable.jsx";

export default function ChatMessage({ message, onRetry }) {
  const isUser = message.role === "user";

  return (
    <div className={`message-row ${isUser ? "message-user" : "message-assistant"}`}>
      {!isUser && (
        <div className="avatar" aria-hidden="true">
          AI
        </div>
      )}
      <div className={`bubble ${message.error ? "bubble-error" : ""}`}>
        {message.text
          .split(/\n{2,}/)
          .map((para, i) => (
            <p key={i} className="bubble-text">{para}</p>
          ))}

        {message.value !== null && message.value !== undefined && (
          <div className="value-answer">{formatValue(message.value)}</div>
        )}

        {message.chart && message.table && (
          <ChartBoundary>
            <ChartView
              chart={message.chart}
              columns={message.table.columns}
              rows={message.table.rows}
            />
          </ChartBoundary>
        )}

        {message.table && (
          <DataTable columns={message.table.columns} rows={message.table.rows} />
        )}

        {message.code && !message.error && (
          <details className="code-details">
            <summary>View the code used for this answer</summary>
            <pre>
              <code>{message.code}</code>
            </pre>
          </details>
        )}

        {message.error && onRetry && (
          <button type="button" className="btn btn-ghost btn-sm retry-btn" onClick={onRetry}>
            Retry now
          </button>
        )}
      </div>
    </div>
  );
}

function formatValue(value) {
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return String(value);
}
