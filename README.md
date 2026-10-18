# Minesweeper Web

**English** | [简体中文](./README.zh-CN.md)

A single-player minesweeper game built with Next.js App Router, React, TypeScript, and Hono.

## Getting started

Use Node.js 24 LTS and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The dev server listens on all network interfaces, so a phone on the same LAN can use the computer's IP and port.

## Features

- Default 12 × 12 board with 26 mines. Mines are placed on the first click, protecting that cell and its eight neighbors.
- Flood fill, number hints, flag / question-mark cycle, and double-click chord on numbers.
- Remaining mines, timer, status text, and restart.
- Five sound effects, lose shake and flash, exploded cell, wrong-flag hints, and a win celebration.
- Desktop and mobile layouts, keyboard controls, and reduced-motion support.

Left-click reveals a cell; right-click cycles marks. On touch, tap to reveal and long-press 450ms to mark, or use the mark-mode button. The double-click window is 250ms. When the flag count matches, neighboring cells open; a misplaced flag can hit a mine. If the flag count does not match, nothing happens.

Arrow keys move focus. Enter / Space reveals, F marks, C chords. You win by revealing every safe cell; you do not need to flag every mine. The first flag does not start the timer. Timing continues if you switch browser tabs. Refreshing the page starts a new game. There is no save or leaderboard.

## Architecture

- `src/app`: Next.js pages, global styles, and static config / status file export.
- `src/features/minesweeper/engine.ts`: Pure game engine, independent of React.
- `src/features/minesweeper/MinesweeperGame.tsx`: UI, gestures, timer, audio, and animation.
- `src/server/app.ts`: Hono API with `/api/health` and `/api/config`.
- `src/shared/game-config.ts`: Default settings and config validation.
- `public/audio`: The original five sound effects.
- `tests/engine.test.ts`: Core rules and API tests.

Board state lives in browser memory, and play does not require the network. Config is read from static JSON generated at build time. If that fails, built-in defaults are used. New config applies only after restart. To change default size, mine count, or question marks, edit the shared config file. Mine count must leave room for first-click 3×3 protection.

Fixes versus the old version: revealed cells cannot be flagged, numbers stay visible after a win, effects and timers are cleaned up together, and elapsed time uses real time deltas so background timing does not drift.

## Verify and production

```sh
npm test
npm run typecheck
npm run build
```

Build output is in `out/` and is served as static files. `next start` is no longer used. Local development still uses `npm run dev`. `/api/config.json` and `/api/health.json` are generated at build time; there is no long-running Hono process. The health file only indicates that the static output exists.

## GitHub Pages

- Source: https://github.com/lichanghui11/mine-sweeper
- Play online: https://lichanghui11.github.io/mine-sweeper/
- In the repo, set `Settings → Pages → Build and deployment → Source` to `GitHub Actions`.
- Pushing to `main` runs `.github/workflows/pages.yml`; you can also run it manually in Actions.
- The workflow uses Node.js 24, `npm ci`, and `package-lock.json`. It publishes `out/` after tests, typecheck, and build succeed.
- `NEXT_PUBLIC_BASE_PATH` comes from the Pages config so pages, config files, and audio work under the repo subpath. No personal token or repository secret is required.
- Local builds omit the subpath by default. To reproduce the Pages build in PowerShell, set `$env:NEXT_PUBLIC_BASE_PATH = '/mine-sweeper'`, run `npm run build`, then `Remove-Item Env:NEXT_PUBLIC_BASE_PATH`.
- After changing default game config, rebuild and redeploy. If you use a custom domain, rerun the workflow so path config matches.

## License

Follows the original project terms: learning and internal demos only. Ask the original author before public or commercial use.
