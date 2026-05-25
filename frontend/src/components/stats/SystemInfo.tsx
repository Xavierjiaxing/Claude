import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Cpu, Database, Activity } from 'lucide-react';

export default function SystemInfo() {
  const items = [
    { icon: Cpu, label: '向量模型', value: 'bge-small-zh-v1.5 / bge-small-en-v1.5' },
    { icon: Cpu, label: '大语言模型', value: 'claude-sonnet-4-6' },
    { icon: Database, label: '向量维度', value: '512' },
    { icon: Database, label: '数据存储', value: 'LanceDB' },
    { icon: Activity, label: '运行状态', value: '运行中', valueColor: 'text-emerald-500' },
  ];

  return (
    <Card>
      <CardHeader><CardTitle className="text-sm">系统信息</CardTitle></CardHeader>
      <CardContent className="space-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between items-center py-2.5 border-b last:border-0 text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <item.icon className="h-3.5 w-3.5" /> {item.label}
            </span>
            <span className={`font-semibold ${item.valueColor || 'text-foreground'}`}>
              {item.value}
              {item.label === '运行状态' && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
