import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import type { ChunkInfo } from '@/lib/types';
import { Search } from 'lucide-react';

interface SourceCardProps { chunks: ChunkInfo[]; sources?: string[]; }

function scoreBadge(score: number) {
  if (score >= 0.7) return <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-600 border-emerald-200">相关度 {Math.round(score * 100)}%</Badge>;
  if (score >= 0.4) return <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-600 border-amber-200">相关度 {Math.round(score * 100)}%</Badge>;
  return <Badge variant="outline" className="text-[10px] bg-red-50 text-red-600 border-red-200">相关度 {Math.round(score * 100)}%</Badge>;
}

export default function SourceCard({ chunks }: SourceCardProps) {
  return (
    <Accordion className="w-full">
      <AccordionItem className="border-0">
        <AccordionTrigger className="text-xs text-muted-foreground hover:text-[#7c3aed] py-1 no-underline hover:no-underline">
          <span className="flex items-center gap-1.5">
            <Search className="h-3 w-3" /> 检索到的文档片段 ({chunks.length})
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-1">
            {chunks.map((c, i) => (
              <div key={i} className="bg-slate-50/50 border rounded-md p-2.5 text-xs">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-semibold text-[#7c3aed]">#{i + 1}</span>
                  <span className="truncate flex-1 text-muted-foreground">{c.sourceFile}</span>
                  {scoreBadge(c.score)}
                </div>
                <p className="text-muted-foreground leading-relaxed line-clamp-4 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
