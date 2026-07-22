# School Management System (ERP)

Enterprise School ERP with:

- Frontend: React + Vite + Tailwind + Redux Toolkit
- Backend: Node.js + Express + MongoDB + Session Auth + RBAC

## Project Structure

- `backend` - Express API, Mongo models, middleware, module routes
- `frontend` - React app with login flow and dashboard shell

## Quick Start (Development)

1. Install dependencies: `npm install`
2. Configure backend env: copy `backend/.env.example` to `backend/.env`
3. Start MongoDB (for persistent data): `npm run mongo:start --workspace school-erp-backend`
   - If MongoDB is not running, backend uses an in-memory DB in development only
4. Run both apps: `npm run dev`
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## Production / Go Live

The React DevTools message *"development build of React"* appears only while using `npm run dev`. For live use, build and serve the **production** build:

1. Set production values in `backend/.env`:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/school_erp
SESSION_SECRET=<long-random-secret>
FRONTEND_URL=http://YOUR_SERVER_IP:5000
SEED_ADMIN_EMAIL=admin@yourschool.com
SEED_ADMIN_PASSWORD=<strong-password>
```

- Use HTTPS in production when possible. If you must use plain HTTP, add `COOKIE_SECURE=false`.
- Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. Build frontend + start server (serves UI + API on one port):

```bash
npm run start:prod
```

Or separately:

```bash
npm run build
set NODE_ENV=production
npm run start
```

3. Open `http://YOUR_SERVER_IP:5000` (or your domain). React DevTools should show **production build** with a green check.

### Optional: reverse proxy (Nginx)

Point `/` and `/api` to the Node process on port 5000, enable HTTPS, and set `FRONTEND_URL` to your public `https://` URL.

## First Admin

Set these in `backend/.env` to create the first Super Admin when none exists:

- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`
- `SEED_ADMIN_NAME` (optional)

Optional Finance Manager:

- `SEED_FINANCE_EMAIL`
- `SEED_FINANCE_PASSWORD`

No demo users, sample students, or prefilled login credentials are included by default wipe rules.

### Showcase sample data (for demos / Vercel)

On startup (when `SEED_SHOWCASE` is not `false`), the backend loads sample teachers, students, assets, and fee receipts.

Re-run manually anytime:

```bash
npm run seed:showcase --workspace school-erp-backend
```

Sample logins:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@yourschool.com` | `ChangeMe@123` |
| Finance | `finance@insaf.demo` | `Finance@123` |
| Teacher | `imran.ali@insaf.demo` | `Teacher@123` |
| Student | `ahmed.khan@insaf.demo` | `Student@123` |

> **Vercel note:** Vercel hosts the frontend well, but MongoDB data must live on **MongoDB Atlas** (or another hosted DB). Point `MONGODB_URI` to Atlas and run `seed:showcase` once against that URI so the live demo has data.

### Railway

Deploy from the **repo root** (Root Directory empty). Folder names are `Backend` / `Frontend` — workspaces must match that casing on Linux.

Build: install once (`npm ci --include=dev`), then `npm run build` only (do not run `npm ci` again — causes `EBUSY` on Railway’s `node_modules/.cache` mount). Node **22** via `.nvmrc` / `nixpacks.toml`.

Required Variables (Variables tab — **no quotes** around values):

| Variable | Example |
|----------|---------|
| `MONGODB_URI` | `mongodb+srv://USER:PASS@cluster.mongodb.net/school_erp?retryWrites=true&w=majority` |
| `SESSION_SECRET` | long random hex |
| `FRONTEND_URL` | your public site URL |
| `NODE_ENV` | `production` |
| `SEED_ADMIN_EMAIL` | `admin@yourschool.com` |
| `SEED_ADMIN_PASSWORD` | strong password |

`MONGODB_URI` **must** start with `mongodb://` or `mongodb+srv://`. If the password has `@`, encode it as `%40`.

