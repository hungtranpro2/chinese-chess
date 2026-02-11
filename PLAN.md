# Kế hoạch xây dựng Website Cờ Tướng

## Context
Xây dựng website chơi cờ tướng (Xiangqi) từ đầu. Dùng Next.js + TypeScript + Tailwind CSS. Chế độ 2 người chơi offline trên 1 máy. Canvas 2D để render bàn cờ.

## Thứ tự triển khai

1. **Khởi tạo Next.js project** — `npx create-next-app@latest . --typescript --tailwind --app --eslint` ✅
2. **Types & Constants** — `src/game/types.ts`, `src/game/constants.ts` ✅
3. **Move logic** — `src/game/moves.ts` (7 loại quân + luật đặc biệt) ✅
4. **Game logic** — `src/game/gameLogic.ts` (chiếu, chiếu bí, tướng đối mặt) ✅
5. **Board renderer** — `src/game/boardRenderer.ts` (Canvas vẽ bàn cờ + quân cờ) ✅
6. **useGameState hook** — `src/hooks/useGameState.ts` (useReducer + history) ✅
7. **React components** — `Board.tsx`, `GameInfo.tsx`, `GameControls.tsx` ✅
8. **Tích hợp** — `page.tsx`, `layout.tsx`, `globals.css` ✅

## Cấu trúc file

```
src/
├── app/
│   ├── globals.css          # Tailwind + theme colors
│   ├── layout.tsx           # Root layout (lang="vi")
│   └── page.tsx             # Trang chính, tích hợp tất cả components
├── components/
│   ├── Board.tsx            # Canvas component, xử lý click
│   ├── GameControls.tsx     # Nút "Ván mới" & "Đi lại"
│   └── GameInfo.tsx         # Hiển thị lượt chơi, trạng thái chiếu/thắng
├── game/
│   ├── types.ts             # PieceColor, PieceType, Board, GameState, GameAction
│   ├── constants.ts         # Kích thước bàn cờ, tên quân, vị trí ban đầu
│   ├── moves.ts             # Luật di chuyển 7 loại quân, kiểm tra chiếu
│   ├── gameLogic.ts         # Chiếu bí, trạng thái game, clone board
│   └── boardRenderer.ts    # Canvas 2D: vẽ lưới, quân cờ, highlight
└── hooks/
    └── useGameState.ts      # useReducer quản lý state + undo
```

## Verification
- `npm run build` → Build thành công ✅
- `npm run dev` → Kiểm tra bàn cờ, click, lượt chơi, luật quân, chiếu/chiếu bí, ván mới, đi lại
