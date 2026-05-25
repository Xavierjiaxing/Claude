import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LayoutGrid, FileText, MessageCircle, FileEdit, BarChart3 } from 'lucide-react';

const navItems = [
  { path: '/', label: '总览', icon: LayoutGrid },
  { path: '/documents', label: '文档管理', icon: FileText, badgeKey: 'docCount' as const },
  { path: '/qa', label: '智能问答', icon: MessageCircle },
  { path: '/report', label: '报告生成', icon: FileEdit },
  { path: '/stats', label: '使用统计', icon: BarChart3 },
];

interface SidebarProps { docCount?: number; }

export default function Sidebar({ docCount }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="w-[200px] bg-sidebar border-r border-sidebar-border flex flex-col py-3 shrink-0 overflow-y-auto">
      {navItems.slice(0, 4).map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 mx-2 rounded-md text-sm font-medium transition-all duration-150 text-left
              ${isActive ? 'bg-violet-50 text-primary shadow-sm border-l-[3px] border-l-[#7c3aed] pl-2.5'
                         : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground border-l-[3px] border-l-transparent pl-2.5'}`}>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
            {item.badgeKey === 'docCount' && docCount !== undefined && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 min-w-4 justify-center font-bold">{docCount}</Badge>
            )}
          </button>
        );
      })}
      <Separator className="my-2 mx-3 w-auto" />
      {navItems.slice(4).map((item) => {
        const isActive = location.pathname === item.path;
        const Icon = item.icon;
        return (
          <button key={item.path} onClick={() => navigate(item.path)}
            className={`flex items-center gap-2.5 px-3.5 py-2.5 mx-2 rounded-md text-sm font-medium transition-all duration-150 text-left
              ${isActive ? 'bg-violet-50 text-primary shadow-sm border-l-[3px] border-l-[#7c3aed] pl-2.5'
                         : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground border-l-[3px] border-l-transparent pl-2.5'}`}>
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="flex-1 truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
