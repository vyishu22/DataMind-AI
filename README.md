# 🧠 DataMind AI — Production-Ready AI Data Analyst Agent

> Upload CSVs, ask questions in plain English, get AI-powered insights, beautiful charts, forecasts, and PDF reports — all in one premium SaaS dashboard.

![DataMind AI](https://img.shields.io/badge/DataMind-AI%20Analyst-6366f1?style=for-the-badge)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)
![Status](https://img.shields.io/badge/Status-✅%20Functional-brightgreen?style=for-the-badge)

---

## 📊 Project Status

| Component | Status |
|-----------|--------|
| **Backend** | ✅ Running (FastAPI + MongoDB) |
| **Frontend** | ✅ Vite dev server operational |
| **Auth System** | ✅ JWT register/login/refresh working |
| **Datasets** | ✅ Upload, list, delete functional |
| **AI Chat** | ✅ OpenRouter integration active |
| **Forecasting** | ✅ ARIMA/Prophet/Linear methods ready |
| **PDF Reports** | ✅ Generation pipeline implemented |
| **Docker** | ✅ Compose config ready |
| **Tests** | ✅ Integration test suite passes |

**Latest Test Run**: ✅ Core integration flows verified (health, auth, datasets, chat, sessions)

---

## ✨ Features

### Core
- 🔐 JWT Authentication (register / login / refresh)
- 📁 CSV Upload & Multi-file Merge
- 📊 Automatic EDA (missing values, duplicates, statistics, correlation, outliers)
- 📈 Interactive Charts (Bar, Line, Pie, Histogram, Heatmap)
- 🤖 AI Insights & Recommendations (OpenRouter / Llama 3.1)
- 💬 Natural Language Data Chat ("Top products?", "Average sales?")
- 🏥 AI Dataset Health Score
- 🧹 AI Data Cleaning Suggestions

### Advanced
- 🎙️ Voice Queries (Web Speech API)
- 📄 PDF Report Generation (charts + insights)
- 📉 Forecasting Dashboard (Prophet, ARIMA, LSTM)
- 📋 Executive Summary Generator
- 💾 Chat History Storage (MongoDB)
- ⬇️ Download Reports

---

## 🗂️ Folder Structure

```
datamind-ai/
├── frontend/                    # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui base components
│   │   │   ├── charts/          # Recharts wrappers
│   │   │   ├── dashboard/       # Dashboard panels
│   │   │   ├── auth/            # Login / Register forms
│   │   │   └── layout/          # Sidebar, Navbar, Shell
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # API client, utils
│   │   ├── store/               # Zustand state
│   │   └── types/               # TypeScript types
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── api/routes/          # Route handlers
│   │   ├── core/                # Config, security, deps
│   │   ├── models/              # MongoDB models (Motor)
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic
│   │   └── utils/               # Helpers
│   ├── main.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── docker/
│   └── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Quick Start

**👉 See [SETUP.md](./SETUP.md) for complete setup & deployment guide**

### Prerequisites
- Node.js 18+
- Python 3.11+
- MongoDB (local or Atlas)
- OpenRouter API key (free tier available)

### 1. Clone & Configure

```bash
git clone https://github.com/yourname/datamind-ai.git
cd datamind-ai
cp .env.example .env
# Edit .env with your MongoDB URL and OpenRouter API key
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:5173 and start uploading datasets!

### 4. Verify Installation

```bash
# Run integration test
python integration_test.py
```

Expected: ✅ All core flows pass (auth, datasets, chat, sessions)

### 5. Docker (All-in-One)

```bash
docker-compose -f docker/docker-compose.yml up --build
```

Access frontend at http://localhost:3000, backend at http://localhost:8000

---

## 🌐 Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
```

### Backend → Render
- Connect GitHub repo to Render
- Set build command: `pip install -r requirements.txt`
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add all environment variables from `.env`

---

## 🔑 Environment Variables

See `.env.example` for all required variables.

---

## 📦 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, shadcn/ui, Recharts, Framer Motion |
| Backend | FastAPI, Pandas, NumPy, Scikit-learn |
| AI | OpenRouter (OpenAI-compatible) |
| Forecasting | Prophet, statsmodels (ARIMA), TensorFlow (LSTM) |
| Database | MongoDB Atlas (Motor async driver) |
| Auth | JWT (python-jose) + bcrypt |
| PDF | ReportLab |
| Deployment | Vercel + Render |
| Container | Docker + docker-compose |

---

## 📸 Screenshots

> Dashboard · Chat · Charts · Forecasting · Reports

---

## 📄 License

MIT © 2024 DataMind AI
