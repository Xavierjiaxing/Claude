import { MessageCircle } from 'lucide-react';

const examples = [
  '注塑工序中飞边问题如何解决？',
  '生物相容性评价需要哪些试验项目？',
  'CAPA-2026-005 的根本原因是什么？',
];

interface WelcomeScreenProps { onExampleClick: (text: string) => void; }

export default function WelcomeScreen({ onExampleClick }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-[#7c3aed]" />
      </div>
      <h3 className="text-lg font-bold bg-gradient-to-r from-[#0f2b6d] to-[#7c3aed] bg-clip-text text-transparent">
        欢迎使用医疗器械 AI 知识库
      </h3>
      <p className="text-sm text-muted-foreground mt-2">
        先在"文档管理"中导入技术文档，然后在此提问
      </p>
      <div className="flex flex-wrap gap-2 justify-center mt-6 max-w-md">
        {examples.map((ex, i) => (
          <button
            key={i}
            onClick={() => onExampleClick(ex)}
            className="text-xs bg-slate-50 hover:bg-violet-50 hover:text-[#7c3aed] border rounded-full px-3 py-1.5 transition-colors cursor-pointer"
          >{ex}</button>
        ))}
      </div>
    </div>
  );
}
