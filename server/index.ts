import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { ClientToServerEvents, ServerToClientEvents } from './types';
import { sanitizePlayerName, isValidPosition, isValidRoomId } from './validation';
import { validateChatMessage, clearRateLimit } from './chatHandler';
import {
  createRoom, joinRoom, getRoom, processMove,
  handleResign, handleDisconnect, listRooms,
  cleanupStaleRooms, getPlayerColor, getOpponentInfo,
} from './gameRoom';

const ALLOWED_ORIGINS = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS }));

const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  // Tạo phòng
  socket.on('room:create', (data, callback) => {
    const name = sanitizePlayerName(data.name);
    const roomId = createRoom(name, socket.id);
    socket.join(roomId);
    console.log(`[Room] ${name} created room ${roomId}`);
    callback(roomId);
  });

  // Tham gia phòng
  socket.on('room:join', (data, callback) => {
    if (!isValidRoomId(data.roomId)) {
      callback(false, 'Mã phòng không hợp lệ');
      return;
    }

    const name = sanitizePlayerName(data.name);
    const result = joinRoom(data.roomId, name, socket.id);

    if (!result.success || !result.room) {
      callback(false, result.error);
      return;
    }

    socket.join(data.roomId);
    callback(true);

    const room = result.room;

    // Thông báo cho player 1 (red) về player 2 đã tham gia
    if (room.players.red) {
      io.to(room.players.red.socketId).emit('room:playerJoined', {
        name,
        color: 'black',
      });

      // Gửi game state cho player 1
      io.to(room.players.red.socketId).emit('game:state', {
        board: room.board,
        currentTurn: room.currentTurn,
        status: room.status,
        playerColor: 'red',
        opponentName: name,
      });
    }

    // Gửi game state cho player 2 (black)
    socket.emit('game:state', {
      board: room.board,
      currentTurn: room.currentTurn,
      status: room.status,
      playerColor: 'black',
      opponentName: room.players.red?.name || 'Người chơi',
    });

    console.log(`[Room] ${name} joined room ${data.roomId}`);
  });

  // Danh sách phòng
  socket.on('room:list', (callback) => {
    callback(listRooms());
  });

  // Xử lý nước đi
  socket.on('game:move', (data) => {
    if (!isValidRoomId(data.roomId)) {
      socket.emit('error', { message: 'Mã phòng không hợp lệ' });
      return;
    }
    if (!isValidPosition(data.from) || !isValidPosition(data.to)) {
      socket.emit('error', { message: 'Vị trí không hợp lệ' });
      return;
    }

    const result = processMove(data.roomId, socket.id, data.from, data.to);
    if (!result.success || !result.room) {
      socket.emit('error', { message: result.error || 'Lỗi không xác định' });
      return;
    }

    const room = result.room;

    // Broadcast nước đi cho cả phòng
    io.to(data.roomId).emit('game:moved', {
      from: data.from,
      to: data.to,
      board: room.board,
      currentTurn: room.currentTurn,
      status: room.status,
    });

    // Nếu game kết thúc
    if (room.status !== 'playing') {
      io.to(data.roomId).emit('game:over', {
        status: room.status,
        reason: 'checkmate',
      });
    }
  });

  // Đầu hàng
  socket.on('game:resign', (data) => {
    if (!isValidRoomId(data.roomId)) {
      socket.emit('error', { message: 'Mã phòng không hợp lệ' });
      return;
    }
    const result = handleResign(data.roomId, socket.id);
    if (result.success && result.room) {
      io.to(data.roomId).emit('game:over', {
        status: result.room.status,
        reason: 'resign',
      });
    }
  });

  // Chat
  socket.on('chat:message', (data) => {
    if (!isValidRoomId(data.roomId)) {
      socket.emit('error', { message: 'Mã phòng không hợp lệ' });
      return;
    }
    const validation = validateChatMessage(socket.id, data.text);
    if (!validation.valid) {
      socket.emit('error', { message: validation.error || 'Tin nhắn không hợp lệ' });
      return;
    }

    const room = getRoom(data.roomId);
    if (!room) return;

    const color = getPlayerColor(room, socket.id);
    if (!color) return;

    const senderName = color === 'red' ? room.players.red?.name : room.players.black?.name;

    io.to(data.roomId).emit('chat:message', {
      sender: senderName || 'Người chơi',
      text: validation.sanitizedText!,
      timestamp: Date.now(),
      color,
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`[Socket] Disconnected: ${socket.id}`);
    clearRateLimit(socket.id);

    const result = handleDisconnect(socket.id);
    if (result.room && result.disconnectedColor) {
      const opponentColor = result.disconnectedColor === 'red' ? 'black' : 'red';
      const opponentPlayer = opponentColor === 'red' ? result.room.players.red : result.room.players.black;

      if (opponentPlayer) {
        const playerName = result.disconnectedColor === 'red'
          ? 'Đỏ' : 'Đen';

        io.to(opponentPlayer.socketId).emit('room:playerLeft', {
          name: playerName,
          color: result.disconnectedColor,
        });

        if (result.room.status !== 'playing') {
          io.to(opponentPlayer.socketId).emit('game:over', {
            status: result.room.status,
            reason: 'disconnect',
          });
        }
      }
    }
  });
});

// Cleanup interval mỗi 30 phút
setInterval(() => {
  const cleaned = cleanupStaleRooms();
  if (cleaned > 0) {
    console.log(`[Cleanup] Removed ${cleaned} stale rooms`);
  }
}, 30 * 60 * 1000);

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Running on port ${PORT}`);
});
