# How This Project Works (Explained Like You're 10)

## What Is This App?

Imagine you're a doctor who has a **really cool diving machine** at the hospital (it's called a **hyperbaric chamber** — it helps people heal by pushing extra oxygen into their body).

But just like your bike needs its tires checked before you ride, this machine needs to be checked **every time** before someone uses it. That's what this app does — it's a **checklist** so the technician (the repair guy) can go through every part and say "yep, this is good!" or "nope, this is broken!"

---

## The Two Versions of the App

This project has **two versions** of the same app — like having the same game on both your computer and your phone.

### 1. The Computer Version (Streamlit Web App)
- **Files:** `app.py` and `models.py`
- You open it in a web browser on your computer
- Built with **Streamlit** (a tool that makes websites using Python)

### 2. The Phone Version (React Native Mobile App)
- **Folder:** `mobile/`
- You install it on your Android phone like a regular app
- Built with **React Native + Expo** (a tool that makes phone apps using JavaScript)
- Works **completely offline** — no internet needed!

---

## Stage 1: The Data Models (`models.py` and `src/types/index.ts`)

**Think of it like this:** Before you build a LEGO house, you need to know what kinds of bricks exist.

These files define the **shapes of our data** — like a cookie cutter defines the shape of a cookie:

- **Status** — Each checklist item can be one of 3 things:
  - "OK" (working fine)
  - "Not OK" (broken!)
  - "Note" (works, but I want to write something about it)

- **Category** — The 38 items are split into 6 groups, like chapters in a book:
  1. **Electricity** (items 1-8) — Wires, switches, power stuff
  2. **Structure** (items 9-15) — Doors, windows, the frame of the machine
  3. **Safety** (items 16-23) — Fire extinguishers, emergency oxygen, smoke detectors
  4. **Gas System** (items 24-31) — Oxygen pipes, gas valves, gas flow meters
  5. **High Pressure Compression** (items 32-35) — The big squeezing machine (compressor)
  6. **Low Pressure Compression** (items 36-38) — The smaller squeezing machine

- **ChecklistItem** — One thing to check. Has an ID number, a category, a description, a status, and an optional note.

- **MaintenanceReport** — The whole report: who checked it, when, which hospital, which machine, and all 38 items.

---

## Stage 2: The 38-Item Checklist (`models.py` DEFAULT_ITEMS / `src/data/checklist.ts`)

**Think of it like this:** This is the actual list of things to check — like a shopping list, but for machine parts.

There are exactly **38 things** the technician must check. Each one starts as "OK" (on the computer version) or "waiting" (on the phone version). The technician goes through them one by one and marks each as OK or Not OK.

Examples:
- Item 1: "Main electrical panel" — Is the big electricity box working?
- Item 16: "Safety valve" — Is the emergency pressure release working?
- Item 32: "HP Compressor" — Is the high-pressure air pump working?

---

## Stage 3: The Web App Interface (`app.py`)

**Think of it like this:** This is the actual screen the technician sees on their computer. It's like the face of a clock — the gears are hidden inside, but you see the hands and numbers.

Here's what the screen has:

### The Sidebar (left panel)
- **Technician name** — Who's doing the check (default: "Emanuel Gutman")
- **Hospital picker** — Which hospital? (dropdown list)
- **Machine ID** — Which specific machine? (like "HBC-001")
- **Today's date** — Shows automatically

### The Main Area
- All 38 items organized by category
- For each item, you pick: OK / Not OK / Note
- If you pick "Not OK" or "Note", a text box appears so you can write what's wrong

### The Camera Section
- You can take photos for each category (like taking a picture of a broken wire)
- Photos are saved automatically

### The Save Button
- When you press "Save Report", it:
  1. Checks that you filled in the hospital and machine info
  2. Saves a **CSV file** (like an Excel spreadsheet) to the `data/reports/` folder
  3. Creates a **PDF file** (a pretty document you can print or email)
  4. Shows you a summary: how many items are OK vs Not OK

---

## Stage 4: The Mobile App Screens (`mobile/src/screens/`)

