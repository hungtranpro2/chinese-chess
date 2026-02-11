'use client';

import { useState } from 'react';
import { RoomInfo } from '../../server/types';

interface RoomLobbyProps {
  rooms: RoomInfo[];
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onRefreshRooms: () => void;
  error: string | null;
}

export default function RoomLobby({ rooms, onCreateRoom, onJoinRoom, onRefreshRooms, error }: RoomLobbyProps) {
  const [playerName, setPlayerName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleCreate = () => {
    if (!playerName.trim()) return;
    onCreateRoom(playerName.trim());
  };

  const handleJoin = (roomId?: string) => {
    if (!playerName.trim()) return;
    const id = roomId || joinRoomId.trim().toUpperCase();
    if (!id) return;
    onJoinRoom(id, playerName.trim());
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-center">
          {error}
        </div>
      )}

      {/* Nhập tên */}
      <div>
        <label className="block text-amber-800 font-medium mb-2">Tên của bạn</label>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          placeholder="Nhập tên..."
          maxLength={20}
          className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder-amber-400"
        />
      </div>

      {/* Tạo phòng */}
      <button
        onClick={handleCreate}
        disabled={!playerName.trim()}
        className="w-full px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 active:bg-amber-900 transition-colors font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Tạo phòng mới
      </button>

      {/* Nhập mã phòng */}
      <div className="flex gap-2">
        <input
          type="text"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
          placeholder="Nhập mã phòng..."
          maxLength={6}
          className="flex-1 px-4 py-3 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:outline-none bg-white text-amber-900 placeholder-amber-400 uppercase tracking-widest text-center font-mono"
        />
        <button
          onClick={() => handleJoin()}
          disabled={!playerName.trim() || !joinRoomId.trim()}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors font-bold shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Vào
        </button>
      </div>

      {/* Danh sách phòng */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-amber-800 font-bold">Phòng đang chờ</h3>
          <button
            onClick={onRefreshRooms}
            className="text-sm text-amber-600 hover:text-amber-800 underline"
          >
            Làm mới
          </button>
        </div>
        {rooms.length === 0 ? (
          <p className="text-amber-500 text-center py-4">Chưa có phòng nào</p>
        ) : (
          <div className="space-y-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex justify-between items-center px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg"
              >
                <div>
                  <span className="font-mono text-amber-800 font-bold">{room.id}</span>
                  <span className="text-amber-600 ml-3">{room.creatorName}</span>
                </div>
                <button
                  onClick={() => handleJoin(room.id)}
                  disabled={!playerName.trim()}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Tham gia
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
