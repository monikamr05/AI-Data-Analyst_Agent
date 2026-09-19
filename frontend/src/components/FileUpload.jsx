import { useRef, useState } from "react";

export default function FileUpload({ onFile, busy }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handlePick(event) {
    const file = event.target.files?.[0];
    if (file) onFile(file);
    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div
      className={`dropzone ${dragOver ? "dropzone-active" : ""} ${busy ? "dropzone-busy" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !busy && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      role="button"
      tabIndex={0}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={handlePick}
      />
      <svg
        className="dropzone-icon"
        viewBox="0 0 24 24"
        width="40"
        height="40"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 20h16" />
      </svg>
      {busy ? (
        <p className="muted">Uploading and profiling your file&hellip;</p>
      ) : (
        <>
          <p>
            <strong>Drag &amp; drop your CSV here</strong>, or click to browse
          </p>
          <p className="muted small">.csv files only, up to 50 MB</p>
        </>
      )}
    </div>
  );
}
