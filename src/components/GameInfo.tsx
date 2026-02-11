'use client';

import { GameState } from '../game/types';
import { getStatusText } from '../game/gameLogic';

interface GameInfoProps {
  state: GameState;
  isAiThinking?: boolean;
  opponentName?: string;
}

export default function GameInfo({ state, isAiThinking, opponentName }: GameInfoProps) {
  const statusText = getStatusText(state);
  const isGameOver = state.status !== 'playing';
  const isCheck = statusText.includes('CHIẾU');

  return (
    <div className="text-center space-y-3">
      <div
        className={`text-2xl font-bold px-6 py-3 rounded-lg ${
          isGameOver
            ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
            : isCheck
              ? 'bg-red-100 text-red-700 border-2 border-red-400 animate-pulse'
              : state.currentTurn === 'red'
                ? 'bg-red-50 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-800 border-2 border-gray-400'
        }`}
      >
        {statusText}
      </div>
      {isAiThinking && (
        <div className="text-amber-700 font-medium animate-pulse">
          AI đang suy nghĩ...
        </div>
      )}
      {opponentName && (
        <div className="text-sm text-gray-600">
          Đối thủ: {opponentName}
        </div>
      )}
      <div className="text-sm text-gray-500">
        Nước đi: {state.moveHistory.length}
      </div>
    </div>
  );
}
