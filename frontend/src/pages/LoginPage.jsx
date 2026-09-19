import { useState } from "react";
import { Brand } from "../components/Sidebar.jsx";

const DEMO_EMAIL = "demo@analyst.local";
const DEMO_PASSWORD = "analyst123";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(event) {
    event?.preventDefault();
    const cleanEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Enter a valid work email.");
      return;
    }
    if (password.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }
    // Local demo gate: any valid credentials sign in. This is not real auth.
    onLogin({ email: cleanEmail, name: "Demo Analyst" });
  }

  function useDemo() {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    setError("");
    onLogin({ email: DEMO_EMAIL, name: "Demo Analyst" });
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand-panel">
          <Brand />

          <div className="login-brand-copy">
            <span className="badge badge-outline">INTELLIGENCE FOR EVERY TABLE</span>
            <h2>
              Turn questions into <span className="grad-text">decisions.</span>
            </h2>
            <p>
              Upload a CSV, ask in plain English, and get answers with tables
              and charts.
            </p>
          </div>

          <p className="login-foot">
            <span className="status-dot" aria-hidden="true" />
            Safe Pandas execution · no arbitrary code
          </p>
        </div>

        <div className="login-form-panel">
          <p className="micro-label">ANALYSTOS / SECURE ACCESS</p>
          <h3>Welcome to your lab</h3>
          <p className="muted">Sign in to continue analyzing your datasets.</p>

          <form className="login-form" onSubmit={submit}>
            <label className="field">
              <span>Work email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                autoComplete="username"
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </label>

            {error && <div className="alert alert-error">{error}</div>}

            <button className="btn btn-primary btn-block" type="submit">
              Sign in
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7" />
                <path d="M8 7h9v9" />
              </svg>
            </button>
          </form>

          <div className="divider">
            <span>OR</span>
          </div>

          <button type="button" className="btn btn-ghost btn-block" onClick={useDemo}>
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            Use demo account
          </button>
        </div>
      </div>
    </div>
  );
}
