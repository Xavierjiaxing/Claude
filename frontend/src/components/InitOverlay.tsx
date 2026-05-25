import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface InitOverlayProps { onDone: () => void; }

export default function InitOverlay({ onDone }: InitOverlayProps) {
  const [overall, setOverall] = useState(0);
  const [status, setStatus] = useState('准备中...');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    const es = new EventSource('/api/init-progress');
    es.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'progress') {
          setOverall(data.overall || 0);
          setStatus(`正在下载模型文件... ${data.overall || 0}%`);
          if (data.file) setDetail(`文件: ${data.file}`);
        } else if (data.type === 'done') {
          es.close();
          onDone();
        } else if (data.type === 'error') {
          setStatus(`初始化失败: ${data.message}`);
        }
      } catch { /* ignore malformed JSON */ }
    });
    return () => es.close();
  }, [onDone]);

  return (
    <div className="fixed inset-0 bg-[#022b71]/95 z-[9999] flex items-center justify-center">
      <div className="bg-card rounded-2xl p-8 w-[420px] max-w-[90vw] text-center shadow-2xl">
        <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-[#7c3aed]" />
        <h2 className="text-lg font-bold mb-1">正在初始化知识库</h2>
        <p className="text-sm text-muted-foreground mb-5">正在下载 AI 模型文件，首次运行约需 2-5 分钟...</p>
        <Progress value={overall} className="h-2 mb-3" />
        <p className="text-sm font-semibold">{status}</p>
        {detail && <p className="text-xs text-muted-foreground mt-1 break-all">{detail}</p>}
      </div>
    </div>
  );
}
