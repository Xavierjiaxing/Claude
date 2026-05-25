import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DailyTokenEntry } from '@/lib/types';
import { formatTokens } from '@/lib/utils';

interface DailyTableProps { history: DailyTokenEntry[]; }

export default function DailyTable({ history }: DailyTableProps) {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">每日 Token 消耗</CardTitle></CardHeader>
      <CardContent>
        <div className="max-h-[300px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-wider">日期</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">输入</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">输出</TableHead>
                <TableHead className="text-xs uppercase tracking-wider">合计</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">暂无数据</TableCell>
                </TableRow>
              ) : (
                sorted.map(d => (
                  <TableRow key={d.date}>
                    <TableCell className="text-xs tabular-nums">{d.date}</TableCell>
                    <TableCell className="text-xs tabular-nums">{formatTokens(d.inputTokens)}</TableCell>
                    <TableCell className="text-xs tabular-nums">{formatTokens(d.outputTokens)}</TableCell>
                    <TableCell className="text-xs font-semibold tabular-nums">
                      {formatTokens((d.inputTokens || 0) + (d.outputTokens || 0))}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
