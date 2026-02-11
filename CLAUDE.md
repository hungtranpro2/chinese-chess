# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Start dev server (Next.js with Turbopack)
- `npm run build` — Production build
- `npm run lint` — Run ESLint

## Architecture

Xiangqi (Chinese Chess) web app — 2-player offline on one machine. Next.js 16 + TypeScript + Tailwind CSS 4, App Router with `src/` directory. All UI text is in Vietnamese. Path alias `@/*` maps to `src/*`.

### Game Engine (`src/game/`)

Pure logic layer, no React dependencies. All functions are pure and stateless — designed to be reusable across client, Web Worker, and server contexts.

- **types.ts** — Core types: `Board` (10x9 grid of `Piece | null`), `GameState`, `GameAction` (reducer actions), `PieceColor` (`'red' | 'black'`), `PieceType` (7 types: king, advisor, elephant, horse, rook, cannon, pawn), `MoveAnimation` for piece animation data
- **constants.ts** — Board dimensions (`BOARD_COLS=9`, `BOARD_ROWS=10`), cell/canvas sizing (`CELL_SIZE=60`, `BOARD_PADDING=40`, `PIECE_RADIUS=24`), piece Chinese character names (`PIECE_NAMES`), palace/elephant territory bounds, `createInitialBoard()`
- **moves.ts** — Movement rules for all 7 piece types. `getRawMoves()` returns moves without check validation. `getValidMoves()` filters by simulating each move to reject self-check and flying generals (`kingsAreFacing()`). `isInCheck()` tests if a side is in check. Horse blocking (chặn chân mã) and cannon jumping (pháo nhảy) are implemented.
- **gameLogic.ts** — `isCheckmate()` (no valid moves = loss), `checkGameStatus()`, `applyMove()`, `cloneBoard()`, `getStatusText()` (Vietnamese status messages)
- **boardRenderer.ts** — Canvas 2D rendering: grid, river text (楚河/漢界), palace diagonals, pieces with Chinese characters, selection highlight (red circle), valid move dots (green), last move highlight (yellow/orange). `pixelToPosition()` converts click coordinates to board position. `posToPixel()` and `ANIMATION_DURATION` (200ms) exported for move animation.

### State Management (`src/hooks/useGameState.ts`)

Single `useReducer` managing all game state. Actions: `SELECT_PIECE`, `MOVE_PIECE`, `CLEAR_SELECTION`, `NEW_GAME`, `UNDO`. `SELECT_PIECE` handles both piece selection and move execution (if clicking a valid move target while a piece is selected). Maintains `historySnapshots` (array of board snapshots) for undo support. Red always moves first.

### UI (`src/components/`)

- **Board.tsx** — `'use client'` component wrapping `<canvas>`. Handles move animation with `requestAnimationFrame` and ease-out cubic easing. Scales click coordinates to canvas coordinates for responsive sizing. Blocks clicks during animation.
- **GameInfo.tsx** — Displays current turn with color-coded background, check warnings (pulsing red), game over state, move count
- **GameControls.tsx** — "Ván mới" (new game) and "Đi lại" (undo) buttons. Undo disabled when no moves or game over.

### Board Coordinate System

Row 0 = black side (top), Row 9 = red side (bottom). Red moves upward (row decreases), black moves downward (row increases). River between rows 4-5. Palace: cols 3-5, rows 0-2 (black) / rows 7-9 (red). Elephant territory: rows 0-4 (black) / rows 5-9 (red).

### Planned Expansion (see NEXT_PLAN.md)

Phase 0: Refactor (GameMode, board flip, routing) → Phase 1: AI (Minimax + Web Worker) → Phase 2: Online multiplayer (Express + Socket.IO) → Phase 3: Chat room. Game engine's pure function design enables direct reuse across all phases.
