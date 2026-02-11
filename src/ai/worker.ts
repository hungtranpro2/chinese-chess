import { findBestMove } from './minimax';

self.onmessage = (e: MessageEvent) => {
  const { board, color, depth, sequence } = e.data;
  const move = findBestMove(board, color, depth);
  self.postMessage({ move, sequence });
};
