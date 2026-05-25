import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import FileTypeBadge from './FileTypeBadge';
import type { DocumentInfo } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { ArrowUpDown, Trash2, FileX } from 'lucide-react';

interface DocTableProps {
  docs: DocumentInfo[];
  selectedFiles: Set<string>;
  onSelectToggle: (filePath: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDelete: (filePath: string) => void;
  emptyMessage: string;
  onSort: (key: string) => void;
  sortBy: string;
  sortDir: 'asc' | 'desc';
}

export default function DocTable({ docs, selectedFiles, onSelectToggle, onSelectAll, onDelete, emptyMessage, onSort }: DocTableProps) {
  if (docs.length === 0) {
    return (
      <div className="bg-card rounded-lg border p-16 text-center">
        <FileX className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
        <p className="text-muted-foreground text-sm">{emptyMessage}</p>
      </div>
    );
  }

  const allChecked = docs.every(d => selectedFiles.has(d.filePath));

  const SortHeader = ({ col, label }: { col: string; label: string }) => (
    <button onClick={() => onSort(col)} className="flex items-center gap-1 hover:text-[#7c3aed] transition-colors font-semibold text-xs uppercase tracking-wider cursor-pointer">
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
            <TableHead className="w-10"><Checkbox checked={allChecked} onCheckedChange={(c) => onSelectAll(!!c)} /></TableHead>
            <TableHead><SortHeader col="name" label="文件名" /></TableHead>
            <TableHead className="w-20"><SortHeader col="type" label="类型" /></TableHead>
            <TableHead className="w-[72px] text-center">片段数</TableHead>
            <TableHead className="w-40"><SortHeader col="date" label="导入时间" /></TableHead>
            <TableHead className="w-16 text-center">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {docs.map((doc, idx) => (
            <TableRow key={doc.filePath} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'} hover:bg-violet-50/30 transition-colors group`}>
              <TableCell className="text-center">
                <Checkbox checked={selectedFiles.has(doc.filePath)} onCheckedChange={(c) => onSelectToggle(doc.filePath, !!c)} />
              </TableCell>
              <TableCell className="truncate max-w-[300px] font-medium text-sm" title={doc.filePath}>{doc.fileName}</TableCell>
              <TableCell><FileTypeBadge type={doc.fileType} /></TableCell>
              <TableCell className="text-center tabular-nums">{doc.chunkCount}</TableCell>
              <TableCell className="text-xs text-muted-foreground tabular-nums">{formatDateTime(doc.ingestedAt)}</TableCell>
              <TableCell className="text-center">
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => onDelete(doc.filePath)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
