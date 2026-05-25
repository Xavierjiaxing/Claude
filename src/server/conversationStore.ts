import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from './apiTypes';

const conversations = new Map<string, Conversation>();

function now(): string {
  return new Date().toISOString();
}

export function createConversation(title?: string): Conversation {
  const id = uuidv4();
  const conv: Conversation = {
    id,
    title: title || '新对话',
    messages: [],
    createdAt: now(),
    updatedAt: now(),
  };
  conversations.set(id, conv);
  return conv;
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

export function addMessage(
  convId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: string[]
): Message | null {
  const conv = conversations.get(convId);
  if (!conv) return null;

  const msg: Message = { role, content, timestamp: now(), sources };
  conv.messages.push(msg);
  conv.updatedAt = now();

  if (conv.title === '新对话' && role === 'user' && content.length > 0) {
    conv.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
  }

  return msg;
}

export function listConversations(): Conversation[] {
  return [...conversations.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function deleteConversation(id: string): boolean {
  return conversations.delete(id);
}
