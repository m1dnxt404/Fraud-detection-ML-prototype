# Fraud Detection ML Prototype

A full-stack, ML-powered fraud detection system with real-time transaction scoring, an adjustable decision threshold, dual-model support (XGBoost + TensorFlow), SHAP explainability, and an interactive analytics dashboard.

## Tech Stack

| Layer          | Technology                                           |
| -------------- | ---------------------------------------------------- |
| Frontend       | React 19, TypeScript, Vite, Tailwind CSS 4, Recharts |
| Backend        | FastAPI, Python 3.12, Pydantic                       |
| ML             | XGBoost, TensorFlow / Keras, scikit-learn            |
| Explainability | SHAP (TreeExplainer, KernelExplainer)                |
| Data           | pandas, NumPy, synthetic generator                   |

## Project Structure

```text
├── backend/
│   ├── main.py                  # FastAPI entry point + CORS
│   ├── schemas.py               # Pydantic models (auto camelCase)
│   ├── data/
│   │   ├── constants.py         # Merchants, cities, card types
│   │   └── generator.py         # Synthetic transaction generator
│   ├── ml/
│   │   ├── model.py             # Dispatch layer — routes to XGBoost or TF
│   │   ├── train.py             # XGBoost training script
│   │   ├── tf_model.py          # TensorFlow/Keras inference
│   │   ├── train_tf.py          # TensorFlow training script
│   │   ├── shap_explain.py      # SHAP global + per-transaction explanations
│   │   └── artifacts/
│   │       ├── xgb_model.json   # Trained XGBoost model
│   │       ├── tf_model.keras   # Trained Keras model
│   │       └── scaler.joblib    # StandardScaler for neural net inputs
│   └── routers/
│       ├── transactions.py      # GET /api/transactions?model=
│       └── model_eval.py        # POST /api/model/evaluate
│                                  GET /api/model/roc?model=
│                                  GET /api/model/features?model=
│                                  GET /api/model/shap/{txn_id}?model=
│
├── frontend/
│   ├── vite.config.ts           # Vite + Tailwind + API proxy
│   └── src/
│       ├── api/                 # Typed fetch client + endpoint functions
│       ├── hooks/
│       │   └── useDashboardData.ts  # Central data hook (API calls + derived state)
│       ├── components/
│       │   ├── ui/              # Card, Badge, MetricCard, Tabs, Tooltip,
│       │   │                      ModelSelector, ShapWaterfall
│       │   ├── OverviewTab.tsx  # Metrics + 4 charts
│       │   ├── ModelTab.tsx     # Threshold slider, ROC, confusion matrix
│       │   └── TransactionsTab.tsx  # Transaction table + detail + SHAP
│       ├── types/               # TypeScript interfaces
│       └── constants.ts         # Color palette, tab definitions
│
└── TeachStack.md                # Technology stack documentation
```

## Features

### Model Selector

- Toggle between **XGBoost** and **TensorFlow** models in the dashboard header
- Switching models re-fetches all data — transactions, metrics, ROC curve, and feature importance update instantly

### Overview Tab

- Transaction volume by hour (bar chart)
- Amount distribution by fraud vs legitimate (stacked bar chart)
- Risk scatter plot (amount vs velocity, sized by risk score)
- SHAP-based global feature importance (mean |SHAP values|, normalized)
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
- **SHAP waterfall chart** per transaction — shows how each feature pushed the prediction up (toward fraud) or down (toward legitimate) from the base value

## Getting Started

### Prerequisites

- Python 3.12 (required for TensorFlow compatibility)
- Node.js 18+
- npm

### 1. Set up the Python environment

```bash
# Create a virtual environment with Python 3.12
py -3.12 -m venv .venvs/fd-backend

# Activate the virtual environment
# Windows
.venvs\fd-backend\Scripts\activate
# macOS / Linux
source .venvs/fd-backend/bin/activate

# Install dependencies
pip install -r backend/requirements.txt
```

### 2. Train both models

```bash
# From the project root (with venv activated)

# Train XGBoost
python -m backend.ml.train

# Train TensorFlow
python -m backend.ml.train_tf
```

XGBoost saves to `backend/ml/artifacts/xgb_model.json`. TensorFlow saves to `backend/ml/artifacts/tf_model.keras` and `backend/ml/artifacts/scaler.joblib`.

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Run the app

Start both servers in separate terminals:

