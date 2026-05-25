import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import InitOverlay from '@/components/InitOverlay';
import { api } from '@/lib/api';

export default function AppLayout() {
  const [docCount, setDocCount] = useState<number | undefined>(undefined);
  const [initDone, setInitDone] = useState(true);

  useEffect(() => {
    api.get<{ initialized: boolean }>('/api/health')
      .then(data => { if (!data.initialized) setInitDone(false); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const load = async () => {
      try { const data = await api.get<{ totalDocuments: number }>('/api/stats'); setDocCount(data.totalDocuments); } catch {}
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!initDone) return <InitOverlay onDone={() => setInitDone(true)} />;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar docCount={docCount} />
        <main className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
