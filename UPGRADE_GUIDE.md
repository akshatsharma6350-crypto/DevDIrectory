# Upgrade guide — Employee & Project Tracking System

Install the one new dependency, then run:

```bash
npm install            # adds react-hot-toast
npm run dev:all
```

| # | Feature | Where it lives |
| --- | --- | --- |
| 1 | **localStorage persistence** — API posts + saved posts are merged | `services/postService.js` (`getAllPosts`, `getPostsByUser`, `createPost`, `deleteLocalPost`) |
| 2 | **Dark / Light toggle** — sets `data-theme` **and** the Tailwind-compatible `dark` class, remembered in localStorage | `context/ThemeContext.jsx`, `components/Navbar.jsx`, no-flash script in `index.html` |
| 3 | **Toasts** (`react-hot-toast`) — loading / success / error, plus a toast-based confirm instead of `window.confirm` | `<Toaster>` in `App.jsx`, `utils/confirmToast.jsx`, used in AddPost, AddProject, ProjectViewer, Login, TaskBoard, StatusBadge |
| 4 | **Advanced filters** — company, tech stack, status, city (+ name/company live search) | `pages/UserDirectory.jsx` |
| 5 | **Employee status badge** (Active / In Meeting / On Leave) — managers (signed-in users) can change it | `components/StatusBadge.jsx` |
| 6 | **Task tracker** (To Do / In Progress / Completed, drag-and-drop + buttons, add / delete) | `components/TaskBoard.jsx`, tab on `pages/UserProfile.jsx` |
| 7 | **Priority & deadline** on tasks **and** Store projects (High/Medium/Low, overdue / due-soon highlighting, sort & filter) | `components/Badges.jsx`, `AddProject.jsx`, `ProjectStore.jsx`, `utils/tracker.js` |
| 8 | **Real-time dashboard** (employees, active projects, completed tasks, overdue, team score, charts) | `pages/Home.jsx`, `components/Charts.jsx`, `utils/tracker.js` (`computeStats`) |

All tracker data is held in one place — `context/TrackerContext.jsx` — which saves to localStorage
(`dd_tasks_v1`, `dd_status_v1`) and syncs across browser tabs, so the dashboard updates instantly.

## Tailwind note
This project styles with CSS variables (`assets/global.css`). If you add Tailwind, set `darkMode: 'class'` —
the toggle already adds/removes the `dark` class on `<html>`.

## Reset demo data
Browser console: `localStorage.removeItem('dd_tasks_v1'); localStorage.removeItem('dd_status_v1'); location.reload()`
