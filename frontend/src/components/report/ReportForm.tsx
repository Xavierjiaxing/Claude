import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import type { ReportType } from '@/lib/types';
import { FileEdit, ChevronLeft, ChevronRight, Square } from 'lucide-react';

interface ReportFormProps {
  onGenerate: (type: string, title: string, focus: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ReportForm({ onGenerate, onStop, isGenerating, collapsed, onToggleCollapse }: ReportFormProps) {
  const [types, setTypes] = useState<ReportType[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');
  const [focus, setFocus] = useState('');

  useEffect(() => {
    api.get<{ types: ReportType[] }>('/api/report/types')
      .then(d => setTypes(d.types || []))
      .catch(() => {});
  }, []);

  const handleGenerate = () => {
    if (!selectedType) return;
    onGenerate(selectedType, title.trim(), focus.trim());
  };

  return (
    <div className={`bg-card rounded-xl border overflow-hidden transition-all duration-300 ${collapsed ? 'w-11 min-w-11' : 'w-[280px] min-w-[260px]'}`}>
      <div className={`flex items-center justify-between p-3.5 ${!collapsed ? 'border-b' : ''}`}>
        {!collapsed && <h3 className="text-sm font-semibold">报告配置</h3>}
        <button onClick={onToggleCollapse} className="text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold mb-1.5 block">报告类型</label>
            <Select value={selectedType} onValueChange={(v) => setSelectedType(v ?? '')}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="-- 请选择 --" />
              </SelectTrigger>
              <SelectContent>
                {types.map(t => (
                  <SelectItem key={t.type} value={t.type} className="text-xs">
                    {t.name} — {t.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">报告标题（可选）</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedType === 'sop-version-compare' ? '输入 SOP 文件编号或名称关键词' : '例如：B20260312 批次滴斗歪斜 CAPA 报告'}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="text-xs font-semibold mb-1.5 block">关注点（可选）</label>
            <Textarea
              value={focus}
              onChange={(e) => setFocus(e.target.value)}
              placeholder="描述你希望报告重点分析的方向..."
              rows={3}
              className="text-xs resize-y"
            />
          </div>
          <div className="space-y-2">
            {isGenerating ? (
              <Button variant="destructive" onClick={onStop} className="w-full h-9 text-xs">
                <Square className="h-3.5 w-3.5 mr-1" /> 停止生成
              </Button>
            ) : (
              <Button onClick={handleGenerate} disabled={!selectedType} className="w-full h-9 text-xs bg-[#7c3aed] hover:bg-[#6d28d9]">
                <FileEdit className="h-3.5 w-3.5 mr-1" /> 生成报告
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
