import { useEffect, useRef, useState } from 'react';
import { GameState, GameAction, PieceColor } from '../game/types';

interface UseAIOptions {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  aiColor: PieceColor;
  depth?: number;
  enabled: boolean;
}

export function useAI({ state, dispatch, aiColor, depth = 3, enabled }: UseAIOptions) {
  const [isThinking, setIsThinking] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const sequenceRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const worker = new Worker(new URL('../ai/worker.ts', import.meta.url));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent) => {
      const { move, sequence } = e.data;

      // Bỏ qua kết quả cũ (stale response)
      if (sequence !== sequenceRef.current) return;

      if (move) {
        // Delay 300ms cho UX tự nhiên
        setTimeout(() => {
          // Kiểm tra lại sequence trước khi dispatch
          if (sequence !== sequenceRef.current) return;
          dispatch({ type: 'EXTERNAL_MOVE', from: move.from, to: move.to });
          setIsThinking(false);
        }, 300);
      } else {
        setIsThinking(false);
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [enabled, dispatch]);

  useEffect(() => {
    if (!enabled) return;
    if (state.currentTurn !== aiColor) return;
    if (state.status !== 'playing') return;
    if (!workerRef.current) return;

    setIsThinking(true);
    sequenceRef.current += 1;
    const currentSeq = sequenceRef.current;

    // Delay nhỏ trước khi gửi cho worker
    const timer = setTimeout(() => {
      workerRef.current?.postMessage({
        board: state.board,
        color: aiColor,
        depth,
        sequence: currentSeq,
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [state.currentTurn, state.status, state.board, aiColor, depth, enabled]);

  return { isThinking };
}
