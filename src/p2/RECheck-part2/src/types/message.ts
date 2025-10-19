export interface Conversation {
  id: number;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp?: string;
  status?: 'online' | 'offline' | 'away';
  preview: string;
  time: string;
}

export interface Message {
  id?: number;
  conversationId?: number;
  senderId?: number;
  senderName?: string;
  content?: string;
  timestamp?: string;
  type?: 'text' | 'image' | 'file';
  from: string;
  text: string;
  time: string;
  avatar?: string;
}