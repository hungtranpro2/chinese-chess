# Kế hoạch mở rộng Game Cờ Tướng: AI + Multiplayer Online + Chat

## Context
Game cờ tướng hiện tại chỉ hỗ trợ chế độ offline (2 người 1 máy). Cần mở rộng thêm 3 tính năng: chơi với AI, đánh cờ online với người chơi khác máy, và chat room trong phòng game. Game engine hiện tại (`src/game/`) đã là pure functions — có thể tái sử dụng trực tiếp trên cả client, Web Worker, và server mà không cần sửa đổi.

## Công nghệ chọn

| Thành phần | Công nghệ | Lý do |
|------------|-----------|-------|
| AI | Minimax + Alpha-Beta Pruning chạy trong Web Worker | Không block UI, không cần server, dùng lại game engine có sẵn |
| Real-time | **Socket.IO** (server + client) | Room management có sẵn, auto reconnect, event-based API |
| Backend | **Node.js + Express + Socket.IO** — server riêng trong cùng monorepo | Next.js trên Vercel không hỗ trợ WebSocket; server riêng dễ deploy và scale |
| Database | **In-memory** (Map) giai đoạn đầu | Game state là ephemeral; thêm DB sau nếu cần leaderboard/history |

## Kiến trúc tổng thể

```
MONOREPO
├── src/game/          ← SHARED (client + server + worker đều import)
│   types.ts, moves.ts, gameLogic.ts, constants.ts, boardRenderer.ts
│
├── src/ (Frontend - Next.js)
│   ├── ai/            ← AI engine + Web Worker (Phase 1)
│   ├── hooks/         ← useGameState, useAI, useSocket, useOnlineGame, useChat
│   ├── components/    ← Board, GameInfo, GameControls, ModeSelector, RoomLobby, ChatPanel
│   └── app/           ← page.tsx (home), play/page.tsx (game), online/page.tsx (lobby+game)
│
└── server/            ← Backend - Express + Socket.IO (Phase 2)
    index.ts, gameRoom.ts, validation.ts, chatHandler.ts, types.ts
```

---

## Phase 0: Refactor cơ sở

**Mục đích:** Chuẩn bị codebase cho 3 tính năng mới mà không phá vỡ chức năng hiện tại.

### Thay đổi:

1. **`src/game/types.ts`** — Thêm `GameMode = 'local' | 'ai' | 'online'`, thêm `mode` và `playerColor` vào `GameState`, thêm actions `EXTERNAL_MOVE` và `SET_STATE`
2. **`src/hooks/useGameState.ts`** — Thêm guard clause: khi mode !== 'local', chỉ cho click quân của `playerColor`. Xử lý `EXTERNAL_MOVE` action (cho AI/server push nước đi)
3. **`src/game/boardRenderer.ts`** — Thêm tham số `flipped: boolean` vào `renderBoard()` và `pixelToPosition()`. Khi flipped: `row → 9-row`, `col → 8-col`
4. **`src/components/Board.tsx`** — Thêm prop `flipped`, `disabled`
5. **`src/app/page.tsx`** — Chuyển thành trang home với `ModeSelector` (3 nút: Chơi 2 người / Chơi với Máy / Chơi Online). Di chuyển game hiện tại sang `src/app/play/page.tsx`

**Dependencies mới:** Không

---

## Phase 1: AI (chơi với máy)

### File mới:

1. **`src/ai/evaluate.ts`** — Hàm đánh giá thế cờ
   - Bảng giá trị quân: Xe=900, Pháo=450, Mã=400, Tượng/Sĩ=200, Tốt=100
   - Position tables 10×9 cho từng loại quân (Tốt qua sông giá trị cao hơn, Mã ở trung tâm mạnh hơn)
   - `evaluateBoard(board): number` — dương = đen có lợi, âm = đỏ có lợi

2. **`src/ai/minimax.ts`** — Thuật toán Minimax + Alpha-Beta Pruning
   - `findBestMove(board, depth): Move` — depth mặc định 3
   - Move ordering: ưu tiên captures, checks trước để cắt tỉa nhanh hơn

3. **`src/ai/worker.ts`** — Web Worker entry point
   - Nhận `{ board, depth }`, import `src/game/*` + `src/ai/*`, trả về `{ move }`
   - Dùng `new Worker(new URL('./worker.ts', import.meta.url))`

