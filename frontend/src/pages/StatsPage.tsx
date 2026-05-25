import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { TokenStats } from '@/lib/types';
import TokenOverview from '@/components/stats/TokenOverview';
import DailyTable from '@/components/stats/DailyTable';
import SystemInfo from '@/components/stats/SystemInfo';
import { BarChart3 } from 'lucide-react';

export default function StatsPage() {
  const [data, setData] = useState<TokenStats | null>(null);

  useEffect(() => {
    api.get<TokenStats>('/api/stats/tokens').then(setData).catch(() => {});
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />使用统计
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Token 消耗与系统运行数据</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TokenOverview data={data} />
        <DailyTable history={data?.dailyHistory || []} />
      </div>
      <SystemInfo />
    </div>
  );
}
