"""DataMind AI - Professional Business Analytics Report.
Clean white corporate design. Times New Roman. 4-6 pages. No HTML tags.
"""
import io, os, uuid
from datetime import datetime
from typing import Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, Image, KeepTogether,
)
from reportlab.pdfgen import canvas as rl_canvas

W, H  = A4
LMAR  = 2.5 * cm
RMAR  = 2.5 * cm
TMAR  = 2.8 * cm
BMAR  = 2.2 * cm
TW    = W - LMAR - RMAR

DARK_BLUE  = colors.HexColor("#1E3A8A")
LT_BLUE_BG = colors.HexColor("#EFF6FF")
BLACK      = colors.black
DK_GRAY    = colors.HexColor("#374151")
MD_GRAY    = colors.HexColor("#6B7280")
LT_GRAY    = colors.HexColor("#F3F4F6")
BDR        = colors.HexColor("#D1D5DB")
WHITE      = colors.white

TN  = "Times-Roman"
TNB = "Times-Bold"
TI  = "Times-Italic"


def _S():
    def p(name, fn=TN, sz=11, col=BLACK, align=TA_LEFT, lead=None, bef=0, aft=4):
        return ParagraphStyle(name, fontName=fn, fontSize=sz, textColor=col,
                              alignment=align, leading=lead or sz * 1.4,
                              spaceBefore=bef, spaceAfter=aft)
    return {
        "cover_title": p("ct", fn=TNB, sz=24, col=DARK_BLUE, align=TA_CENTER, aft=6),
        "cover_sub":   p("cs", fn=TI,  sz=13, col=DK_GRAY,   align=TA_CENTER, aft=4),
        "h1":  p("h1", fn=TNB, sz=16, col=DARK_BLUE, bef=10, aft=4),
        "h2":  p("h2", fn=TNB, sz=12, col=DK_GRAY,   bef=6,  aft=3),
        "body":    p("bd", fn=TN, sz=11, col=BLACK),
        "body_gray":p("bg",fn=TN, sz=11, col=DK_GRAY),
        "bullet":  p("bl", fn=TN, sz=11, col=BLACK, bef=1, aft=1),
        "caption": p("cp", fn=TI, sz=9,  col=MD_GRAY, align=TA_CENTER, bef=2, aft=5),
        "footer":  p("ft", fn=TN, sz=9,  col=MD_GRAY, align=TA_CENTER),
        "na":      p("na", fn=TI, sz=10, col=MD_GRAY),
    }


def _hr(thick=0.6, col=None, bef=3, aft=5):
    return HRFlowable(width="100%", thickness=thick,
                      color=col or BDR, spaceBefore=bef, spaceAfter=aft)


def _sec_with(title, S, num, *items):
    """Section heading always kept on same page as first content block."""
    label = f"{num}.  {title}" if num else title
    flat = []
    for it in items:
        if isinstance(it, list):
            flat.extend(it)
        elif it is not None:
            flat.append(it)
    parts = [
        _hr(thick=1.5, col=DARK_BLUE, bef=2, aft=2),
        Paragraph(label, S["h1"]),
        _hr(thick=0.4, bef=0, aft=5),
    ] + flat
    return [Spacer(1, 0.15 * cm), KeepTogether(parts)]


def _na(S):
    return Paragraph("Not available for this dataset.", S["na"])


# Chart helpers
_MPL = {
    "figure.facecolor": "white", "axes.facecolor": "white",
    "axes.edgecolor": "#374151",  "axes.labelcolor": "#374151",
    "xtick.color": "#374151",     "ytick.color": "#374151",
    "text.color": "#374151",      "grid.color": "#E5E7EB",
    "grid.alpha": 0.6,
}


def _to_img(fig, w_cm):
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight", facecolor="white")
    plt.close(fig)
    buf.seek(0)
    img = Image(buf)
    img.drawWidth  = w_cm * cm
    img.drawHeight = img.drawWidth * (fig.get_figheight() / fig.get_figwidth())
    return img


def _center_img(img):
    t = Table([[img]], colWidths=[TW])
    t.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    return t


