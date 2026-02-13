# Fraud Detection ML Prototype

A full-stack, ML-powered fraud detection system with real-time transaction scoring, an adjustable decision threshold, and an interactive analytics dashboard.

## Tech Stack

| Layer    | Technology                                           |
| -------- | ---------------------------------------------------- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts |
| Backend  | FastAPI, Python 3.14, Pydantic                       |
| ML Model | XGBoost (binary classification)                      |
| Data     | scikit-learn, pandas, NumPy                          |

## Project Structure

```text
├── backend/
│   ├── main.py                  # FastAPI entry point + CORS
│   ├── schemas.py               # Pydantic models (auto camelCase)
│   ├── data/
│   │   ├── constants.py         # Merchants, cities, card types
│   │   └── generator.py         # Synthetic transaction generator
│   ├── ml/
│   │   ├── train.py             # XGBoost training script
│   │   ├── model.py             # Inference, evaluation, feature importance
│   │   └── artifacts/
│   │       └── xgb_model.json   # Trained model
│   └── routers/
│       ├── transactions.py      # GET /api/transactions
│       └── model_eval.py        # POST /api/model/evaluate
│                                  GET /api/model/roc
│                                  GET /api/model/features
│
├── frontend/
│   ├── vite.config.ts           # Vite + Tailwind + API proxy
│   └── src/
│       ├── api/                 # Typed fetch client + endpoint functions
│       ├── hooks/
│       │   └── useDashboardData.ts  # Central data hook (API calls + derived state)
│       ├── components/
│       │   ├── ui/              # Card, Badge, MetricCard, Tabs, Tooltip
│       │   ├── OverviewTab.tsx  # Metrics + 4 charts
│       │   ├── ModelTab.tsx     # Threshold slider, ROC, confusion matrix
│       │   └── TransactionsTab.tsx  # Transaction table + detail panel
│       ├── types/               # TypeScript interfaces
│       └── constants.ts         # Color palette, tab definitions
│
└── TeachStack.md                # Technology stack documentation
```

## Features

### Overview Tab

- Transaction volume by hour (bar chart)
- Amount distribution by fraud vs legitimate (stacked bar chart)
- Risk scatter plot (amount vs velocity, sized by risk score)
- XGBoost feature importance (live from trained model)
- Key metrics: total transactions, flagged count, precision, recall, F1

### Model Performance Tab

- Adjustable decision threshold slider (0.10 – 0.90)
- Live confusion matrix (TP, FP, FN, TN) updating in real-time
- ROC curve with random classifier reference line
- Precision-recall tradeoff across all thresholds

### Transaction Log Tab

- Top 15 highest-risk transactions sorted by risk score
- Clickable rows with full transaction detail panel
- Risk factor badges: High Amount, Late Night, High Velocity, Far from Home
- Color-coded risk scores (green / amber / red)

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm

### 1. Install backend dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Train the XGBoost model

```bash
# From the project root
python -m backend.ml.train
```

This generates 5,000 synthetic transactions, trains an XGBoost classifier with class-weight balancing, and saves the model to `backend/ml/artifacts/xgb_model.json`.

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Run the app

Start both servers in separate terminals:

```bash
# Terminal 1 — Backend (port 8000)
cd Fraud detection ML prototype
python -m uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite dev server proxies all `/api` requests to the FastAPI backend.

## API Endpoints

| Method | Endpoint              | Description                                    |
| ------ | --------------------- | ---------------------------------------------- |
| GET    | `/api/transactions`   | Returns 500 scored synthetic transactions      |
| POST   | `/api/model/evaluate` | Evaluates metrics at a given threshold         |
| GET    | `/api/model/roc`      | Returns ROC + precision-recall curve (21 pts)  |
| GET    | `/api/model/features` | Returns XGBoost feature importance             |

## ML Pipeline

### Synthetic Data

500 transactions generated with a 12% fraud rate. Fraud transactions exhibit:

- Higher amounts (50% chance of $2,000–$10,000)
- Late-night hours (60% chance of 1–5 AM)
- Higher velocity (5–19 txn/hr vs 1–4 for legitimate)
- Greater distance from home (500–8,500 mi vs 0–200)
- Broader merchant and city distributions

### Model

- **Algorithm**: XGBoost binary classifier (200 estimators, max depth 5)
- **Features**: amount, hour, velocity, distance from home, merchant (encoded), city (encoded)
- **Class balancing**: `scale_pos_weight` compensates for the 88/12 class split
- **Training data**: 5,000 samples (80/20 stratified train-test split, seed 42)

### Architecture

```text
Browser (React)
    │
    ▼
Vite Dev Server ──proxy──▶ FastAPI (port 8000)
                                │
                                ▼
                          XGBoost Model
                                │
                                ▼
                     Synthetic Data Generator
```

## Design Decisions

- **Pydantic `alias_generator=to_camel`** — Python snake_case serializes to JavaScript camelCase automatically
- **LRU-cached dataset** — transactions are generated once per server session, ensuring consistent data across all endpoints
- **Debounced threshold** — slider changes are debounced (150ms) to avoid flooding the backend
- **Tailwind v4 `@theme`** — custom `fd-*` color tokens defined in CSS, keeping the dark palette consistent
- **Recharts inline palette** — Recharts requires raw hex values, so `constants.ts` keeps the palette object for chart props only
