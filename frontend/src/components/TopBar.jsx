import { useEffect, useState } from "react";
import { fetchHealth } from "../services/api.js";

const PAGE_TITLES = {
  dashboard: "Dashboard",
  upload: "Upload Dataset",
  workspace: "Ask AI Workspace",
  history: "Analysis History",
  reports: "Reports & Export",
  settings: "Settings",
};

export default function TopBar({ page, dataset, onNewDataset, onAskAgent, user, onSignOut }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    let alive = true;
    function check() {
      fetchHealth()
        .then((h) => alive && setOnline(Boolean(h?.status === "ok")))
        .catch(() => alive && setOnline(false));
    }
    check();
    const timer = setInterval(check, 30000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <p className="breadcrumb">
          WORKSPACE <span>/</span> {(PAGE_TITLES[page] || "Dashboard").toUpperCase()}
        </p>
        {dataset && <p className="topbar-dataset">Analyzing {dataset.name}</p>}
      </div>

      <div className="topbar-right">
        <span className={`agent-pill ${online ? "agent-online" : "agent-offline"}`}>
          <span className="status-dot" aria-hidden="true" />
          {online ? "Agent online" : "Agent offline"}
        </span>

        <div className="topbar-actions">
          <button type="button" className="btn btn-ghost btn-sm" onClick={onNewDataset}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New dataset
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={onAskAgent}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3v3M18.4 5.6 16 8M21 12h-3M5.6 5.6 8 8M3 12h3M8 16c0 2.2 1.8 4 4 4s4-1.8 4-4m-7-3-1-1m7 1 1-1" />
            </svg>
            Ask the agent
          </button>
        </div>

        <div className="user-chip" title={user?.email || ""}>
          <span className="user-avatar">{initials(user?.name || "Demo Analyst")}</span>
          <span className="user-name">{user?.name || "Demo Analyst"}</span>
          <button type="button" className="icon-btn" onClick={onSignOut} title="Sign out">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

function initials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
