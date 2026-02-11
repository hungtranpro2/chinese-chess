import { Board, Move, Piece, Position } from './types';
import {
  CELL_SIZE, BOARD_PADDING, CANVAS_WIDTH, CANVAS_HEIGHT,
  PIECE_RADIUS, BOARD_COLS, BOARD_ROWS, PIECE_NAMES
} from './constants';

// Transform tọa độ khi bàn cờ bị lật
function transformCoords(col: number, row: number, flipped: boolean): [number, number] {
  if (flipped) return [8 - col, 9 - row];
  return [col, row];
}

// Chuyển vị trí bàn cờ sang pixel (có hỗ trợ flipped)
function toPixel(col: number, row: number, flipped: boolean = false): [number, number] {
  const [tc, tr] = transformCoords(col, row, flipped);
  return [
    BOARD_PADDING + tc * CELL_SIZE,
    BOARD_PADDING + tr * CELL_SIZE,
  ];
}

// Chuyển pixel sang vị trí bàn cờ
export function pixelToPosition(x: number, y: number, flipped: boolean = false): Position | null {
  const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
  const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);

  if (col < 0 || col >= BOARD_COLS || row < 0 || row >= BOARD_ROWS) return null;

  const [px, py] = toPixel(flipped ? 8 - col : col, flipped ? 9 - row : row, flipped);
  const dist = Math.sqrt((x - px) ** 2 + (y - py) ** 2);
  if (dist > PIECE_RADIUS + 5) return null;

  // Reverse transform: pixel coords → logical coords
  if (flipped) {
    return { col: 8 - col, row: 9 - row };
  }
  return { col, row };
}

// Thời gian animation (ms)
const ANIMATION_DURATION = 200;

// Chuyển vị trí bàn cờ sang pixel (export cho animation)
export function posToPixel(col: number, row: number, flipped: boolean = false): [number, number] {
  return toPixel(col, row, flipped);
}

// Vẽ toàn bộ bàn cờ
export function renderBoard(
  ctx: CanvasRenderingContext2D,
  board: Board,
  selectedPosition: Position | null,
  validMoves: Position[],
  lastMove: Move | null,
  animatingPiecePos?: { x: number; y: number; piece: Piece } | null,
  flipped: boolean = false,
) {
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawBoardBackground(ctx);
  drawGrid(ctx, flipped);
  drawRiverText(ctx, flipped);
  drawPalaceDiagonals(ctx, flipped);
  drawLastMoveHighlight(ctx, lastMove, !!animatingPiecePos, flipped);
  drawPieces(ctx, board, animatingPiecePos ? lastMove?.to ?? null : null, flipped);
  drawSelection(ctx, selectedPosition, flipped);
  drawValidMoves(ctx, validMoves, flipped);

  // Vẽ quân đang animation ở vị trí nội suy
  if (animatingPiecePos) {
    drawSinglePiece(ctx, animatingPiecePos.x, animatingPiecePos.y, animatingPiecePos.piece);
  }
}

export { ANIMATION_DURATION };

// Nền bàn cờ
function drawBoardBackground(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#f0d9a0';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Viền ngoài
  ctx.strokeStyle = '#8b4513';
  ctx.lineWidth = 3;
  ctx.strokeRect(
    BOARD_PADDING - 5,
    BOARD_PADDING - 5,
    (BOARD_COLS - 1) * CELL_SIZE + 10,
    (BOARD_ROWS - 1) * CELL_SIZE + 10,
  );
}

// Vẽ lưới
function drawGrid(ctx: CanvasRenderingContext2D, flipped: boolean) {
  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = 1;

  // Vẽ các đường dọc
  for (let c = 0; c < BOARD_COLS; c++) {
    const [x1, y1] = toPixel(c, 0, flipped);
    const [, y2] = toPixel(c, 4, flipped);
    ctx.beginPath();
    ctx.moveTo(x1, Math.min(y1, y2));
    ctx.lineTo(x1, Math.max(y1, y2));
    ctx.stroke();

    const [x3, y3] = toPixel(c, 5, flipped);
    const [, y4] = toPixel(c, 9, flipped);
    ctx.beginPath();
    ctx.moveTo(x3, Math.min(y3, y4));
    ctx.lineTo(x3, Math.max(y3, y4));
    ctx.stroke();
  }

  // Đường dọc biên trái và phải xuyên qua sông
  const [lx] = toPixel(0, 0, flipped);
  const [rx] = toPixel(8, 0, flipped);
  const [, ry4] = toPixel(0, 4, flipped);
  const [, ry5] = toPixel(0, 5, flipped);
  ctx.beginPath();
  ctx.moveTo(lx, Math.min(ry4, ry5));
  ctx.lineTo(lx, Math.max(ry4, ry5));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(rx, Math.min(ry4, ry5));
  ctx.lineTo(rx, Math.max(ry4, ry5));
  ctx.stroke();

  // Vẽ các đường ngang
  for (let r = 0; r < BOARD_ROWS; r++) {
    const [x1, y1] = toPixel(0, r, flipped);
    const [x2] = toPixel(8, r, flipped);
    ctx.beginPath();
    ctx.moveTo(Math.min(x1, x2), y1);
    ctx.lineTo(Math.max(x1, x2), y1);
    ctx.stroke();
  }
}