def _missing_chart(missing):
    if not missing:
        return None
    cols = list(missing.keys())[:12]
    pcts = [missing[c]["pct"] for c in cols]
    with plt.rc_context(_MPL):
        fig, ax = plt.subplots(figsize=(8, max(2.5, len(cols) * 0.42)))
        bars = ax.barh(cols, pcts, color="#2563EB", edgecolor="#1E3A8A", height=0.55)
        for bar, pct in zip(bars, pcts):
            ax.text(bar.get_width() + 0.3, bar.get_y() + bar.get_height() / 2,
                    f"{pct:.1f}%", va="center", fontsize=8)
        ax.set_xlabel("Missing %", fontsize=9)
        ax.invert_yaxis()
        ax.set_xlim(0, max(pcts) * 1.3 + 4)
        ax.set_title("Missing Values by Column", fontsize=10, fontweight="bold")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(axis="x", linewidth=0.4)
        fig.tight_layout()
    return _to_img(fig, TW / cm * 0.72)


def _corr_heatmap(corr_dict):
    if not corr_dict or len(corr_dict) < 2:
        return None
    cols = list(corr_dict.keys())[:8]
    mat  = np.array([[corr_dict[r].get(c, 0) for c in cols] for r in cols])
    n    = len(cols)
    with plt.rc_context(_MPL):
        fig, ax = plt.subplots(figsize=(max(4.5, n * 0.85), max(3.5, n * 0.72)))
        im = ax.imshow(mat, cmap="RdYlGn", vmin=-1, vmax=1, aspect="auto")
        ax.set_xticks(range(n))
        ax.set_xticklabels(cols, rotation=40, ha="right", fontsize=8)
        ax.set_yticks(range(n))
        ax.set_yticklabels(cols, fontsize=8)
        for i in range(n):
            for j in range(n):
                ax.text(j, i, f"{mat[i, j]:.2f}", ha="center", va="center",
                        fontsize=7, color="black" if abs(mat[i, j]) < 0.6 else "white")
        plt.colorbar(im, ax=ax, fraction=0.04, pad=0.04)
        ax.set_title("Pearson Correlation Heatmap", fontsize=10, fontweight="bold")
        fig.tight_layout()
    return _to_img(fig, TW / cm * 0.78)


def _hist_grid(distributions, skewness):
    cols = list(distributions.keys())[:6]
    if not cols:
        return None
    nc = min(3, len(cols))
    nr = (len(cols) + nc - 1) // nc
    with plt.rc_context(_MPL):
        fig, axes = plt.subplots(nr, nc, figsize=(nc * 4, nr * 2.8))
        if nr == 1 and nc == 1:
            flat = [axes]
        elif nr == 1:
            flat = list(axes)
        else:
            flat = [ax for row in axes for ax in (row if hasattr(row, "__iter__") else [row])]
        for i, col in enumerate(cols):
            ax = flat[i]
            d  = distributions[col]
            bins, counts = d["bins"], d["counts"]
            centers = [(bins[j] + bins[j + 1]) / 2 for j in range(len(counts))]
            ax.bar(centers, counts, width=(bins[1] - bins[0]) * 0.82,
                   color="#2563EB", edgecolor="#1E3A8A", alpha=0.85)
            sk = skewness.get(col)
            ax.set_title(f"{col}" + (f" (skew={sk:.2f})" if sk is not None else ""),
                         fontsize=8, fontweight="bold")
            ax.tick_params(labelsize=7)
            ax.spines["top"].set_visible(False)
            ax.spines["right"].set_visible(False)
        for i in range(len(cols), len(flat)):
            flat[i].set_visible(False)
        fig.suptitle("Distribution Histograms", fontsize=10, fontweight="bold", y=1.01)
        fig.tight_layout()
    return _to_img(fig, TW / cm)


