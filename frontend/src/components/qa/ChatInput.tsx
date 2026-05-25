import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Square } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

export default function ChatInput({ value, onChange, onSend, onStop, isStreaming, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      if (!isStreaming && value.trim()) onSend();
    }
  };

  return (
    <div className="flex gap-2 p-3 border-t bg-slate-50/50 items-end">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="输入您的问题... (Ctrl+Enter 发送)"
        rows={1}
        disabled={disabled}
        className="flex-1 resize-none rounded-xl border bg-card px-4 py-2.5 text-sm outline-none focus:border-[#7c3aed] focus:ring-[3px] focus:ring-violet-100 transition-all"
      />
      <div className="flex gap-1.5">
        {isStreaming ? (
          <Button variant="destructive" size="icon" onClick={onStop} className="h-9 w-9 rounded-xl shrink-0">
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={onSend}
            disabled={!value.trim() || disabled}
            size="icon"
            className="h-9 w-9 rounded-xl shrink-0 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-40"
          >
            <Send className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
