import { useEffect, useState, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { api } from '@/lib/api';
import type { Conversation, Message } from '@/lib/types';
import ConvList from '@/components/qa/ConvList';
import ChatBubble from '@/components/qa/ChatBubble';
import ChatInput from '@/components/qa/ChatInput';
import WelcomeScreen from '@/components/qa/WelcomeScreen';
import { toast } from 'sonner';

export default function QAPage() {
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [convSearch, setConvSearch] = useState('');
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  const loadConvs = useCallback(async () => {
    try {
      const data = await api.get<{ conversations: Conversation[] }>('/api/ask/conversations');
      setConvs(data.conversations || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  const filteredConvs = convs.filter(c =>
    !convSearch.trim() || (c.title || '').toLowerCase().includes(convSearch.trim().toLowerCase())
  );

  const handleSelectConv = async (id: string) => {
    try {
      const data = await api.get<{ conversations: Conversation[] }>('/api/ask/conversations');
      const conv = (data.conversations || []).find(c => c.id === id);
      if (!conv) return;
      setActiveConvId(id);
      setMessages(conv.messages || []);
    } catch (err) { toast.error('加载对话失败: ' + (err as Error).message); }
  };

  const handleNewConv = () => {
    setActiveConvId(null);
    setMessages([]);
    setInput('');
  };

  const handleDeleteConv = async (id: string) => {
    if (!confirm('确定要删除此对话吗？')) return;
    try {
      await api.del('/api/ask/conversations/' + id);
      if (activeConvId === id) handleNewConv();
      loadConvs();
      toast.success('对话已删除');
    } catch (err) { toast.error('删除失败: ' + (err as Error).message); }
  };

  const handleSend = async () => {
    const question = input.trim();
    if (!question || isStreaming) return;

    const userMsg: Message = { role: 'user', content: question, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    let rawText = '';
    let firstChunk = true;
    const controller = new AbortController();
    abortRef.current = controller;

    api.stream(
      '/api/ask',
      { question, conversationId: activeConvId, stream: true },
      (chunk) => {
        rawText += chunk;
        if (firstChunk) {
          firstChunk = false;
          flushSync(() => setStreamingText(rawText));
        } else {
          setStreamingText(rawText);
        }
      },
      (sources, chunks, convId) => {
        setActiveConvId(convId);
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: rawText,
          timestamp: new Date().toISOString(),
          sources,
          chunks: chunks?.length > 0 ? chunks : undefined,
        }]);
        setStreamingText('');
        setIsStreaming(false);
        abortRef.current = null;
        loadConvs();
      },
      (errMsg) => {
        if (!rawText) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: '抱歉，请求失败: ' + errMsg,
            timestamp: new Date().toISOString(),
          }]);
        }
        setStreamingText('');
        setIsStreaming(false);
        abortRef.current = null;
      },
      controller.signal,
    );
  };

  const handleStop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (streamingText) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: streamingText,
        timestamp: new Date().toISOString(),
      }]);
      setStreamingText('');
    }
    setIsStreaming(false);
    loadConvs();
  };

  const displayMessages = [...messages];
  if (isStreaming && streamingText) {
    displayMessages.push({
      role: 'assistant',
      content: streamingText,
      timestamp: new Date().toISOString(),
    });
  }

  return (
    <div className="flex h-[calc(100vh-130px)] min-h-[480px] bg-card rounded-xl border overflow-hidden">
      <div className="w-[260px] min-w-[200px] border-r flex flex-col bg-slate-50/30">
        <ConvList
          convs={filteredConvs}
          activeConvId={activeConvId}
          searchQuery={convSearch}
          onSearchChange={setConvSearch}
          onSelect={handleSelectConv}
          onDelete={handleDeleteConv}
          onNew={handleNewConv}
        />
      </div>
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex-1 overflow-y-auto p-4">
          {displayMessages.length === 0 ? (
            <WelcomeScreen onExampleClick={(text) => setInput(text)} />
          ) : (
            <div>
              {displayMessages.map((msg, i) => <ChatBubble key={i} msg={msg} />)}
              {isStreaming && streamingText === '' && (
                <div className="flex gap-1.5 px-4 py-3">
                  <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 bg-[#7c3aed] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          onStop={handleStop}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  );
}
