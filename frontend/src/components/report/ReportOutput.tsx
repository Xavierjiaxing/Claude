import { Button } from '@/components/ui/button';
import { Copy, Download, Check, FileEdit, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { marked } from 'marked';
import { toast } from 'sonner';

interface ReportOutputProps {
  markdown: string;
  sources: string[];
  isGenerating: boolean;
}

export default function ReportOutput({ markdown, sources, isGenerating }: ReportOutputProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!markdown) { toast.info('没有可复制的内容'); return; }
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    toast.success('已复制到剪贴板');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) { toast.info('没有可下载的内容'); return; }
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `报告-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('下载完成');
  };

  const html = markdown ? marked.parse(markdown) as string : '';

  if (!markdown && !isGenerating) return null;

  return (
    <div className="bg-card rounded-xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-slate-50/50">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <FileEdit className="h-4 w-4" /> 生成的报告
        </h3>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 text-xs">
            {copied ? <Check className="h-3.5 w-3.5 mr-1 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
            {copied ? '已复制' : '复制'}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 text-xs">
            <Download className="h-3.5 w-3.5 mr-1" /> 下载 MD
          </Button>
        </div>
      </div>
      <div className="p-5 max-h-[500px] overflow-y-auto">
        {isGenerating && !markdown ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> 正在生成报告，请稍候...
          </div>
        ) : (
          <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        )}
      </div>
      {sources.length > 0 && (
        <div className="px-4 py-2.5 border-t bg-slate-50/30 text-xs text-muted-foreground">
          <strong>参考文档：</strong>{sources.join('、')}
        </div>
      )}
    </div>
  );
}
