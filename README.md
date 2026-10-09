# AWS Three-Tier Task Management Application

A full-stack, three-tier web application built with **React (Vite)**, **Node.js (Express)**, and **PostgreSQL**, architected for highly available and scalable deployment on AWS (EC2, ALB, Auto Scaling, RDS PostgreSQL).

---

## Architecture Overview

```
[ Tier 1: Presentation ]  React + Vite SPA (Client Browser / S3 + CloudFront or EC2/ALB)
          │
          ▼  REST API (JSON over HTTP / HTTPS)
[ Tier 2: Application  ]  Node.js + Express REST API (ALB -> Auto Scaling EC2)
          │
          ▼  pg Connection Pool
[ Tier 3: Database     ]  PostgreSQL (Local Docker Compose / Amazon RDS Multi-AZ)
```

- **Frontend**: React 18, Vite 5, responsive UI with real-time health indicator and task filtering.
- **Backend**: Modular Node.js + Express layered architecture (Routes -> Controllers -> Services -> Repositories -> Database).
- **Database**: PostgreSQL 16 with version-controlled migrations and data integrity constraints.
- **Security**: Argon2id password hashing, JWT Bearer token authentication, input validation via Zod, strict user-level data isolation, and parameterized SQL queries.
- **Observability**: Pino structured JSON logging with sensitive field redaction and request ID tracing (`x-request-id`).
- **Health Checks**: `/health/live` (process liveness) and `/health/ready` (PostgreSQL dependency readiness for AWS ALB target health checks).

---

## Repository Structure

```
aws-three-tier-web-application/
├── frontend/                     # Tier 1: React + Vite Frontend
│   ├── src/
│   │   ├── api/                  # API client & endpoints
│   │   ├── components/           # Navbar, TaskCard, TaskModal, Filter, Stats
│   │   ├── context/              # AuthContext (JWT management)
│   │   ├── pages/                # Login, Register, Dashboard
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                      # Tier 2: Node.js + Express REST API
│   ├── src/
│   │   ├── config/               # Environment, pg.Pool DB connection, Pino logger
│   │   ├── controllers/          # HTTP request handlers
│   │   ├── middleware/           # Auth, validation, request-id, error handling
│   │   ├── repositories/         # Parameterized SQL database queries
│   │   ├── routes/               # API routes (/api/v1/auth, /api/v1/tasks, /health)
│   │   ├── services/             # Core business logic & user ownership checks
│   │   ├── utils/                # Argon2id password hashing, JWT, AppError
│   │   ├── validators/           # Zod request validation schemas
│   │   ├── app.js                # Express application setup
│   │   └── server.js             # Server startup & graceful shutdown
│   ├── migrations/               # SQL schema migrations & migration runner
│   │   ├── 001_create_users_table.sql
│   │   ├── 002_create_tasks_table.sql
│   │   └── runner.js
│   ├── tests/                    # Vitest + Supertest integration tests
│   │   ├── auth.test.js
│   │   ├── health.test.js
│   │   ├── ownership.test.js
│   │   ├── tasks.test.js
│   │   └── validation.test.js
│   ├── package.json
│   └── vitest.config.js
├── compose.yaml                  # Local PostgreSQL Docker Compose configuration
├── .env.example                  # Environment template
└── package.json                  # Root developer scripts
```

---

## Local Development Quickstart

### Prerequisites
- **Node.js**: v18+
- **Docker & Docker Compose**: v2+

### 1. Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env
```

### 2. Start PostgreSQL Container
Spin up the local PostgreSQL database using Docker Compose:
```bash
docker compose up -d
```

*(Note: If port `5432` is already in use by a host service on your machine, `compose.yaml` defaults to host port `5433` via `.env`).*

### 3. Run Database Migrations
Apply version-controlled database migrations to create the `users` and `tasks` tables:
```bash
npm run migrate
```

### 4. Run Automated Tests
Execute the comprehensive test suite (27 unit, integration, and security ownership tests):
```bash
npm test
```

### 5. Start Backend API
In a terminal, start the Express backend:
```bash
npm run dev:backend
```
The API will be available at `http://localhost:3000`.

### 6. Start Frontend Application
In another terminal, start the Vite development server:
```bash
npm run dev:frontend
```
Open your browser at `http://localhost:5173`.

---

## REST API Endpoints

### Health Checks
| Method | Endpoint | Description | Expected Status |
|---|---|---|---|
| `GET` | `/health/live` | Process liveness check | `200 OK` |
| `GET` | `/health/ready` | PostgreSQL readiness check (for ALB target group) | `200 OK` / `503 Service Unavailable` |

### Authentication
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register new user account | Public |
| `POST` | `/api/v1/auth/login` | Authenticate credentials & return JWT | Public |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile | Bearer Token |

### Task Management
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/v1/tasks` | Create task (`pending`, `in_progress`, `completed`) | Bearer Token |
| `GET` | `/api/v1/tasks` | List owned tasks (supports `?status=` & `?priority=`) | Bearer Token |
| `GET` | `/api/v1/tasks/:id` | Retrieve single owned task by UUID | Bearer Token |
| `PATCH` | `/api/v1/tasks/:id` | Partially update owned task | Bearer Token |
| `DELETE` | `/api/v1/tasks/:id` | Delete owned task | Bearer Token |

---

## Security & Reliability Design

- **Argon2id Hashing**: High-cost memory-hard password hashing.
- **Multi-Tenant Ownership Verification**: Every task query filters on `user_id = $2`. Accessing, modifying, or deleting another user's task returns a `404 Not Found` to prevent resource enumeration.
- **Safe SQL Parameterization**: All queries use parameterized values (`$1`, `$2`) to eliminate SQL injection risks.
- **Log Sanitation**: Sensitive fields (`password`, `password_hash`, `token`, `authorization`) are stripped automatically from structured Pino logs.
- **Graceful Shutdown**: The Node process intercepts `SIGTERM` and `SIGINT`, drains inflight requests, and closes database connections cleanly before exiting.
