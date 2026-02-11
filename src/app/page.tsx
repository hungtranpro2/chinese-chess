'use client';

import { useRouter } from 'next/navigation';
import ModeSelector from '../components/ModeSelector';
import { GameMode } from '../game/types';

export default function Home() {
  const router = useRouter();

  const handleSelectMode = (mode: GameMode) => {
    if (mode === 'online') {
      router.push('/online');
    } else {
      router.push(`/play?mode=${mode}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-8">
      <h1 className="text-4xl font-bold text-amber-900 tracking-wide">
        Cờ Tướng
      </h1>
      <p className="text-amber-700 text-lg">Chọn chế độ chơi</p>
      <ModeSelector onSelectMode={handleSelectMode} />
    </div>
  );
}
