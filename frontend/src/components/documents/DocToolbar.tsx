import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Trash2, RefreshCw } from 'lucide-react';

interface DocToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  totalDocs: number;
  totalChunks: number;
  selectedCount: number;
  onDeleteSelected: () => void;
  onRefresh: () => void;
}

export default function DocToolbar({ searchQuery, onSearchChange, totalDocs, totalChunks, selectedCount, onDeleteSelected, onRefresh }: DocToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 bg-card rounded-lg border px-3 py-1.5">
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <Input
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索文件名或类型..."
          className="border-0 bg-transparent h-9 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange('')} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 text-sm text-muted-foreground bg-card rounded-lg border px-4 py-2">
        <span>共 <strong className="text-foreground">{totalDocs}</strong> 份文档</span>
        <span>· <strong className="text-foreground">{totalChunks}</strong> 个片段</span>
        <div className="flex-1" />
        {selectedCount > 0 && (
          <Button variant="destructive" size="sm" onClick={onDeleteSelected}>
            <Trash2 className="h-3.5 w-3.5 mr-1" /> 删除选中 ({selectedCount})
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onRefresh} className="h-8 w-8" title="刷新">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
