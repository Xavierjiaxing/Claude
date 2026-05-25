import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatTokens } from '@/lib/utils';
import type { TokenStats } from '@/lib/types';
import { LogOut } from 'lucide-react';

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [tokenDisplay, setTokenDisplay] = useState('--');

  useEffect(() => {
    const refresh = async () => {
      try {
        const data = await api.get<TokenStats>('/api/stats/tokens');
        const total = (data.inputTokens || 0) + (data.outputTokens || 0);
        setTokenDisplay(formatTokens(total));
      } catch { /* ignore */ }
    };
    refresh();
    const interval = setInterval(refresh, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="relative h-14 bg-gradient-to-r from-[#022b71] via-[#0f2b6d] to-[#5b21b6] flex items-center justify-between px-6 text-white shrink-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3 relative">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="8" width="24" height="16" rx="4" />
              <line x1="16" y1="8" x2="16" y2="24" />
              <line x1="10" y1="14" x2="22" y2="14" strokeLinecap="round" />
              <line x1="10" y1="18" x2="22" y2="18" strokeLinecap="round" />
            </svg>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-bold tracking-wide">医疗器械 AI 知识库</h1>
          <p className="text-[10px] opacity-65 font-normal">RAG 智能检索与报告生成系统</p>
        </div>
      </div>
      <div className="flex items-center gap-3 relative">
        <button onClick={() => navigate('/stats')}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full px-3 py-1 text-xs cursor-pointer border border-white/10">
          <span className="font-bold tabular-nums">{tokenDisplay}</span>
          <span className="opacity-60 text-[10px] uppercase tracking-wider">Tokens</span>
        </button>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-full hover:bg-white/15 text-white h-8 w-8" title="退出登录">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
