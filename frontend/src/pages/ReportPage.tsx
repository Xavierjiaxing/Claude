import { useState, useRef } from 'react';
import { api } from '@/lib/api';
import ReportForm from '@/components/report/ReportForm';
import ReportOutput from '@/components/report/ReportOutput';
import { toast } from 'sonner';
import { FileEdit } from 'lucide-react';

export default function ReportPage() {
  const [markdown, setMarkdown] = useState('');
  const [sources, setSources] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = (type: string, title: string, focus: string) => {
    setIsGenerating(true);
    setMarkdown('');
    setSources([]);

    const controller = new AbortController();
    abortRef.current = controller;

    let rawText = '';
    api.stream(
      '/api/report',
      { type, title, focus, stream: true },
      (text) => {
        rawText += text;
        setMarkdown(rawText);
      },
      (s) => {
        setSources(s || []);
        setIsGenerating(false);
        abortRef.current = null;
        if (!collapsed) setCollapsed(true);
        toast.success('报告生成完成');
      },
      (errMsg) => {
        setIsGenerating(false);
        abortRef.current = null;
        if (!rawText) toast.error('报告生成失败: ' + errMsg);
      },
      controller.signal,
    );
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsGenerating(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <FileEdit className="h-5 w-5" />报告生成
        </h2>
        <p className="text-sm text-muted-foreground mt-1">基于知识库文档自动生成专业报告</p>
      </div>
      <div className="flex gap-4 items-start">
        <ReportForm
          onGenerate={handleGenerate}
          onStop={handleStop}
          isGenerating={isGenerating}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <div className="flex-1">
          <ReportOutput markdown={markdown} sources={sources} isGenerating={isGenerating} />
        </div>
      </div>
    </div>
  );
}
