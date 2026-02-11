// Chế độ chơi
export type GameMode = 'local' | 'ai' | 'online';

// Màu quân cờ
export type PieceColor = 'red' | 'black';

// Loại quân cờ
export type PieceType = 'king' | 'advisor' | 'elephant' | 'horse' | 'rook' | 'cannon' | 'pawn';

// Quân cờ
export interface Piece {
  type: PieceType;
  color: PieceColor;
}

// Vị trí trên bàn cờ (col: 0-8, row: 0-9)
export interface Position {
  col: number;
  row: number;
}

// Một nước đi
export interface Move {
  from: Position;
  to: Position;
  captured?: Piece;
}

// Trạng thái game
export type GameStatus = 'playing' | 'red_wins' | 'black_wins' | 'draw';

// Bàn cờ: mảng 10 hàng x 9 cột
export type Board = (Piece | null)[][];

// Thông tin animation nước đi
export interface MoveAnimation {
  from: Position;
  to: Position;
  piece: Piece;
  captured?: Piece;
  startTime: number;
}

// State tổng thể
export interface GameState {
  board: Board;
  currentTurn: PieceColor;
  selectedPosition: Position | null;
  validMoves: Position[];
  moveHistory: Move[];
  status: GameStatus;
  historySnapshots: Board[];
  lastMove: Move | null;
  mode: GameMode;
  playerColor: PieceColor | null;
}

// Action cho reducer
export type GameAction =
  | { type: 'SELECT_PIECE'; position: Position }
  | { type: 'MOVE_PIECE'; from: Position; to: Position }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'NEW_GAME' }
  | { type: 'UNDO' }
  | { type: 'EXTERNAL_MOVE'; from: Position; to: Position }
  | { type: 'SET_STATE'; state: Partial<GameState> };