def _outlier_chart(outliers):
    cols = [c for c, v in outliers.items() if v["count"] > 0][:10]
    if not cols:
        return None
    pcts    = [outliers[c]["pct"] for c in cols]
    bcolors = ["#991B1B" if p > 10 else "#92400E" if p > 5 else "#1D4ED8" for p in pcts]
    with plt.rc_context(_MPL):
        fig, ax = plt.subplots(figsize=(8, max(2.5, len(cols) * 0.45)))
        for i, (col, pct, bc) in enumerate(zip(cols, pcts, bcolors)):
            ax.barh(i, pct, color=bc, edgecolor="#111827", height=0.55)
            ax.text(pct + 0.3, i, f"{pct:.1f}%", va="center", fontsize=8)
        ax.set_yticks(range(len(cols)))
        ax.set_yticklabels(cols, fontsize=9)
        ax.set_xlabel("Outlier %", fontsize=9)
        ax.invert_yaxis()
        ax.set_title("Outlier Percentage by Column (IQR)", fontsize=10, fontweight="bold")
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(axis="x", linewidth=0.4)
        fig.tight_layout()
    return _to_img(fig, TW / cm * 0.72)


def _forecast_chart(fd):
    if not fd:
        return None
    hd  = list(fd.get("historical_dates", []))[-50:]
    hv  = list(fd.get("historical_values", []))[-50:]
    fd2 = fd.get("dates", [])
    fv  = fd.get("values", [])
    if not fd2:
        return None
    lo = fd.get("lower", [])
    hi = fd.get("upper", [])
    with plt.rc_context(_MPL):
        fig, ax = plt.subplots(figsize=(10, 3.5))
        ax.plot(range(len(hd)), hv, color="#1E3A8A", lw=2, label="Historical")
        off = len(hd)
        fx  = list(range(off, off + len(fd2)))
        ax.plot(fx, fv, color="#2563EB", lw=2, ls="--", label="Forecast")
        if lo and hi:
            ax.fill_between(fx, lo, hi, alpha=0.15, color="#2563EB", label="Confidence Interval")
        ax.axvline(off - 0.5, color="#9CA3AF", ls=":", lw=1)
        all_d = hd + list(fd2)
        step  = max(1, len(all_d) // 8)
        ax.set_xticks(range(0, len(all_d), step))
        ax.set_xticklabels([all_d[i][5:] for i in range(0, len(all_d), step)],
                           rotation=30, ha="right", fontsize=8)
        ax.set_title("Forecast vs Historical", fontsize=10, fontweight="bold")
        ax.legend(fontsize=9, framealpha=0.7)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.grid(axis="y", linewidth=0.4)
        fig.tight_layout()
    return _to_img(fig, TW / cm)


# Table helpers
def _data_table(header, rows, cw=None):
    t = Table([header] + rows, colWidths=cw, hAlign="LEFT", repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",     (0, 0), (-1, 0),  LT_BLUE_BG),
        ("TEXTCOLOR",      (0, 0), (-1, 0),  DARK_BLUE),
        ("FONTNAME",       (0, 0), (-1, 0),  TNB),
        ("FONTSIZE",       (0, 0), (-1, 0),  10),
        ("ALIGN",          (0, 0), (-1, 0),  "CENTER"),
        ("LINEABOVE",      (0, 0), (-1, 0),  1.2, DARK_BLUE),
        ("LINEBELOW",      (0, 0), (-1, 0),  0.6, BDR),
        ("FONTNAME",       (0, 1), (-1, -1), TN),
        ("FONTSIZE",       (0, 1), (-1, -1), 10),
        ("TEXTCOLOR",      (0, 1), (-1, -1), BLACK),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, LT_GRAY]),
        ("INNERGRID",      (0, 0), (-1, -1), 0.3, BDR),
        ("BOX",            (0, 0), (-1, -1), 0.6, BDR),
        ("LINEBELOW",      (0, -1),(-1, -1), 0.8, DARK_BLUE),
        ("TOPPADDING",     (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 5),
        ("LEFTPADDING",    (0, 0), (-1, -1), 7),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 7),
        ("VALIGN",         (0, 0), (-1, -1), "MIDDLE"),
    ]))
    return t


