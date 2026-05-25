import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import type { Conversation } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { MessageCircle } from 'lucide-react';

export default function RecentConversations() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get<{ conversations: Conversation[] }>('/api/ask/conversations')
      .then(data => {
        const sorted = (data.conversations || []).sort(
          (a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')
        );
        setConvs(sorted.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">最近对话</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="h-8 bg-muted rounded animate-pulse" />)}
          </div>
        ) : convs.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p>尚无对话记录</p>
            <p className="text-xs mt-1">开始一次智能问答吧</p>
          </div>
        ) : (
          <div className="divide-y divide-border -mx-2">
            {convs.map(conv => (
              <div
                key={conv.id}
                onClick={() => navigate('/qa')}
                className="flex justify-between items-center px-2 py-2.5 cursor-pointer hover:text-[#7c3aed] transition-colors rounded-md hover:bg-violet-50/50"
              >
                <span className="text-sm truncate font-medium">{conv.title || '新对话'}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-3">{formatDate(conv.updatedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
