# Code Stand

Code Stand is a small full-stack code analysis app. Paste a code snippet, choose a mode, and get a structured response that explains the code, reviews it for issues, or suggests practical improvements.

## Features

- `Explain` mode for plain-language breakdowns
- `Review` mode for bugs, edge cases, and risky assumptions
- `Improve` mode for concrete cleanup and refactor suggestions
- Structured output with summary, intent, important lines, risks, and next step
- React frontend with an Express API backend

## Tech stack

- React 19
- Vite
- Express
- Gemini API via `@google/genai`
- Tailwind CSS v4

## Project structure

```text
src/
  App.tsx        Frontend UI
  main.tsx       React entry point
  index.css      App styling
server.js        Express API server
vite.config.ts   Vite config and API proxy
```

## Requirements

- Node.js 20 or later
- A valid Gemini API key

## Installation

```bash
npm install
```

## Environment setup

Create a `.env.local` file in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash
API_PORT=3001
PORT=3001
```

### Environment variables

- `GEMINI_API_KEY`: Required. Used by the backend to call Gemini.
- `GEMINI_MODEL`: Optional. Defaults to `gemini-2.5-flash`.
- `API_PORT`: Optional. Port for the Express API.
- `PORT`: Optional fallback for the API port.

## Run locally

Start both the frontend and backend:

```bash
npm run dev
```

Services:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

The Vite app proxies `/api/*` requests to the backend automatically.

## Production

Build the frontend:

```bash
npm run build
```

Start the server:

```bash
npm start
```

When `dist/` exists, the Express server serves both the built frontend and the API.

## Available scripts

- `npm run dev` - run frontend and backend together
- `npm run dev:client` - run only the Vite frontend
- `npm run dev:server` - run only the Express backend
- `npm run build` - build the frontend
- `npm run preview` - preview the built frontend
- `npm run start` - start the backend server
- `npm run lint` - run TypeScript type checking

## API

### `GET /api/health`

Returns backend status and whether the Gemini API key is configured.

Example response:

```json
{
  "ok": true,
  "configured": true,
  "model": "gemini-2.5-flash"
}
```

### `POST /api/analyze`

Request body:

```json
{
  "mode": "explain",
  "question": "Explain the async flow clearly.",
  "code": "const value = await fetchData();"
}
```

Supported modes:

- `explain`
- `review`
- `improve`

The backend returns structured JSON for the UI to render.

## How to use

1. Start the app with `npm run dev`.
2. Open `http://localhost:3000`.
3. Choose `Explain`, `Review`, or `Improve`.
4. Paste your code.
5. Add an optional prompt for more specific analysis.
6. Run the analysis.

## Troubleshooting

### Analysis fails immediately

Check that `.env.local` exists and contains a valid `GEMINI_API_KEY`.

### Frontend loads but analysis does not work

Confirm the backend is running on port `3001` and that `/api/health` responds.

### Port conflict

Change `API_PORT` in `.env.local`, then update the proxy target in [vite.config.ts](/E:/FUN/jojocoding-/vite.config.ts) if needed.

## Notes

- The app is only as precise as the code snippet you provide. Incomplete snippets may produce lower-confidence results.
- The Gemini key is used only on the server side. It should not be exposed in frontend code.
