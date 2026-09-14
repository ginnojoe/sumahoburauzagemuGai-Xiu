# トリキ牌ゲーム

居酒屋メニューの牌を集めて、3・3・2の手札を目指すスマホ向けスコアアタックゲーム。

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/toriki-hai-game/src/game-data.ts` — title, menu tile definitions, categories, image filenames, and game constants
- `artifacts/toriki-hai-game/src/game-logic.ts` — shuffle, initial hand, draw, merge, cabbage strengthening, discard, and score calculation
- `artifacts/toriki-hai-game/src/App.tsx` — landing screen, game screen, help modal, tile interactions, and final score view
- `artifacts/toriki-hai-game/public/menu/` — individual menu image slots; add or replace files using the filenames in `game-data.ts`
- `artifacts/toriki-hai-game/src/index.css` — responsive mobile-first theme and motion

## Architecture decisions

- The first version is client-only; one game is kept in React state and does not require accounts or a database.
- The game rules are isolated from rendering so score rules and deck settings can be changed without rewriting the UI.
- Menu images are optional file slots with a visual fallback, so the game remains playable before individual assets are available.

## Product

- Starts a new 8-tile hand from a shuffled 68-tile set and plays through a configurable 24-tile mountain.
- Automatically merges duplicate menu tiles into Lv.1–Lv.4 tiles, shows their pool, handles cabbage strengthening, and lets the player discard from 9 tiles.
- Calculates a final score from level totals and closeness to the 3・3・2 category balance.

## User preferences

 - Prioritize smartphone portrait play and simple, understandable interactions.

## Gotchas

- Individual images are loaded from `public/menu/`; missing files intentionally fall back to colored placeholders.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
