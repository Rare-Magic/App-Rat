# App Rat — Backend Specification

## Overview

- **Stack:** Python 3 + Flask (chosen for easy packaging to EXE later).
- **Frontend:** React app lives in `frontend/`; backend serves API and (optionally) static build.
- **File layout:**
  - **`input/`** — User-uploaded input file (Excel/CSV) for the current run.
  - **`process/`** — Mapping file (e.g. `Mapping-file.xlsx`), and generated `process.csv` (after CMDB and Gartner mapping).
  - **`output/`** — Output CSV and PPT (to be implemented later).

Reference/sample files: `input/Input file.xlsx` (sample input), `process/Mapping-file.xlsx` (mapping file). User uploads input with any filename; columns must match (names normalized: strip whitespace, case-insensitive).

---

## 1. Upload / Drop Input File

**UI:** User uploads or drops a file → show “File uploaded successfully” and a **summary table**.

**Backend:**

- Accept uploaded file (multipart/form-data).
- Validate: allow `.xlsx`, `.xls`, `.csv`.
- Save the file into **`input/`** (e.g. `input/upload_<timestamp>.xlsx` or single `input/current.xlsx` overwritten each run). Keep a predictable path so later steps can read “the current input file.”
- Read the saved file and compute summary.

**Input file columns (expected):**

- SysID, Applications Name, Install Type, Tier, Application Type, Description, Health, Spend

**Summary to return to frontend (for tabular display):**

| Application Type | Count | Total Spend   |
|------------------|-------|---------------|
| (value)          | (int) | (sum of Spend) |

- One row per distinct **Application Type**.
- **Count** = number of rows with that Application Type.
- **Total Spend** = sum of **Spend** for that Application Type (treat non-numeric/missing as 0).

**API (to be implemented):** e.g. `POST /api/upload` → save to `input/`, return `{ summary: [ { applicationType, count, totalSpend }, ... ] }`. Frontend shows this in a table (e.g. in left or right pane).

---

## 2. Industry Selection

- User selects industry in the UI (dropdown). **No backend operation** for this step; frontend only. Backend may receive industry in a later step if needed for analytics or reporting.

---

## 3. Map CMDB Data (Button)

**UI:** User clicks “Map CMDB Data” → progress bar runs **60 seconds**, **uneven** (not linear), to 100%. When done, show a **pivot summary table** on the UI.

**Backend:**

- **Inputs:**  
  - File in **`input/`** (current upload).  
  - Mapping file in **`process/`** (e.g. `Mapping-file.xlsx` or a copy placed there).  
- **Mapping file columns:** SysID | L1 | L2 | Gartner Mapping | Market Leaders  
- **Logic:**  
  - Join input file with Mapping file on **SysID**.  
  - Add two new columns to the input data: **L1**, **L2** (from Mapping file).  
  - If SysID has no match, L1/L2 can be null or “N/A”.  
  - Write result to **`process/process.csv`** (all original input columns + L1 + L2).  
- **Output:** `process/process.csv` created/overwritten.

**Summary to return for UI (pivot table):**

| L1   | Applications count | Spend   |
|------|--------------------|---------|
| (L1) | (count of rows)    | (sum Spend) |

- One row per distinct **L1** (after mapping).  
- **Applications count** = number of applications (rows) in that L1.  
- **Spend** = total Spend for that L1.

**API (to be implemented):** e.g. `POST /api/map-cmdb` → run mapping, write `process/process.csv`, return `{ summary: [ { l1, applicationsCount, spend }, ... ] }`. Frontend shows progress for 60s (uneven), then displays this table.

**UI progress:** Frontend runs a 60-second timer with **uneven** progress (e.g. slow at start, faster in middle, slow again near 100%). No need for real-time progress from backend for this step; backend just does the job and returns when done.

---

## 4. Gartner Leaders Mapping (Button)

**UI:** User clicks “Gartner Leaders Mapping” → progress bar again **60 seconds**, **uneven**, to 100%. When done, show a **pivot summary table** with filtering.

**Backend:**

- **Inputs:**  
  - **`process/process.csv`** (already has input columns + L1, L2 from step 3).  
  - Same Mapping file in **`process/`** (SysID | L1 | L2 | Gartner Mapping | Market Leaders).  
