# AI Data Analyst Agent

[![Live Demo](https://img.shields.io/badge/Live_Demo-onrender.com-success?style=for-the-badge&logo=render)](https://ai-data-analyst-agent-k5sl.onrender.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_%2B_Vite-61dafb?style=for-the-badge&logo=react)](https://react.dev/)
[![Python](https://img.shields.io/badge/Backend-Python_Flask-3776ab?style=for-the-badge&logo=python)](https://flask.palletsprojects.com/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285f4?style=for-the-badge&logo=google)](https://aistudio.google.com/)

> **🌐 Live Application**: [https://ai-data-analyst-agent-k5sl.onrender.com/](https://ai-data-analyst-agent-k5sl.onrender.com/)

A full-stack, AI-powered web application that lets you upload CSV datasets, ask questions in plain English, and receive instant answers accompanied by detailed explanations, structured data tables, interactive charts, and transparent pandas code.

The AI (**Google Gemini**) writes real pandas code to answer each query; the backend statically validates the generated code in a secure AST sandbox and executes it against your data in isolated memory.

---

## 🚀 Features

- **⚡ Instant CSV Profiling** — Row & column counts, data types, null counts, unique values, summary stats (min, max, mean), duplicate detection, and quick data preview.
- **💬 Natural-Language Q&A** — Ask questions like *"Which product category generated the highest revenue?"* and get answers backed by real numbers.
- **📊 Dynamic Charts & Tables** — Automatic visualization via Recharts (Bar, Line, Area, Pie, Scatter) tailored to the query results.
- **💡 Smart Starter Questions** — Tailored questions generated dynamically from your dataset's columns and distributions.
- **🔍 Code Transparency** — Inspect the exact pandas code written by the AI to verify and reproduce any result.
- **🧠 Contextual Chat History** — Multi-turn conversation support that understands follow-up questions in context.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide Icons |
| **Backend** | Python 3.12, Flask, Flask-CORS, Gunicorn |
| **Data Processing** | Pandas, NumPy |
| **AI Engine** | Google Gemini 2.5 Flash (`google-genai`) |
| **Styling** | Modern responsive CSS with sleek dark/light aesthetics |

---

## 📁 Project Structure

```
ai-data-analyst-agent/
│
├── api/
│   ├── index.py             # Serverless WSGI entry point (Vercel)
│   └── requirements.txt     # Python dependencies for serverless deployment
│
├── frontend/
│   ├── src/
│   │   ├── components/      # FileUpload, ChatMessage, ChartView, DataTable, etc.
│   │   ├── pages/           # Dashboard, Upload, Workspace, History, Reports, Settings
│   │   ├── services/        # api.js (API client)
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── package.json
│   └── index.html
│
├── backend/
│   ├── app.py               # Flask application factory and entry point
│   ├── requirements.txt
│   ├── .env.example         # Sample environment variables
│   ├── routes/              # dataset_routes.py, analysis_routes.py
│   ├── services/            # data_service, gemini_service, execution_service
│   └── uploads/             # Local CSV storage
│
├── sample_data/
│   └── sales_data.csv       # Sample demo dataset
├── requirements.txt         # Root Python requirements
├── render.yaml              # Render blueprint deployment configuration
├── vercel.json              # Vercel static build and routing configuration
└── README.md
```

---

## 💻 Local Setup & Development

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment:
# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Get a free Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey), then copy the environment template:

```bash
# Windows
copy .env.example .env
# macOS / Linux
cp .env.example .env
```

Open `.env` and set your key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the Flask backend:
```bash
python app.py
# Runs on http://localhost:5000
```

### 2. Frontend Setup (in a second terminal)

```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

Open `http://localhost:5173` in your browser. The Vite development server automatically proxies `/api/*` requests to the Flask backend on port 5000.

---

## ☁️ Deployment Guides

### Option 1: Deploy to Render (Recommended)

Render runs a persistent full-stack Python service with Gunicorn:

1. Push your repository to GitHub.
2. Sign in to [Render Dashboard](https://dashboard.render.com) and click **New +** → **Web Service**.
3. Select your GitHub repository.
4. Configure the settings:
   - **Environment / Runtime**: `Python`
   - **Build Command**: 
     ```bash
     npm --prefix frontend install && npm --prefix frontend run build && pip install -r requirements.txt
     ```
   - **Start Command**: 
     ```bash
     gunicorn --chdir backend "app:create_app()" -b 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 120
     ```
5. Add **Environment Variables**:
   - `PYTHON_VERSION` = `3.12.0`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
6. Click **Deploy Web Service**.

---

### Option 2: Deploy to Vercel

1. Push your repository to GitHub.
2. Go to [Vercel Dashboard](https://vercel.com/new) and import the repository.
3. Keep **Framework Preset** as **Other** and **Root Directory** as `./`.
4. Add the **Environment Variable**:
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
5. Click **Deploy**. Vercel will build the frontend and serve the Flask backend via serverless functions.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/upload` | Upload CSV dataset (`file` multipart form) |
| `GET` | `/api/datasets` | List active datasets |
| `GET` | `/api/datasets/<id>` | Fetch dataset schema, summary statistics, and profile |
| `GET` | `/api/datasets/<id>/preview?n=20` | Get first N rows of the dataset |
| `POST` | `/api/ask` | Submit a question `{dataset_id, question, history}` |
| `GET` | `/api/suggested-questions?dataset_id=` | Retrieve starter questions for a dataset |
| `GET` | `/api/health` | Health check & verify Gemini API configuration |

---

## 🔬 How the Analysis Pipeline Works

1. **Prompt Construction**: The backend prepares a structured context including dataset column schemas, summary statistics, data preview samples, recent chat history, and the user's question.
2. **AI Code Generation**: Google Gemini produces a structured JSON response containing a natural language explanation, pandas code (assigning output to `result`), and an optional chart specification.
3. **AST Sandbox Validation**: Python's `ast` module statically inspects the code to ensure it only imports permitted libraries (`pandas`, `numpy`), blocks access to dangerous built-ins, and rejects file/network I/O.
4. **Execution & Format**: The validated code executes against a copy of the DataFrame. Results are serialized to JSON-safe tables and chart configurations.
5. **Interactive UI Rendering**: React components display the natural language explanation, interactive Recharts visualization, scrollable data table, and reproducible Python code.

---

## 🛡️ Security & Sandbox Design

- **Static AST Filtering**: Prohibits `exec`, `eval`, `open`, `__import__`, `os`, `sys`, `subprocess`, and dunder attribute access.
- **Restricted Execution Scope**: Code executes with minimal safe built-ins against in-memory copies of the data.
- **Isolated Serverless/Container Environments**: Ensures safe execution during personal and team demo deployments.

---

## 📄 License

MIT License. Feel free to use and customize for your data analysis projects!
