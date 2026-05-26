import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { DocumentInfo, DocumentsResponse, StatsResponse } from '@/lib/types';
import UploadZone from '@/components/documents/UploadZone';
import DocToolbar from '@/components/documents/DocToolbar';
import DocTable from '@/components/documents/DocTable';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { FileText } from 'lucide-react';

export default function DocumentsPage() {
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalChunks, setTotalChunks] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 20;

  const loadDocs = useCallback(async () => {
    try {
      const qs = `?page=${page}&pageSize=${PAGE_SIZE}${searchQuery ? '&search=' + encodeURIComponent(searchQuery) : ''}`;
      const [stats, docsData] = await Promise.all([
        api.get<StatsResponse>('/api/stats'),
        api.get<DocumentsResponse>('/api/documents' + qs),
      ]);
      setTotalDocs(stats.totalDocuments);
      setTotalChunks(stats.totalChunks);

      let sorted = docsData.documents || [];
      sorted.sort((a, b) => {
        let va: string, vb: string;
        if (sortBy === 'name') { va = (a.fileName || '').toLowerCase(); vb = (b.fileName || '').toLowerCase(); }
        else if (sortBy === 'type') { va = (a.fileType || '').toLowerCase(); vb = (b.fileType || '').toLowerCase(); }
        else { va = a.ingestedAt || ''; vb = b.ingestedAt || ''; }
        const cmp = va < vb ? -1 : va > vb ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
      setDocs(sorted);
      setTotalPages(docsData.totalPages);
    } catch { /* ignore */ }
  }, [page, searchQuery, sortBy, sortDir]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleSort = (key: string) => {
    if (sortBy === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
    setPage(1);
  };

  // Sync selected files to sessionStorage for ReportPage to use
  useEffect(() => {
    if (selectedFiles.size > 0) {
      sessionStorage.setItem('selected_files', JSON.stringify([...selectedFiles]));
    } else {
      sessionStorage.removeItem('selected_files');
    }
  }, [selectedFiles]);

  const handleSelectToggle = (filePath: string, checked: boolean) => {
    setSelectedFiles(prev => { const next = new Set(prev); checked ? next.add(filePath) : next.delete(filePath); return next; });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedFiles(new Set(docs.map(d => d.filePath)));
    else setSelectedFiles(new Set());
  };

  const handleDelete = async (filePath: string) => {
    if (!confirm(`确定要删除此文档吗？\n\n${filePath}`)) return;
    try {
      await api.del('/api/documents', { sourceFile: filePath });
      setSelectedFiles(prev => { const next = new Set(prev); next.delete(filePath); return next; });
      toast.success('文档已删除');
      loadDocs();
    } catch (err) { toast.error('删除失败: ' + (err as Error).message); }
  };

  const handleDeleteSelected = async () => {
    const count = selectedFiles.size;
    if (count === 0) return;
    if (!confirm(`确定要删除选中的 ${count} 份文档吗？\n\n此操作不可恢复。`)) return;
    let deleted = 0;
    for (const fp of Array.from(selectedFiles)) {
      try { await api.del('/api/documents', { sourceFile: fp }); deleted++; } catch { /* skip */ }
    }
    if (deleted > 0) toast.success(`已删除 ${deleted} 份文档`);
    setSelectedFiles(new Set());
    loadDocs();
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2"><FileText className="h-5 w-5" />文档管理</h2>
        <p className="text-sm text-muted-foreground mt-1">上传、检索与管理知识库文档</p>
      </div>
      <UploadZone onUploaded={loadDocs} />
      <DocToolbar
        searchQuery={searchQuery}
        onSearchChange={(q) => { setSearchQuery(q); setPage(1); }}
        totalDocs={totalDocs}
        totalChunks={totalChunks}
        selectedCount={selectedFiles.size}
        onDeleteSelected={handleDeleteSelected}
        onRefresh={loadDocs}
      />
      <DocTable
        docs={docs}
        selectedFiles={selectedFiles}
        onSelectToggle={handleSelectToggle}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        emptyMessage={searchQuery ? `未找到匹配 "${searchQuery}" 的文档` : '暂无文档，请上传文件'}
        onSort={handleSort}
        sortBy={sortBy}
        sortDir={sortDir}
      />
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>上一页</Button>
          <span className="text-sm text-muted-foreground">第 {page} / {totalPages} 页 (共 {totalDocs} 份文档)</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>下一页</Button>
        </div>
      )}
    </div>
  );
}