**Think of it like this:** The phone app is like the computer app, but redesigned to fit in your pocket.

It has **4 screens** you can swipe between (like pages in a book):

### Screen 1: Setup (`ReportInfoScreen.tsx`)
- First thing you see when you open the app
- Pick your name, hospital, and machine ID
- Like filling in the cover page of a notebook before you start writing

### Screen 2: Checklist (`ChecklistScreen.tsx`)
- Shows 6 category cards (like folders)
- Each card shows how many items you've checked in that category
- Tap a card to see the items inside

### Screen 3: Category Detail (`CategoryScreen.tsx`)
- Shows all items in one category
- Tap each item to mark it OK or Not OK
- You can take a photo for each individual item (with the phone camera!)

### Screen 4: Export (`ExportScreen.tsx`)
- Shows a summary dashboard:
  - Green card: how many are OK
  - Red card: how many are Not OK
  - Gray card: how many you haven't checked yet
  - A progress bar showing what % you've completed
- Buttons to create a PDF, share it, export CSV, or start a new report

---

## Stage 5: Data Storage

### Computer Version
- **CSV files** saved to `data/reports/` folder
- **Photos** saved to `data/images/` folder
- Nothing is stored online — everything stays on your computer

### Phone Version (`src/store/useReport.ts` and `src/utils/storage.ts`)
- Uses **Zustand** (a tiny storage library) — think of it like a box that remembers everything even if you close the app
- Data is saved to **AsyncStorage** (the phone's built-in memory)
- Photos are saved to the phone's file system
- Also fully offline — no internet needed!

---

## Stage 6: PDF Report Generation

### Computer Version (`models.py` — `generate_pdf_bytes()`)
- Uses **ReportLab** (a Python tool for making PDFs)
- Creates a professional-looking document with:
  - A navy blue header with the company logo
  - The technician's name, hospital, date, and machine ID
  - A big table with all 38 items and their statuses
  - Green cells for OK items, red cells for Not OK items
  - A summary at the bottom
- Hebrew text is tricky (it goes right-to-left!), so a special tool called **python-bidi** flips the text the right way

### Phone Version (`src/utils/pdf.ts`)
- Uses **expo-print** — it makes an HTML page (like a mini website) and converts it to PDF
- The HTML page has the same navy/gold style as the computer version
- Photos you took are embedded right into the PDF!
- Uses **expo-sharing** to let you send the PDF through WhatsApp, email, etc.

---

## Stage 7: RTL (Right-to-Left) Support

**Think of it like this:** In English, you read left-to-right (like this sentence). But in Hebrew, you read **right-to-left**. So the whole app needs to be flipped like a mirror!

### Computer Version
- CSS rules in `app.py` flip everything: `direction: rtl`
- Buttons, labels, and text all align to the right

### Phone Version
- `I18nManager.forceRTL(true)` in `App.tsx` tells the phone "flip everything!"
- This needs one app restart the first time to take effect

---

## Stage 8: Navigation (Phone Only — `App.tsx`)

**Think of it like this:** The phone app is like a house with rooms. Navigation is the hallways connecting them.

- **Bottom tabs** — 3 buttons at the bottom of the screen (like a TV remote):
  1. Checklist (the main list)
  2. Report Info (fill in your details)
  3. Export (create and share the report)

- **Stack navigation** — When you tap a category card, it "pushes" you into the category detail screen (like opening a folder). Press back to go back to the main checklist.

---

## How It All Fits Together (The Big Picture)

```
Technician opens the app
        |
        v
Fills in: Name, Hospital, Machine ID
        |
        v
Goes through 38 items, one by one
  - Marks each as OK / Not OK
  - Takes photos if needed
  - Writes notes for problems
        |
        v
Presses "Save" or "Export"
        |
        v
App creates a PDF report
  - Pretty table with all results
  - Summary of OK vs Not OK
  - Photos attached
        |
        v
Technician shares the report
  (download on computer, or WhatsApp/email on phone)
```

That's it! The whole app is basically a fancy digital checklist that creates a professional report at the end. Like a to-do list, but for making sure a hospital machine is safe to use.
