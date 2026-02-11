'use client';

import { GameMode } from '../game/types';

interface ModeSelectorProps {
  onSelectMode: (mode: GameMode) => void;
}

const modes = [
  {
    mode: 'local' as GameMode,
    label: 'Chơi 2 người',
    description: 'Hai người chơi trên cùng một máy',
  },
  {
    mode: 'ai' as GameMode,
    label: 'Chơi với Máy',
    description: 'Đấu với trí tuệ nhân tạo',
  },
  {
    mode: 'online' as GameMode,
    label: 'Chơi Online',
    description: 'Đấu với người chơi khác qua mạng',
  },
];

export default function ModeSelector({ onSelectMode }: ModeSelectorProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      {modes.map(({ mode, label, description }) => (
        <button
          key={mode}
          onClick={() => onSelectMode(mode)}
          className="group px-6 py-5 bg-amber-50 border-2 border-amber-300 rounded-xl hover:bg-amber-100 hover:border-amber-500 active:bg-amber-200 transition-all shadow-md hover:shadow-lg text-left"
        >
          <div className="text-xl font-bold text-amber-900 group-hover:text-amber-800">
            {label}
          </div>
          <div className="text-sm text-amber-700 mt-1">
            {description}
          </div>
        </button>
      ))}
    </div>
  );
}
