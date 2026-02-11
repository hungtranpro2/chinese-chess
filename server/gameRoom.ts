import { ServerRoom, RoomInfo, PlayerInfo } from './types';
import { Board, PieceColor, Position } from '../src/game/types';
import { createInitialBoard } from '../src/game/constants';
import { getValidMoves } from '../src/game/moves';
import { applyMove, checkGameStatus } from '../src/game/gameLogic';

// In-memory rooms
const rooms = new Map<string, ServerRoom>();

// Generate 6-char room ID
function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}

// Tạo phòng mới
export function createRoom(name: string, socketId: string): string {
  let id = generateRoomId();
  while (rooms.has(id)) {
    id = generateRoomId();
  }

  const room: ServerRoom = {
    id,
    players: {
      red: { socketId, name },
      black: null,
    },
    board: createInitialBoard(),
    currentTurn: 'red',
    status: 'playing',
    moveHistory: [],
    createdAt: Date.now(),
  };

  rooms.set(id, room);
  return id;
}

// Tham gia phòng
export function joinRoom(roomId: string, name: string, socketId: string): { success: boolean; error?: string; room?: ServerRoom } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Phòng không tồn tại' };
  if (room.players.black !== null) return { success: false, error: 'Phòng đã đầy' };

  room.players.black = { socketId, name };
  return { success: true, room };
}

// Lấy phòng theo ID
export function getRoom(roomId: string): ServerRoom | undefined {
  return rooms.get(roomId);
}

// Tìm phòng theo socketId
export function findRoomBySocket(socketId: string): ServerRoom | undefined {
  for (const room of rooms.values()) {
    if (room.players.red?.socketId === socketId || room.players.black?.socketId === socketId) {
      return room;
    }
  }
  return undefined;
}

// Lấy màu quân của socket trong phòng
export function getPlayerColor(room: ServerRoom, socketId: string): PieceColor | null {
  if (room.players.red?.socketId === socketId) return 'red';
  if (room.players.black?.socketId === socketId) return 'black';
  return null;
}

// Lấy thông tin đối thủ
export function getOpponentInfo(room: ServerRoom, socketId: string): PlayerInfo | null {
  if (room.players.red?.socketId === socketId) return room.players.black;
  if (room.players.black?.socketId === socketId) return room.players.red;
  return null;
}

// Xử lý nước đi
export function processMove(roomId: string, socketId: string, from: Position, to: Position): { success: boolean; error?: string; room?: ServerRoom } {
  const room = rooms.get(roomId);
  if (!room) return { success: false, error: 'Phòng không tồn tại' };
  if (room.status !== 'playing') return { success: false, error: 'Ván đã kết thúc' };

  const color = getPlayerColor(room, socketId);
  if (!color) return { success: false, error: 'Bạn không ở trong phòng này' };
  if (color !== room.currentTurn) return { success: false, error: 'Chưa đến lượt bạn' };

  // Validate nước đi
  const piece = room.board[from.row][from.col];
  if (!piece || piece.color !== color) return { success: false, error: 'Quân không hợp lệ' };

  const validMoves = getValidMoves(room.board, from.row, from.col);
  const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);
  if (!isValid) return { success: false, error: 'Nước đi không hợp lệ' };

  // Apply nước đi
  room.board = applyMove(room.board, from, to);
  room.currentTurn = color === 'red' ? 'black' : 'red';
  room.status = checkGameStatus(room.board, room.currentTurn);
  room.moveHistory.push({ from, to });

  return { success: true, room };
}

// Xử lý đầu hàng
export function handleResign(roomId: string, socketId: string): { success: boolean; room?: ServerRoom; loserColor?: PieceColor } {
  const room = rooms.get(roomId);
  if (!room) return { success: false };

  const color = getPlayerColor(room, socketId);
  if (!color) return { success: false };

  room.status = color === 'red' ? 'black_wins' : 'red_wins';
  return { success: true, room, loserColor: color };
}

// Xử lý disconnect
export function handleDisconnect(socketId: string): { room?: ServerRoom; disconnectedColor?: PieceColor } {
  const room = findRoomBySocket(socketId);
  if (!room) return {};

  const color = getPlayerColor(room, socketId);
  if (!color) return {};

  // Nếu game đang chơi, đối thủ thắng
  if (room.status === 'playing') {
    room.status = color === 'red' ? 'black_wins' : 'red_wins';
  }

  // Xóa player
  if (color === 'red') room.players.red = null;
  else room.players.black = null;

  // Xóa phòng nếu không còn ai
  if (!room.players.red && !room.players.black) {
    rooms.delete(room.id);
  }

  return { room, disconnectedColor: color };
}

// Lấy danh sách phòng đang chờ
export function listRooms(): RoomInfo[] {
  const result: RoomInfo[] = [];
  for (const room of rooms.values()) {
    if (room.players.black === null && room.players.red !== null) {
      result.push({
        id: room.id,
        playerCount: 1,
        creatorName: room.players.red.name,
      });
    }
  }
  return result;
}

// Cleanup phòng cũ (> 1 giờ)
export function cleanupStaleRooms(): number {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  let cleaned = 0;

  for (const [id, room] of rooms.entries()) {
    if (now - room.createdAt > oneHour) {
      rooms.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}
