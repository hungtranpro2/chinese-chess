'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Board from '../../components/Board';
import GameInfo from '../../components/GameInfo';
import GameControls from '../../components/GameControls';
import RoomLobby from '../../components/RoomLobby';
import ChatPanel from '../../components/ChatPanel';
import { useSocket } from '../../hooks/useSocket';
import { useOnlineGame } from '../../hooks/useOnlineGame';
import { useChat } from '../../hooks/useChat';
import { GameState } from '../../game/types';

export default function OnlinePage() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { state, createRoom, joinRoom, refreshRooms, handleCellClick, resign, reset } = useOnlineGame(socket);
  const [playerName, setPlayerName] = useState('');

  const { messages, unreadCount, sendMessage, isPanelOpen, setPanelOpen } = useChat({
    socket,
    roomId: state.roomId,
    playerName,
  });

  // Refresh danh sách phòng khi vào trang
  useEffect(() => {
    if (isConnected) {
      refreshRooms();
    }
  }, [isConnected, refreshRooms]);

  const handleCreateRoom = (name: string) => {
    setPlayerName(name);
    createRoom(name);
  };

  const handleJoinRoom = (roomId: string, name: string) => {
    setPlayerName(name);
    joinRoom(roomId, name);
  };

  const handleNewGame = () => {
    reset();
  };

  const handleBack = () => {
    router.push('/');
  };

  // Chưa kết nối
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-6">
        <h1 className="text-4xl font-bold text-amber-900 tracking-wide">Cờ Tướng Online</h1>
        <p className="text-amber-700 animate-pulse">Đang kết nối tới server...</p>
        <button onClick={handleBack} className="text-amber-600 hover:text-amber-800 underline">
          Quay lại
        </button>
      </div>
    );
  }

  // Lobby
  if (state.phase === 'idle' || state.phase === 'creating' || state.phase === 'joining') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-6">
        <h1 className="text-4xl font-bold text-amber-900 tracking-wide">Cờ Tướng Online</h1>
        <RoomLobby
          rooms={state.rooms}
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onRefreshRooms={refreshRooms}
          error={state.error}
        />
        <button onClick={handleBack} className="text-amber-600 hover:text-amber-800 underline mt-4">
          Quay lại
        </button>
      </div>
    );
  }

  // Đang chờ đối thủ
  if (state.phase === 'waiting') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-6">
        <h1 className="text-4xl font-bold text-amber-900 tracking-wide">Cờ Tướng Online</h1>
        <div className="bg-white border-2 border-amber-300 rounded-xl px-8 py-6 text-center shadow-lg">
          <p className="text-amber-800 font-bold text-lg mb-2">Phòng: <span className="font-mono tracking-widest">{state.roomId}</span></p>
          <p className="text-amber-600 animate-pulse">Đang chờ đối thủ tham gia...</p>
          <p className="text-sm text-amber-500 mt-3">Chia sẻ mã phòng cho bạn bè</p>
        </div>
        <button onClick={handleNewGame} className="text-amber-600 hover:text-amber-800 underline">
          Hủy
        </button>
      </div>
    );
  }

  // Game đang chơi hoặc đã kết thúc
  const isGameOver = state.status !== 'playing';
  const statusText = isGameOver
    ? state.gameOverReason === 'resign'
      ? `${state.status === 'red_wins' ? 'Đỏ' : 'Đen'} thắng (đối thủ đầu hàng)`
      : state.gameOverReason === 'disconnect'
        ? `${state.status === 'red_wins' ? 'Đỏ' : 'Đen'} thắng (đối thủ thoát)`
        : `${state.status === 'red_wins' ? 'Đỏ' : 'Đen'} thắng!`
    : undefined;

  // Tạo GameState cho GameInfo
  const gameState: GameState = {
    board: state.board || [],
    currentTurn: state.currentTurn,
    selectedPosition: state.selectedPosition,
    validMoves: state.validMoves,
    moveHistory: [],
    status: state.status,
    historySnapshots: [],
    lastMove: state.lastMove,
    mode: 'online',
    playerColor: state.playerColor,
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-4 gap-6">
      <h1 className="text-4xl font-bold text-amber-900 tracking-wide">Cờ Tướng Online</h1>

      {statusText ? (
        <div className="text-2xl font-bold px-6 py-3 rounded-lg bg-yellow-100 text-yellow-800 border-2 border-yellow-400">
          {statusText}
        </div>
      ) : (
        <GameInfo state={gameState} opponentName={state.opponentName || undefined} />
      )}

      {state.board && (
        <Board
          board={state.board}
          selectedPosition={state.selectedPosition}
          validMoves={state.validMoves}
          lastMove={state.lastMove}
          onCellClick={handleCellClick}
          flipped={state.playerColor === 'black'}
          disabled={isGameOver || state.currentTurn !== state.playerColor}
        />
      )}

      {isGameOver ? (
        <div className="flex gap-3">
          <button
            onClick={handleNewGame}
            className="px-6 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:bg-amber-900 transition-colors font-medium shadow-md"
          >
            Phòng mới
          </button>
          <button
            onClick={handleBack}
            className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-800 transition-colors font-medium shadow-md"
          >
            Trang chủ
          </button>
        </div>
      ) : (
        <GameControls
          onNewGame={handleNewGame}
          onUndo={() => {}}
          canUndo={false}
          showResign={true}
          onResign={resign}
        />
      )}

      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg">
          {state.error}
        </div>
      )}

      {/* Chat panel - chỉ hiển thị khi đang chơi hoặc đã kết thúc */}
      {(state.phase === 'playing' || state.phase === 'finished') && (
        <ChatPanel
          messages={messages}
          unreadCount={unreadCount}
          isOpen={isPanelOpen}
          onToggle={setPanelOpen}
          onSendMessage={sendMessage}
        />
      )}
    </div>
  );
}
