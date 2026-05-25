import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react';

export interface FileProgress {
  name: string;
  status: 'pending' | 'processing' | 'done' | 'error';
  error?: string;
}

interface UploadProgressProps {
  fileProgress: FileProgress[];
  overallPct: number;
  statusText: string;
}

export default function UploadProgress({ fileProgress, overallPct, statusText }: UploadProgressProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Progress value={overallPct} className="h-2" />
        <p className="text-sm text-muted-foreground">{statusText}</p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {fileProgress.map((fp, i) => (
            <div key={i} className="flex items-center gap-2 text-sm py-1">
              {fp.status === 'done' && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
              {fp.status === 'error' && <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              {fp.status === 'processing' && <Loader2 className="h-4 w-4 text-violet-500 animate-spin shrink-0" />}
              {fp.status === 'pending' && <Clock className="h-4 w-4 text-slate-300 shrink-0" />}
              <span className="truncate flex-1">{fp.name}</span>
              <span className={`text-xs shrink-0 font-medium
                ${fp.status === 'done' ? 'text-emerald-600' : ''}
                ${fp.status === 'error' ? 'text-red-500' : ''}
                ${fp.status === 'processing' ? 'text-violet-600' : ''}
                ${fp.status === 'pending' ? 'text-slate-400' : ''}`}>
                {fp.status === 'done' ? '完成' : fp.status === 'error' ? (fp.error || '失败') : fp.status === 'processing' ? '分析中...' : '等待'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
