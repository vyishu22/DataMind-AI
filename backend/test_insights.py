"""Quick test of the full generate_insights pipeline."""
import asyncio
import sys
import json
import pandas as pd
import numpy as np

sys.path.insert(0, ".")

async def main():
    from app.core.config import settings
    from app.services.openrouter_client import chat as openrouter_chat, OpenRouterError, RateLimitError
    from app.services.analysis import run_eda
    from app.services.ai_service import generate_insights

    print("Model:", settings.OPENROUTER_MODEL)
    print("API key set:", bool(settings.OPENROUTER_API_KEY))

    # Build a small test dataframe
    np.random.seed(42)
    df = pd.DataFrame({
        "date": pd.date_range("2024-01-01", periods=30).astype(str),
        "sales": np.random.randint(100, 500, 30),
        "revenue": np.random.rand(30) * 10000,
        "region": np.random.choice(["North", "South", "East"], 30),
    })

    print("\n--- Step 1: run_eda ---")
    try:
        eda = run_eda(df)
        print("EDA OK, shape:", eda["shape"])
    except Exception as e:
        print("EDA FAILED:", e)
        return

    print("\n--- Step 2: raw OpenRouter call ---")
    try:
        resp = await openrouter_chat(
            messages=[
                {"role": "system", "content": "You are a data science expert. Always respond with valid JSON."},
                {"role": "user", "content": "Return this JSON exactly: {\"findings\":[\"ok\"],\"quality_issues\":[],\"business_insights\":[],\"next_steps\":[],\"recommended_charts\":[]}"},
            ],
            model=settings.OPENROUTER_MODEL,
            temperature=0.3,
            timeout=30,
        )
        print("Raw content:", repr(resp.get("content", "")[:400]))
    except OpenRouterError as e:
        print("OpenRouterError:", e)
        return
    except RateLimitError as e:
        print("RateLimitError:", e)
        return

    print("\n--- Step 3: generate_insights ---")
    try:
        insights = await generate_insights(df, eda)
        print("Insights result:")
        print(json.dumps(insights, indent=2))
    except Exception as e:
        print("generate_insights FAILED:", type(e).__name__, e)

asyncio.run(main())
