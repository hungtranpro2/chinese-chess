'use client';

interface GameControlsProps {
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  showResign?: boolean;
  onResign?: () => void;
}

export default function GameControls({ onNewGame, onUndo, canUndo, showResign, onResign }: GameControlsProps) {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onNewGame}
        className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:bg-amber-900 transition-colors font-medium shadow-md"
      >
        Ván mới
      </button>
      {!showResign && (
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Đi lại
        </button>
      )}
      {showResign && onResign && (
        <button
          onClick={onResign}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 transition-colors font-medium shadow-md"
        >
          Đầu hàng
        </button>
      )}
    </div>
  );
}
