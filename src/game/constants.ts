import { Board, Piece, PieceColor } from './types';

// Kích thước bàn cờ
export const BOARD_COLS = 9;
export const BOARD_ROWS = 10;

// Kích thước render
export const CELL_SIZE = 60;
export const BOARD_PADDING = 40;
export const CANVAS_WIDTH = BOARD_PADDING * 2 + (BOARD_COLS - 1) * CELL_SIZE;
export const CANVAS_HEIGHT = BOARD_PADDING * 2 + (BOARD_ROWS - 1) * CELL_SIZE;
export const PIECE_RADIUS = 24;

// Tên quân cờ tiếng Trung
export const PIECE_NAMES: Record<PieceColor, Record<string, string>> = {
  red: {
    king: '帥',
    advisor: '仕',
    elephant: '相',
    horse: '傌',
    rook: '俥',
    cannon: '炮',
    pawn: '兵',
  },
  black: {
    king: '將',
    advisor: '士',
    elephant: '象',
    horse: '馬',
    rook: '車',
    cannon: '砲',
    pawn: '卒',
  },
};

// Vị trí cung (palace) cho Tướng và Sĩ
export const PALACE = {
  red: { minCol: 3, maxCol: 5, minRow: 7, maxRow: 9 },
  black: { minCol: 3, maxCol: 5, minRow: 0, maxRow: 2 },
};

// Phần sân cho Tượng
export const ELEPHANT_TERRITORY = {
  red: { minRow: 5, maxRow: 9 },
  black: { minRow: 0, maxRow: 4 },
};

// Tạo quân cờ
function p(type: string, color: PieceColor): Piece {
  return { type: type as Piece['type'], color };
}

// Bàn cờ ban đầu (row 0 = đen trên cùng, row 9 = đỏ dưới cùng)
export function createInitialBoard(): Board {
  const board: Board = Array.from({ length: BOARD_ROWS }, () =>
    Array(BOARD_COLS).fill(null)
  );

  // Quân đen (hàng 0-4)
  board[0][0] = p('rook', 'black');
  board[0][1] = p('horse', 'black');
  board[0][2] = p('elephant', 'black');
  board[0][3] = p('advisor', 'black');
  board[0][4] = p('king', 'black');
  board[0][5] = p('advisor', 'black');
  board[0][6] = p('elephant', 'black');
  board[0][7] = p('horse', 'black');
  board[0][8] = p('rook', 'black');
  board[2][1] = p('cannon', 'black');
  board[2][7] = p('cannon', 'black');
  board[3][0] = p('pawn', 'black');
  board[3][2] = p('pawn', 'black');
  board[3][4] = p('pawn', 'black');
  board[3][6] = p('pawn', 'black');
  board[3][8] = p('pawn', 'black');

  // Quân đỏ (hàng 5-9)
  board[9][0] = p('rook', 'red');
  board[9][1] = p('horse', 'red');
  board[9][2] = p('elephant', 'red');
  board[9][3] = p('advisor', 'red');
  board[9][4] = p('king', 'red');
  board[9][5] = p('advisor', 'red');
  board[9][6] = p('elephant', 'red');
  board[9][7] = p('horse', 'red');
  board[9][8] = p('rook', 'red');
  board[7][1] = p('cannon', 'red');
  board[7][7] = p('cannon', 'red');
  board[6][0] = p('pawn', 'red');
  board[6][2] = p('pawn', 'red');
  board[6][4] = p('pawn', 'red');
  board[6][6] = p('pawn', 'red');
  board[6][8] = p('pawn', 'red');

  return board;
}
