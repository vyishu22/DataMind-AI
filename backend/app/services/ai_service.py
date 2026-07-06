"""AI service: chat, insights, executive summary using OpenRouter."""
from typing import Optional
import pandas as pd
import json
import re

from app.core.config import settings
from app.services.openrouter_client import chat as openrouter_chat, OpenRouterError, RateLimitError


def _extract_json(text: str) -> dict:
    """Robustly extract a JSON object from a model response.

    Handles:
    - Plain JSON
    - ```json ... ``` fences
    - Leading/trailing whitespace or <pad> tokens
    - Truncated JSON (attempts partial recovery)
    """
    # Remove <pad> tokens some models emit
    text = re.sub(r"<pad>", "", text).strip()

    # Try 1: direct parse
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try 2: extract content inside ```...``` fences
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text)
    if fence:
        try:
            return json.loads(fence.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try 3: find the first { ... } block
    brace = re.search(r"\{[\s\S]*\}", text)
    if brace:
        try:
            return json.loads(brace.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not extract JSON from model response: {text[:200]}")


def _to_messages(system: str, history: Optional[list], user_input: str) -> list:
    messages = [{"role": "system", "content": system}]
    if history:
        # history is list of {role, content}
        for msg in history[-6:]:
            role = msg.get("role", "user")
            messages.append({"role": role, "content": msg.get("content", "")})
    messages.append({"role": "user", "content": user_input})
    return messages


async def ask_about_data(
    question: str,
    df: pd.DataFrame,
    history: Optional[list] = None,
) -> str:
    """Answer a natural-language question about a DataFrame using OpenRouter."""
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    cat_cols = df.select_dtypes(exclude="number").columns.tolist()
    stats_summary = df[numeric_cols].describe().round(2).to_string() if numeric_cols else "No numeric columns"

    system_prompt = f"""You are DataMind AI, an expert data analyst assistant.
You are analyzing a dataset with {len(df)} rows and {len(df.columns)} columns.
Columns: {', '.join(df.columns.tolist())}
Numeric columns: {', '.join(numeric_cols)}
Categorical columns: {', '.join(cat_cols)}

Statistical summary:
{stats_summary}

Sample data (first 3 rows):
{df.head(3).fillna('').to_string()}

Answer questions concisely and accurately. If asked for calculations, compute them from the data summary.
Format numbers clearly. Use bullet points when listing multiple items.
If a question requires visual analysis, describe what chart would best answer it."""

    messages = _to_messages(system_prompt, history, question)

    try:
        resp = await openrouter_chat(messages=messages, model=settings.OPENROUTER_MODEL, temperature=0.3)
        return resp.get("content", "")
    except RateLimitError:
        return "Error: rate limit exceeded. Please try again later."
    except OpenRouterError as e:
        return f"Error: AI service unavailable: {str(e)}"


async def generate_insights(df: pd.DataFrame, eda: dict) -> dict:
    """Generate AI insights from EDA results using OpenRouter."""
    prompt = f"""You are a senior data scientist reviewing a dataset.

Dataset overview:
- Rows: {eda['shape']['rows']}, Columns: {eda['shape']['columns']}
- Missing values: {eda['missing_total']} total
- Duplicate rows: {eda['duplicates']}
- Columns: {', '.join(eda['column_names'])}

Statistical summary:
{str(eda.get('statistics', {}))[:1500]}

Return ONLY a JSON object (no markdown, no explanation) with exactly these keys:
{{
  "findings": ["finding1", "finding2", "finding3"],
  "quality_issues": ["issue1"],
  "business_insights": ["insight1"],
  "next_steps": ["step1"],
  "recommended_charts": ["chart1"]
}}

Each list should have 3-5 short, specific, actionable items. No extra keys."""

    messages = [
        {"role": "system", "content": "You are a data science expert. Respond ONLY with a valid JSON object. No markdown fences, no explanation."},
        {"role": "user", "content": prompt},
    ]

    _default_error = {
        "findings": ["AI service error: could not generate insights."],
        "quality_issues": [],
        "business_insights": [],
        "next_steps": [],
        "recommended_charts": [],
    }

    try:
        resp = await openrouter_chat(messages=messages, model=settings.OPENROUTER_MODEL, temperature=0.1, timeout=60)
        text = resp.get("content", "").strip()
        if not text:
            return _default_error
        return _extract_json(text)
    except (OpenRouterError, RateLimitError):
        return _default_error
    except Exception:
        return _default_error


async def generate_executive_summary(df: pd.DataFrame, eda: dict, insights: dict) -> str:
    """Generate a concise executive summary using OpenRouter."""
    prompt = f"""Write a professional executive summary for a data analysis report.

Dataset: {eda['shape']['rows']} rows × {eda['shape']['columns']} columns
Key findings: {insights.get('findings', [])}
Quality score: See health metrics
Business insights: {insights.get('business_insights', [])}

Write 3-4 paragraphs suitable for a C-level executive.
Be concise, highlight ROI/business value, and end with a clear recommendation."""

    messages = [
        {"role": "system", "content": "You are a business intelligence expert writing for executives."},
        {"role": "user", "content": prompt},
    ]
    try:
        resp = await openrouter_chat(messages=messages, model=settings.OPENROUTER_MODEL, temperature=0.3)
        return resp.get("content", "")
    except RateLimitError:
        return "Error: rate limit exceeded. Please try again later."
    except OpenRouterError as e:
        return f"Error: AI service unavailable: {str(e)}"