// Vẽ chữ trên sông
function drawRiverText(ctx: CanvasRenderingContext2D, flipped: boolean) {
  ctx.fillStyle = '#8b4513';
  ctx.font = 'bold 22px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const [, y4] = toPixel(0, 4, flipped);
  const [, y5] = toPixel(0, 5, flipped);
  const riverY = (y4 + y5) / 2;

  const [lx] = toPixel(2, 0, flipped);
  const [rx] = toPixel(6, 0, flipped);

  if (flipped) {
    // Khi lật: đổi vị trí chữ
    ctx.fillText('漢 界', lx, riverY);
    ctx.fillText('楚 河', rx, riverY);
  } else {
    ctx.fillText('楚 河', lx, riverY);
    ctx.fillText('漢 界', rx, riverY);
  }
}

// Vẽ đường chéo cung
function drawPalaceDiagonals(ctx: CanvasRenderingContext2D, flipped: boolean) {
  ctx.strokeStyle = '#4a3728';
  ctx.lineWidth = 1;

  // Cung đen (logical rows 0-2)
  const [bx1, by1] = toPixel(3, 0, flipped);
  const [bx2, by2] = toPixel(5, 2, flipped);
  ctx.beginPath();
  ctx.moveTo(bx1, by1);
  ctx.lineTo(bx2, by2);
  ctx.stroke();

  const [bx3] = toPixel(5, 0, flipped);
  const [bx4] = toPixel(3, 2, flipped);
  ctx.beginPath();
  ctx.moveTo(bx3, by1);
  ctx.lineTo(bx4, by2);
  ctx.stroke();

  // Cung đỏ (logical rows 7-9)
  const [rx1, ry1] = toPixel(3, 7, flipped);
  const [rx2, ry2] = toPixel(5, 9, flipped);
  ctx.beginPath();
  ctx.moveTo(rx1, ry1);
  ctx.lineTo(rx2, ry2);
  ctx.stroke();

  const [rx3] = toPixel(5, 7, flipped);
  const [rx4] = toPixel(3, 9, flipped);
  ctx.beginPath();
  ctx.moveTo(rx3, ry1);
  ctx.lineTo(rx4, ry2);
  ctx.stroke();
}

// Vẽ highlight nước đi cuối cùng
function drawLastMoveHighlight(ctx: CanvasRenderingContext2D, lastMove: Move | null, isAnimating: boolean, flipped: boolean) {
  if (!lastMove) return;

  // Highlight ô xuất phát
  const [fx, fy] = toPixel(lastMove.from.col, lastMove.from.row, flipped);
  ctx.fillStyle = 'rgba(255, 193, 7, 0.35)';
  ctx.fillRect(fx - CELL_SIZE / 2, fy - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);

  // Highlight ô đích (chỉ khi không đang animation)
  if (!isAnimating) {
    const [tx, ty] = toPixel(lastMove.to.col, lastMove.to.row, flipped);
    ctx.fillStyle = 'rgba(255, 152, 0, 0.35)';
    ctx.fillRect(tx - CELL_SIZE / 2, ty - CELL_SIZE / 2, CELL_SIZE, CELL_SIZE);
  }
}

// Vẽ một quân cờ tại vị trí pixel bất kỳ
function drawSinglePiece(ctx: CanvasRenderingContext2D, x: number, y: number, piece: Piece) {
  // Bóng đổ nhẹ khi đang di chuyển
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Nền quân cờ
  ctx.beginPath();
  ctx.arc(x, y, PIECE_RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = '#fdf6e3';
  ctx.fill();
  ctx.restore();

  // Viền quân cờ
  ctx.strokeStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Viền trong
  ctx.beginPath();
  ctx.arc(x, y, PIECE_RADIUS - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Chữ trên quân
  ctx.fillStyle = piece.color === 'red' ? '#c0392b' : '#2c3e50';
  ctx.font = 'bold 20px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(PIECE_NAMES[piece.color][piece.type], x, y + 1);
}

// Vẽ quân cờ (bỏ qua quân đang animation)
function drawPieces(ctx: CanvasRenderingContext2D, board: Board, skipPosition: Position | null, flipped: boolean) {
  for (let r = 0; r < BOARD_ROWS; r++) {
    for (let c = 0; c < BOARD_COLS; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      // Bỏ qua quân đang được animation
      if (skipPosition && skipPosition.row === r && skipPosition.col === c) continue;

      const [x, y] = toPixel(c, r, flipped);
      drawSinglePiece(ctx, x, y, piece);
    }
  }
}

// Vẽ highlight quân được chọn
function drawSelection(ctx: CanvasRenderingContext2D, selectedPosition: Position | null, flipped: boolean) {
  if (!selectedPosition) return;

  const [x, y] = toPixel(selectedPosition.col, selectedPosition.row, flipped);
  ctx.beginPath();
  ctx.arc(x, y, PIECE_RADIUS + 3, 0, Math.PI * 2);
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 3;
  ctx.stroke();
}

// Vẽ các nước đi hợp lệ
function drawValidMoves(ctx: CanvasRenderingContext2D, validMoves: Position[], flipped: boolean) {
  for (const move of validMoves) {
    const [x, y] = toPixel(move.col, move.row, flipped);
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(46, 204, 113, 0.6)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(39, 174, 96, 0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
