# TaskFlow

A clean, responsive task manager. Sign up, add tasks with priorities and due dates, and find what matters with filters, search and sorting.

**Live demo:** https://taskflow-waseel.onrender.com
*(Hosted on Render's free plan. The first visit after a quiet period can take about 30 seconds while the server wakes up.)*

![CI](https://github.com/muhammad-waseel/taskflow/actions/workflows/ci.yml/badge.svg)

## Features

- **Accounts:** register, log in and log out with JWT authentication. Passwords are hashed with bcrypt.
- **Tasks:** create, edit, complete and delete tasks with a title, description, priority (low, medium or high) and due date.
- **Filters:** All, Active or Completed tabs, priority filter, live search, and sort by newest, oldest, due date or priority.
- **At a glance:** total, active, completed and overdue counts, a progress bar, and "Due today" and "Overdue" badges.
- **Private by design:** every API route checks ownership, so you can only see and change your own tasks.
- **Responsive:** works on desktop and mobile.

## Tech stack

| Layer | Tools |
|---|---|
| Frontend | React 19, Vite, plain CSS |
| Backend | Node.js, Express 5, Mongoose 9 |
| Database | MongoDB (Atlas in production) |
| Security | JWT, bcrypt, Helmet, rate limiting on auth routes |
| Testing | Jest + Supertest (34 API tests) |
| DevOps | Docker (multi-stage), GitHub Actions CI, Render |

## API

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Current user |
| GET | `/api/tasks?status=&priority=&search=&sort=` | List your tasks |
| GET | `/api/tasks/stats` | Total, active, completed and overdue counts |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get one task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/health` | Health check |

All `/api/tasks` routes need an `Authorization: Bearer <token>` header.

## Run locally

Requirements: Node.js 18+ and MongoDB (local or Atlas).

```bash
git clone https://github.com/muhammad-waseel/taskflow.git
cd taskflow
npm run install:all

# server/.env (see .env.example)
cp .env.example server/.env

# terminal 1: API on http://localhost:5000
npm run dev --prefix server

# terminal 2: React app on http://localhost:5173 (proxies /api to the server)
npm run dev --prefix client
```

Or run everything, including MongoDB, with Docker:

```bash
docker compose up --build
# open http://localhost:5000
```

## Tests

```bash
npm test
```

The 34 Jest and Supertest tests cover registration, login, token checks, validation, task CRUD, filters, search, sorting, stats and access control between users. The tests start a temporary in-memory MongoDB 8 automatically. Set `MONGO_URI_TEST` to use your own database instead. CI runs the tests on every push, then builds the client and the Docker image.

## Deployment

Deployed on Render as a single web service. Express serves both the API and the built React app.

- Build command: `npm run render-build`
- Start command: `npm start`
- Environment variables: `MONGO_URI`, `MONGO_DB_NAME=taskflow`, `JWT_SECRET`, `NODE_ENV=production`

---

Built by **Muhammad Waseel**. [Portfolio](https://muhammad-waseel.github.io) · [LinkedIn](https://www.linkedin.com/in/muhammad-waseel-dev) · [GitHub](https://github.com/muhammad-waseel)
