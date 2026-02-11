import { useReducer, useCallback } from 'react';
import { GameState, GameAction, GameMode, PieceColor, Position } from '../game/types';
import { createInitialState, cloneBoard, applyMove, checkGameStatus } from '../game/gameLogic';
import { getValidMoves } from '../game/moves';

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_PIECE': {
      if (state.status !== 'playing') return state;

      const { position } = action;
      const piece = state.board[position.row][position.col];

      // Guard clause: trong mode không phải local, chỉ cho click quân của playerColor và đúng lượt
      if (state.mode !== 'local') {
        if (state.currentTurn !== state.playerColor) return state;

        // Click vào ô trống hoặc quân đối thủ khi đã chọn quân → kiểm tra valid move để di chuyển
        if (state.selectedPosition && (!piece || piece.color !== state.playerColor)) {
          const isValid = state.validMoves.some(
            m => m.row === position.row && m.col === position.col
          );
          if (isValid) {
            return gameReducer(state, {
              type: 'MOVE_PIECE',
              from: state.selectedPosition,
              to: position,
            });
          }
          // Click ô không hợp lệ và không phải quân của mình → bỏ chọn
          if (!piece || piece.color !== state.playerColor) {
            return { ...state, selectedPosition: null, validMoves: [] };
          }
        }

        // Chỉ cho chọn quân của mình
        if (piece && piece.color !== state.playerColor) {
          return state;
        }
      }

      // Nếu click vào quân của mình → chọn quân đó
      if (piece && piece.color === state.currentTurn) {
        const moves = getValidMoves(state.board, position.row, position.col);
        return {
          ...state,
          selectedPosition: position,
          validMoves: moves,
        };
      }

      // Nếu đã chọn quân và click vào ô hợp lệ → di chuyển
      if (state.selectedPosition) {
        const isValid = state.validMoves.some(
          m => m.row === position.row && m.col === position.col
        );
        if (isValid) {
          return gameReducer(state, {
            type: 'MOVE_PIECE',
            from: state.selectedPosition,
            to: position,
          });
        }
      }

      return { ...state, selectedPosition: null, validMoves: [] };
    }

    case 'MOVE_PIECE':
    case 'EXTERNAL_MOVE': {
      const { from, to } = action;
      const captured = state.board[to.row][to.col];
      const newBoard = applyMove(state.board, from, to);
      const nextTurn = state.currentTurn === 'red' ? 'black' as const : 'red' as const;
      const status = checkGameStatus(newBoard, nextTurn);

      const move = { from, to, captured: captured ?? undefined };
      return {
        ...state,
        board: newBoard,
        currentTurn: nextTurn,
        selectedPosition: null,
        validMoves: [],
        moveHistory: [...state.moveHistory, move],
        status,
        historySnapshots: [...state.historySnapshots, cloneBoard(newBoard)],
        lastMove: move,
      };
    }

    case 'SET_STATE': {
      return { ...state, ...action.state };
    }

    case 'CLEAR_SELECTION':
      return { ...state, selectedPosition: null, validMoves: [] };

    case 'NEW_GAME':
      return createInitialState(state.mode, state.playerColor);

    case 'UNDO': {
      if (state.moveHistory.length === 0) return state;

      // Khi chơi với AI, undo 2 bước (1 bước AI + 1 bước người) để quay lại lượt người chơi
      const steps = (state.mode === 'ai' && state.moveHistory.length >= 2) ? 2 : 1;

      const newHistory = state.moveHistory.slice(0, -steps);
      const newSnapshots = state.historySnapshots.slice(0, -steps);
      const previousBoard = cloneBoard(newSnapshots[newSnapshots.length - 1]);
      // Undo chẵn bước → lượt không đổi, undo lẻ bước → lượt đổi
      const previousTurn = steps % 2 === 0 ? state.currentTurn : (state.currentTurn === 'red' ? 'black' as const : 'red' as const);

      return {
        ...state,
        board: previousBoard,
        currentTurn: previousTurn,
        selectedPosition: null,
        validMoves: [],
        moveHistory: newHistory,
        status: 'playing',
        historySnapshots: newSnapshots,
        lastMove: newHistory.length > 0 ? newHistory[newHistory.length - 1] : null,
      };
    }

    default:
      return state;
  }
}

export function useGameState(mode: GameMode = 'local', playerColor: PieceColor | null = null) {
  const [state, dispatch] = useReducer(
    gameReducer,
    { mode, playerColor },
    (init) => createInitialState(init.mode, init.playerColor)
  );

  const handleCellClick = useCallback((position: Position) => {
    dispatch({ type: 'SELECT_PIECE', position });
  }, []);

  const newGame = useCallback(() => {
    dispatch({ type: 'NEW_GAME' });
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' });
  }, []);

  return { state, dispatch, handleCellClick, newGame, undo };
}