```bash
# Terminal 1 — Backend (port 8000)
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. The Vite dev server proxies all `/api` requests to the FastAPI backend.

## API Endpoints

All endpoints accept a `model` query parameter (`xgboost` or `tensorflow`, defaults to `xgboost`).

| Method | Endpoint                  | Description                                    |
| ------ | ------------------------- | ---------------------------------------------- |
| GET    | `/api/transactions`       | Returns 500 scored synthetic transactions      |
| POST   | `/api/model/evaluate`     | Evaluates metrics at a given threshold         |
| GET    | `/api/model/roc`          | Returns ROC + precision-recall curve (21 pts)  |
| GET    | `/api/model/features`     | Returns SHAP-based global feature importance   |
| GET    | `/api/model/shap/{txnId}` | Returns per-transaction SHAP explanation       |

## ML Pipeline

### Synthetic Data

500 transactions generated with a 12% fraud rate. Fraud transactions exhibit:

- Higher amounts (50% chance of $2,000–$10,000)
- Late-night hours (60% chance of 1–5 AM)
- Higher velocity (5–19 txn/hr vs 1–4 for legitimate)
- Greater distance from home (500–8,500 mi vs 0–200)
- Broader merchant and city distributions

### Models

#### XGBoost

- **Algorithm**: Binary classifier (200 estimators, max depth 5)
- **Class balancing**: `scale_pos_weight` compensates for the 88/12 class split
- **SHAP**: `TreeExplainer` — exact Shapley values, computed in <1 second

#### TensorFlow / Keras

- **Architecture**: Sequential neural network — Dense(64, relu) → Dropout(0.3) → Dense(32, relu) → Dropout(0.2) → Dense(1, sigmoid)
- **Preprocessing**: `StandardScaler` on all features (saved as `scaler.joblib`)
- **Class balancing**: `class_weight` dictionary (fraud class weight ~7.46)
- **Training**: 50 epochs, batch size 32, early stopping (patience 10)
- **SHAP**: `KernelExplainer` — model-agnostic, compatible with Keras 3 (30–90s on first call, cached after)

Both models are trained on 5,000 samples (80/20 stratified split, seed 42) using 6 features: amount, hour, velocity, distance from home, merchant (encoded), city (encoded).

### SHAP Explainability

SHAP (SHapley Additive exPlanations) provides two levels of insight:

- **Global importance** — the `/features` endpoint returns mean |SHAP values| per feature, normalized and sorted. This replaces the previous XGBoost built-in / TF permutation importance with a unified, theoretically grounded method.
- **Per-transaction breakdown** — the `/shap/{txnId}` endpoint returns each feature's SHAP contribution for a specific transaction, showing the base value (average model output), each feature's push toward or away from fraud, and the final output value.

SHAP values are computed once per model for all 500 transactions and cached for the server session via `@lru_cache(maxsize=2)`. Per-transaction lookups are O(1) index operations into the cached array.

### Architecture

```text
Browser (React)
    │
    ▼
Vite Dev Server ──proxy──▶ FastAPI (port 8000)
                                │
                           ┌────┴────┐
                           ▼         ▼
                       XGBoost   TensorFlow
                           └────┬────┘
                                ▼
                          SHAP Explainer
                    (TreeExplainer / KernelExplainer)
                                │
                                ▼
                     Synthetic Data Generator
```

## Design Decisions

- **SHAP over built-in importance** — SHAP provides theoretically grounded feature attributions (Shapley values) that work identically across model types, replacing the previous mix of XGBoost's Gini importance and TF's permutation importance
- **Dual-model dispatch** — `model.py` routes `predict_risk_scores()` to either XGBoost or TensorFlow based on a `model_name` parameter
- **Per-model caching** — `lru_cache(maxsize=2)` stores scored datasets and SHAP values separately for each model so switching is instant after the first load
- **KernelExplainer for TF** — `shap.DeepExplainer` is incompatible with Keras 3; `KernelExplainer` is model-agnostic and works with any callable, at the cost of a slower first computation (~30–90s, cached after)
- **Python 3.12 venv** — TensorFlow requires Python ≤3.12; the project uses a dedicated virtual environment to avoid conflicts with system Python
- **Pydantic `alias_generator=to_camel`** — Python snake_case serializes to JavaScript camelCase automatically
- **Debounced threshold** — slider changes are debounced (150ms) to avoid flooding the backend
- **Tailwind v4 `@theme`** — custom `fd-*` color tokens defined in CSS, keeping the dark palette consistent
- **Recharts inline palette** — Recharts requires raw hex values, so `constants.ts` keeps the palette object for chart props only
