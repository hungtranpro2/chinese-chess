import { Board, PieceColor, Position } from '../game/types';
import { BOARD_ROWS, BOARD_COLS } from '../game/constants';
import { getValidMoves } from '../game/moves';
import { applyMove, isCheckmate } from '../game/gameLogic';
import { evaluateBoard } from './evaluate';

interface Move {
  from: Position;
  to: Position;
}

// Lấy tất cả nước đi hợp lệ của một bên
function getAllMoves(board: Board, color: PieceColor): Move[] {
  const moves: Move[] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        const validMoves = getValidMoves(board, r, c);
        for (const to of validMoves) {
          moves.push({ from: { row: r, col: c }, to });
        }
      }
    }
  }
  return moves;
}

// Sắp xếp nước đi: ưu tiên ăn quân (MVV-LVA) để cải thiện pruning
const PIECE_ORDER: Record<string, number> = {
  king: 6, rook: 5, cannon: 4, horse: 3, elephant: 2, advisor: 1, pawn: 0,
};

function orderMoves(board: Board, moves: Move[]): Move[] {
  return moves.sort((a, b) => {
    const capturedA = board[a.to.row][a.to.col];
    const capturedB = board[b.to.row][b.to.col];
    const scoreA = capturedA ? PIECE_ORDER[capturedA.type] ?? 0 : -1;
    const scoreB = capturedB ? PIECE_ORDER[capturedB.type] ?? 0 : -1;
    return scoreB - scoreA;
  });
}

// Minimax với alpha-beta pruning
function minimax(
  board: Board,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  maximizingColor: PieceColor,
  currentColor: PieceColor,
): number {
  const opponent: PieceColor = currentColor === 'red' ? 'black' : 'red';

  // Kiểm tra chiếu bí — ưu tiên chiếu bí sớm hơn (depth lớn hơn = sớm hơn)
  if (isCheckmate(board, currentColor)) {
    return isMaximizing ? -99999 - depth : 99999 + depth;
  }

  if (depth === 0) {
    return evaluateBoard(board, maximizingColor);
  }

  const moves = orderMoves(board, getAllMoves(board, currentColor));

  if (moves.length === 0) {
    return evaluateBoard(board, maximizingColor);
  }

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move.from, move.to);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, false, maximizingColor, opponent);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const newBoard = applyMove(board, move.from, move.to);
      const evalScore = minimax(newBoard, depth - 1, alpha, beta, true, maximizingColor, opponent);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

// Tìm nước đi tốt nhất
export function findBestMove(board: Board, color: PieceColor, depth: number = 3): Move | null {
  const moves = orderMoves(board, getAllMoves(board, color));
  if (moves.length === 0) return null;

  const opponent: PieceColor = color === 'red' ? 'black' : 'red';
  let bestMove: Move | null = null;
  let bestScore = -Infinity;

  for (const move of moves) {
    const newBoard = applyMove(board, move.from, move.to);
    const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false, color, opponent);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
