import sys, traceback, os; sys.path.insert(0, ".")
import pandas as pd
from app.services.analysis import run_eda, compute_health_score, get_cleaning_suggestions
from app.services.pdf_service import generate_report

try:
    csvs = [f for f in os.listdir("uploads") if f.endswith(".csv")]
    fp = f"uploads/{csvs[0]}" if csvs else None
    if not fp: print("No CSV"); sys.exit(1)
    df = pd.read_csv(fp)
    eda = run_eda(df); health = compute_health_score(eda); cleaning = get_cleaning_suggestions(df, eda)
    insights = {
        "findings": ["Sales highest in Q4", "Electronics drives 45% of revenue"],
        "quality_issues": ["2 missing values in Profit"],
        "business_insights": ["Weekend spike in sales", "Category A most profitable"],
        "next_steps": ["Normalise numeric columns", "Remove duplicates", "Cap outliers"],
        "recommended_charts": ["Sales trend line", "Category pie"],
    }
    path = generate_report(os.path.basename(fp), eda, health, insights, None, cleaning)
    print("SUCCESS:", path, f"({os.path.getsize(path)//1024} KB)")
except Exception:
    traceback.print_exc()
