# DataMind AI – Setup & Deployment Guide

## Overview

DataMind AI is a full-stack AI-powered data analysis platform with:
- **Backend**: FastAPI + MongoDB + OpenRouter AI + forecasting (ARIMA/Prophet)
- **Frontend**: React + TypeScript + Vite + TailwindCSS
- **Features**: User auth, dataset upload/analysis, AI chat, forecasting, PDF reports

## Prerequisites

- **Python 3.10+** (backend)
- **Node.js 18+** (frontend)
- **MongoDB** (local or Atlas)
- **OpenRouter API Key** (free tier available at https://openrouter.ai/)

## Local Development Setup

### 1. Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Environment Configuration

Create or update `.env` in the **project root**:

```env
# ─── App ───────────────────────────────────────────
APP_NAME=DataMind AI
ENVIRONMENT=development
DEBUG=true

# ─── MongoDB ─────────────────────────────────────────
# Local: mongodb://localhost:27017
# Atlas: mongodb+srv://user:pass@cluster.mongodb.net/?appName=datamind
MONGODB_URL=mongodb+srv://your_user:your_pass@your_cluster.mongodb.net/?appName=datamind
MONGODB_DB_NAME=datamind

# ─── JWT ─────────────────────────────────────────────
SECRET_KEY=your-secret-key-at-least-32-characters-long
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=7

# ─── AI (OpenRouter) ─────────────────────────────────
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxx
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free

# ─── Frontend ────────────────────────────────────────
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=DataMind AI

# ─── CORS ───────────────────────────────────────────
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# ─── File Upload ─────────────────────────────────────
MAX_UPLOAD_SIZE_MB=50
UPLOAD_DIR=./uploads

# ─── Email (optional) ────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@datamind.ai

# ─── Frontend URL ───────────────────────────────────
FRONTEND_URL=http://localhost:5173
```

### 3. Start Backend

From the **backend** directory:

```bash
.\venv\Scripts\activate  # Windows
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Expected output:
```
✅ Connected to MongoDB: datamind
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 4. Start Frontend

From the **frontend** directory (new terminal):

```bash
npm install  # if not already done
npm run dev
```

Access the app at `http://localhost:5173` or `http://localhost:5174` (if 5173 is in use).

## API Endpoints

### Authentication
- `POST /api/auth/register` – Create new account
- `POST /api/auth/login` – Login with email/password
- `POST /api/auth/refresh` – Refresh access token
- `GET /api/auth/me` – Get current user
- `POST /api/auth/logout` – Logout

### Datasets
- `POST /api/datasets/upload` – Upload CSV file
- `GET /api/datasets/` – List all datasets
- `GET /api/datasets/{id}` – Get dataset details
- `DELETE /api/datasets/{id}` – Delete dataset
- `POST /api/datasets/merge` – Merge multiple datasets

### Analysis
- `GET /api/analysis/{id}/eda` – Exploratory Data Analysis
- `GET /api/analysis/{id}/health` – Data quality score
- `GET /api/analysis/{id}/correlation-matrix` – Feature correlations
- `POST /api/analysis/{id}/clean` – Apply cleaning actions

### Chat & AI
- `POST /api/chat/message` – Send message to AI analyst
- `GET /api/chat/history/{dataset_id}` – Get chat history
- `DELETE /api/chat/history/{dataset_id}` – Clear chat history
- `GET /api/chat/sessions` – List active sessions
- `POST /api/chat/insights/{dataset_id}` – Generate AI insights

### Forecasting
- `GET /api/forecast/columns/{dataset_id}` – List date/numeric columns
- `POST /api/forecast/predict` – Generate time series forecast (ARIMA/Prophet/Linear)

### Reports
- `POST /api/reports/generate` – Generate PDF report
- `GET /api/reports/` – List reports
- `GET /api/reports/download/{id}` – Download report

### Health
- `GET /api/health` – Health check

## Integration Test

Run the included integration test to verify core flows:

```bash
cd backend
.\venv\Scripts\activate
python ..\integration_test.py
```

Expected output:
```
✅ Core integration flows working!
  - Health check ✅
  - Register user ✅
  - Login ✅
  - Get current user ✅
  - List datasets ✅
  - List chat sessions ✅
```

## Database Schema

### Collections

**users**
```javascript
{
  _id: ObjectId,
  email: String (unique),
  hashed_password: String,
  fullName: String,
  created_at: ISODate,
  datasets_count: Int,
  verified: Boolean,
  refresh_tokens: [{ token: String, expires_at: ISODate }]
}
```

**datasets**
```javascript
{
  _id: ObjectId,
  user_id: String,
  name: String,
  filepath: String,
  rows: Int,
  columns: Int,
  column_names: [String],
  created_at: ISODate
}
```

**chats**
```javascript
{
  _id: ObjectId,
  user_id: String,
  dataset_id: String,
  session_id: String,
  role: "user" | "assistant",
  content: String,
  created_at: ISODate
}
```

**reports**
```javascript
{
  _id: ObjectId,
  user_id: String,
  dataset_id: String,
  filepath: String,
  created_at: ISODate
}
```

## Deployment

### Option 1: Docker Compose (Local)

```bash
cd docker
docker-compose up --build
```

Accesses:
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- MongoDB: localhost:27017

### Option 2: Render (Cloud)

1. Push code to GitHub
2. Connect repo to Render
3. Create two services:
   - **Backend**: `uvicorn main:app --host 0.0.0.0 --port 8000`
   - **Frontend**: `npm run build && npm run preview`

4. Set environment variables in Render dashboard
5. Deploy

### Option 3: Vercel (Frontend) + Railway (Backend)

- Deploy frontend to Vercel via GitHub integration
- Deploy backend to Railway with Python environment
- Update `VITE_API_URL` to Railway backend URL in Vercel env vars

## Troubleshooting

### Backend won't start
- Verify MongoDB is running: `mongod` or check Atlas connection
- Check `.env` file is in project root (not backend/)
- Verify `OPENROUTER_API_KEY` is set and valid

### Frontend build errors
- Run `npm install` in frontend/
- Verify TypeScript config: `npx tsc --noEmit`
- Clear cache: `rm -rf node_modules .next dist`

### 401 Unauthorized on API calls
- Check token is in `Authorization: Bearer <token>` header
- Verify token is fresh (not expired)
- Check `ALLOWED_ORIGINS` in `.env` includes frontend URL

### Forecast endpoint fails
- Verify CSV has date column (ISO 8601 format preferred)
- Ensure value column is numeric
- Check column names match request payload

### AI responses are slow or timeout
- OpenRouter free tier has rate limits
- Use paid tier for production
- Consider using a different model (e.g., `gpt-3.5-turbo` via paid OpenRouter)

## Performance Tips

1. **Database**: Add indexes for frequent queries (already done in `database.py`)
2. **File Upload**: Compress PDFs before generation (`kaleido` does this)
3. **Caching**: Implement Redis for session/token caching in production
4. **Async**: All endpoints are async – use connection pooling for MongoDB
5. **CORS**: Restrict `ALLOWED_ORIGINS` to your domain in production

## Security Checklist

- [ ] Change `SECRET_KEY` to strong random value (32+ characters)
- [ ] Use environment variables for sensitive data (API keys, DB URL)
- [ ] Enable HTTPS in production
- [ ] Set `DEBUG=false` and `ENVIRONMENT=production`
- [ ] Implement rate limiting (middleware already in place)
- [ ] Add CSRF protection if using cookies
- [ ] Validate file uploads (size, type)
- [ ] Regular dependency updates: `pip check`, `npm audit`

## Development Workflow

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Backend changes**: Edit in `backend/app/`, test with integration_test.py
3. **Frontend changes**: Edit in `frontend/src/`, hot-reload in dev server
4. **Commit & push**: `git commit -m "feat: description" && git push origin feature/my-feature`
5. **Create PR**: GitHub PR for review

## Testing

### Unit Tests (Backend)
```bash
cd backend
pytest tests/
```

### Integration Test (Full Flow)
```bash
python integration_test.py
```

### Manual API Testing
```bash
# Health check
curl http://localhost:8000/api/health

# Register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Test","email":"test@example.com","password":"Secure123!"}'

# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Secure123!"}'
```

## Project Structure

```
datamind-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/        # API endpoints
│   │   ├── core/
│   │   │   ├── config.py      # Settings from .env
│   │   │   ├── database.py    # MongoDB connection
│   │   │   └── security.py    # JWT & auth
│   │   ├── services/
│   │   │   ├── ai_service.py  # OpenRouter integration
│   │   │   └── auth_service.py
│   │   ├── middleware/
│   │   └── models/
│   ├── main.py                # FastAPI app entry
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Route pages
│   │   ├── services/          # API client
│   │   ├── store/             # State management
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker/
│   └── docker-compose.yml
├── .env                       # Environment config (root)
├── integration_test.py        # Integration test script
└── README.md
```

## Getting Help

- **Backend Issues**: Check `backend/app/core/config.py` for settings
- **Frontend Issues**: Check `frontend/src/env.d.ts` for type definitions
- **Database**: Use MongoDB Compass or Atlas UI to inspect collections
- **API Docs**: Visit http://localhost:8000/api/docs (Swagger UI)

---

**Last Updated**: 2025  
**Status**: ✅ Fully functional dev environment with auth, datasets, chat, and forecasting
