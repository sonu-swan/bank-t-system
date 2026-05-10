# TaskFlow — Team Task Manager v2

Full-stack: React 18 + Vite + Node.js + Express + MongoDB + JWT

---

## Quick Start

```bash
# 1. Start MongoDB (local or Atlas)
mongod

# 2. Backend
cd backend
npm install
cp .env .env.local
npm run seed       # loads demo data
npm run dev        # http://localhost:5000

# 3. Frontend (new terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## Demo Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@taskflow.io | demo1234 | Admin |
| arjun@taskflow.io | demo1234 | Member |
| kavya@taskflow.io | demo1234 | Member |
| rahul@taskflow.io | demo1234 | Member |

---

## Features

### Auth
- JWT login/register with role selection (Admin / Member)
- Auto refresh token (silent 401 recovery)
- Change name, password via Profile page

### Dashboard
- Personal stats: assigned, in-progress, overdue, done
- Overdue alerts list, projects progress bars, completed tasks
- Task status breakdown chart

### Projects
- Create/edit/delete projects (admin)
- Per-project member management with project-level roles (lead/member)
- 4-column kanban per project with task stats

### Tasks
- Kanban board AND list view with toggle
- Filter: project, priority, assignee, overdue-only
- Status history / audit trail on every task
- Comments with delete (author or admin)
- Quick status update inline
- Create/edit/delete tasks

### Notifications
- Bell icon with unread badge (polls every 30s)
- Types: task assigned, status changed, overdue, comment, project added, role changed
- Mark read individually or all-at-once
- Click to navigate to linked resource

### Search
- Global search bar (Cmd+K shortcut)
- Debounced, searches tasks + projects
- Shows priority badge + project color inline

### Analytics
- Summary: total tasks, completion rate, overdue count, velocity
- Bar charts: by status, by priority, top contributors
- Spark line: completion trend last 14 days
- Project health table with risk indicators

### Team (Admin only)
- All members with task stats + completion rate progress bars
- Change role (admin ↔ member)
- Deactivate members

### Export
- Download tasks as CSV (filterable by project)
- Available on Analytics page + Profile admin tools

### Theme
- Dark / Light mode toggle (persisted to localStorage)
- Sidebar collapsible

### Admin Tools (Profile page)
- Trigger overdue notifications check manually
- Export all tasks CSV

---

## API Reference

```
Auth:         POST /register /login /refresh  GET /me  PATCH /me /change-password
Projects:     GET POST / GET PATCH DELETE /:id  GET /:id/stats
              POST DELETE /:id/members  GET POST /:id/labels
Tasks:        GET /dashboard  GET POST /  GET PATCH DELETE /:id
              POST DELETE /:id/comments
Team:         GET /  PATCH /:id/role  DELETE /:id
Notifications:GET /  GET /unread-count  PATCH /read-all  DELETE /clear-all
              PATCH /:id/read  DELETE /:id
Search:       GET /search?q=...
Analytics:    GET /analytics/overview
Export:       GET /export/tasks.csv?projectId=...
Internal:     POST /internal/run-overdue-check  (admin only)
```

---

## Deploy

### Backend → Railway / Render
Set env vars: `MONGO_URI` `JWT_SECRET` `JWT_REFRESH_SECRET` `CLIENT_URL` `NODE_ENV=production`

### Frontend → Vercel / Netlify
Set env var: `VITE_API_URL=https://your-backend.railway.app/api`
Build: `npm run build`  Output: `dist`
