import { Outlet } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-slate-50">
      <header className="h-14 bg-gradient-to-r from-[#022b71] via-[#0f2b6d] to-[#5b21b6] flex items-center px-6 text-white shrink-0">
        <h1 className="text-base font-bold">医疗器械 AI 知识库</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
