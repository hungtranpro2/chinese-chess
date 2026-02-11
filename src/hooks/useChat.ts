import { useState, useCallback, useEffect, useRef } from 'react';
import { Socket } from 'socket.io-client';
import { PieceColor } from '../game/types';
import { ClientToServerEvents, ServerToClientEvents } from '../../server/types';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface ChatMessage {
  sender: string;
  text: string;
  timestamp: number;
  color: PieceColor;
  isOwn: boolean;
}

interface UseChatOptions {
  socket: TypedSocket | null;
  roomId: string | null;
  playerName: string;
}

export function useChat({ socket, roomId, playerName }: UseChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const isPanelOpenRef = useRef(isPanelOpen);
  isPanelOpenRef.current = isPanelOpen;

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (data: { sender: string; text: string; timestamp: number; color: PieceColor }) => {
      const isOwn = data.sender === playerName;
      setMessages(prev => [...prev, { ...data, isOwn }]);

      if (!isOwn && !isPanelOpenRef.current) {
        setUnreadCount(prev => prev + 1);
      }
    };

    socket.on('chat:message', handleMessage);

    return () => {
      socket.off('chat:message', handleMessage);
    };
  }, [socket, playerName]);

  const sendMessage = useCallback((text: string) => {
    if (!socket || !roomId || !text.trim()) return;
    socket.emit('chat:message', { roomId, text: text.trim() });
  }, [socket, roomId]);

  const setPanelOpen = useCallback((open: boolean) => {
    setIsPanelOpen(open);
    if (open) {
      setUnreadCount(0);
    }
  }, []);

  return { messages, unreadCount, sendMessage, isPanelOpen, setPanelOpen };
}
