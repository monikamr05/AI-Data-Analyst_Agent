const NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
      </svg>
    ),
  },
  {
    id: "upload",
    label: "Upload Dataset",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M4 20h16" />
      </svg>
    ),
  },
  {
    id: "workspace",
    label: "Ask AI Workspace",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v3" />
        <path d="M18.4 5.6 16 8" />
        <path d="M21 12h-3" />
        <path d="M5.6 5.6 8 8" />
        <path d="M3 12h3" />
        <path d="M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4" />
        <path d="m9 13-1-1" />
        <path d="m16 13 1-1" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Analysis History",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" />
      </svg>
    ),
  },
  {
    id: "reports",
    label: "Reports & Export",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6" />
        <path d="M12 18v-6" />
        <path d="m9 15 3 3 3-3" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (
      <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export function Brand({ compact = false }) {
  return (
    <div className={`brand ${compact ? "brand-compact" : ""}`}>
      <span className="brand-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="none">
          <rect x="2" y="2" width="20" height="20" rx="6" fill="url(#brandGrad)" />
          <rect x="6.5" y="12.5" width="2.6" height="5.5" rx="0.9" fill="#fff" opacity="0.95" />
          <rect x="10.7" y="9" width="2.6" height="9" rx="0.9" fill="#fff" opacity="0.95" />
          <rect x="14.9" y="6" width="2.6" height="12" rx="0.9" fill="#fff" opacity="0.95" />
          <circle cx="18.2" cy="5.4" r="2" fill="#22d3ee" stroke="#0b1020" strokeWidth="1.2" />
          <defs>
            <linearGradient id="brandGrad" x1="2" y1="2" x2="22" y2="22">
              <stop stopColor="#6366f1" />
              <stop offset="1" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
        </svg>
      </span>
      <span className="brand-text">
        <strong>AnalystOS</strong>
        <small>DATA INTELLIGENCE</small>
      </span>
    </div>
  );
}

export default function Sidebar({ page, onNavigate, datasetName }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <Brand />
      </div>

      <p className="sidebar-label">Workspace</p>
      <nav className="sidebar-nav">
        {NAV.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${page === item.id ? "nav-active" : ""}`}
            onClick={() => onNavigate(item.id)}
            title={item.label}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {item.id === "workspace" && datasetName && <span className="nav-dot" />}
          </button>
        ))}
      </nav>
    </aside>
  );
}
