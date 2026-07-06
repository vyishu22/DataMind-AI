#!/usr/bin/env bash
# DataMind AI — One-command local dev setup
set -e

echo ""
echo "🧠  DataMind AI — Setup"
echo "========================"

# Check prerequisites
command -v python3 >/dev/null 2>&1 || { echo "❌  Python 3.11+ required"; exit 1; }
command -v node    >/dev/null 2>&1 || { echo "❌  Node 18+ required"; exit 1; }

# Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "📋  .env created from .env.example — fill in your secrets!"
fi

# Backend
echo ""
echo "🔧  Setting up backend..."
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt --quiet
cd ..

# Frontend
echo ""
echo "🎨  Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

echo ""
echo "✅  Setup complete!"
echo ""
echo "Start backend:   cd backend && source venv/bin/activate && uvicorn main:app --reload"
echo "Start frontend:  cd frontend && npm run dev"
echo ""
echo "Or run both with Docker:"
echo "  docker-compose -f docker/docker-compose.yml up --build"
