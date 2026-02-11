import { Board, PieceColor, PieceType } from '../game/types';
import { BOARD_ROWS, BOARD_COLS } from '../game/constants';
import { isInCheck } from '../game/moves';

// Giá trị quân cờ
const PIECE_VALUES: Record<PieceType, number> = {
  king: 10000,
  rook: 600,
  cannon: 285,
  horse: 270,
  elephant: 120,
  advisor: 120,
  pawn: 30,
};

// Bảng vị trí cho Tốt (đỏ nhìn từ dưới lên)
const PAWN_POSITION_RED: number[][] = [
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [0,  0,  0,  0,  0,  0,  0,  0,  0],
  [40, 0, 40,  0, 50,  0, 40,  0, 40],
  [50,10, 50, 20, 60, 20, 50, 10, 50],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [10, 0, 10,  0, 15,  0, 10,  0, 10],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
];

// Bảng vị trí cho Mã
const HORSE_POSITION_RED: number[][] = [
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0, 10, 20, 10, 20, 10,  0,  0],
  [ 0,  0, 20, 30, 30, 30, 20,  0,  0],
  [ 0,  0, 20, 30, 30, 30, 20,  0,  0],
  [ 0,  0, 10, 20, 10, 20, 10,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
];

// Bảng vị trí cho Xe
const ROOK_POSITION_RED: number[][] = [
  [10, 10, 10, 20, 20, 20, 10, 10, 10],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [10, 20, 20, 30, 30, 30, 20, 20, 10],
  [10, 20, 20, 30, 30, 30, 20, 20, 10],
  [ 0, 10, 10, 20, 20, 20, 10, 10,  0],
  [ 0, 10, 10, 20, 20, 20, 10, 10,  0],
  [10, 20, 20, 30, 30, 30, 20, 20, 10],
  [10, 20, 20, 30, 30, 30, 20, 20, 10],
  [20, 30, 30, 40, 40, 40, 30, 30, 20],
  [10, 10, 10, 20, 20, 20, 10, 10, 10],
];

// Bảng vị trí cho Pháo
const CANNON_POSITION_RED: number[][] = [
  [ 0,  0, 10,  0,  0,  0, 10,  0,  0],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [10, 10, 20, 20, 20, 20, 20, 10, 10],
  [10, 20, 30, 30, 30, 30, 30, 20, 10],
  [10, 20, 30, 30, 40, 30, 30, 20, 10],
  [10, 20, 30, 30, 40, 30, 30, 20, 10],
  [10, 20, 30, 30, 30, 30, 30, 20, 10],
  [10, 10, 20, 20, 20, 20, 20, 10, 10],
  [ 0,  0,  0,  0,  0,  0,  0,  0,  0],
  [ 0,  0, 10,  0,  0,  0, 10,  0,  0],
];

// Lấy bonus vị trí cho một quân
function getPositionBonus(type: PieceType, row: number, col: number, color: PieceColor): number {
  // Đối với quân đen, lật bảng vị trí
  const r = color === 'red' ? row : 9 - row;
  const c = color === 'red' ? col : 8 - col;

  switch (type) {
    case 'pawn': return PAWN_POSITION_RED[r]?.[c] ?? 0;
    case 'horse': return HORSE_POSITION_RED[r]?.[c] ?? 0;
    case 'rook': return ROOK_POSITION_RED[r]?.[c] ?? 0;
    case 'cannon': return CANNON_POSITION_RED[r]?.[c] ?? 0;
    default: return 0;
  }
}

// Đánh giá bàn cờ: dương = có lợi cho color
export function evaluateBoard(board: Board, color: PieceColor): number {
  let score = 0;
  const opponent: PieceColor = color === 'red' ? 'black' : 'red';

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const value = PIECE_VALUES[piece.type] + getPositionBonus(piece.type, r, c, piece.color);

      if (piece.color === color) {
        score += value;
      } else {
        score -= value;
      }
    }
  }

  // Bonus/penalty cho chiếu
  if (isInCheck(board, opponent)) score += 50;
  if (isInCheck(board, color)) score -= 50;

  return score;
}
