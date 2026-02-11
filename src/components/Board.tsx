'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { Board as BoardType, Piece, Position, Move } from '../game/types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/constants';
import { renderBoard, pixelToPosition, posToPixel, ANIMATION_DURATION } from '../game/boardRenderer';

interface BoardProps {
  board: BoardType;
  selectedPosition: Position | null;
  validMoves: Position[];
  lastMove: Move | null;
  onCellClick: (position: Position) => void;
  flipped?: boolean;
  disabled?: boolean;
}

// Easing function: ease-out cubic
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export default function Board({ board, selectedPosition, validMoves, lastMove, onCellClick, flipped = false, disabled = false }: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationRef = useRef<number | null>(null);
  const prevLastMoveRef = useRef<Move | null>(null);

  // Vẽ bàn cờ tĩnh (không animation)
  const drawStatic = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderBoard(ctx, board, selectedPosition, validMoves, lastMove, null, flipped);
  }, [board, selectedPosition, validMoves, lastMove, flipped]);

  // Chạy animation khi có nước đi mới
  useEffect(() => {
    // Kiểm tra nếu lastMove thay đổi và thực sự là nước đi mới
    const prevMove = prevLastMoveRef.current;
    const isNewMove = lastMove && (!prevMove ||
      lastMove.from.row !== prevMove.from.row ||
      lastMove.from.col !== prevMove.from.col ||
      lastMove.to.row !== prevMove.to.row ||
      lastMove.to.col !== prevMove.to.col);

    prevLastMoveRef.current = lastMove;

    if (!isNewMove || !lastMove) {
      drawStatic();
      return;
    }

    // Lấy quân cờ tại vị trí đích (đã di chuyển trong state)
    const piece = board[lastMove.to.row][lastMove.to.col];
    if (!piece) {
      drawStatic();
      return;
    }

    // Hủy animation trước đó nếu có
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    setIsAnimating(true);
    const startTime = performance.now();
    const [fromX, fromY] = posToPixel(lastMove.from.col, lastMove.from.row, flipped);
    const [toX, toY] = posToPixel(lastMove.to.col, lastMove.to.row, flipped);

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
      const easedProgress = easeOutCubic(progress);

      const currentX = fromX + (toX - fromX) * easedProgress;
      const currentY = fromY + (toY - fromY) * easedProgress;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      renderBoard(ctx, board, selectedPosition, validMoves, lastMove, {
        x: currentX,
        y: currentY,
        piece,
      }, flipped);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation xong, vẽ lại trạng thái tĩnh
        setIsAnimating(false);
        animationRef.current = null;
        renderBoard(ctx, board, selectedPosition, validMoves, lastMove, null, flipped);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [board, selectedPosition, validMoves, lastMove, drawStatic, flipped]);

  // Cleanup animation khi component unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating || disabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const position = pixelToPosition(x, y, flipped);
    if (position) {
      onCellClick(position);
    }
  }, [onCellClick, isAnimating, disabled, flipped]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onClick={handleClick}
      className={`cursor-pointer max-w-full h-auto border-2 border-amber-800 rounded-lg shadow-xl ${disabled ? 'pointer-events-none opacity-70' : ''}`}
    />
  );
}
