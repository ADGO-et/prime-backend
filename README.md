# Prime Capital Backend API

Node.js + Express + **PostgreSQL** + **Prisma** + JWT auth.

## Quick Start

### 1. Start PostgreSQL

```bash
npm run db:up
```

### 2. Configure environment

```bash
cp .env.example .env
```

### 3. Install & migrate

```bash
npm install
npm run prisma:migrate
npm run prisma:seed
```

### 4. Run API

```bash
npm run dev
```

Server: **http://localhost:5000**

## Default admin login

| Field | Value |
|-------|-------|
| Email | `compliance@primecapital.et` |
| Password | `Admin@12345` |

Change via `ADMIN_SEED_*` in `.env` before seeding.

## Stack

| Layer | Technology |
|-------|------------|
| API | Express 4 |
| Database | PostgreSQL 16 |
| ORM | Prisma |
| Auth | JWT + bcrypt (admin routes protected) |
| Uploads | Multer → **MinIO/S3** (or local `uploads/` in dev) |

## Object storage

- **Dev (no S3 env):** files in `uploads/`
- **Prod / MinIO:** set `S3_*` in `.env` — see **[docs/DEVOPS.md](docs/DEVOPS.md)**

```bash
npm run db:up          # Postgres + MinIO
# Uncomment S3_* in .env, then:
npm run storage:init
curl http://localhost:5000/health   # storage.mode: "s3"
```

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/auth/login` | Public |
| GET | `/api/auth/me` | JWT |
| POST | `/api/kyc/submit` | Public (rate-limited) |
| GET | `/api/admin/*` | JWT |
| GET | `/api/admin/documents/:filename` | JWT |
| GET | `/health` | Public |

## Security (production)

- Set `NODE_ENV=production`
- Use a strong `JWT_SECRET` (32+ chars, random)
- Lock `CORS_ORIGINS` to your real domains
- Run Postgres with SSL (`?sslmode=require` on DATABASE_URL)
- Change seed admin password; do not re-run seed in prod

## Protected documents

KYC files are **not** publicly served. Admins fetch via:

`GET /api/admin/documents/:filename` (JWT required)
