# LC Tracker Backend

Express + MongoDB API for the [LC Tracker](../README.md) Chrome extension. Receives LeetCode solving session records from the extension and exposes query/stats endpoints.

## Prerequisites

- **Node.js** 18 or later
- **MongoDB** running locally or a remote cluster URI

## Setup

```bash
cd lc-tracker-backend
cp .env.example .env   # on Windows: copy .env.example .env
```

Edit `.env` and set a strong `API_KEY`. Then:

```bash
npm install
npm run dev
```

The server listens on `PORT` (default `3000`).

## Environment variables

| Variable   | Description                                      | Default                              |
|------------|--------------------------------------------------|--------------------------------------|
| `MONGO_URI`| MongoDB connection string                          | `mongodb://localhost:27017/lc_tracker` |
| `API_KEY`  | Secret sent by the extension as `x-api-key`      | (required)                           |
| `PORT`     | HTTP port                                        | `3000`                               |

## Endpoints

All `/api/*` routes require the header `x-api-key: <API_KEY>`.

### Health check (no auth)

```bash
curl http://localhost:3000/health
```

### Save a session (idempotent upsert by `sessionId`)

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-key" \
  -d '{"sessionId":"test-1","problemSlug":"two-sum","startedAt":"2026-06-23T00:00:00.000Z","activeMs":60000,"tabSwitchCount":0,"events":[]}'
```

### List sessions

Query params: `slug`, `difficulty`, `page` (default 1), `limit` (default 20).

```bash
curl "http://localhost:3000/api/sessions?difficulty=Easy&page=1&limit=10" \
  -H "x-api-key: your-key"
```

### Get one session

```bash
curl http://localhost:3000/api/sessions/test-1 \
  -H "x-api-key: your-key"
```

### Stats summary

```bash
curl http://localhost:3000/api/stats/summary \
  -H "x-api-key: your-key"
```

## Extension integration

Once this server is running, wire the extension’s `sendToBackend()` in `background.js` to POST to `/api/sessions` with the same `x-api-key` as in `.env`. See the project instructions for the exact `fetch()` snippet.

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `npm run dev` | Start with nodemon       |
| `npm start`   | Start in production mode |
