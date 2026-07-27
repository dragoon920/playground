# TQ Playground

Full-stack starter: **Go** API, **MySQL**, **React** (Vite), all via **Docker Compose**.

## Stack

| Service | Tech | URL |
|---------|------|-----|
| Frontend | React + Vite | http://localhost:5173 |
| API | Go + Gin (MVC) | http://localhost:8080 |
| Database | MySQL 8.4 | localhost:3306 |

## Quick start

```bash
docker compose up --build
```

Then open http://localhost:5173

API health: http://localhost:8080/api/health

## Auth (default admin)

| Email | Password |
|-------|----------|
| `admin@playground.local` | `admin123` |

After login you get the **Users** admin page (list / create / delete).

## API

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | — | Health check |
| `POST` | `/api/auth/login` | — | `{ email, password }` → JWT |
| `GET` | `/api/auth/me` | Bearer | Current user |
| `GET` | `/api/users` | Admin | List users |
| `POST` | `/api/users` | Admin | Create user |
| `DELETE` | `/api/users/:id` | Admin | Delete user |
| `GET/POST/PATCH/DELETE` | `/api/items...` | Bearer | Items CRUD |

## Project layout

```
playground/
├── backend/                 # Go + Gin API
│   ├── controllers/         # HTTP handlers
│   ├── services/            # Business logic
│   ├── models/              # Data models
│   ├── middleware/          # CORS, logging
│   ├── routes/              # Route wiring
│   ├── database/            # MySQL connection
│   └── config/              # Env config
├── frontend/                # React + Vite
├── mysql/                   # DB init scripts
├── docker-compose.yml
└── .env.example
```

## Credentials (dev)

- User: `playground`
- Password: `playground`
- Database: `playground`
- Root password: `root`

## Useful commands

```bash
# Start
docker compose up --build

# Stop
docker compose down

# Reset DB volume
docker compose down -v

# API logs
docker compose logs -f api
```

## Local Go (optional)

If you have Go installed and MySQL running via Docker:

```bash
docker compose up mysql -d
cd backend
cp ../.env.example .env   # or export the env vars
go run .
```

## Deploy to AWS (EC2 + Compose)

Terraform creates an EC2 instance that runs Docker Compose. GitHub Actions redeploys on push to `main`.

```bash
cd infra/terraform
terraform init
terraform apply
```

After apply, add GitHub repo secrets:

| Secret | Value |
|--------|--------|
| `EC2_HOST` | Terraform output `public_ip` |
| `EC2_SSH_KEY` | Contents of `infra/terraform/playground-ec2.pem` |

Then open the `frontend_url` / `api_url` outputs.
