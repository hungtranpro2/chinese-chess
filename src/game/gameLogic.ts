import { Board, GameMode, GameState, GameStatus, PieceColor, Position } from './types';
import { createInitialBoard } from './constants';
import { getValidMoves, isInCheck } from './moves';
import { BOARD_ROWS, BOARD_COLS } from './constants';

// Tạo state ban đầu
export function createInitialState(mode: GameMode = 'local', playerColor: PieceColor | null = null): GameState {
  return {
    board: createInitialBoard(),
    currentTurn: 'red',
    selectedPosition: null,
    validMoves: [],
    moveHistory: [],
    status: 'playing',
    historySnapshots: [createInitialBoard()],
    lastMove: null,
    mode,
    playerColor,
  };
}

// Deep clone board
export function cloneBoard(board: Board): Board {
  return board.map(row => row.map(cell => (cell ? { ...cell } : null)));
}

// Thực hiện nước đi trên board
export function applyMove(board: Board, from: Position, to: Position): Board {
  const newBoard = cloneBoard(board);
  newBoard[to.row][to.col] = newBoard[from.row][from.col];
  newBoard[from.row][from.col] = null;
  return newBoard;
}

// Kiểm tra một bên có bị chiếu bí không (không còn nước đi hợp lệ)
export function isCheckmate(board: Board, color: PieceColor): boolean {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const moves = getValidMoves(board, r, c);
        if (moves.length > 0) return false;
      }
    }
  }
  return true;
}

// Kiểm tra trạng thái game sau nước đi
export function checkGameStatus(board: Board, nextTurn: PieceColor): GameStatus {
  if (isCheckmate(board, nextTurn)) {
    return nextTurn === 'red' ? 'black_wins' : 'red_wins';
  }
  return 'playing';
}

// Lấy text trạng thái
export function getStatusText(state: GameState): string {
  switch (state.status) {
    case 'red_wins': return 'Đỏ thắng!';
    case 'black_wins': return 'Đen thắng!';
    case 'draw': return 'Hòa cờ!';
    case 'playing': {
      const turnText = state.currentTurn === 'red' ? 'Đỏ' : 'Đen';
      const checkText = isInCheck(state.board, state.currentTurn) ? ' - CHIẾU!' : '';
      return `Lượt ${turnText}${checkText}`;
    }
  }
}
