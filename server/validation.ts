import { Position } from '../src/game/types';

// Kiểm tra vị trí hợp lệ
export function isValidPosition(pos: Position): boolean {
  return (
    typeof pos.row === 'number' &&
    typeof pos.col === 'number' &&
    pos.row >= 0 && pos.row <= 9 &&
    pos.col >= 0 && pos.col <= 8 &&
    Number.isInteger(pos.row) &&
    Number.isInteger(pos.col)
  );
}

// Sanitize tên người chơi
export function sanitizePlayerName(name: string): string {
  if (typeof name !== 'string') return 'Người chơi';
  const sanitized = name
    .replace(/[<>&"'/]/g, '')
    .trim()
    .slice(0, 20);
  return sanitized || 'Người chơi';
}

// Kiểm tra mã phòng hợp lệ
export function isValidRoomId(id: string): boolean {
  return typeof id === 'string' && /^[A-Z0-9]{6}$/.test(id);
}
