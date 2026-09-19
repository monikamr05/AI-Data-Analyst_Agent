# AI Data Analyst Agent

A full-stack web app that lets you upload a CSV file, ask questions about the
data in plain English, and get back AI-generated answers with explanations,
tables, and interactive charts.

The AI (Google Gemini) writes real pandas code to answer each question; the
backend validates that code against an allow-list and runs it against your
uploaded data in a guarded sandbox.

## Features

- **CSV upload with instant profiling** — row/column counts, dtypes, nulls,
  uniques, min/max/mean, duplicate detection, and a data preview.
- **Natural-language Q&A** — ask things like *"Which region had the highest
  revenue last year?"* and get a plain-language answer backed by real numbers.
- **Tables and charts** — results render as scrollable tables and Recharts
  visualizations (bar, line, area, pie, scatter) chosen automatically by the AI.
- **Suggested questions** — starter questions generated from your dataset's
  actual columns.
- **Code transparency** — every answer can show the exact pandas code that
  produced it (click "View the code used for this answer").
- **Chat context** — follow-up questions take the recent conversation into
  account.

## Tech stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | React 18 + Vite, Recharts           |
| Backend   | Python 3, Flask, Flask-CORS         |
| Data      | Pandas, NumPy                       |
| AI        | Google Gemini API (`google-genai`)  |
| Styling   | Hand-written responsive CSS         |

## Project structure

```
ai-data-analyst-agent/
│
├── api/
│   └── index.py            # Vercel serverless entry point (imports the Flask app)
│
├── frontend/
│   ├── src/
│   │   ├── components/     # FileUpload, ChatMessage, ChartView, DataTable, ...
│   │   ├── pages/          # Dashboard, Upload, Workspace, History, Reports, Settings
│   │   ├── services/       # api.js (fetch wrappers for the Flask API)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── app.py              # Flask app factory + entry point
│   ├── requirements.txt
│   ├── .env.example        # copy to .env and add your Gemini key
│   ├── routes/             # dataset_routes.py, analysis_routes.py
│   ├── services/           # data_service, gemini_service, execution_service
│   └── uploads/            # uploaded CSV files land here (locally)
│
├── sample_data/
│   └── sales_data.csv      # 180-row demo dataset
├── requirements.txt        # root copy for Vercel's Python build step
├── vercel.json             # Vite build + /api rewrite config
├── README.md
└── .gitignore
```

## Setup

### 1. Backend

```bash
cd backend

python -m venv .venv
.venv\Scripts\activate          # Windows  (macOS/Linux: source .venv/bin/activate)

pip install -r requirements.txt
```

Get a free Gemini API key from <https://aistudio.google.com/apikey>, then:

```bash
copy .env.example .env          # macOS/Linux: cp .env.example .env
```

Open `.env` and paste your key after `GEMINI_API_KEY=`. Then start the API:

```bash
python app.py                   # serves on http://localhost:5000
```

### 2. Frontend (second terminal)

```bash
cd frontend
npm install
npm run dev                     # serves on http://localhost:5173
```

The Vite dev server proxies `/api/*` calls to Flask on port 5000, so just open
<http://localhost:5173> in your browser.

## Deploy to Vercel

The repo is wired for Vercel out of the box:

- `vercel.json` builds the frontend with `npm --prefix frontend run build`,
  serves the static bundle from `frontend/dist`, and rewrites every `/api/*`
  request to the Python function in `api/index.py`.
- `api/index.py` imports the Flask app from `backend/` and exposes it as a
  serverless WSGI function.
- The root `requirements.txt` installs the Python dependencies.

Steps:

1. Push the project to GitHub and import the repo at
   <https://vercel.com/new> (framework detection can be left on "Other").
2. In **Project → Settings → Environment Variables**, add
   `GEMINI_API_KEY` with your Gemini key (get one at
   <https://aistudio.google.com/apikey>). Never commit the key — `.env` is
   git-ignored.
3. Deploy. Vercel installs Python deps, builds the frontend, and exposes
   `https://<your-app>.vercel.app`.

Notes on the serverless runtime:

- **Datasets live in function memory.** Each deployment or cold start clears
  them, so after a deploy you re-upload your CSV (the UI prompts you to).
- **Uploads are capped at 4 MB** on Vercel (its request-body limit is 4.5 MB);
  locally the cap is 50 MB.
- **Functions run at most 60 s** on the Hobby plan, so the backend auto-retries
  a Gemini 429 only when Google says to wait ≤ 30 s; otherwise you get a
  friendly "quota exhausted" message with a Retry button.
- The demo login is a client-side gate, not real authentication.

## Usage

1. Drag `sample_data/sales_data.csv` (or any of your own CSV files) onto the
   upload page.
2. Click a suggested question on the left, or type your own in the chat box.
3. Read the explanation, and explore the table, chart, and generated code.

Example questions against the sample data:

- *"Which region has the highest total revenue? Show a bar chart."*
- *"How did monthly revenue develop over time?"*
- *"What is the average profit per product category?"*
- *"Which sales rep sold the most units?"*

## API endpoints

| Method | Path                                   | Description                                |
| ------ | -------------------------------------- | ------------------------------------------ |
| POST   | `/api/upload`                          | Upload a CSV (multipart field `file`)      |
| GET    | `/api/datasets`                        | List datasets loaded in this session       |
| GET    | `/api/datasets/<id>`                   | Dataset profile (schema + stats)           |
| GET    | `/api/datasets/<id>/preview?n=20`      | First N rows                               |
| POST   | `/api/ask`                             | `{dataset_id, question, history}` → answer |
| GET    | `/api/suggested-questions?dataset_id=` | Tailored starter questions                 |
| GET    | `/api/health`                          | Health check + whether the API key is set  |

Example `POST /api/ask` response:

```json
{
  "answer": "The North region leads with $12,340 in total revenue, ...",
  "code": "result = df.groupby('region')['revenue'].sum().reset_index()",
  "result": {
    "type": "table",
    "columns": ["region", "revenue"],
    "rows": [{"region": "North", "revenue": 12340.0}],
    "row_count": 4,
    "truncated": false
  },
  "chart": { "type": "bar", "x": "region", "y": "revenue", "title": "Revenue by region" }
}
```

## How the analysis pipeline works

1. The backend builds a prompt containing the dataset schema, a sample of rows,
   the recent chat history, and the user's question.
2. Gemini is asked (in JSON mode) for `{explanation, code, chart}`.
3. `execution_service` statically validates the code with Python's `ast` module
   (pandas/numpy imports only, no dunder access, no dangerous builtins) and
   executes it with a minimal builtin scope against a **copy** of the data.
4. The `result` variable is converted to a JSON-safe table or scalar; the chart
   spec is checked against the result's actual columns before being returned.
5. The frontend renders the explanation, the table, and the Recharts chart.

## Security note

Executing model-generated code is inherently powerful and risky. The sandbox
(AST allow-list, restricted builtins, no file/network access) plus Vercel's
serverless isolation makes this acceptable for a personal demo deployment,
but the login page is a client-side gate — anyone with the URL can use the
app. For a production or multi-user deployment, add real authentication,
process isolation, stricter resource limits, and rate limiting first.
