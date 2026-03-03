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

# RTL stylesheet for Hebrew text
st.markdown(
    """
    <style>
        body, .stApp { direction: rtl; }
        .stRadio > div { flex-direction: row; }
        .stTextInput > label,
        .stSelectbox > label,
        .stTextArea > label { text-align: right; }
        h1, h2, h3, p { text-align: right; }
        .block-container { padding-top: 1rem; }
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

if "items" not in st.session_state:
    st.session_state.items = get_default_items()

if "camera_open" not in st.session_state:
    st.session_state.camera_open = {cat.value: False for cat in Category}

if "image_paths" not in st.session_state:
    st.session_state.image_paths = {}  # category.value -> file path


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

# Build a lookup: category -> list of item indices in session_state.items
items_by_category: dict[str, list[int]] = {}
for idx, item in enumerate(st.session_state.items):
    items_by_category.setdefault(item.category.value, []).append(idx)

# ---------------------------------------------------------------------------
# Main form
# ---------------------------------------------------------------------------

with st.form("maintenance_form"):
    for category in Category:
        cat_val = category.value
        indices = items_by_category.get(cat_val, [])

        st.subheader(f"📋 {cat_val}")

        for idx in indices:
            item: ChecklistItem = st.session_state.items[idx]

            col_label, col_status = st.columns([3, 2])
            with col_label:
                st.markdown(f"**{item.id}. {item.description}**")
            with col_status:
                status_choice = st.radio(
                    label=f"סטטוס_{item.id}",
                    options=[s.value for s in Status],
                    index=[s.value for s in Status].index(item.status.value),
                    horizontal=True,
                    label_visibility="collapsed",
                    key=f"status_{item.id}",
                )

            if status_choice in (Status.FAILED.value, Status.NOTE.value):
                note = st.text_input(
                    f"הערה לפריט {item.id}",
                    value=item.note,
                    key=f"note_{item.id}",
                    label_visibility="visible",
                )
            else:
                note = ""

            # Write back to session state so values persist across reruns
            st.session_state.items[idx] = item.model_copy(
                update={"status": Status(status_choice), "note": note}
            )

        # Camera toggle button — outside form won't work inside st.form,
        # so we display saved image path if available, and a note to use
        # the camera section below the form.
        if cat_val in st.session_state.image_paths:
            st.caption(f"📷 תמונה צולמה: {st.session_state.image_paths[cat_val]}")

        st.markdown("---")

    submitted = st.form_submit_button("💾 שמור דוח", use_container_width=True)

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
# Form submission handler
# ---------------------------------------------------------------------------

if submitted:
    # Validate required metadata
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
                items=st.session_state.items,
                image_paths=st.session_state.image_paths,
            )

            df = report_to_dataframe(report)
            filename = generate_filename(report)
            output_path = REPORTS_DIR / filename
            df.to_csv(output_path, encoding="utf-8-sig", index=False)

            st.success(f"✅ הדוח נשמר בהצלחה!\nקובץ: `{filename}`")

            # Offer CSV download
            with open(output_path, "rb") as f:
                st.download_button(
                    label="⬇️ הורד דוח CSV",
                    data=f,
                    file_name=filename,
                    mime="text/csv",
                    use_container_width=True,
                )

            # Summary stats
            total = len(report.items)
            failed = sum(1 for i in report.items if i.status == Status.FAILED)
            notes = sum(1 for i in report.items if i.status == Status.NOTE)
            ok = sum(1 for i in report.items if i.status == Status.OK)

            col1, col2, col3 = st.columns(3)
            col1.metric("תקין ✅", ok)
            col2.metric("לא תקין ❌", failed)
            col3.metric("הערה ⚠️", notes)

        except ValidationError as e:
            st.error(f"שגיאת אימות:\n{e}")
        except Exception as e:
            st.error(f"שגיאה בלתי צפויה: {e}")
