# CLAUDE.md - School System Architecture & Assistant Directives

## 🎯 Architecture & Token Optimization Protocol
This codebase is designed under the **Micro-Modular Architecture Protocol** to minimize token consumption and maximize speed:
- Total lines in `js/app.js`: **<= 100 lines** (Bootstrap only).
- Maximum lines per module in `modules/`: **<= 600 lines** (Warning at 450).
- Automated bundle artifact: `dist/bundle.js` (Compiled via `scripts/build.js`).

## ⚡ Workflow Rules for Claude
1. **Surgical Reading & Modification**:
   - Never inspect or load all files at once.
   - Target only the single module in `modules/` responsible for the user request.
2. **Never Edit `dist/bundle.js`**:
   - Edits must occur only in `modules/` or `index.html`/`style.css`.
   - Run `node scripts/build.js` after making module modifications.
3. **Budget Verification**:
   - Always run `node scripts/check_budget.js` to ensure module line limits are respected.
4. **Contract Preservation**:
   - Keep global bindings on `window` intact (e.g., `window.renderStudents()`, `window.applyGraceMarks()`) so DOM inline handlers remain functional.

## 🧭 Module Directory
| Module | Primary Responsibility |
| :--- | :--- |
| `modules/coreState.js` | Global `appData`, security sanitization (`escapeHtml`), toasts, theme switcher |
| `modules/subjectsConfig.js` | Stages, branches, subject dictionaries, educational configurations |
| `modules/storage.js` | LocalStorage, IndexedDB offline sync, JSON export/import |
| `modules/auditAndSnapshots.js` | Auto-snapshots, instant undo engine, and audit logging |
| `modules/controlLock.js` | Official exam record lockdown & sealing mode with PIN protection |
| `modules/header.js` | School branding, stages/sections tabs and selector management |
| `modules/students.js` | Student CRUD, intelligent Arabic gender detector, Excel import |
| `modules/grades.js` | Term grades, subject final calculations, master grade sheet |
| `modules/graceMarks.js` | Iraqi Ministry 5-mark grace allocation engine |
| `modules/stats.js` | Official statistical student counts by stage and section |
| `modules/rooms.js` | Exam room allocation algorithm and printable cards |
| `modules/reportCards.js` | Multi-card printable results cards with verbal appreciation |
| `modules/officialDocs.js` | Official school document suite (Enrollment, Transfer, Exam Passes) |
| `modules/analytics.js` | Chart.js visual analytics and Top 10 honor board |
| `modules/excelExport.js` | Official XLSX master sheet generation via SheetJS |