4. **`src/hooks/useAI.ts`** — Hook quản lý Web Worker
   - Watch `currentTurn === 'black'` && `mode === 'ai'` → gửi board cho worker
   - Nhận kết quả → dispatch `EXTERNAL_MOVE`
   - Expose `isThinking: boolean` cho UI hiển thị "AI đang suy nghĩ..."

5. **`src/components/ModeSelector.tsx`** — Component chọn chế độ chơi

6. **`src/app/play/page.tsx`** — Trang game hỗ trợ cả mode local và AI

**Dependencies mới:** Không. Toàn bộ TypeScript thuần.

---

## Phase 2: Multiplayer Online

### Backend (`server/`):

1. **`server/index.ts`** — Express + Socket.IO, listen port 3001, CORS cho localhost:3000
2. **`server/types.ts`** — `Player { id, name, color }`, `Room { id, players, board, currentTurn, moveHistory, status }`
3. **`server/gameRoom.ts`** — Room management in-memory (`Map<string, Room>`)
   - `createRoom(playerName)` → room ID 6 ký tự, player 1 là đỏ
   - `joinRoom(roomId, playerName)` → player 2 là đen, game bắt đầu
   - Tự động xóa room sau 30 phút không hoạt động
4. **`server/validation.ts`** — Server-side move validation, import trực tiếp `getValidMoves`, `applyMove`, `checkGameStatus` từ `src/game/`
5. **`server/chatHandler.ts`** → xem Phase 3

### Socket.IO Protocol:
```
CLIENT → SERVER:  room:create, room:join, game:move, game:resign, chat:message
SERVER → CLIENT:  room:joined, game:moved, game:over, chat:message, opponent:disconnected, error
```

### Frontend:

6. **`src/hooks/useSocket.ts`** — Socket.IO client connection management
7. **`src/hooks/useOnlineGame.ts`** — State machine: idle → creating/joining → waiting → playing → finished
8. **`src/components/RoomLobby.tsx`** — Nhập tên → Tạo phòng / Nhập mã phòng → Đợi đối thủ
9. **`src/app/online/page.tsx`** — Lobby + Game page, Board với `flipped={playerColor === 'black'}`

### Thay đổi file hiện tại:
- `GameControls.tsx` — Ẩn Undo khi online, thêm nút "Đầu hàng"
- `GameInfo.tsx` — Hiển thị tên người chơi

**Dependencies mới:** `socket.io`, `socket.io-client`, `express`, `cors`, `tsx`, `concurrently`

**Scripts mới trong package.json:**
```json
"server": "tsx watch server/index.ts",
"dev:all": "concurrently \"npm run dev\" \"npm run server\""
```

---

## Phase 3: Chat Room

1. **`server/chatHandler.ts`** — Validate sender thuộc room, sanitize text (max 200 chars), broadcast
2. **`src/hooks/useChat.ts`** — Quản lý messages array, sendMessage function
3. **`src/components/ChatPanel.tsx`** — Panel bên phải bàn cờ (desktop) / dưới bàn cờ (mobile), scrollable, auto-scroll, hiển thị tên với màu đỏ/đen

**Dependencies mới:** Không (dùng Socket.IO có sẵn từ Phase 2)

---

## Tóm tắt timeline

| Phase | Nội dung | Dependencies mới | Độ khó |
|-------|----------|-------------------|--------|
| 0 | Refactor cơ sở (GameMode, flipped, routing) | Không | Thấp |
| 1 | AI (Minimax + Web Worker) | Không | Trung bình |
| 2 | Multiplayer Online (Socket.IO + Express server) | socket.io, express, tsx, concurrently | Cao |
| 3 | Chat Room | Không | Thấp |

**Thứ tự bắt buộc:** Phase 0 → 1 → 2 → 3 (Phase 3 phụ thuộc WebSocket từ Phase 2)

## Verification

- **Phase 0:** `npm run build` thành công, game offline vẫn hoạt động, routing `/play` hoạt động
- **Phase 1:** Chọn "Chơi với Máy", đỏ đi → AI tự đi đen trong ~1-2 giây, chiếu/chiếu bí hoạt động
- **Phase 2:** `npm run dev:all`, mở 2 tab → tạo phòng tab 1, join mã phòng tab 2 → đánh cờ qua lại, board flip đúng cho đen
- **Phase 3:** Gửi tin nhắn từ tab 1, tab 2 nhận được real-time
