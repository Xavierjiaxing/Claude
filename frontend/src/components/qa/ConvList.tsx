import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Plus, X } from 'lucide-react';
import type { Conversation } from '@/lib/types';

interface ConvListProps {
  convs: Conversation[];
  activeConvId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function ConvList({ convs, activeConvId, searchQuery, onSearchChange, onSelect, onDelete, onNew }: ConvListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-3 space-y-2 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索对话..."
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button onClick={onNew} className="w-full h-8 text-xs" size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" /> 新建对话
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {convs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            {searchQuery ? '未找到匹配的对话' : '暂无对话'}
          </p>
        ) : (
          convs.map(conv => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={`group flex items-center justify-between px-3 py-2.5 cursor-pointer border-l-[3px] transition-all text-sm
                ${conv.id === activeConvId
                  ? 'border-l-[#7c3aed] bg-violet-50 text-primary font-semibold'
                  : 'border-l-transparent hover:bg-slate-50 text-muted-foreground'
                }`}
            >
              <span className="truncate flex-1 mr-2">{conv.title || '新对话'}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(conv.id); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-500 transition-all shrink-0"
              ><X className="h-3.5 w-3.5" /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
