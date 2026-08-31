# 🚀 CSEPL-4 Railway Deployment Guide

This repository is pre-configured for automated 1-click deployment on [Railway](https://railway.app).

---

## 🏗️ Deployment Architecture

- **Unified Single-Service**: Express serves the REST API (`/api/*`), media storage (`/uploads/*`), and the compiled React SPA bundle (`/*`) from a single port.
- **Managed PostgreSQL**: Automatically provisioned via Railway PostgreSQL plugin.
- **Database Schema Sync**: Auto-runs `prisma db push` on every deploy before server startup.
- **Persistent Media Storage**: Attach a Railway Volume to `/app/server/uploads` so player headshots, team emblems, and match photos survive container redeployments.

---

## 📋 Step-by-Step Instructions

### Step 1: Create a Railway Project
1. Log in to [Railway](https://railway.app).
2. Click **"+ New Project"** -> **"Deploy from GitHub repo"**.
3. Select `sanzid-islam-mahi/CU-CSE-Premier-League-Webapp`.

### Step 2: Add PostgreSQL Database
1. In your Railway Project Canvas, click **"+ Create"** -> **"Database"** -> **"Add PostgreSQL"**.
2. Railway will automatically provision PostgreSQL and expose `DATABASE_URL` as an environment variable to your project.

### Step 3: Configure Environment Variables
In your web service settings -> **Variables** tab, ensure the following variables are present:

| Variable | Value | Description |
|---|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` | Auto-linked from Railway Postgres |
| `JWT_SECRET` | *e.g.* `csepl-production-jwt-super-secret-key-2026` | Any secure random string |
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `3001` (or leave default) | Automatically set by Railway |

### Step 4: Add Persistent Volume for Uploads (Recommended)
To persist uploaded photos across deployments:
1. In your web service settings, go to the **Volumes** tab.
2. Click **"+ Add Volume"**.
3. Set Mount Path: `/app/server/uploads` (or `/app/uploads`).

### Step 5: Seed the Initial Database
Once the app deploys successfully, open the Railway service terminal (or run locally with the remote `DATABASE_URL`):
```bash
npm run db:seed
```
This initializes:
- Default Admin Account: `admin@cse.cu.ac.bd` (Password: `admin123`)
- 6 Batches (Anabil 21 through 26th Batch)
- 120 initial player profiles with credentials
- Cricket & Football Tournaments

### Step 6: Generate Domain
1. In your web service settings -> **Networking** -> **Generate Domain**.
2. Open your `https://*.up.railway.app` URL!

---

## 🛠️ Verification Checklist
- [ ] Healthcheck endpoint responds at `https://<your-app>.up.railway.app/api/health`
- [ ] Homepage loads with tournaments, batches, and live match cards
- [ ] Login as Admin (`admin@cse.cu.ac.bd` / `admin123`) works
- [ ] Uploading a batch photo / crest succeeds and persists
