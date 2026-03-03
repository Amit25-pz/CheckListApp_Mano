"""יומן תחזוקה תא היפרברי — Hyperbaric Chamber Maintenance Log."""

from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

import streamlit as st
from pydantic import ValidationError

from models import (
    Category,
    ChecklistItem,
    MaintenanceReport,
    Status,
    generate_filename,
    generate_pdf_bytes,
    get_default_items,
    report_to_dataframe,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------

st.set_page_config(
    page_title="יומן תחזוקה היפרברי",
    page_icon="🏥",
    layout="centered",
    initial_sidebar_state="expanded",
)

# Brand colours (from company logo)
PRIMARY   = "#4A4F6E"   # dark navy / logo background
ACCENT    = "#CEC28C"   # warm gold / logo illustration
LIGHT_BG  = "#F5F0E6"   # very light cream
TEXT_DARK = "#EDE8D5"   # cream text on dark backgrounds

st.markdown(
    f"""
    <style>
        /* ── RTL ── */
        body, .stApp {{ direction: rtl; }}
        .stRadio > div {{ flex-direction: row; }}
        .stTextInput > label,
        .stSelectbox > label,
        .stTextArea > label {{ text-align: right; }}
        h1, h2, h3, p {{ text-align: right; }}
        .block-container {{ padding-top: 1rem; }}

        /* ── Sidebar: fully hidden when collapsed ── */
        section[data-testid="stSidebar"][aria-expanded="false"] {{
            width: 0 !important;
            min-width: 0 !important;
            overflow: hidden !important;
            padding: 0 !important;
        }}
        [data-testid="collapsedControl"] {{
            display: none !important;
        }}

        /* ── Sidebar colours ── */
        section[data-testid="stSidebar"] {{
            background-color: {PRIMARY};
        }}
        /* All sidebar text: black */
        section[data-testid="stSidebar"] * {{
            color: #000000 !important;
        }}
        /* Input cells: white background, black text */
        section[data-testid="stSidebar"] input,
        section[data-testid="stSidebar"] textarea,
        section[data-testid="stSidebar"] [data-baseweb="select"] > div,
        section[data-testid="stSidebar"] [data-baseweb="input"] {{
            background-color: #FFFFFF !important;
            color: #000000 !important;
            border-color: {ACCENT} !important;
        }}

        /* ── Main content: always black text (fixes mobile) ── */
        .main *, .block-container * {{
            color: #000000;
        }}
        /* Re-apply exceptions that need non-black */
        h1, h2, h3 {{ color: {PRIMARY} !important; }}

        /* ── App background ── */
        .stApp {{ background-color: {LIGHT_BG}; }}

        /* ── Primary button ("שמור דוח") ── */
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

        /* ── Download button ── */
        div.stDownloadButton > button {{
            background-color: {ACCENT} !important;
            color: {PRIMARY} !important;
            font-weight: bold;
            border: none;
        }}
        div.stDownloadButton > button:hover {{
            background-color: #DDD3A0 !important;
        }}
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

HOSPITALS = [
    "בית חולים איכילוב",
    "בית חולים הדסה",
    "בית חולים רמב\"ם",
    "בית חולים שיבא (תל השומר)",
    "בית חולים סורוקה",
    "אחר...",
]

MACHINE_IDS = [
    "HBC-001",
    "HBC-002",
    "HBC-003",
    "HBC-004",
    "אחר...",
]

DATA_DIR = Path("data")
REPORTS_DIR = DATA_DIR / "reports"
IMAGES_DIR = DATA_DIR / "images"

REPORTS_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Session state initialisation
# ---------------------------------------------------------------------------

if "checklist_items" not in st.session_state:
    st.session_state.checklist_items = get_default_items()

if "camera_open" not in st.session_state:
    st.session_state.camera_open = {cat.value: False for cat in Category}

if "image_paths" not in st.session_state:
    st.session_state.image_paths = {}  # category.value -> file path

if "saved_report" not in st.session_state:
    st.session_state.saved_report = None  # (csv_bytes, filename) after first save

if "report_filename" not in st.session_state:
    st.session_state.report_filename = None  # fixed for the whole session


def toggle_camera(category_value: str) -> None:
    st.session_state.camera_open[category_value] = not st.session_state.camera_open[category_value]


# ---------------------------------------------------------------------------
# Sidebar — report metadata
# ---------------------------------------------------------------------------

with st.sidebar:
    st.title("פרטי הדוח")
    st.markdown("---")

    technician = st.text_input("שם הטכנאי", value="עמנואל גוטמן")

    hospital_choice = st.selectbox("בית חולים", HOSPITALS)
    if hospital_choice == "אחר...":
        hospital = st.text_input("הזן שם בית חולים", key="hospital_custom")
    else:
        hospital = hospital_choice

    machine_choice = st.selectbox("מזהה מכשיר", MACHINE_IDS)
    if machine_choice == "אחר...":
        machine_id = st.text_input("הזן מזהה מכשיר", key="machine_custom")
    else:
        machine_id = machine_choice

    st.markdown("---")
    st.caption(f"תאריך: {datetime.now().strftime('%d/%m/%Y %H:%M')}")

# ---------------------------------------------------------------------------
# Main header
# ---------------------------------------------------------------------------

st.title("🏥 יומן תחזוקה — תא היפרברי")
st.markdown("מלא את רשימת הבדיקה עבור כל הקטגוריות, לאחר מכן לחץ **שמור דוח**.")
st.markdown("---")

# ---------------------------------------------------------------------------
# Camera inputs (outside form — must use session state callbacks)
# ---------------------------------------------------------------------------

# Build a lookup: category -> list of item indices in session_state.checklist_items
items_by_category: dict[str, list[int]] = {}
for idx, item in enumerate(st.session_state.checklist_items):
    items_by_category.setdefault(item.category.value, []).append(idx)

# ---------------------------------------------------------------------------
# Checklist (no st.form — allows reactive note field on status change)
# ---------------------------------------------------------------------------

for category in Category:
    cat_val = category.value
    indices = items_by_category.get(cat_val, [])

    st.subheader(f"📋 {cat_val}")

    for idx in indices:
        item: ChecklistItem = st.session_state.checklist_items[idx]

        # UI options: "הערה" is a UI-only choice that keeps status=תקין
        # but opens the note field.
        UI_OPTIONS = ["תקין", "לא תקין", "הערה"]

        # Derive the current UI selection from the stored model state
        if item.status == Status.FAILED:
            current_ui = "לא תקין"
        elif item.note:
            current_ui = "הערה"
        else:
            current_ui = "תקין"

        col_label, col_status = st.columns([3, 2])
        with col_label:
            st.markdown(f"**{item.id}. {item.description}**")
        with col_status:
            status_choice = st.radio(
                label=f"סטטוס_{item.id}",
                options=UI_OPTIONS,
                index=UI_OPTIONS.index(current_ui),
                horizontal=True,
                label_visibility="collapsed",
                key=f"status_{item.id}",
            )

        # Note field opens for "לא תקין" or "הערה"; "הערה" keeps status=תקין
        if status_choice in ("לא תקין", "הערה"):
            note = st.text_input(
                f"הערה לפריט {item.id}",
                value=item.note,
                key=f"note_{item.id}",
                label_visibility="visible",
            )
        else:
            note = ""

        # Map UI choice → model Status ("הערה" stays תקין)
        actual_status = Status.FAILED if status_choice == "לא תקין" else Status.OK

        # Write back to session state so values persist across reruns
        st.session_state.checklist_items[idx] = item.model_copy(
            update={"status": actual_status, "note": note}
        )

    if cat_val in st.session_state.image_paths:
        st.caption(f"📷 תמונה צולמה: {st.session_state.image_paths[cat_val]}")

    st.markdown("---")

submitted = st.button("💾 שמור דוח", use_container_width=True, type="primary")

# ---------------------------------------------------------------------------
# Camera inputs — rendered outside the form so callbacks work
# ---------------------------------------------------------------------------

st.markdown("## 📸 צילום תמונות לפי קטגוריה")
st.caption("צלם תמונה לכל קטגוריה לפי הצורך. התמונות נשמרות אוטומטית.")

for category in Category:
    cat_val = category.value
    col_title, col_btn = st.columns([4, 1])
    with col_title:
        st.markdown(f"**{cat_val}**")
    with col_btn:
        btn_label = "סגור 📷" if st.session_state.camera_open[cat_val] else "📷"
        st.button(
            btn_label,
            key=f"cam_btn_{cat_val}",
            on_click=toggle_camera,
            args=(cat_val,),
            use_container_width=True,
        )

    if st.session_state.camera_open[cat_val]:
        uploaded = st.camera_input(
            f"צלם תמונה — {cat_val}",
            key=f"camera_{cat_val}",
        )
        if uploaded is not None:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            safe_cat = cat_val.replace(" ", "_")
            img_path = IMAGES_DIR / f"{safe_cat}_{ts}.jpg"
            img_path.write_bytes(uploaded.getvalue())
            st.session_state.image_paths[cat_val] = str(img_path)
            st.success(f"תמונה נשמרה: {img_path.name}")

st.markdown("---")

# ---------------------------------------------------------------------------
# Save handler — runs only on "שמור דוח" click, saves exactly once
# ---------------------------------------------------------------------------

if submitted:
    if not hospital or hospital == "אחר...":
        st.error("נא לבחור או להזין שם בית חולים.")
    elif not machine_id or machine_id == "אחר...":
        st.error("נא לבחור או להזין מזהה מכשיר.")
    elif not technician.strip():
        st.error("נא להזין שם טכנאי.")
    else:
        try:
            report = MaintenanceReport(
                technician=technician.strip(),
                hospital=hospital.strip(),
                machine_id=machine_id.strip(),
                items=st.session_state.checklist_items,
                image_paths=st.session_state.image_paths,
            )

            # Generate base filename once per session so repeated saves
            # overwrite the same files instead of creating new ones.
            if st.session_state.report_filename is None:
                st.session_state.report_filename = generate_filename(report)
            base = st.session_state.report_filename

            # Save CSV to disk (data record)
            df = report_to_dataframe(report)
            try:
                df.to_csv(REPORTS_DIR / f"{base}.csv", encoding="utf-8-sig", index=False)
            except PermissionError:
                st.warning("קובץ ה-CSV פתוח בתוכנה אחרת (Excel?). סגור אותו ושמור שוב כדי לעדכן אותו. ה-PDF זמין להורדה.")

            # Generate PDF bytes and store in session state for download
            pdf_bytes = generate_pdf_bytes(report)
            st.session_state.saved_report = (pdf_bytes, f"{base}.pdf")

            failed = sum(1 for i in report.items if i.status == Status.FAILED)
            ok     = sum(1 for i in report.items if i.status == Status.OK)
            col1, col2 = st.columns(2)
            col1.metric("תקין ✅", ok)
            col2.metric("לא תקין ❌", failed)

        except ValidationError as e:
            st.error(f"שגיאת אימות:\n{e}")
        except Exception as e:
            st.error(f"שגיאה בלתי צפויה: {e}")

# Download button shown persistently after any successful save;
# clicking it does NOT re-run the save block above.
if st.session_state.saved_report is not None:
    pdf_bytes, pdf_filename = st.session_state.saved_report
    st.success(f"✅ הדוח נשמר בהצלחה! קובץ: `{pdf_filename}`")
    st.download_button(
        label="⬇️ הורד דוח PDF",
        data=pdf_bytes,
        file_name=pdf_filename,
        mime="application/pdf",
        use_container_width=True,
    )
