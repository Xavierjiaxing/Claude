import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TokenStats } from '@/lib/types';
import { formatTokens } from '@/lib/utils';

interface TokenOverviewProps { data: TokenStats | null; }

export default function TokenOverview({ data }: TokenOverviewProps) {
  const input = data?.inputTokens || 0;
  const output = data?.outputTokens || 0;
  const total = input + output;
  const maxTokens = Math.max(input, output, 1);

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">Token 消耗概览</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">累计输入</span>
              <span className="font-bold tabular-nums">{formatTokens(input)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#0f2b6d] to-[#7c3aed] rounded-full transition-all duration-500" style={{ width: `${Math.round(input / maxTokens * 100)}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">累计输出</span>
              <span className="font-bold tabular-nums">{formatTokens(output)}</span>
            </div>
            <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-300 rounded-full transition-all duration-500" style={{ width: `${Math.round(output / maxTokens * 100)}%` }} />
            </div>
          </div>
        </div>
        <div className="flex justify-between pt-3 border-t text-sm">
          <span className="font-semibold">合计</span>
          <span className="font-bold text-[#7c3aed] tabular-nums text-lg">{formatTokens(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
