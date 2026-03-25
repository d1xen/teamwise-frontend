# TeamWise Frontend

React SPA for TeamWise — the esports team management platform.

**React 19 · TypeScript · Vite 6 · Tailwind CSS 3.4**

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- The [TeamWise API](../teamwise/) running on `http://localhost:8080`

### 1. Install

```bash
npm install
```

### 2. Run

```bash
npm run dev
```

The app starts on `http://localhost:5173`. API calls are proxied to `localhost:8080` automatically (configured in `vite.config.ts`).

### 3. Build

```bash
npm run build
npm run preview   # preview the production build locally
```

### 4. Lint

```bash
npm run lint
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Production only | Backend API base URL (e.g. `https://api.teamwise.gg`) |

In development, the Vite dev server proxies `/api` requests to `localhost:8080` — no `VITE_API_URL` needed.

### Deployment

- **Hosting**: Vercel (auto-deploy from `main`)
- **Production URL**: `https://teamwise.gg`
- Set `VITE_API_URL` in Vercel environment variables (build-time injection)
- SPA routing handled by `vercel.json` rewrites

---

## Architecture

```
src/
├── api/                HTTP layer
│   ├── client/         apiClient — central HTTP client (auth, 401 handling)
│   ├── endpoints/      One file per domain (team, profile, faceit…)
│   └── types/          TypeScript types matching backend DTOs
├── app/                Root providers (Auth + Router + Toaster)
├── config/             appConfig (API URL, external links)
├── contexts/           Shared state (AuthContext, TeamContext, AgendaContext)
├── design-system/      Reusable UI primitives (Button, Card, Input, Badge…)
├── features/           Domain modules
│   ├── auth/           Login, Steam callback
│   ├── profile/        User profile editing
│   ├── team/           Team management, roster, settings
│   ├── faceit/         FACEIT sync & competition overview
│   └── match/          Match history
├── i18n/               Translations (EN + FR)
├── layouts/            App shell, team layout, sidebar
├── pages/              Route-level components
├── router/             Route config + auth guards
└── shared/             Cross-cutting utilities, hooks, components
```

### Data Flow

```
Backend DTO → api/types/ → api/endpoints/ → hook → component
```

All authenticated HTTP calls go through `apiClient`. A 401 response triggers automatic logout.

### Contexts

| Context | Purpose |
|---------|---------|
| `AuthContext` | Current user, JWT token, login/logout |
| `TeamContext` | Active team, members, membership, permissions |
| `AgendaContext` | Team events and availability |

### i18n

Two languages are supported: **English** and **French**. All user-facing text uses `useTranslation()` from react-i18next. Language preference is persisted in localStorage.

---

## FACEIT Integration (Development)

The FACEIT module requires the backend to be configured with a FACEIT OAuth app. Since FACEIT OAuth requires HTTPS, you need a tunnel for local development:

1. Start an HTTPS tunnel (e.g. [ngrok](https://ngrok.com/)):
   ```bash
   ngrok http 8080
   ```

2. Configure the backend with the ngrok URL (see [API README](../teamwise/README.md#faceit-integration))

3. No frontend configuration needed — the OAuth flow is entirely backend-driven

---

## Key Conventions

- **TypeScript strict** — no `any`, types in `api/types/` must match backend DTOs exactly
- **i18n mandatory** — every visible string goes through `useTranslation()`
- **Business logic in hooks** — components stay presentational (`features/*/hooks/`)
- **Design system first** — reuse `design-system/` components before creating new ones
- **`apiClient` only** — never use raw `fetch()` for authenticated calls
