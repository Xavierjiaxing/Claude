import type { LucideIcon } from 'lucide-react';

interface ActionCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}

export default function ActionCard({ icon: Icon, title, description, onClick }: ActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start gap-4 p-5 bg-card rounded-xl border border-border hover:border-[#7c3aed]/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left cursor-pointer group"
    >
      <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
        <Icon className="h-5 w-5 text-[#7c3aed]" />
      </div>
      <div>
        <p className="font-semibold text-sm">{title}</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
      </div>
    </button>
  );
}
