import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { Board, PieceColor, GameStatus, Position } from '../game/types';
import { ClientToServerEvents, ServerToClientEvents, RoomInfo } from '../../server/types';
import { getValidMoves } from '../game/moves';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

type OnlineState = 'idle' | 'creating' | 'joining' | 'waiting' | 'playing' | 'finished';

interface OnlineGameState {
  phase: OnlineState;
  roomId: string | null;
  playerColor: PieceColor | null;
  opponentName: string | null;
  board: Board | null;
  currentTurn: PieceColor;
  status: GameStatus;
  selectedPosition: Position | null;
  validMoves: Position[];
  lastMove: { from: Position; to: Position } | null;
  rooms: RoomInfo[];
  error: string | null;
  gameOverReason: string | null;
}

export function useOnlineGame(socket: TypedSocket | null) {
  const [state, setState] = useState<OnlineGameState>({
    phase: 'idle',
    roomId: null,
    playerColor: null,
    opponentName: null,
    board: null,
    currentTurn: 'red',
    status: 'playing',
    selectedPosition: null,
    validMoves: [],
    lastMove: null,
    rooms: [],
    error: null,
    gameOverReason: null,
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  // Listen to socket events
  useEffect(() => {
    if (!socket) return;

    socket.on('game:state', (data) => {
      setState(prev => ({
        ...prev,
        phase: 'playing',
        board: data.board,
        currentTurn: data.currentTurn,
        status: data.status,
        playerColor: data.playerColor,
        opponentName: data.opponentName,
        selectedPosition: null,
        validMoves: [],
      }));
    });

    socket.on('game:moved', (data) => {
      setState(prev => ({
        ...prev,
        board: data.board,
        currentTurn: data.currentTurn,
        status: data.status,
        lastMove: { from: data.from, to: data.to },
        selectedPosition: null,
        validMoves: [],
      }));
    });

    socket.on('game:over', (data) => {
      setState(prev => ({
        ...prev,
        phase: 'finished',
        status: data.status,
        gameOverReason: data.reason,
      }));
    });

    socket.on('room:playerJoined', (data) => {
      setState(prev => ({
        ...prev,
        opponentName: data.name,
      }));
    });

    socket.on('room:playerLeft', (data) => {
      setState(prev => ({
        ...prev,
        opponentName: null,
      }));
    });

    socket.on('error', (data) => {
      setState(prev => ({ ...prev, error: data.message }));
      // Auto clear error
      setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 3000);
    });

    return () => {
      socket.off('game:state');
      socket.off('game:moved');
      socket.off('game:over');
      socket.off('room:playerJoined');
      socket.off('room:playerLeft');
      socket.off('error');
    };
  }, [socket]);

  const createRoom = useCallback((name: string) => {
    if (!socket) return;
    setState(prev => ({ ...prev, phase: 'creating' }));
    socket.emit('room:create', { name }, (roomId) => {
      setState(prev => ({
        ...prev,
        phase: 'waiting',
        roomId,
        playerColor: 'red',
      }));
    });
  }, [socket]);

  const joinRoom = useCallback((roomId: string, name: string) => {
    if (!socket) return;
    setState(prev => ({ ...prev, phase: 'joining' }));
    socket.emit('room:join', { roomId, name }, (success, error) => {
      if (!success) {
        setState(prev => ({
          ...prev,
          phase: 'idle',
          error: error || 'Không thể tham gia phòng',
        }));
        setTimeout(() => {
          setState(prev => ({ ...prev, error: null }));
        }, 3000);
      } else {
        setState(prev => ({
          ...prev,
          roomId,
          playerColor: 'black',
        }));
      }
    });
  }, [socket]);

  const refreshRooms = useCallback(() => {
    if (!socket) return;
    socket.emit('room:list', (rooms) => {
      setState(prev => ({ ...prev, rooms }));
    });
  }, [socket]);

  const sendMove = useCallback((from: Position, to: Position) => {
    if (!socket || !stateRef.current.roomId) return;
    socket.emit('game:move', {
      roomId: stateRef.current.roomId,
      from,
      to,
    });
  }, [socket]);

  const handleCellClick = useCallback((position: Position) => {
    const s = stateRef.current;
    if (!s.board || s.status !== 'playing') return;
    if (s.currentTurn !== s.playerColor) return;

    const piece = s.board[position.row][position.col];

    // Chọn quân của mình
    if (piece && piece.color === s.playerColor) {
      // Tính valid moves locally
      const moves = getValidMoves(s.board, position.row, position.col);
      setState(prev => ({
        ...prev,
        selectedPosition: position,
        validMoves: moves,
      }));
      return;
    }

    // Di chuyển nếu đã chọn quân
    if (s.selectedPosition) {
      const isValid = s.validMoves.some(
        m => m.row === position.row && m.col === position.col
      );
      if (isValid) {
        sendMove(s.selectedPosition, position);
        setState(prev => ({
          ...prev,
          selectedPosition: null,
          validMoves: [],
        }));
        return;
      }
    }

    setState(prev => ({
      ...prev,
      selectedPosition: null,
      validMoves: [],
    }));
  }, [sendMove]);

  const resign = useCallback(() => {
    if (!socket || !stateRef.current.roomId) return;
    socket.emit('game:resign', { roomId: stateRef.current.roomId });
  }, [socket]);

  const reset = useCallback(() => {
    setState({
      phase: 'idle',
      roomId: null,
      playerColor: null,
      opponentName: null,
      board: null,
      currentTurn: 'red',
      status: 'playing',
      selectedPosition: null,
      validMoves: [],
      lastMove: null,
      rooms: [],
      error: null,
      gameOverReason: null,
    });
  }, []);

  return {
    state,
    createRoom,
    joinRoom,
    refreshRooms,
    handleCellClick,
    resign,
    reset,
  };
}
