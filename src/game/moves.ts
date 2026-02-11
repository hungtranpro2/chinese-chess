import { Board, Piece, PieceColor, Position } from './types';
import { BOARD_COLS, BOARD_ROWS, PALACE, ELEPHANT_TERRITORY } from './constants';

// Kiểm tra vị trí có nằm trong bàn cờ không
function inBounds(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_ROWS && col >= 0 && col < BOARD_COLS;
}

// Lấy quân cờ tại vị trí
function getPiece(board: Board, row: number, col: number): Piece | null {
  if (!inBounds(row, col)) return null;
  return board[row][col];
}

// Kiểm tra ô trống
function isEmpty(board: Board, row: number, col: number): boolean {
  return inBounds(row, col) && board[row][col] === null;
}

// Kiểm tra có thể đi đến ô (trống hoặc có quân đối phương)
function canMoveTo(board: Board, row: number, col: number, color: PieceColor): boolean {
  if (!inBounds(row, col)) return false;
  const piece = board[row][col];
  return piece === null || piece.color !== color;
}

// Nước đi của Tướng (King)
function getKingMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const palace = PALACE[color];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= palace.minRow && nr <= palace.maxRow &&
        nc >= palace.minCol && nc <= palace.maxCol &&
        canMoveTo(board, nr, nc, color)) {
      moves.push({ row: nr, col: nc });
    }
  }

  return moves;
}

// Nước đi của Sĩ (Advisor)
function getAdvisorMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const palace = PALACE[color];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (const [dr, dc] of directions) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= palace.minRow && nr <= palace.maxRow &&
        nc >= palace.minCol && nc <= palace.maxCol &&
        canMoveTo(board, nr, nc, color)) {
      moves.push({ row: nr, col: nc });
    }
  }

  return moves;
}

// Nước đi của Tượng (Elephant)
function getElephantMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const territory = ELEPHANT_TERRITORY[color];
  const steps = [[-2, -2], [-2, 2], [2, -2], [2, 2]];
  const blocks = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

  for (let i = 0; i < steps.length; i++) {
    const [dr, dc] = steps[i];
    const [br, bc] = blocks[i];
    const nr = row + dr;
    const nc = col + dc;
    const blockRow = row + br;
    const blockCol = col + bc;

    if (nr >= territory.minRow && nr <= territory.maxRow &&
        inBounds(nr, nc) &&
        isEmpty(board, blockRow, blockCol) &&
        canMoveTo(board, nr, nc, color)) {
      moves.push({ row: nr, col: nc });
    }
  }

  return moves;
}

// Nước đi của Mã (Horse)
function getHorseMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];
  // [bước chân, bước chéo1, bước chéo2]
  const movePatterns: [number, number, number, number, number, number][] = [
    [-1, 0, -2, -1, -2, 1],  // lên 1, rồi lên-trái hoặc lên-phải
    [1, 0, 2, -1, 2, 1],     // xuống 1, rồi xuống-trái hoặc xuống-phải
    [0, -1, -1, -2, 1, -2],  // trái 1, rồi trên-trái hoặc dưới-trái
    [0, 1, -1, 2, 1, 2],     // phải 1, rồi trên-phải hoặc dưới-phải
  ];

  for (const [br, bc, r1, c1, r2, c2] of movePatterns) {
    // Kiểm tra chân ngựa có bị chặn không
    if (!isEmpty(board, row + br, col + bc)) continue;

    // Hai nước đi có thể từ hướng này
    for (const [nr, nc] of [[row + r1, col + c1], [row + r2, col + c2]]) {
      if (canMoveTo(board, nr, nc, color)) {
        moves.push({ row: nr, col: nc });
      }
    }
  }

  return moves;
}

