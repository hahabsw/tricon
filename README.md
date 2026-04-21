# Tricon

Tricon is a turn-based multiplayer strategy game where players connect stars (nodes) to claim **triangle territories** and compete by total area.  
This repo contains both the web client (Next.js) and the realtime game server (Colyseus).

- **Live demo**: `https://tricon.baesw.com`

## Features

- **Multiplayer rooms**: create/join rooms via room code
- **Authoritative server**: Colyseus Room-based state sync
- **Server-side validation**: no-intersection, no-duplicate edges, distance/connection limits
- **Scoring & results**: triangle-area scoring and final rankings

## Tech stack

- **Web**: Next.js (App Router), React, Tailwind CSS
- **Realtime**: Colyseus
- **Language/build**: TypeScript, `tsx` (server dev), `tsup` (server bundling)

## Getting started (local)

### Install

```bash
npm install
```

### Run dev (web + game server)

```bash
npm run dev
```

- **Web**: `http://localhost:3000`
- **Game server (Colyseus)**: check the console output for the port

### Run separately

```bash
# Web only
npm run dev:next

# Game server only
npm run dev:server
```

## Project structure (high-level)

- `app/`: Next.js UI (routes/pages)
- `src/client/`: Colyseus client + frontend logic
- `src/game/`: shared game types/rules/geometry (client + server)
- `src/server/`: Colyseus server (rooms, state, matchmaking logic)

## Deployment

- `npm run build`: build Next.js
- `npm run build:colyseus`: bundle the Colyseus server
- `docker/`, `infra/`, `scripts/`: container/infra/staging deployment assets

## License

MIT. See `LICENSE`.
