'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Board from '../../components/Board';
import GameInfo from '../../components/GameInfo';
import GameControls from '../../components/GameControls';
import { useGameState } from '../../hooks/useGameState';
import { useAI } from '../../hooks/useAI';
import { GameMode, PieceColor } from '../../game/types';

function PlayGame() {
  const searchParams = useSearchParams();
  const mode = (searchParams.get('mode') || 'local') as GameMode;
  const playerColor: PieceColor = 'red';

  const { state, dispatch, handleCellClick, newGame, undo } = useGameState(mode, mode === 'ai' ? playerColor : null);

  const { isThinking } = useAI({
    state,
    dispatch,
    aiColor: 'black',
    depth: 3,
    enabled: mode === 'ai',
  });

  const disabled = mode === 'ai' && (state.currentTurn !== playerColor || isThinking);

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-4xl font-bold text-amber-900 tracking-wide">
        Cờ Tướng
      </h1>

      <GameInfo state={state} isAiThinking={isThinking} />

      <Board
        board={state.board}
        selectedPosition={state.selectedPosition}
        validMoves={state.validMoves}
        lastMove={state.lastMove}
        onCellClick={handleCellClick}
        disabled={disabled}
      />

      <GameControls
        onNewGame={newGame}
        onUndo={undo}
        canUndo={state.moveHistory.length > 0 && state.status === 'playing' && !isThinking}
      />
    </div>
  );
}

export default function PlayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex items-center justify-center">
        <p className="text-amber-700 text-lg">Đang tải...</p>
      </div>
    }>
      <PlayGame />
    </Suspense>
  );
}