// Nước đi của Xe (Rook)
function getRookMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    let nr = row + dr;
    let nc = col + dc;
    while (inBounds(nr, nc)) {
      const piece = board[nr][nc];
      if (piece === null) {
        moves.push({ row: nr, col: nc });
      } else {
        if (piece.color !== color) {
          moves.push({ row: nr, col: nc });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return moves;
}

// Nước đi của Pháo (Cannon)
function getCannonMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

  for (const [dr, dc] of directions) {
    let nr = row + dr;
    let nc = col + dc;
    let jumped = false;

    while (inBounds(nr, nc)) {
      const piece = board[nr][nc];
      if (!jumped) {
        if (piece === null) {
          moves.push({ row: nr, col: nc });
        } else {
          jumped = true; // gặp "ngòi" để nhảy qua
        }
      } else {
        if (piece !== null) {
          if (piece.color !== color) {
            moves.push({ row: nr, col: nc });
          }
          break;
        }
      }
      nr += dr;
      nc += dc;
    }
  }

  return moves;
}

// Nước đi của Tốt (Pawn)
function getPawnMoves(board: Board, row: number, col: number, color: PieceColor): Position[] {
  const moves: Position[] = [];

  if (color === 'red') {
    // Đỏ đi lên (row giảm)
    if (canMoveTo(board, row - 1, col, color)) {
      moves.push({ row: row - 1, col });
    }
    // Qua sông (row <= 4) được đi ngang
    if (row <= 4) {
      if (canMoveTo(board, row, col - 1, color)) {
        moves.push({ row, col: col - 1 });
      }
      if (canMoveTo(board, row, col + 1, color)) {
        moves.push({ row, col: col + 1 });
      }
    }
  } else {
    // Đen đi xuống (row tăng)
    if (canMoveTo(board, row + 1, col, color)) {
      moves.push({ row: row + 1, col });
    }
    // Qua sông (row >= 5) được đi ngang
    if (row >= 5) {
      if (canMoveTo(board, row, col - 1, color)) {
        moves.push({ row, col: col - 1 });
      }
      if (canMoveTo(board, row, col + 1, color)) {
        moves.push({ row, col: col + 1 });
      }
    }
  }

  return moves;
}

// Lấy tất cả nước đi hợp lệ (chưa kiểm tra chiếu)
export function getRawMoves(board: Board, row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];

  switch (piece.type) {
    case 'king': return getKingMoves(board, row, col, piece.color);
    case 'advisor': return getAdvisorMoves(board, row, col, piece.color);
    case 'elephant': return getElephantMoves(board, row, col, piece.color);
    case 'horse': return getHorseMoves(board, row, col, piece.color);
    case 'rook': return getRookMoves(board, row, col, piece.color);
    case 'cannon': return getCannonMoves(board, row, col, piece.color);
    case 'pawn': return getPawnMoves(board, row, col, piece.color);
    default: return [];
  }
}

// Kiểm tra 2 tướng có đối mặt nhau không (cùng cột, không có quân nào giữa)
export function kingsAreFacing(board: Board): boolean {
  let redKing: Position | null = null;
  let blackKing: Position | null = null;

  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece?.type === 'king') {
        if (piece.color === 'red') redKing = { row: r, col: c };
        else blackKing = { row: r, col: c };
      }
    }
  }

  if (!redKing || !blackKing) return false;
  if (redKing.col !== blackKing.col) return false;

  // Kiểm tra có quân nào giữa 2 tướng không
  const minRow = Math.min(redKing.row, blackKing.row);
  const maxRow = Math.max(redKing.row, blackKing.row);
  for (let r = minRow + 1; r < maxRow; r++) {
    if (board[r][redKing.col] !== null) return false;
  }

  return true;
}

// Lấy nước đi hợp lệ (đã kiểm tra chiếu và tướng đối mặt)
export function getValidMoves(board: Board, row: number, col: number): Position[] {
  const piece = board[row][col];
  if (!piece) return [];

  const rawMoves = getRawMoves(board, row, col);

  return rawMoves.filter(move => {
    // Thử nước đi
    const newBoard = board.map(r => [...r]);
    newBoard[move.row][move.col] = newBoard[row][col];
    newBoard[row][col] = null;

    // Kiểm tra tướng đối mặt
    if (kingsAreFacing(newBoard)) return false;

    // Kiểm tra có bị chiếu sau nước đi không
    return !isInCheck(newBoard, piece.color);
  });
}

// Kiểm tra một bên có bị chiếu không
export function isInCheck(board: Board, color: PieceColor): boolean {
  // Tìm vị trí tướng
  let kingPos: Position | null = null;
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece?.type === 'king' && piece.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return true; // Tướng bị mất = bị chiếu

  // Kiểm tra tất cả quân đối phương có thể ăn tướng không
  const opponent: PieceColor = color === 'red' ? 'black' : 'red';
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (piece && piece.color === opponent) {
        const moves = getRawMoves(board, r, c);
        if (moves.some(m => m.row === kingPos!.row && m.col === kingPos!.col)) {
          return true;
        }
      }
    }
  }

  return false;
}
