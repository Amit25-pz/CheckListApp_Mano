# CheckListApp_Mano — יומן תחזוקה תא היפרברי

## Project Overview / סקירת הפרויקט

**Hebrew / עברית:**
מערכת דיגיטלית לניהול רשימת תחזוקה של תא היפרברי — 38 פריטים מקצועיים, ממשק בעברית, מיועד לטכנאים בשטח על מכשירים ניידים.

**English:**
A professional Streamlit web application for hyperbaric chamber maintenance management. Digitizes a 38-item paper checklist with Hebrew UI, Pydantic validation, and CSV data pipeline. Designed for field technicians on mobile devices.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    app.py (UI)                      │
│  Streamlit · Hebrew RTL · Mobile-first layout       │
│                                                     │
│  Sidebar:  Technician / Hospital / Machine ID       │
│  Main:     38-item checklist grouped by category    │
│            📸 camera toggle per category             │
│  Submit:   Pydantic validation → CSV export         │
└──────────────────┬──────────────────────────────────┘
                   │ uses
┌──────────────────▼──────────────────────────────────┐
│                  models.py                          │
│  Enums:  Status, Category                           │
│  Models: ChecklistItem, MaintenanceReport           │
│  Utils:  report_to_dataframe(), generate_filename() │
└──────────────────┬──────────────────────────────────┘
                   │ writes
┌──────────────────▼──────────────────────────────────┐
│              data/                                  │
│  reports/   YYYY-MM-DD_HH-MM_Tech_Hospital_ID.csv   │
│  images/    <category>_<timestamp>.jpg              │
└─────────────────────────────────────────────────────┘
```

---

## Setup Instructions

```bash
# 1. Clone the repository
git clone https://github.com/Amit25-pz/CheckListApp_Mano.git
cd CheckListApp_Mano

# 2. Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run the application
streamlit run app.py
```

The app will open at `http://localhost:8501` in your browser.

---

## Directory Structure

```
CheckListApp_Mano/
├── .gitignore
├── README.md
├── requirements.txt
├── models.py          ← Pydantic domain models & helpers
├── app.py             ← Streamlit UI application
└── data/
    ├── reports/       ← Generated CSV reports (git-ignored)
    │   └── .gitkeep
    └── images/        ← Captured category photos (git-ignored)
        └── .gitkeep
```

---

## Definition of Done

- [x] Git repository initialized with `main` branch
- [x] GitHub repository created and linked (`Amit25-pz/CheckListApp_Mano`)
- [x] `.gitignore` excludes venv, pycache, reports, images
- [x] `requirements.txt` pins all dependencies
- [x] `models.py` — Status/Category enums, ChecklistItem, MaintenanceReport (Pydantic v2)
- [x] `app.py` — Hebrew RTL UI, 38-item checklist, sidebar metadata, camera toggle
- [x] Form submission → Pydantic validation → CSV with UTF-8-SIG encoding
- [x] CSV readable in Excel with correct Hebrew rendering
- [x] Camera toggle works per-category without breaking form state
- [x] `feature/ui-update` branch created for future iterations

---

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, production-ready code |
| `feature/ui-update` | UI iteration and experimental changes |

All new features should be developed on feature branches and merged to `main` via pull request.

---

## Checklist Categories

| Category | Hebrew | Items |
|---|---|---|
| Electrical | חשמל | 1–8 |
| Structure | מבנה | 9–15 |
| Safety | בטיחות | 16–23 |
| Gas System | מערכת גז | 24–31 |
| HP Compression | דחיסת לחץ גבוה | 32–35 |
| LP Compression | דחיסת לחץ נמוך | 36–38 |
