export default function DataTable({ columns = [], rows = [], maxRows = 100, compact = false }) {
  const visible = rows.slice(0, maxRows);
  return (
    <div className={`table-wrap ${compact ? "table-compact" : ""}`}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c}>{formatCell(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > maxRows && (
        <p className="muted small table-note">
          Showing first {maxRows} of {rows.length.toLocaleString()} rows.
        </p>
      )}
    </div>
  );
}

function formatCell(value) {
  if (value === null || value === undefined || value === "") {
    return <span className="null-value">null</span>;
  }
  if (typeof value === "number") {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  if (typeof value === "string" && value.length > 80) {
    return value.slice(0, 77) + "...";
  }
  return String(value);
}