def _kv_table(pairs, cw=None):
    cw = cw or [TW * 0.38, TW * 0.62]
    t  = Table([[k, v] for k, v in pairs], colWidths=cw, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("FONTNAME",       (0, 0), (0, -1), TNB),
        ("FONTNAME",       (1, 0), (1, -1), TN),
        ("FONTSIZE",       (0, 0), (-1,-1), 10),
        ("TEXTCOLOR",      (0, 0), (0, -1), DARK_BLUE),
        ("TEXTCOLOR",      (1, 0), (1, -1), BLACK),
        ("ROWBACKGROUNDS", (0, 0), (-1,-1), [WHITE, LT_GRAY]),
        ("INNERGRID",      (0, 0), (-1,-1), 0.3, BDR),
        ("BOX",            (0, 0), (-1,-1), 0.6, BDR),
        ("TOPPADDING",     (0, 0), (-1,-1), 5),
        ("BOTTOMPADDING",  (0, 0), (-1,-1), 5),
        ("LEFTPADDING",    (0, 0), (-1,-1), 7),
        ("VALIGN",         (0, 0), (-1,-1), "MIDDLE"),
    ]))
    return t


def _kpi_row(items):
    """Compact KPI tiles, 16pt value — no oversized gaps."""
    n  = len(items)
    cw = TW / n
    kv_style = ParagraphStyle("kv2", fontName=TNB, fontSize=16,
                               textColor=DARK_BLUE, alignment=TA_CENTER, leading=20)
    kl_style = ParagraphStyle("kl2", fontName=TN,  fontSize=8,
                               textColor=MD_GRAY,   alignment=TA_CENTER)
    cells = []
    for lbl, val in items:
        tile = Table(
            [[Paragraph(str(val), kv_style)],
             [Paragraph(str(lbl), kl_style)]],
            colWidths=[cw - 0.2 * cm],
        )
        tile.setStyle(TableStyle([
            ("BACKGROUND",    (0, 0), (-1, -1), LT_GRAY),
            ("LINEABOVE",     (0, 0), (-1,  0), 2, DARK_BLUE),
            ("BOX",           (0, 0), (-1, -1), 0.4, BDR),
            ("ALIGN",         (0, 0), (-1, -1), "CENTER"),
            ("TOPPADDING",    (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]))
        cells.append(tile)
    row = Table([cells], colWidths=[cw] * n)
    row.setStyle(TableStyle([("PADDING", (0, 0), (-1, -1), 2)]))
    return row


def _footer_cb(rid, gen_date):
    def _cb(canv: rl_canvas.Canvas, doc):
        canv.saveState()
        tw_ = W - 2 * LMAR
        # Header rule
        canv.setStrokeColor(DARK_BLUE)
        canv.setLineWidth(2)
        canv.line(LMAR, H - 1.5 * cm, LMAR + tw_, H - 1.5 * cm)
        canv.setFont(TNB, 9)
        canv.setFillColor(DARK_BLUE)
        canv.drawString(LMAR, H - 1.3 * cm, "DataMind AI")
        canv.setFont(TN, 9)
        canv.setFillColor(MD_GRAY)
        canv.drawRightString(LMAR + tw_, H - 1.3 * cm, "Professional Data Analysis Report")
        # Footer rule
        canv.setStrokeColor(BDR)
        canv.setLineWidth(0.5)
        canv.line(LMAR, BMAR * 0.6, LMAR + tw_, BMAR * 0.6)
        canv.setFont(TN, 9)
        canv.setFillColor(MD_GRAY)
        pg = canv.getPageNumber()
        canv.drawString(LMAR, BMAR * 0.35,
            f"Generated by DataMind AI  |  {gen_date}  |  Report ID: {rid}")
        canv.drawRightString(LMAR + tw_, BMAR * 0.35, f"Page {pg}")
        canv.restoreState()
    return _cb


def generate_report(
    dataset_name: str,
    eda: dict,
    health: dict,
    insights: dict,
    executive_summary: Optional[str],
    cleaning_suggestions: list,
    forecast_data: Optional[dict] = None,
    output_dir: str = "reports_output",
) -> str:
    os.makedirs(output_dir, exist_ok=True)
    rid      = uuid.uuid4().hex[:8].upper()
    filepath = os.path.join(output_dir, f"report_{rid.lower()}.pdf")
    gen_date = datetime.now().strftime("%d %B %Y")

    doc = SimpleDocTemplate(
        filepath, pagesize=A4,
        leftMargin=LMAR, rightMargin=RMAR,
        topMargin=TMAR, bottomMargin=BMAR,
        title=f"DataMind AI - {dataset_name}",
        author="DataMind AI",
    )
    cb = _footer_cb(rid, gen_date)
    S  = _S()
    el = []

    shape    = eda.get("shape", {})
    score    = health.get("score", 0)
    grade    = health.get("grade", "N/A")
    dtypes   = eda.get("dtypes", {})
    num_c    = [c for c, t in dtypes.items() if "int" in t or "float" in t]
    cat_c    = [c for c, t in dtypes.items() if "object" in t or "category" in t]
    missing  = eda.get("missing", {})
    outliers = eda.get("outliers", {})
    stats    = eda.get("statistics", {})
    corr     = eda.get("correlation", {})
    dist     = eda.get("distributions", {})
    skew     = eda.get("skewness", {})
    findings   = insights.get("findings", [])
    bi         = insights.get("business_insights", [])
    next_steps = insights.get("next_steps", [])
    qi         = insights.get("quality_issues", [])
    out_count  = sum(v["count"] for v in outliers.values())
    has_out    = any(v["count"] > 0 for v in outliers.values())
    sc_word    = ("Excellent" if score >= 85 else "Good" if score >= 70
                  else "Fair" if score >= 55 else "Poor")

    # PAGE 1 - Cover
    el.append(Spacer(1, 0.6 * cm))
    el.append(KeepTogether([
        Paragraph("DataMind AI", S["cover_title"]),
        Paragraph("Professional Data Analysis Report", S["cover_sub"]),
        Spacer(1, 0.2 * cm),
        _hr(thick=2, col=DARK_BLUE, bef=0, aft=6),
        _kv_table([
            ("Dataset",      dataset_name),
            ("Generated",    f"{datetime.now().strftime('%d %B %Y  %H:%M')} UTC"),
            ("Size",         f"{shape.get('rows',0):,} rows x {shape.get('columns',0)} columns"),
            ("Health Score", f"{score}/100 (Grade {grade} - {sc_word})"),
            ("Report ID",    rid),
        ]),
        Spacer(1, 0.3 * cm),
        _kpi_row([
            ("Rows",        f"{shape.get('rows',0):,}"),
            ("Columns",     str(shape.get("columns", 0))),
            ("Missing",     str(eda.get("missing_total", 0))),
            ("Duplicates",  str(eda.get("duplicates", 0))),
            ("Outliers",    str(out_count)),
            ("Score",       f"{score}/100"),
        ]),
        Spacer(1, 0.3 * cm),
        _hr(thick=0.5, bef=0, aft=4),
        Paragraph(f"Confidential  |  Generated by DataMind AI  |  {gen_date}", S["footer"]),
    ]))
    el.append(PageBreak())

    # PAGE 2 - Executive Summary + Dataset Overview + Data Quality
    miss = eda.get("missing_total", 0)
    dups = eda.get("duplicates", 0)
    summary = executive_summary or (
        f"The dataset '{dataset_name}' contains {shape.get('rows',0):,} records "
        f"across {shape.get('columns',0)} columns. "
        f"Overall data quality: {score}/100 (Grade {grade} - {sc_word}). "
        + (f"{miss} missing value(s) detected. " if miss else "No missing values. ")
        + (f"{dups} duplicate row(s) found. " if dups else "")
        + (f"{out_count} outlier(s) detected." if out_count else "")
    )
    f_paras = [Paragraph(f"  \u2022  {f}", S["bullet"]) for f in findings[:5]]
    sec1 = [Paragraph(summary, S["body"])]
    if findings:
        sec1 += [Spacer(1, 0.12*cm), Paragraph("Key Findings:", S["h2"])] + f_paras
    el += _sec_with("Executive Summary", S, "1", *sec1)

    ov_table = _kv_table([
        ("Dataset Name",        dataset_name),
        ("Rows",                f"{shape.get('rows',0):,}"),
        ("Columns",             str(shape.get("columns", 0))),
        ("Numeric Columns",     str(len(num_c)) if num_c else "None"),
        ("Categorical Columns", str(len(cat_c)) if cat_c else "None"),
        ("Missing Values",      str(eda.get("missing_total", 0))),
        ("Duplicate Rows",      str(eda.get("duplicates", 0))),
    ])
    dtype_rows = [[col, dtype] for col, dtype in list(dtypes.items())[:16]]
    dtype_block = []
    if dtype_rows:
        dtype_block = [Spacer(1,0.12*cm), Paragraph("Column Data Types", S["h2"]),
                       _data_table(["Column","Data Type"], dtype_rows, cw=[TW*0.55,TW*0.45])]
    el += _sec_with("Dataset Overview", S, "2", ov_table, *dtype_block)

    bd = health.get("breakdown", {})
    h_tbl = _data_table(
        ["Metric", "Score"],
        [["Completeness",  f"{bd.get('completeness',0)}%"],
         ["Uniqueness",    f"{bd.get('uniqueness',0)}%"],
         ["Consistency",   f"{bd.get('consistency',0)}%"],
         ["Volume",        f"{bd.get('volume',0)}%"],
         ["Diversity",     f"{bd.get('diversity',0)}%"],
         ["Overall Score", f"{score}/100 (Grade {grade})"]],
        cw=[TW*0.5, TW*0.5]
    )
    iss_paras = [Paragraph(f"  {'WARNING' if i.get('severity')=='high' else 'Note'}: {i['message']}",
                           S["body_gray"]) for i in health.get("issues",[])]
    el += _sec_with("Data Quality & Health Score", S, "3", h_tbl, *iss_paras)
    el.append(PageBreak())

    # PAGE 3 - Missing Values, Duplicates, Statistics, Correlation, Outliers
    if missing:
        mv_rows = [[col, str(info["count"]), f"{info['pct']:.1f}%"]
                   for col, info in list(missing.items())[:16]]
        mv_tbl = _data_table(["Column","Missing Count","Missing %"], mv_rows,
                              cw=[TW*0.5, TW*0.25, TW*0.25])
        mc = _missing_chart(missing)
        mv_extra = ([Spacer(1,0.12*cm), _center_img(mc),
                     Paragraph("Figure 1: Missing value percentage by column.", S["caption"])]
                    if mc else [])
        el += _sec_with("Missing Values Analysis", S, "4", mv_tbl, *mv_extra)
    else:
        el += _sec_with("Missing Values Analysis", S, "4",
                        Paragraph("No missing values detected. Dataset is complete.", S["body"]))

    dup  = eda.get("duplicates", 0)
    dpct = round(dup / max(shape.get("rows", 1), 1) * 100, 2)
    el += _sec_with("Duplicate Analysis", S, "5", _kv_table([
        ("Duplicate Rows",  f"{dup} ({dpct}%)"),
        ("Unique Rows",     f"{shape.get('rows',0) - dup:,}"),
        ("Recommendation",  "Remove duplicates before analysis." if dup > 0
                            else "No action required."),
    ]))

    if stats:
        sc_  = list(stats.keys())[:7]
        mets = ["count","mean","50%","std","min","max"]
        lbls = ["Count","Mean","Median","Std Dev","Min","Max"]
        hdr  = ["Metric"] + [c[:10] for c in sc_]
        rows_ = []
        for m, l in zip(mets, lbls):
            row = [l]
            for col in sc_:
                v = stats[col].get(m)
                row.append(f"{v:,.2f}" if isinstance(v, float) else str(v or "-"))
            rows_.append(row)
        sk_row = ["Skewness"]
        for col in sc_:
            v = skew.get(col)
            sk_row.append(f"{v:.2f}" if v is not None else "-")
        rows_.append(sk_row)
        cw_ = [2.8*cm] + [max(1.5, (TW/cm - 2.8) / max(len(sc_),1))*cm] * len(sc_)
        el += _sec_with("Statistical Summary", S, "6", _data_table(hdr, rows_, cw=cw_))
    else:
        el += _sec_with("Statistical Summary", S, "6", _na(S))

    if corr and len(corr) > 1:
        hm = _corr_heatmap(corr)
        pairs = []
        cl = list(corr.keys())
        for i, c1 in enumerate(cl):
            for c2 in cl[i+1:]:
                v = corr[c1].get(c2)
                if v is not None and abs(v) < 1.0:
                    pairs.append((c1, c2, v))
        pairs.sort(key=lambda x: abs(x[2]), reverse=True)
        corr_items = []
        if hm:
            corr_items += [_center_img(hm),
                           Paragraph("Figure 2: Pearson correlation heatmap.", S["caption"])]
        if pairs:
            cr = [[f"{c1} x {c2}", f"{v:.3f}",
                   "Strong" if abs(v)>0.7 else "Moderate" if abs(v)>0.4 else "Weak"]
                  for c1,c2,v in pairs[:7]]
            corr_items += [Spacer(1,0.12*cm), Paragraph("Top Correlated Pairs", S["h2"]),
                           _data_table(["Feature Pair","Correlation","Strength"], cr,
                                       cw=[TW*0.55,TW*0.2,TW*0.25])]
        el += _sec_with("Correlation Analysis", S, "7", *corr_items) if corr_items \
              else _sec_with("Correlation Analysis", S, "7", _na(S))
    else:
        el += _sec_with("Correlation Analysis", S, "7", _na(S))

    if has_out:
        out_rows = []
        for col, info in list(outliers.items())[:14]:
            sev = "High" if info["pct"]>10 else "Medium" if info["pct"]>5 else "Low"
            out_rows.append([col, str(info["count"]), f"{info['pct']:.1f}%", "IQR", sev])
        out_tbl = _data_table(
            ["Column","Count","Outlier %","Method","Severity"], out_rows,
            cw=[TW*0.28,TW*0.14,TW*0.16,TW*0.14,TW*0.28])
        oc = _outlier_chart(outliers)
        oc_extra = ([Spacer(1,0.12*cm), _center_img(oc),
                     Paragraph("Figure 3: Outlier percentage per column.", S["caption"])]
                    if oc else [])
        el += _sec_with("Outlier Detection (IQR Method)", S, "8", out_tbl, *oc_extra)
    else:
        el += _sec_with("Outlier Detection (IQR Method)", S, "8",
                        Paragraph("No outliers detected.", S["body"]))

    if dist:
        dc = _hist_grid(dist, skew)
        if dc:
            el += _sec_with("Distribution Analysis", S, "9",
                            _center_img(dc),
                            Paragraph("Figure 4: Distribution histograms.", S["caption"]))

    el.append(PageBreak())

    # PAGE 4 - AI Insights, Cleaning, Recommendations, Forecast, Conclusion
    ins_items = []
    if bi:
        ins_items += [Paragraph("Business Insights", S["h2"])] + \
                     [Paragraph(f"  \u2022  {item}", S["bullet"]) for item in bi[:5]]
    if qi:
        ins_items += [Spacer(1,0.08*cm), Paragraph("Quality Issues", S["h2"])] + \
                     [Paragraph(f"  \u2022  {q}", S["bullet"]) for q in qi[:4]]
    el += _sec_with("AI Insights", S, "10", *(ins_items or [_na(S)]))

    AC = {
        "fill_median":        "Replace missing numeric values with median",
        "fill_mode":          "Replace missing categorical values with mode",
        "drop_column":        "Remove column (>50% missing)",
        "drop_duplicates":    "Remove duplicate rows",
        "cap_outliers":       "Cap outliers using IQR bounds",
        "convert_to_numeric": "Convert text column to numeric",
    }
    if cleaning_suggestions:
        crows = [[s["column"],
                  AC.get(s["action"], s["action"].replace("_"," ").title()),
                  s["reason"],
                  s["priority"].upper()]
                 for s in cleaning_suggestions[:12]]
        el += _sec_with("Data Cleaning Suggestions", S, "11",
                        _data_table(["Column","Action","Reason","Priority"], crows,
                                    cw=[TW*0.17,TW*0.22,TW*0.46,TW*0.15]))
    else:
        el += _sec_with("Data Cleaning Suggestions", S, "11",
                        Paragraph("No cleaning actions required.", S["body"]))

    rec_items = ([Paragraph(f"  {i}.  {r}", S["bullet"]) for i,r in enumerate(next_steps[:6],1)]
                 or [Paragraph(f"  \u2022  {c}", S["bullet"])
                     for c in insights.get("recommended_charts",[])[:4]]
                 or [_na(S)])
    el += _sec_with("Recommendations", S, "12", *rec_items)

    if forecast_data:
        fd2 = forecast_data.get("dates", [])
        fv  = forecast_data.get("values", [])
        if fd2 and fv:
            avg_v = sum(fv) / len(fv)
            fc_items = [_kv_table([
                ("Method",   forecast_data.get("method","N/A").upper()),
                ("Horizon",  f"{len(fd2)} periods"),
                ("Start",    fd2[0]), ("End", fd2[-1]),
                ("Average",  f"{avg_v:,.2f}"),
                ("Trend",    "Upward" if fv[-1]>fv[0] else "Downward" if fv[-1]<fv[0] else "Stable"),
            ])]
            fc = _forecast_chart(forecast_data)
            if fc:
                fc_items += [Spacer(1,0.12*cm), _center_img(fc),
                             Paragraph("Figure 5: Historical vs forecast.", S["caption"])]
            el += _sec_with("Forecast Summary", S, "13", *fc_items)
        else:
            el += _sec_with("Forecast Summary", S, "13", _na(S))

    sec_n = "14" if forecast_data else "13"
    sd = ("clean and suitable for immediate use" if score >= 80
          else "mostly clean with minor preprocessing required" if score >= 60
          else "requires significant preprocessing")
    ready = (["Machine Learning"] if score>=70 else []) + \
            (["Dashboarding & Reporting"] if score>=60 else []) + \
            (["Statistical Analysis"] if score>=55 else []) + \
            (["Time-Series Forecasting"] if dist else [])
    actions = (
        ([f"Remove {eda['duplicates']} duplicate row(s)"] if eda.get("duplicates",0)>0 else []) +
        ([f"Impute or remove {eda['missing_total']} missing value(s)"] if eda.get("missing_total",0)>0 else []) +
        (["Review and handle outliers"] if has_out else []) +
        (["Normalise or standardise numeric columns before ML"] if num_c else []) +
        (["Collect more data for robust modelling"] if shape.get("rows",0)<500 else [])
    ) or ["No further preprocessing needed - dataset is production-ready"]

    conc = [
        Paragraph(f"The dataset '{dataset_name}' is {sd}. "
                  f"Overall data quality: {score}/100 (Grade {grade} - {sc_word}).", S["body"]),
    ]
    if ready:
        conc += [Spacer(1,0.12*cm), Paragraph("Dataset Is Ready For:", S["h2"])] + \
                [Paragraph(f"  \u2714  {r}", S["bullet"]) for r in ready]
    conc += [Spacer(1,0.1*cm), Paragraph("Recommended Next Steps:", S["h2"])] + \
            [Paragraph(f"  \u2714  {a}", S["bullet"]) for a in actions]
    conc += [Spacer(1,0.18*cm),
             _data_table(["Overall Score","Grade","Rating","Status"],
                         [[f"{score}/100", grade, sc_word,
                           "Ready for Use" if score>=80 else "Preprocessing Required"]],
                         cw=[TW*0.25,TW*0.12,TW*0.2,TW*0.43])]
    el += _sec_with("Conclusion & Overall Assessment", S, sec_n, *conc)

    el.append(Spacer(1, 0.35 * cm))
    el.append(_hr(thick=1.2, col=DARK_BLUE, bef=0, aft=4))
    el.append(Paragraph(
        f"Report ID: {rid}  |  Generated by DataMind AI  |  {gen_date}  |  Confidential",
        S["footer"]
    ))

    doc.build(el, onFirstPage=cb, onLaterPages=cb)
    return filepath
