import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { formatTokens } from '@/lib/utils';
import type { StatsResponse, TokenStats } from '@/lib/types';
import StatCard from '@/components/dashboard/StatCard';
import ActionCard from '@/components/dashboard/ActionCard';
import RecentConversations from '@/components/dashboard/RecentConversations';
import { FileText, Grid3X3, Zap, Upload, MessageCircle, FileEdit } from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [docCount, setDocCount] = useState('--');
  const [chunkCount, setChunkCount] = useState('--');
  const [todayTokens, setTodayTokens] = useState('--');

  useEffect(() => {
    const load = async () => {
      try {
        const [stats, tokens] = await Promise.all([
          api.get<StatsResponse>('/api/stats'),
          api.get<TokenStats>('/api/stats/tokens'),
        ]);
        setDocCount(String(stats.totalDocuments || 0));
        setChunkCount(String(stats.totalChunks || 0));

        const today = new Date().toISOString().slice(0, 10);
        const todayEntry = (tokens.dailyHistory || []).find(d => d.date === today);
        const todayTotal = todayEntry
          ? (todayEntry.inputTokens || 0) + (todayEntry.outputTokens || 0)
          : 0;
        setTodayTokens(formatTokens(todayTotal));
      } catch { /* ignore */ }
    };
    load();
    const interval = setInterval(load, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Grid3X3 className="h-5 w-5" />系统总览
        </h2>
        <p className="text-sm text-muted-foreground mt-1">知识库运行状态与快速操作</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={FileText} label="文档总数" value={docCount} iconBg="bg-blue-50" iconColor="text-[#0f2b6d]" />
        <StatCard icon={Grid3X3} label="文本片段" value={chunkCount} iconBg="bg-violet-50" iconColor="text-[#7c3aed]" />
        <StatCard icon={Zap} label="今日 Token 消耗" value={todayTokens} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <ActionCard icon={Upload} title="上传文档" description="导入 PDF、DOCX、图片等文件" onClick={() => navigate('/documents')} />
        <ActionCard icon={MessageCircle} title="智能问答" description="基于知识库的 RAG 检索问答" onClick={() => navigate('/qa')} />
        <ActionCard icon={FileEdit} title="生成报告" description="CAPA、验证、技术总结等专业报告" onClick={() => navigate('/report')} />
      </div>

      <RecentConversations />
    </div>
  );
}
