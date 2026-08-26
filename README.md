# csepl-4

Full-stack starter: React + TypeScript (Vite) · Tailwind CSS v4 · shadcn/ui · lucide-react · Express · Prisma · PostgreSQL · Zod

## Structure

```
client/   React (Vite, TS) + Tailwind v4 + shadcn/ui
server/   Express (TS, ESM) + Prisma + Zod
```

## Setup

```bash
npm install
# create the database if needed:
psql -U postgres -h localhost -c "CREATE DATABASE csepl;"
npm run db:push        # sync Prisma schema to Postgres
npm run dev            # run server (:3001) + client (:5173) together
```

## Scripts

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Server + client with hot reload      |
| `npm run db:push` | Push `server/prisma/schema.prisma`   |
| `npm run db:migrate` | Create/apply a migration          |
| `npm run build`   | Build client and server              |

## API

- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks { "title": string }` — validated with Zod

Client requests to `/api/*` are proxied to the server by Vite.
