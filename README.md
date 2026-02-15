# CookWire (Material 3 rewrite)

CookWire is a React + Vite HTML/CSS/JS playground rebuilt with Material Design 3.

## Highlights

- Material 3 UI (MUI) with dark-first theme tokens
- Responsive navigation:
  - Compact (`<600px`): bottom navigation + editor/preview tabs
  - Medium (`600-840px`): navigation rail
  - Expanded (`>840px`): navigation drawer
- Productivity features:
  - Command palette (`Cmd/Ctrl + K`)
  - Search/replace (`Cmd/Ctrl + F`, `Cmd/Ctrl + Shift + H`)
  - Keyboard shortcuts (`Cmd/Ctrl + S`, `Alt + 1/2/3`, `Cmd/Ctrl + /`)
  - Prettier formatting (HTML/CSS/JS)
- Cloud save with anonymous owner key (`X-CookWire-Owner-Key`)
- Japanese/English UI

## Environment

Copy `.env.example` to `.env`.

### Frontend

- `VITE_API_BASE_URL`: API base URL (default: `http://localhost:3000/api`)

### Backend

- `PORT` (optional, default `3000`)
- `DATA_DIR` (optional, default `./data`)
- `DATABASE_PATH` (optional, default `./data/projects.db`)
- `CORS_ALLOW_ORIGINS` (comma-separated origins, or `*`)

## Run locally

```bash
npm install
npm run server
npm run dev
```

## API

All `/api/projects` endpoints require `X-CookWire-Owner-Key` header.

- `POST /api/projects` create
- `PUT /api/projects/:id` update (owner key match required)
- `GET /api/projects` list for owner key
- `GET /api/projects/:id` fetch one (owner key match required)

Deprecated endpoints:

- `GET|POST /api/fiddles`
- `GET|PUT /api/fiddles/:id`

These now return `410 Gone`.

## Scripts

- `npm run dev` start Vite
- `npm run build` production build
- `npm run preview` preview build
- `npm run lint` ESLint
- `npm run server` API server
