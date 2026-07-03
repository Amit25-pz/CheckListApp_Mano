# -*- coding: utf-8 -*-
"""יומן בדיקות ואחזקה בתא לחץ — גרסה 2: תבניות לפי אתר, דוח פנימי ודוח לקוח."""

from __future__ import annotations

from datetime import datetime

import streamlit as st
from pydantic import ValidationError

from checklists import SITE_NAMES, TEMPLATES
from models import (
    APP_VERSION,
    CheckResult,
    MaintenanceReport,
    SectionResult,
    Status,
    generate_filename,
    quarter_from_date,
    report_to_dataframe,
    sanitize_filename_part,
)
from pdf import generate_pdf_bytes
from pathlib import Path

# ---------------------------------------------------------------------------
# הגדרות עמוד ועיצוב
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="יומן בדיקות תא לחץ",
    page_icon="🏥",
    layout="centered",
    initial_sidebar_state="expanded",
)

PRIMARY   = "#4A4F6E"   # כחול-נייבי מהלוגו
ACCENT    = "#CEC28C"   # זהב חם מהלוגו
LIGHT_BG  = "#F5F0E6"   # קרם בהיר
TEXT_DARK = "#EDE8D5"   # קרם על רקע כהה

st.markdown(
    f"""
    <style>
        /* ── RTL ── */
        body, .stApp {{ direction: rtl; }}
        .stRadio > div {{ flex-direction: row; }}
        .stTextInput > label,
        .stSelectbox > label,
        .stTextArea > label,
        .stDateInput > label {{ text-align: right; }}
        h1, h2, h3, p {{ text-align: right; }}
        .block-container {{ padding-top: 1rem; }}

        /* ── סרגל צד ── */
        section[data-testid="stSidebar"][aria-expanded="false"] {{
            width: 0 !important;
            min-width: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
        }}
        [data-testid="collapsedControl"] {{ display: none !important; }}
        section[data-testid="stSidebar"] {{ background-color: {PRIMARY}; }}
        section[data-testid="stSidebar"] * {{ color: #000000 !important; }}
        section[data-testid="stSidebar"] input,
        section[data-testid="stSidebar"] textarea,
        section[data-testid="stSidebar"] [data-baseweb="select"] > div,
        section[data-testid="stSidebar"] [data-baseweb="input"] {{
            background-color: #FFFFFF !important;
            color: #000000 !important;
            border-color: {ACCENT} !important;
        }}

        /* ── תוכן ראשי ── */
        .main *, .block-container * {{ color: #000000; }}
        h1, h2, h3 {{ color: {PRIMARY} !important; }}
        .stApp {{ background-color: {LIGHT_BG}; }}

        /* ── כפתור ראשי ── */
        div.stButton > button[kind="primary"] {{
            background-color: {PRIMARY} !important;
            color: {ACCENT} !important;
            border: 1px solid {ACCENT} !important;
            font-weight: bold;
        }}
        div.stButton > button[kind="primary"]:hover {{
            background-color: #3A3E58 !important;
            color: {TEXT_DARK} !important;
        }}

        /* ── כפתורי הורדה ── */
        div.stDownloadButton > button {{
            background-color: {ACCENT} !important;
            color: {PRIMARY} !important;
            font-weight: bold;
            border: none;
        }}
        div.stDownloadButton > button:hover {{ background-color: #DDD3A0 !important; }}
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# תיקיות נתונים
# ---------------------------------------------------------------------------

DATA_DIR = Path("data")
REPORTS_DIR = DATA_DIR / "reports"
IMAGES_DIR = DATA_DIR / "images"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

UI_STATUSES = [Status.OK.value, Status.FAILED.value, Status.NOTE.value]

# ---------------------------------------------------------------------------
# סרגל צד — פרטי הדוח
# ---------------------------------------------------------------------------

with st.sidebar:
    st.title("פרטי הדוח")
    st.markdown("---")

    technician = st.text_input("שם הטכנאי", value="עמנואל גוטמן")

    site_options = SITE_NAMES + ["אחר..."]
    site_choice = st.selectbox("אתר / תא לחץ", site_options)

    if site_choice == "אחר...":
        site_name = st.text_input("הזן שם אתר", key="site_custom")
        template = TEMPLATES["כללי"]          # אתר לא מוכר ⇒ התבנית הכללית
    else:
        site_name = site_choice
        template = TEMPLATES[site_choice]

    machine_id = st.text_input("מזהה מכונה / תא", placeholder="לדוגמה: תא לחץ 1")

    report_date = st.date_input("תאריך הבדיקה", value=datetime.now().date())
    quarter = st.text_input(
        "רבעון",
        value=quarter_from_date(datetime(report_date.year, report_date.month, 1)),
        help="מחושב אוטומטית מהתאריך; ניתן לשינוי ידני",
    )

    st.markdown("---")
    if st.button("🔄 דוח חדש (איפוס הטופס)", use_container_width=True):
        for key in list(st.session_state.keys()):
            del st.session_state[key]
        st.rerun()

    st.caption(f"גרסת אפליקציה: {APP_VERSION}")

# מפתחות הווידג'טים כוללים את שם האתר, כך שמעבר בין אתרים לא מערבב נתונים
site_key = sanitize_filename_part(site_name or "ללא_שם")

# ---------------------------------------------------------------------------
# ניהול מצב: מצלמות ותמונות לפי סעיף
# ---------------------------------------------------------------------------

if "camera_open" not in st.session_state:
    st.session_state.camera_open = {}
if "image_paths" not in st.session_state:
    st.session_state.image_paths = {}   # (site, section) -> path
if "saved_outputs" not in st.session_state:
    st.session_state.saved_outputs = None


def toggle_camera(cam_key: str) -> None:
    st.session_state.camera_open[cam_key] = not st.session_state.camera_open.get(cam_key, False)


def mark_section_ok(section_index: int, num_checks: list[int]) -> None:
    """כפתור 'הכל תקין' — מסמן את כל תתי-הבדיקות בסעיף כתקינות."""
    for ci in num_checks:
        st.session_state[f"{site_key}_s{section_index}_c{ci}_status"] = Status.OK.value


# ---------------------------------------------------------------------------
# כותרת ראשית + סיכום חי
# ---------------------------------------------------------------------------

st.title("🏥 יומן בדיקות ואחזקה בתא לחץ")
st.markdown(f"**אתר: {site_name or '—'}** · עבור על הסעיפים, סמן חריגים, ולחץ **שמור דוח**.")

# ספירה חיה מתוך מצב הווידג'טים (לפני הרינדור — מהריצה הקודמת)
live_failed = 0
live_notes = 0
total_checks = 0
for si, section in enumerate(template.sections):
    for ci, check in enumerate(section.checks):
        if check.kind != "check":
            continue
        total_checks += 1
        val = st.session_state.get(f"{site_key}_s{si}_c{ci}_status", Status.OK.value)
        if val == Status.FAILED.value:
            live_failed += 1
        elif val == Status.NOTE.value:
            live_notes += 1

m1, m2, m3, m4 = st.columns(4)
m1.metric("סה\"כ בדיקות", total_checks)
m2.metric("תקין ✅", total_checks - live_failed - live_notes)
m3.metric("לא תקין ❌", live_failed)
m4.metric("הערות ✱", live_notes)
st.markdown("---")

# ---------------------------------------------------------------------------
# הסעיפים — expander לכל סעיף ראשי
# ---------------------------------------------------------------------------

for si, section in enumerate(template.sections):
    # אייקון סטטוס בכותרת הסעיף לפי מצב הריצה הקודמת
    section_failed = any(
        st.session_state.get(f"{site_key}_s{si}_c{ci}_status") == Status.FAILED.value
        for ci, c in enumerate(section.checks) if c.kind == "check"
    )
    section_noted = any(
        st.session_state.get(f"{site_key}_s{si}_c{ci}_status") == Status.NOTE.value
        for ci, c in enumerate(section.checks) if c.kind == "check"
    )
    icon = "❌" if section_failed else ("✱" if section_noted else "✅")

    with st.expander(f"{icon} {section.name}"):
        check_indices = [ci for ci, c in enumerate(section.checks) if c.kind == "check"]
        st.button(
            "✔ סמן הכל תקין",
            key=f"{site_key}_s{si}_allok",
            on_click=mark_section_ok,
            args=(si, check_indices),
        )

        for ci, check in enumerate(section.checks):
            if check.kind == "value":
                suffix = " 🔒" if check.internal else ""
                st.text_input(
                    f"{check.description}{suffix}",
                    key=f"{site_key}_s{si}_c{ci}_value",
                    placeholder="הזן ערך...",
                    help="🔒 = שדה פנימי, לא יופיע בדוח ללקוח" if check.internal else None,
                )
                continue

            col_label, col_status = st.columns([3, 2])
            with col_label:
                st.markdown(f"**{check.description}**")
            with col_status:
                status_choice = st.radio(
                    label=f"סטטוס — {check.description}",
                    options=UI_STATUSES,
                    horizontal=True,
                    label_visibility="collapsed",
                    key=f"{site_key}_s{si}_c{ci}_status",
                )

            if status_choice in (Status.FAILED.value, Status.NOTE.value):
                st.text_input(
                    "הערה / פעולה שננקטה",
                    key=f"{site_key}_s{si}_c{ci}_note",
                    placeholder="פרט...",
                )

        # ── מצלמה לתיעוד ויזואלי של הסעיף ──
        cam_key = f"{site_key}_s{si}"
        btn_label = "סגור מצלמה 📷" if st.session_state.camera_open.get(cam_key) else "📷 צלם תיעוד"
        st.button(
            btn_label,
            key=f"cam_btn_{cam_key}",
            on_click=toggle_camera,
            args=(cam_key,),
        )
        if st.session_state.camera_open.get(cam_key):
            uploaded = st.camera_input(f"צלם תמונה — {section.name}", key=f"camera_{cam_key}")
            if uploaded is not None:
                ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                img_name = f"{site_key}_{sanitize_filename_part(section.name)}_{ts}.jpg"
                img_path = IMAGES_DIR / img_name
                try:
                    img_path.write_bytes(uploaded.getvalue())
                    st.session_state.image_paths[cam_key] = str(img_path)
                    st.success(f"תמונה נשמרה: {img_name}")
                except PermissionError:
                    st.error("אין הרשאה לשמור את התמונה. בדוק שהתיקייה data/images זמינה.")

        if cam_key in st.session_state.image_paths:
            st.caption(f"📷 תמונה צולמה: {st.session_state.image_paths[cam_key]}")

st.markdown("---")

general_comments = st.text_area("הערות כלליות", key=f"{site_key}_general_comments")

submitted = st.button("💾 שמור דוח", use_container_width=True, type="primary")

# ---------------------------------------------------------------------------
# שמירה: CSV + שני דוחות PDF
# ---------------------------------------------------------------------------

if submitted:
    if not site_name or not site_name.strip():
        st.error("נא לבחור או להזין שם אתר.")
    elif not machine_id.strip():
        st.error("נא להזין מזהה מכונה / תא.")
    elif not technician.strip():
        st.error("נא להזין שם טכנאי.")
    else:
        try:
            # בניית עץ התוצאות מתוך מצב הווידג'טים
            sections_result: list[SectionResult] = []
            for si, section in enumerate(template.sections):
                checks_result: list[CheckResult] = []
                for ci, check in enumerate(section.checks):
                    if check.kind == "value":
                        checks_result.append(CheckResult(
                            description=check.description,
                            kind="value",
                            internal=check.internal,
                            value=st.session_state.get(f"{site_key}_s{si}_c{ci}_value", "").strip(),
                        ))
                    else:
                        status_val = st.session_state.get(
                            f"{site_key}_s{si}_c{ci}_status", Status.OK.value
                        )
                        note_val = ""
                        if status_val in (Status.FAILED.value, Status.NOTE.value):
                            note_val = st.session_state.get(
                                f"{site_key}_s{si}_c{ci}_note", ""
                            ).strip()
                        checks_result.append(CheckResult(
                            description=check.description,
                            kind="check",
                            internal=check.internal,
                            status=Status(status_val),
                            note=note_val,
                        ))
                sections_result.append(SectionResult(name=section.name, checks=checks_result))

            report_ts = datetime.combine(report_date, datetime.now().time())
            report = MaintenanceReport(
                technician=technician.strip(),
                site=site_name.strip(),
                machine_id=machine_id.strip(),
                quarter=quarter.strip(),
                timestamp=report_ts,
                sections=sections_result,
                image_paths={
                    k: v for k, v in st.session_state.image_paths.items()
                    if k.startswith(site_key)
                },
                general_comments=general_comments.strip(),
            )

            # שם הקובץ נגזר מנתוני הדוח הנוכחיים בכל שמירה (תיקון באג v1)
            base = generate_filename(report)

            csv_bytes = report_to_dataframe(report).to_csv(
                index=False, encoding="utf-8-sig"
            ).encode("utf-8-sig")
            try:
                (REPORTS_DIR / f"{base}.csv").write_bytes(csv_bytes)
            except PermissionError:
                st.warning("קובץ ה-CSV פתוח בתוכנה אחרת (Excel?). ההורדה עדיין זמינה למטה.")

            pdf_internal = generate_pdf_bytes(report, include_internal=True)
            pdf_customer = generate_pdf_bytes(report, include_internal=False)

            st.session_state.saved_outputs = {
                "base": base,
                "csv": csv_bytes,
                "pdf_internal": pdf_internal,
                "pdf_customer": pdf_customer,
            }

        except ValidationError as e:
            st.error(f"שגיאת אימות נתונים:\n{e}")
        except Exception as e:
            st.error(f"שגיאה בלתי צפויה: {e}")

# כפתורי הורדה — נשארים זמינים אחרי השמירה
if st.session_state.saved_outputs:
    out = st.session_state.saved_outputs
    st.success(f"✅ הדוח נשמר בהצלחה! קובץ: `{out['base']}`")

    col_int, col_cust = st.columns(2)
    with col_int:
        st.download_button(
            "📄 הורד דוח פנימי (מלא)",
            data=out["pdf_internal"],
            file_name=f"{out['base']}_פנימי.pdf",
            mime="application/pdf",
            use_container_width=True,
        )
    with col_cust:
        st.download_button(
            "📄 הורד דוח ללקוח",
            data=out["pdf_customer"],
            file_name=f"{out['base']}_לקוח.pdf",
            mime="application/pdf",
            use_container_width=True,
        )
    st.download_button(
        "📊 הורד נתונים (CSV)",
        data=out["csv"],
        file_name=f"{out['base']}.csv",
        mime="text/csv",
        use_container_width=True,
    )
