// Local analysis-history persistence (localStorage). The backend keeps
// datasets in memory only, so saved runs live in the browser.

const KEY = "analystos_history";
const MAX_ITEMS = 25;

export function loadHistory() {
  try {
    const raw = localStorage.getItem(KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function persist(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // Quota exceeded: drop the oldest items and retry once.
    try {
      localStorage.setItem(KEY, JSON.stringify(items.slice(0, 10)));
    } catch {
      /* give up silently */
    }
  }
}

export function addRun(run) {
  const items = loadHistory();
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    date: new Date().toISOString(),
    ...run,
  };
  const next = [entry, ...items].slice(0, MAX_ITEMS);
  persist(next);
  return entry;
}

export function removeRun(id) {
  persist(loadHistory().filter((item) => item.id !== id));
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}

export function formatRunDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  });
}
