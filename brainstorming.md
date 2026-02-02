# App Rat Bot — Brainstorming

## Vision Summary (from model.txt)

**App Rationalization Bot** — A tool that lets users upload app data (Excel/CSV), select industry, run taxonomy mapping and Gartner mapping, then download a generated PPT. UI-first (React), backend later, eventually packaged as an exe.

---

## 1. Simple UI — How to Build It

### Overall Layout
- **Single-page app** with a clear **header + two-pane body**.
- **Header**: Fixed or sticky so branding is always visible; center area for “App Rationalization” and logos on left/right.
- **Body**: One main content area split **40% left / 60% right** (configurable via CSS or layout component). Left = actions & controls; right = status & output.

### Left Pane (40%) — “Control & Input”
- **Upload zone**: One block for file (Excel/CSV) with:
  - Drag-and-drop overlay + “Browse” or “Choose file” button.
  - Clear rules: fixed column names/numbers (show short “expected format” hint or link to template).
- **Industry**: Single dropdown, 4–5 options; keep labels short and consistent.
- **Actions**: Two primary buttons in order:
  1. “Map taxonomy to Excel” → triggers backend (later) + shows progress.
  2. “Gartner mapping” → same idea, progress then PPT-ready state.
- **Progress**: One progress bar per long-running step (taxonomy, Gartner); optional percentage and status text beside it.
- **Output**: One section that appears only after Gartner mapping is 100%: PPT icon + “Bot output” / “Download PPT” — whole block clickable to download.

### Right Pane (60%) — “Status & Output”
- **Status log / feed**: Chronological list of events, e.g.:
  - File uploaded successfully
  - Industry selected: &lt;name&gt;
  - Mapping started… → 100% → show table
  - Gartner mapping started… → 100% → show table
  - PPT downloaded
- **Tables**: When a step hits 100%, show its result in a table (taxonomy result, then Gartner “best in class” list). Keeps right pane as the “single source of truth” for what the bot did.

### Simplicity Principles
- One primary flow: Upload → Select industry → Map taxonomy → Gartner map → Download PPT.
- No extra tabs or pages for the main flow; use show/hide and conditional sections (e.g. “Output” only after Gartner 100%).
- Reuse same components for “progress + status” so the pattern is consistent and easy to maintain.

---

## 2. Dark Interactive Theme — Ideas

### Color & Contrast
- **Background**: Deep dark (e.g. near-black or dark blue-grey), not pure black, to reduce eye strain.
- **Surfaces**: Slightly lighter panels for left/right panes (cards/sections) so the layout is clear.
- **Text**: Off-white or light grey for body; white for headings and key labels.
- **Accents**: One or two accent colors (e.g. teal, blue, or green) for:
  - Primary buttons (Map taxonomy, Gartner mapping).
  - Progress bars (fill color).
  - Links and “Download PPT” block.
  - Optional: subtle border or glow on focus/hover.

### Interactivity (Dark Theme)
- **Hover**: Buttons and clickable areas (upload zone, PPT block) slightly brighter or with soft border/glow.
- **Focus**: Visible focus ring (accent color) for keyboard users.
- **Progress**: Smooth animation (e.g. bar fill, optional pulse) so completion feels responsive.
- **Status feed**: New items could briefly highlight or slide in; optional icons per status type (upload, mapping, download).
- **Disabled states**: Muted colors and “not clickable” cursor so it’s clear when actions aren’t available (e.g. Gartner before taxonomy done).

### Visual Hierarchy
- Header: Bold title, logos sized so they don’t overpower “App Rationalization”.
- Left pane: Clear sections (Upload | Industry | Actions | Progress | Output) with spacing or thin dividers.
- Right pane: Status as a timeline or list; tables with light borders or alternating row shades for readability.

### Mood & Polish
- **Dark interactive** can mean: subtle shadows, soft gradients on buttons, and smooth transitions (e.g. progress bar, section visibility). Avoid flashy or distracting motion.
- Optional: very subtle grid or pattern in the background to give depth without noise.

---

## 3. Feature & UX Brainstorm

| Area | Idea |
|------|------|
| **Upload** | Show filename and size after upload; “Remove” to clear and re-upload. |
| **Industry** | Default selection (e.g. first option) or “Select industry” placeholder to force a choice. |
| **Progress** | Show step name + percentage; optional “Cancel” in a future phase. |
| **Tables** | Sortable columns, optional search/filter if rows are many. |
| **PPT block** | Big, obvious click area (icon + “Download PPT”); after click, status: “Output downloaded”. |
| **Errors** | Dedicated area (e.g. top of right pane or inline) for upload/validation/backend errors. |
| **Exe** | Later: wrap React app (e.g. with Electron or similar) so backend + UI run in one exe. |

---

## 4. Tech Stack (High-Level, No Code)

- **UI**: React (as in model) — components for Header, LeftPane (Upload, Industry, Buttons, Progress, Output), RightPane (Status, Tables).
- **Styling**: CSS (or a library) for layout (flex/grid), dark palette, and interactive states.
- **State**: Simple state (e.g. file, industry, progress %, status messages, table data) — structure so backend can plug in later (API calls instead of mocks).
- **Build**: Standard React build; later, pack with Electron (or equivalent) for exe and optional bundled backend.

---

## 5. Next Steps (When You Start Implementing)

1. Define the **exact** Excel/CSV column names and count; add a “Template” or “Expected format” note in the UI.
2. Finalize **industry** list (4–5 names).
3. Design **API contract** (upload, start taxonomy, start Gartner, get progress, get PPT) so UI can call stubs first and replace with real backend later.
4. Pick **accent color(s)** and document them (e.g. “Primary: #00C9A7, Secondary: #4A90D9”) for consistency.
5. Sketch or wireframe the 40/60 split and header once to align with “simple UI + dark interactive theme”.

---

*No code in this doc — only structure, UX, and theme ideas to guide implementation.*
