"""EDA, health score, outlier detection, correlation."""
from typing import Any, Dict

import numpy as np
import pandas as pd
from scipy import stats


def _safe_val(v):
    """Convert numpy types to Python native for JSON serialisation."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v) if not np.isnan(v) and not np.isinf(v) else None
    if isinstance(v, (np.bool_,)):
        return bool(v)
    if isinstance(v, (np.ndarray,)):
        return v.tolist()
    return v


def run_eda(df: pd.DataFrame) -> Dict[str, Any]:
    """Full exploratory data analysis."""
    result: Dict[str, Any] = {}

    # ── Basic info ──────────────────────────────────────────────────────────────
    result["shape"] = {"rows": len(df), "columns": len(df.columns)}
    result["column_names"] = df.columns.tolist()
    result["dtypes"] = {col: str(dt) for col, dt in df.dtypes.items()}

    # ── Missing values ──────────────────────────────────────────────────────────
    missing = df.isnull().sum()
    result["missing"] = {
        col: {
            "count": int(missing[col]),
            "pct": round(float(missing[col]) / len(df) * 100, 2),
        }
        for col in df.columns
        if missing[col] > 0
    }
    result["missing_total"] = int(missing.sum())

    # ── Duplicates ──────────────────────────────────────────────────────────────
    result["duplicates"] = int(df.duplicated().sum())

    # ── Numeric statistics ──────────────────────────────────────────────────────
    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    desc = df[numeric_cols].describe().to_dict() if numeric_cols else {}
    result["statistics"] = {
        col: {k: _safe_val(v) for k, v in vals.items()}
        for col, vals in desc.items()
    }

    # ── Skewness & kurtosis ─────────────────────────────────────────────────────
    result["skewness"] = {
        col: _safe_val(df[col].skew())
        for col in numeric_cols
    }
    result["kurtosis"] = {
        col: _safe_val(df[col].kurt())
        for col in numeric_cols
    }

    # ── Correlation matrix ──────────────────────────────────────────────────────
    if len(numeric_cols) > 1:
        corr = df[numeric_cols].corr()
        result["correlation"] = {
            col: {c: _safe_val(v) for c, v in row.items()}
            for col, row in corr.to_dict().items()
        }
    else:
        result["correlation"] = {}

    # ── Outliers (IQR method) ───────────────────────────────────────────────────
    outliers: Dict[str, Any] = {}
    for col in numeric_cols:
        s = df[col].dropna()
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        mask = (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)
        outlier_vals = s[mask].tolist()[:20]  # cap at 20
        outliers[col] = {
            "count": int(mask.sum()),
            "pct": round(float(mask.sum()) / len(s) * 100, 2),
            "samples": [_safe_val(v) for v in outlier_vals],
            "lower_bound": _safe_val(q1 - 1.5 * iqr),
            "upper_bound": _safe_val(q3 + 1.5 * iqr),
        }
    result["outliers"] = outliers

    # ── Categorical columns ─────────────────────────────────────────────────────
    cat_cols = df.select_dtypes(exclude="number").columns.tolist()
    result["categorical"] = {
        col: {
            "unique": int(df[col].nunique()),
            "top_values": df[col].value_counts().head(10).to_dict(),
        }
        for col in cat_cols
    }

    # ── Value distributions for numeric (histogram bins) ───────────────────────
    distributions: Dict[str, Any] = {}
    for col in numeric_cols[:8]:  # limit to first 8 for performance
        s = df[col].dropna()
        counts, bin_edges = np.histogram(s, bins=20)
        distributions[col] = {
            "counts": counts.tolist(),
            "bins": [round(float(b), 4) for b in bin_edges.tolist()],
        }
    result["distributions"] = distributions

    return result


def compute_health_score(eda: Dict[str, Any]) -> Dict[str, Any]:
    """Return a 0-100 dataset health score with breakdown."""
    shape = eda.get("shape", {})
    rows = shape.get("rows", 1)
    cols_count = shape.get("columns", 1)

    # Missing data penalty (max -30)
    missing_pct = (eda.get("missing_total", 0) / max(rows * cols_count, 1)) * 100
    missing_score = max(0, 30 - missing_pct * 3)

    # Duplicates penalty (max -20)
    dup_pct = (eda.get("duplicates", 0) / max(rows, 1)) * 100
    dup_score = max(0, 20 - dup_pct * 4)

    # Outlier penalty (max -20)
    outliers = eda.get("outliers", {})
    avg_outlier_pct = (
        sum(v["pct"] for v in outliers.values()) / max(len(outliers), 1)
        if outliers else 0
    )
    outlier_score = max(0, 20 - avg_outlier_pct * 2)

    # Data volume bonus (max 15)
    volume_score = min(15, rows / 1000 * 5)

    # Column diversity (max 15)
    diversity_score = min(15, cols_count)

    total = missing_score + dup_score + outlier_score + volume_score + diversity_score
    total = round(min(100, max(0, total)))

    grade = "A" if total >= 85 else "B" if total >= 70 else "C" if total >= 55 else "D"

    return {
        "score": total,
        "grade": grade,
        "breakdown": {
            "completeness": round(missing_score / 30 * 100),
            "uniqueness": round(dup_score / 20 * 100),
            "consistency": round(outlier_score / 20 * 100),
            "volume": round(volume_score / 15 * 100),
            "diversity": round(diversity_score / 15 * 100),
        },
        "issues": _health_issues(eda),
    }


def _health_issues(eda: Dict) -> list:
    issues = []
    if eda.get("missing_total", 0) > 0:
        issues.append({
            "type": "missing_values",
            "severity": "high" if eda["missing_total"] > 100 else "medium",
            "message": f"{eda['missing_total']} missing values detected across columns",
        })
    if eda.get("duplicates", 0) > 0:
        issues.append({
            "type": "duplicates",
            "severity": "medium",
            "message": f"{eda['duplicates']} duplicate rows found",
        })
    outlier_cols = [c for c, v in eda.get("outliers", {}).items() if v["pct"] > 5]
    if outlier_cols:
        issues.append({
            "type": "outliers",
            "severity": "medium",
            "message": f"High outlier rate in: {', '.join(outlier_cols[:3])}",
        })
    return issues


def get_cleaning_suggestions(df: pd.DataFrame, eda: Dict[str, Any]) -> list:
    """AI-style rule-based cleaning recommendations."""
    suggestions = []

    # Missing values
    for col, info in eda.get("missing", {}).items():
        dtype = eda["dtypes"].get(col, "")
        if info["pct"] > 50:
            suggestions.append({
                "column": col,
                "action": "drop_column",
                "reason": f"{info['pct']}% missing — consider removing this column",
                "priority": "high",
            })
        elif "float" in dtype or "int" in dtype:
            suggestions.append({
                "column": col,
                "action": "fill_median",
                "reason": f"Fill {info['count']} missing numeric values with median",
                "priority": "medium",
            })
        else:
            suggestions.append({
                "column": col,
                "action": "fill_mode",
                "reason": f"Fill {info['count']} missing categorical values with mode",
                "priority": "medium",
            })

    # Duplicates
    if eda.get("duplicates", 0) > 0:
        suggestions.append({
            "column": "all",
            "action": "drop_duplicates",
            "reason": f"Remove {eda['duplicates']} duplicate rows",
            "priority": "high",
        })

    # Outliers
    for col, info in eda.get("outliers", {}).items():
        if info["pct"] > 10:
            suggestions.append({
                "column": col,
                "action": "cap_outliers",
                "reason": f"Cap {info['count']} outliers in '{col}' using IQR bounds",
                "priority": "medium",
            })

    # Type suggestions
    for col in df.columns:
        if df[col].dtype == object:
            try:
                pd.to_numeric(df[col])
                suggestions.append({
                    "column": col,
                    "action": "convert_to_numeric",
                    "reason": f"Column '{col}' appears numeric but stored as text",
                    "priority": "low",
                })
            except Exception:
                pass

    return suggestions
