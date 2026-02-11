import { Board, PieceColor, GameStatus, Position } from '../src/game/types';

// Thông tin người chơi
export interface PlayerInfo {
  socketId: string;
  name: string;
}

// Phòng chơi trên server
export interface ServerRoom {
  id: string;
  players: {
    red: PlayerInfo | null;
    black: PlayerInfo | null;
  };
  board: Board;
  currentTurn: PieceColor;
  status: GameStatus;
  moveHistory: { from: Position; to: Position }[];
  createdAt: number;
}

// Room info gửi cho client (danh sách phòng)
export interface RoomInfo {
  id: string;
  playerCount: number;
  creatorName: string;
}

// Events từ client gửi lên server
export interface ClientToServerEvents {
  'room:create': (data: { name: string }, callback: (roomId: string) => void) => void;
  'room:join': (data: { roomId: string; name: string }, callback: (success: boolean, error?: string) => void) => void;
  'room:list': (callback: (rooms: RoomInfo[]) => void) => void;
  'game:move': (data: { roomId: string; from: Position; to: Position }) => void;
  'game:resign': (data: { roomId: string }) => void;
  'chat:message': (data: { roomId: string; text: string }) => void;
}

// Events từ server gửi xuống client
export interface ServerToClientEvents {
  'game:state': (data: { board: Board; currentTurn: PieceColor; status: GameStatus; playerColor: PieceColor; opponentName: string }) => void;
  'game:moved': (data: { from: Position; to: Position; board: Board; currentTurn: PieceColor; status: GameStatus }) => void;
  'game:over': (data: { status: GameStatus; reason: string }) => void;
  'room:playerJoined': (data: { name: string; color: PieceColor }) => void;
  'room:playerLeft': (data: { name: string; color: PieceColor }) => void;
  'chat:message': (data: { sender: string; text: string; timestamp: number; color: PieceColor }) => void;
  'error': (data: { message: string }) => void;
}