- **Logic:**  
  - Join `process.csv` with Mapping file on **SysID**.  
  - Add two new columns: **Gartner Mapping**, **Market Leaders**.  
  - Save back to **`process/process.csv`** (all existing columns + Gartner Mapping + Market Leaders).  
- **Output:** `process/process.csv` updated in place.

**Configurable filter (backend variable):**

- **N (integer):** Only include L2s that have **application count > N** in the summary.  
- **Gartner Mapping = N/A:** Exclude any L2 where **Gartner Mapping** is “N/A” (or blank) from the **summary table** returned to the UI. (Still write them in `process.csv`; only the summary is filtered.)

**Summary to return for UI (pivot table):**

| L1   | L2   | Top 5 application names by spend | Market leaders (by L2) |
|------|------|----------------------------------|------------------------|
| (L1) | (L2) | (comma-separated or list)        | (from Mapping, per L2) |

- One row per **(L1, L2)** that passes the filters (count > N, Gartner Mapping ≠ N/A).  
- **Top 5 application names by spend:** For that L1+L2, take top 5 by **Spend**, show **Applications Name**.  
- **Market leaders (by L2):** From Mapping file, the **Market Leaders** value for that L2 (can be same for all rows in that L2).

**API (to be implemented):** e.g. `POST /api/map-gartner` → run mapping, update `process/process.csv`, return `{ summary: [ { l1, l2, top5AppNames, marketLeaders }, ... ] }`. Frontend runs 60s uneven progress, then shows this table.

**UI progress:** Same as step 3 — 60 seconds, uneven; backend returns when done.

---

## 5. Folder Structure (Target)

```
App-Rat/
├── frontend/           # React app (Vite)
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── input/              # User upload: current input file
├── process/            # Mapping-file.xlsx, process.csv
├── output/             # Output CSV & PPT (later)
├── backend/            # (Later) Flask app
│   └── ...
├── Input file.xlsx     # Sample/reference
├── Mapping-file.xlsx   # Sample/reference (or copy into process/)
└── backend.md
```

- **input/** — Only the current run’s uploaded file.  
- **process/** — Mapping Excel + `process.csv` (created/updated by Map CMDB and Gartner steps).  
- **output/** — Reserved for output CSV and PPT (implement later).

---

## 6. Backend Configuration (Variables)

- **N (integer):** Minimum application count for an L2 to appear in the Gartner summary table (e.g. `N = 2` → only L2s with more than 2 applications). Define in config or env (e.g. `GARTNER_MIN_L2_COUNT=2`).  
- **Mapping file path:** e.g. `process/Mapping-file.xlsx` (or configurable).  
- **Input/process/output paths:** As above; can be env or config.

---

## 7. API Summary (To Implement)

| Endpoint            | Method | Purpose |
|---------------------|--------|--------|
| `/api/upload`       | POST   | Save file to `input/`, return summary (Application Type \| Count \| Total Spend). |
| `/api/map-cmdb`     | POST   | Map input → L1/L2, write `process/process.csv`, return pivot (L1 \| Applications count \| Spend). |
| `/api/map-gartner`  | POST   | Add Gartner Mapping + Market Leaders to `process.csv`, return filtered pivot (L1 \| L2 \| top 5 apps \| Market leaders). |

- All JSON request/response unless file upload (multipart).  
- CORS: allow frontend origin (dev and production).  
- Error responses: 4xx/5xx with message; frontend to show “File uploaded successfully” only on success.

---

## 8. UI Behaviour Summary

1. **Upload:** Show “File uploaded successfully” + table **Application Type \| Count \| Total Spend.**  
2. **Industry:** No backend call.  
3. **Map CMDB Data:** 60s uneven progress → then table **L1 \| Applications count \| Spend.**  
4. **Gartner Leaders Mapping:** 60s uneven progress → then table **L1 \| L2 \| Top 5 application names by spend \| Market leaders (by L2)**, with L2s filtered by N and Gartner Mapping ≠ N/A.

---

## 9. Future (Not in This Phase)

- **Output CSV / PPT** generation and download from **output/** folder.  
- **EXE packaging** (e.g. PyInstaller for Flask + static frontend).

No further implementations in this document; the above is the specification. Implementation is in `backend/` (Flask) and `frontend/` (React).

**Run backend (from project root):**
```bash
cd App-Rat
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r backend/requirements.txt
python backend/app.py
```
API: `http://localhost:5000`. Set `VITE_API_URL=http://localhost:5000` when running frontend dev (or use default).
