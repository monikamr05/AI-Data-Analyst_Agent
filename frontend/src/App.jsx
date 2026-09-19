import { useCallback, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import WorkspacePage from "./pages/WorkspacePage.jsx";

const USER_KEY = "analystos_user";

function loadUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function App() {
  const [user, setUser] = useState(loadUser);
  const [dataset, setDataset] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const pendingRef = useRef(null);
  const [historyVersion, setHistoryVersion] = useState(0);

  const login = useCallback((profile) => {
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }, []);

  const signOut = useCallback(() => {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const bumpHistory = useCallback(() => {
    setHistoryVersion((v) => v + 1);
  }, []);

  const goUpload = useCallback(() => setPage("upload"), []);
  const goWorkspace = useCallback(() => setPage("workspace"), []);

  const askFromDashboard = useCallback((question) => {
    pendingRef.current = question;
    setPendingQuestion(question);
    setPage("workspace");
  }, []);

  const takePendingQuestion = useCallback(() => {
    const question = pendingRef.current;
    pendingRef.current = null;
    setPendingQuestion(null);
    return question;
  }, []);

  const handleUploaded = useCallback((nextDataset) => {
    setDataset(nextDataset);
    setPage("dashboard");
  }, []);

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <div className="app-shell">
      <Sidebar page={page} onNavigate={setPage} datasetName={dataset?.name} />

      <div className="app-body">
        <TopBar
          page={page}
          dataset={dataset}
          user={user}
          onNewDataset={goUpload}
          onAskAgent={goWorkspace}
          onSignOut={signOut}
        />

        <main className="app-main">
          {page === "dashboard" && (
            <DashboardPage dataset={dataset} onUpload={goUpload} onAsk={askFromDashboard} />
          )}
          {page === "upload" && <UploadPage onUploaded={handleUploaded} />}
          {page === "workspace" &&
            (dataset ? (
              <WorkspacePage
                dataset={dataset}
                pendingQuestion={pendingQuestion}
                takePendingQuestion={takePendingQuestion}
                onHistoryChange={bumpHistory}
              />
            ) : (
              <DashboardPage dataset={dataset} onUpload={goUpload} onAsk={askFromDashboard} />
            ))}
          {page === "history" && <HistoryPage refreshKey={historyVersion} />}
          {page === "reports" && <ReportsPage refreshKey={historyVersion} />}
          {page === "settings" && (
            <SettingsPage
              dataset={dataset}
              onUnloadDataset={() => setDataset(null)}
              onHistoryChange={bumpHistory}
            />
          )}
        </main>
      </div>
    </div>
  );
}
