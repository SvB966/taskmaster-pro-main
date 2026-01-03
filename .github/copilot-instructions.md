# Copilot Instructions

- Project: Vite + React (TS) frontend with a simple Express + SQLite backend. Frontend served by Vite on 3000; backend API on 3002 using `server/server.js` and local db `server/tasks.db` (auto-created).
- Run locally: from repo root run `npm install` then `npm run dev` (spawns backend and Vite via concurrently). On Windows, `start-dev.bat` also installs deps if `node_modules` is missing and starts dev servers.
- Backend API: see `server/server.js` for routes. Endpoints: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:id`, `DELETE /api/tasks/:id`. Data stored as SQLite table `tasks` with JSON-serialized `subtasks`.
- Types and domain model: canonical definitions in `types.ts` (`Task`, `Subtask`, `TaskStatus`). Dates are ISO `YYYY-MM-DD`, times `HH:MM`. `TaskStatus` enum uses labels `Not Started`, `In Progress`, `Completed`.
- Data flow: UI state in `App.tsx`; tasks loaded via `taskService` (`services/taskService.ts`) which fetches the backend. CRUD operations update state and then call the API. `taskService` creates ids with `crypto.randomUUID()` and auto-fills `createdAt`, `updatedAt`, and default `endTime` if missing.
- Views: `App.tsx` switches between calendar, dashboard, and task detail. Calendar selection drives the right-hand task panel; clicking tasks can open detail view.
- Calendar: `components/Calendar.tsx` renders monthly grid, groups tasks per date via a map, and shows status dots (red/amber/green per `TaskStatus`). Selected and today states are derived from ISO date strings.
- Task Panel: `components/TaskPanel.tsx` handles per-day list, creation, and inline edit. Subtasks use `crypto.randomUUID()`. Form auto-adjusts end time when start or duration changes. Delete/update callbacks come from `App.tsx`.
- Dashboard: `components/Dashboard.tsx` computes KPI aggregates and renders custom SVG line/pie visuals without external chart libs; time range filters include presets and custom date range.
- Task Detail: `components/TaskDetail.tsx` (see file) shows full task view with subtasks toggle and status controls; `Header.tsx` manages navigation, dark mode toggle, and view switching.
- Styling: uses Tailwind-style utility classes inline; dark mode toggled by adding `dark` class to `document.documentElement` with localStorage preference in `App.tsx`.
- Error handling: `App.tsx` surfaces API errors via banner; `taskService` throws on non-OK fetch responses. If errors appear on load, ensure backend is running.
- Testing/linters: none configured; keep changes lightweight and consistent with existing patterns. Favor small, direct React components and utility helpers over new infra.
- Persistence notes: backend auto-initializes SQLite file; no migrations. If schema changes, adjust `server/server.js` table definition and consider data compatibility.
- Ports/conflicts: backend fixed to 3002, frontend to 3000. Change scripts/env if needed when adding features.
