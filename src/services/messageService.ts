import type { Conversation, Message } from '../types/message';



export async function fetchConversations(): Promise<Conversation[]> {
  
  return [];
}

export async function fetchMessages(_conversationId: number): Promise<Message[]> {
  // TODO: Replace with real API call
  return [];
}

export async function sendMessage(_conversationId: number, _message: Message): Promise<void> {
  // TODO: Replace with real API call
  return;
}
