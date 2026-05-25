import type { Message } from '@/lib/types';
import SourceCard from './SourceCard';
import { marked } from 'marked';
import { Bot, User } from 'lucide-react';

interface ChatBubbleProps { msg: Message; }

export default function ChatBubble({ msg }: ChatBubbleProps) {
  const isUser = msg.role === 'user';
  const html = isUser ? msg.content : marked.parse(msg.content) as string;

  return (
    <div className={`flex gap-3 mb-5 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-[#0f2b6d]' : 'bg-violet-100'}`}>
        {isUser ? <User className="h-4 w-4 text-white" /> : <Bot className="h-4 w-4 text-[#7c3aed]" />}
      </div>
      <div className={`max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <p className="text-[10px] text-muted-foreground mb-1 px-1">{isUser ? '您' : 'AI 助手'}</p>
        <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-br from-[#022b71] to-[#5b21b6] text-white rounded-br-md shadow-md'
            : 'bg-card border rounded-bl-md shadow-sm'
        }`}>
          {isUser ? (
            <p>{html}</p>
          ) : (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
        {!isUser && msg.chunks && msg.chunks.length > 0 && (
          <div className="mt-2"><SourceCard chunks={msg.chunks} sources={msg.sources} /></div>
        )}
      </div>
    </div>
  );
}
