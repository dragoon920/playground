# Playground

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

## API

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/items` | List items |
| `POST` | `/api/items` | Create `{ "title": "..." }` |
| `PATCH` | `/api/items/:id` | Update `{ "title"?: "...", "done"?: true }` |
| `DELETE` | `/api/items/:id` | Delete item |

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
