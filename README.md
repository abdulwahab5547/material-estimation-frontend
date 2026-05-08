# StructuraCore — Frontend

Web client for StructuraCore, a construction material estimation platform. Lets users build a hierarchical project model (project → floors → rooms → walls), generate material takeoffs and cost estimates, version those estimates, and export polished PDF reports.

This is the web client only. The REST API lives in a separate repository.

---

## Tech stack

- **Framework:** React 19
- **Build tool:** Vite 6
- **Language:** TypeScript 5 (strict)
- **Styling:** Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Routing:** React Router v7
- **Data:** TanStack Query v5 (server state) + Zustand (client state)
- **Forms & validation:** React Hook Form + Zod
- **HTTP:** Axios with cookie-based auth and silent token refresh
- **3D:** react-three-fiber + drei + three.js (room visualization)
- **Charts:** Recharts
- **Animation:** Framer Motion
- **Notifications:** Sonner

## Features

- Email/password auth with HTTP-only cookies and automatic refresh-token rotation
- Project explorer for navigating the floor → room → wall hierarchy
- Geometry editor for walls, with re-estimation on edit
- Material takeoff and cost dashboard driven by the API's estimation engine
- Per-user rate cards on the profile, used to convert quantities into monetary cost
- Estimate revision history per project
- Reusable room/wall templates
- PDF report download
- Aggregate analytics dashboard
- 3D room preview powered by react-three-fiber
- Demo project presets for first-run exploration

## Project structure

```
frontend/
├── src/
│   ├── main.tsx              # App bootstrap (router + query client + theme)
│   ├── App.tsx               # Top-level route tree
│   ├── pages/                # Route-level pages (Landing, Dashboard, Profile, NotFound)
│   ├── features/             # Feature modules — auth, projects, rooms, walls,
│   │                         #   estimates, revisions, templates, reports,
│   │                         #   profile, analytics, three-d
│   ├── components/
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── layout/           # App shell, navigation
│   │   └── ErrorBoundary.tsx
│   ├── lib/
│   │   └── api.ts            # Axios instance + 401 → refresh → retry interceptor
│   └── index.css             # Tailwind entry
├── public/
├── index.html
├── vite.config.ts            # Dev proxy for /api and /uploads
├── package.json
└── tsconfig.json
```

## Prerequisites

- Node.js 22.x
- npm 10+
- A running instance of the StructuraCore backend (locally or deployed)

## Local setup

```bash
git clone <this-repo-url>
cd <repo>
npm install
cp .env.example .env   # optional — see Environment variables below
npm run dev
```

The dev server runs on `http://localhost:5173` (Vite will pick the next free port if 5173 is busy).

In dev, **leave `VITE_API_URL` unset** — the Vite dev server proxies `/api/*` and `/uploads/*` to `http://localhost:5000` (configured in [`vite.config.ts`](vite.config.ts)). Make sure the backend is running on that port (or update the proxy `target` to match).

## Environment variables

Vite env variables must be prefixed with `VITE_` to be exposed to client code.

| Name | Required | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | Production only | `/` (use Vite proxy) | Base URL of the deployed backend, **without** trailing `/api` and **without** trailing `/`. Example: `https://api.structuracore.com` |

> Setting `VITE_API_URL` in local dev will bypass the Vite proxy and hit the URL directly — only do this if you know you want that.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run typecheck` | Type-check without emitting |
| `npm run lint` | ESLint |

## Auth & networking

- Auth uses HTTP-only cookies issued by the backend. Axios is configured with `withCredentials: true` so the browser sends cookies on every request.
- A response interceptor in [`src/lib/api.ts`](src/lib/api.ts) catches `401` responses, calls `POST /api/auth/refresh` once, and retries the original request transparently.
- For cross-origin production deployments, the backend must set cookies with `SameSite=None; Secure` and serve `Access-Control-Allow-Credentials: true` against the exact frontend origin. Both are handled by the backend when its `COOKIE_SECURE=true` and `CLIENT_ORIGIN=https://<this-frontend-origin>` are set correctly.

## Deployment — Vercel

1. Create a Vercel project pointing at this repository.
2. **Framework Preset:** Vite (auto-detected). Build command `npm run build`, output `dist`.
3. **Settings → General → Node.js Version → 22.x.**
4. **Settings → Environment Variables** — set:
   - `VITE_API_URL` = the deployed backend origin (e.g. `https://structuracore-backend.vercel.app`), no trailing `/api`, no trailing `/`.
5. Deploy.
6. After the frontend has a stable URL, go to the **backend** project and set its `CLIENT_ORIGIN` env var to that exact URL, then redeploy the backend so CORS and cookie issuance know the new origin.

## License

Proprietary. All rights reserved.
