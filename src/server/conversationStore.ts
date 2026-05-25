import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Conversation, Message } from './apiTypes';

const CONV_DIR = path.resolve('./conversations');
const conversations = new Map<string, Conversation>();

// ---- persistence helpers ----

function ensureDir(): void {
  if (!fs.existsSync(CONV_DIR)) {
    fs.mkdirSync(CONV_DIR, { recursive: true });
  }
}

function filePath(id: string): string {
  return path.join(CONV_DIR, `${id}.json`);
}

function saveConv(conv: Conversation): void {
  ensureDir();
  fs.writeFileSync(filePath(conv.id), JSON.stringify(conv, null, 2), 'utf-8');
}

function removeFile(id: string): void {
  try { fs.unlinkSync(filePath(id)); } catch {}
}

// ---- init: load existing conversations from disk ----

(function loadFromDisk(): void {
  try {
    ensureDir();
    const files = fs.readdirSync(CONV_DIR).filter((f) => f.endsWith('.json'));
    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(CONV_DIR, f), 'utf-8');
        const conv: Conversation = JSON.parse(raw);
        conversations.set(conv.id, conv);
      } catch {
        // skip corrupted files
      }
    }
    if (conversations.size > 0) {
      console.log(`[convStore] Loaded ${conversations.size} conversation(s)`);
    }
  } catch {
    // fresh start, no conversations yet
  }
})();

// ---- public API (same interface, now persistent) ----

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
  saveConv(conv);
  return conv;
}

export function getConversation(id: string): Conversation | undefined {
  return conversations.get(id);
}

export function addMessage(
  convId: string,
  role: 'user' | 'assistant',
  content: string,
  sources?: string[],
  chunks?: { text: string; sourceFile: string; score: number }[]
): Message | null {
  const conv = conversations.get(convId);
  if (!conv) return null;

  const msg: Message = { role, content, timestamp: now(), sources, chunks };
  conv.messages.push(msg);
  conv.updatedAt = now();

  if (conv.title === '新对话' && role === 'user' && content.length > 0) {
    conv.title = content.slice(0, 40) + (content.length > 40 ? '...' : '');
  }

  saveConv(conv);
  return msg;
}

export function listConversations(): Conversation[] {
  return [...conversations.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export function deleteConversation(id: string): boolean {
  removeFile(id);
  return conversations.delete(id);
}
