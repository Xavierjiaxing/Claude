import { useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import UploadProgress from './UploadProgress';
import type { FileProgress } from './UploadProgress';
import { Upload, FileUp } from 'lucide-react';

interface UploadZoneProps { onUploaded: () => void; }

const SUPPORTED_EXTS = ['pdf', 'docx', 'txt', 'md', 'svg', 'jpg', 'jpeg', 'png', 'bmp', 'webp'];

export default function UploadZone({ onUploaded }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileProgress, setFileProgress] = useState<FileProgress[]>([]);
  const [uploading, setUploading] = useState(false);
  const [overallPct, setOverallPct] = useState(0);
  const [statusText, setStatusText] = useState('');

  const processFiles = useCallback(async (files: FileList) => {
    const fileList = Array.from(files).filter(f =>
      SUPPORTED_EXTS.includes(f.name.split('.').pop()?.toLowerCase() || '')
    );
    if (fileList.length === 0) { setStatusText('没有支持的文件类型'); return; }

    setUploading(true);
    const progress: FileProgress[] = fileList.map(f => ({ name: f.name, status: 'pending' as const }));
    setFileProgress(progress);

    let doneCount = 0;
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setOverallPct(Math.round((i / fileList.length) * 100));
      setStatusText(`处理中 ${i + 1}/${fileList.length}：${file.name}`);

      const newProgress = [...progress];
      newProgress[i] = { name: file.name, status: 'processing' };
      setFileProgress(newProgress);

      try {
        const formData = new FormData();
        formData.append('files', file);
        const result = await api.upload<{ chunks: number }>('/api/ingest', formData);
        newProgress[i] = {
          name: file.name,
          status: result.chunks === 0 ? 'error' : 'done',
          error: result.chunks === 0 ? '未能提取内容' : undefined
        };
        if (result.chunks > 0) doneCount++;
      } catch (err) {
        newProgress[i] = { name: file.name, status: 'error', error: (err as Error).message };
      }
      setFileProgress([...newProgress]);
    }

    setOverallPct(100);
    if (doneCount === fileList.length) setStatusText(`已完成！成功导入 ${doneCount} 个文件`);
    else if (doneCount > 0) setStatusText(`部分完成：${doneCount}/${fileList.length} 个文件导入成功`);
    else setStatusText('导入失败');

    onUploaded();
    setTimeout(() => {
      setUploading(false);
      setFileProgress([]);
      setOverallPct(0);
      setStatusText('');
    }, 4000);
  }, [onUploaded]);

  return (
    <div className="space-y-3">
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setIsDragOver(false); processFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all duration-300 bg-card
          ${isDragOver ? 'border-[#7c3aed] bg-violet-50/50 shadow-[0_0_0_4px_rgba(124,58,237,0.08)]' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt,.md,.svg,.jpg,.jpeg,.png,.bmp,.webp"
          className="hidden"
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }} />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isDragOver ? 'bg-violet-100 text-[#7c3aed]' : 'bg-slate-100 text-slate-400'}`}>
            <Upload className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-medium">拖拽文件到此处，或点击选择文件</p>
            <p className="text-xs text-muted-foreground mt-1">支持 PDF、DOCX、TXT、MD 及图片（JPG/PNG/BMP/WebP），单文件 ≤50MB</p>
          </div>
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
            <FileUp className="h-3.5 w-3.5 mr-1" /> 浏览文件
          </Button>
        </div>
      </div>
      {uploading && <UploadProgress fileProgress={fileProgress} overallPct={overallPct} statusText={statusText} />}
    </div>
  );
}
