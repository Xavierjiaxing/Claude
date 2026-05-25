# 前端视觉重设计 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将现有原生 HTML/CSS/JS 前端迁移为 React + Tailwind CSS + shadcn/ui，提升专业产品感

**Architecture:** Vite + React 18 + TypeScript 构建 SPA，React Router 管理路由，shadcn/ui 提供组件，Express 后端 API 不变。开发时 Vite 代理 API 到 Express，生产时 Express 托管 Vite 构建产物。

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, React Router v6, framer-motion, marked, lucide-react, Inter + Noto Sans SC 字体

---

## 文件结构

```
frontend/                          -- 新建 Vite 项目目录
  package.json
  vite.config.ts
  tsconfig.json (via vite scaffold)
  index.html
  src/
    index.css                      -- Tailwind + brand tokens + fonts
    main.tsx                       -- React entry
    App.tsx                        -- Router + AuthProvider + Toaster
    lib/
      api.ts                       -- 从 public/js/api.js 迁移
      types.ts                     -- API 类型定义
      utils.ts                     -- formatTokens, formatDate
    hooks/
      useAuth.ts                   -- 认证 Context + Provider
    components/
      ui/                          -- shadcn/ui 组件
      layout/
        AppLayout.tsx              -- Header + Sidebar + Outlet
        Header.tsx                 -- 品牌 Header + Token 显示 + 退出
        Sidebar.tsx                -- 侧边栏导航
      dashboard/
        StatCard.tsx
        ActionCard.tsx
        RecentConversations.tsx
      documents/
        UploadZone.tsx
        UploadProgress.tsx
        DocTable.tsx
        DocToolbar.tsx
        FileTypeBadge.tsx
      qa/
        ChatBubble.tsx
        ChatInput.tsx
        ConvList.tsx
        SourceCard.tsx
        WelcomeScreen.tsx
      report/
        ReportForm.tsx
        ReportOutput.tsx
      stats/
        TokenOverview.tsx
        DailyTable.tsx
        SystemInfo.tsx
      InitOverlay.tsx
    pages/
      DashboardPage.tsx
      DocumentsPage.tsx
      QAPage.tsx
      ReportPage.tsx
      StatsPage.tsx
      LoginPage.tsx
```

---

### Task 1: 初始化 Vite + React + TypeScript 项目

**Files:**
- Create: `frontend/` (entire Vite scaffold)

- [ ] **Step 1: Run Vite scaffold**

```bash
cd D:/052001 && npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install core dependencies**

```bash
cd D:/052001/frontend && npm install && npm install react-router-dom framer-motion marked tailwindcss @tailwindcss/vite lucide-react
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
cd D:/052001/frontend && npx shadcn@latest init -d
```
(Select: TypeScript, Tailwind v4, neutral → slate, CSS variables → yes)

- [ ] **Step 4: Add shadcn/ui components**

```bash
cd D:/052001/frontend && npx shadcn@latest add button card table badge input textarea select dialog progress accordion separator scroll-area tooltip pagination sonner avatar dropdown-menu checkbox
```

- [ ] **Step 5: Configure Vite proxy and alias**

Write `frontend/vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:3000' },
  },
})
```

- [ ] **Step 6: Write brand tokens into index.css**

Write `frontend/src/index.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-brand: #0f2b6d;
  --color-brand-light: #eef1f8;
  --color-accent: #7c3aed;
  --color-accent-light: #f5f3ff;
  --font-sans: 'Inter', 'Noto Sans SC', system-ui, sans-serif;
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.145 0 0);
  --primary: oklch(0.28 0.10 265);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0.01 265);
  --secondary-foreground: oklch(0.28 0.10 265);
  --muted: oklch(0.96 0.005 265);
  --muted-foreground: oklch(0.55 0.02 265);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.55 0.2 20);
  --border: oklch(0.9 0.01 265);
  --input: oklch(0.9 0.01 265);
  --ring: oklch(0.52 0.18 280);
  --sidebar: oklch(0.985 0.002 265);
  --sidebar-foreground: oklch(0.25 0.05 265);
  --sidebar-primary: oklch(0.28 0.10 265);
  --sidebar-primary-foreground: oklch(0.98 0 0);
  --sidebar-accent: oklch(0.96 0.01 265);
  --sidebar-accent-foreground: oklch(0.28 0.10 265);
  --sidebar-border: oklch(0.9 0.01 265);
  --sidebar-ring: oklch(0.52 0.18 280);
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: var(--font-sans);
    font-size: 14px;
    line-height: 1.6;
  }
}
```

- [ ] **Step 7: Write index.html with Google Fonts**

Write `frontend/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>医疗器械 AI 知识库</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+SC:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

- [ ] **Step 8: Commit**

```bash
cd D:/052001 && git add frontend/ && git commit -m "feat: scaffold Vite + React + Tailwind + shadcn/ui project"
```

---

### Task 2: API 客户端、类型和工具函数

**Files:**
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/utils.ts`

- [ ] **Step 1: Write TypeScript types**

Write `frontend/src/lib/types.ts`:

```typescript
export interface DocumentInfo {
  fileName: string;
  filePath: string;
  fileType: string;
  chunkCount: number;
  ingestedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  chunks?: ChunkInfo[];
}

export interface ChunkInfo {
  text: string;
  sourceFile: string;
  score: number;
}

export interface StatsResponse {
  totalChunks: number;
  totalDocuments: number;
}

export interface TokenStats {
  inputTokens: number;
  outputTokens: number;
  dailyHistory: DailyTokenEntry[];
}

export interface DailyTokenEntry {
  date: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ReportType {
  type: string;
  name: string;
  description: string;
}

export interface DocumentsResponse {
  documents: DocumentInfo[];
  total: number;
  page: number;
  totalPages: number;
}
```

- [ ] **Step 2: Write API client**

Write `frontend/src/lib/api.ts`:

```typescript
function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('auth_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse(res: Response) {
  if (res.status === 401) {
    sessionStorage.removeItem('auth_token');
    window.location.href = '/login';
    throw new Error('未授权');
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const res = await fetch(path, { headers: authHeaders() });
    return handleResponse(res);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  async del<T>(path: string, body?: unknown): Promise<T> {
    const res = await fetch(path, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse(res);
  },

  upload<T>(path: string, formData: FormData, onProgress?: (pct: number) => void): Promise<T> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', path);
      const token = sessionStorage.getItem('auth_token');
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      });
      xhr.addEventListener('load', () => {
        if (xhr.status === 401) {
          sessionStorage.removeItem('auth_token');
          window.location.href = '/login';
          reject(new Error('未授权'));
          return;
        }
        if (xhr.status >= 200 && xhr.status < 300) resolve(JSON.parse(xhr.responseText));
        else reject(new Error(JSON.parse(xhr.responseText || '{}').error || `HTTP ${xhr.status}`));
      });
      xhr.addEventListener('error', () => reject(new Error('网络连接失败')));
      xhr.send(formData);
    });
  },

  async stream(
    path: string,
    body: unknown,
    onChunk: (text: string) => void,
    onDone: (sources: string[], chunks: { text: string; sourceFile: string; score: number }[], conversationId: string) => void,
    onError: (msg: string) => void,
    signal?: AbortSignal,
  ) {
    try {
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
        signal,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'chunk') onChunk(data.text);
              else if (data.type === 'done') onDone(data.sources || [], data.chunks || [], data.conversationId);
              else if (data.type === 'error') onError(data.message);
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
          }
        }
      }
    } catch (err) {
      if (onError) onError((err as Error).message || String(err));
    }
  },
};
```

- [ ] **Step 3: Write utility functions**

Write `frontend/src/lib/utils.ts`:

```typescript
export function formatTokens(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '--';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

export function formatDate(d: string | null | undefined): string {
  if (!d) return '--';
  const dt = new Date(d);
  const now = new Date();
  if (dt.toDateString() === now.toDateString()) {
    return dt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }
  return dt.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

export function formatDateTime(d: string | null | undefined): string {
  if (!d) return '--';
  return new Date(d).toLocaleString('zh-CN');
}
```

- [ ] **Step 4: Commit**

```bash
cd D:/052001 && git add frontend/src/lib/ && git commit -m "feat: add API client, types, and utilities"
```

---

### Task 3: 认证系统与路由

**Files:**
- Create: `frontend/src/hooks/useAuth.ts`
- Modify: `frontend/src/App.tsx`
- Write: `frontend/src/main.tsx`
- Create: `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Write useAuth hook**

Write `frontend/src/hooks/useAuth.ts`:

```typescript
import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { api } from '@/lib/api';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(!!sessionStorage.getItem('auth_token'));
    setIsLoading(false);
  }, []);

  const login = useCallback(async (password: string) => {
    const data = await api.post<{ token: string }>('/api/auth/login', { password });
    sessionStorage.setItem('auth_token', data.token);
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try { await api.post('/api/auth/logout', {}); } catch { /* ignore */ }
    sessionStorage.removeItem('auth_token');
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

- [ ] **Step 2: Write LoginPage**

Write `frontend/src/pages/LoginPage.tsx`:

```tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try { await login(password); }
    catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#022b71] via-[#0f2b6d] to-[#5b21b6]">
      <Card className="w-[380px] shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f2b6d] to-[#7c3aed] flex items-center justify-center text-white text-xl font-bold">医</div>
          <CardTitle className="text-lg">医疗器械 AI 知识库</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input type="password" placeholder="请输入访问密码" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>{loading ? '登录中...' : '登录'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3: Write App.tsx**

Write `frontend/src/App.tsx`:

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import DocumentsPage from '@/pages/DocumentsPage';
import QAPage from '@/pages/QAPage';
import ReportPage from '@/pages/ReportPage';
import StatsPage from '@/pages/StatsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route index element={<DashboardPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="qa" element={<QAPage />} />
            <Route path="report" element={<ReportPage />} />
            <Route path="stats" element={<StatsPage />} />
          </Route>
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

- [ ] **Step 4: Write main.tsx**

Write `frontend/src/main.tsx`:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><App /></React.StrictMode>
);
```

- [ ] **Step 5: Create placeholder page files**

Write `frontend/src/pages/DashboardPage.tsx`:

```tsx
export default function DashboardPage() { return <div>Dashboard</div>; }
```

Do the same for DocumentsPage, QAPage, ReportPage, StatsPage (replace function name and text).

- [ ] **Step 6: Commit**

```bash
cd D:/052001 && git add frontend/src/hooks/ frontend/src/App.tsx frontend/src/main.tsx frontend/src/pages/ && git commit -m "feat: add auth system, routing, login page, and page shells"
```


---

### Task 4: 布局组件 (AppLayout, Header, Sidebar)

**Files:**
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/components/layout/Header.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Write Header**

Write `frontend/src/components/layout/Header.tsx`:

```tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default function Header() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="relative h-14 bg-gradient-to-r from-[#022b71] via-[#0f2b6d] to-[#5b21b6] flex items-center justify-between px-6 text-white shrink-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      <div className="flex items-center gap-3 relative">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
            <svg viewBox="0 0 32 32" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="4" y="8" width="24" height="16" rx="4" />
              <line x1="16" y1="8" x2="16" y2="24" />
              <line x1="10" y1="14" x2="22" y2="14" strokeLinecap="round" />
              <line x1="10" y1="18" x2="22" y2="18" strokeLinecap="round" />
            </svg>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
        </div>
        <div className="leading-tight">
          <h1 className="text-base font-bold tracking-wide">医疗器械 AI 知识库</h1>
          <p className="text-[10px] opacity-65 font-normal">RAG 智能检索与报告生成系统</p>
        </div>
      </div>
      <div className="flex items-center gap-3 relative">
        <button onClick={() => navigate('/stats')}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full px-3 py-1 text-xs cursor-pointer border border-white/10">
          <span className="font-bold tabular-nums" id="headerTokenVal">--</span>
          <span className="opacity-60 text-[10px] uppercase tracking-wider">Tokens</span>
        </button>
        <Button variant="ghost" size="icon" onClick={logout} className="rounded-full hover:bg-white/15 text-white h-8 w-8" title="退出登录">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Write Sidebar**

Write `frontend/src/components/layout/Sidebar.tsx`:

```tsx
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
```

- [ ] **Step 3: Write AppLayout**

Write `frontend/src/components/layout/AppLayout.tsx`:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
cd D:/052001 && git add frontend/src/components/layout/ && git commit -m "feat: add AppLayout, Header, and Sidebar components"
```

---

### Task 5: 仪表盘页面

**Files:** `StatCard.tsx`, `ActionCard.tsx`, `RecentConversations.tsx` in `frontend/src/components/dashboard/`; rewrite `pages/DashboardPage.tsx`

Key design points:
- StatCard: LucideIcon + value text-2xl font-bold + label text-xs uppercase tracking-wider. Card hover:-translate-y-0.5
- ActionCard: icon in violet-50 bg, hover:border-[#7c3aed]/40 hover:-translate-y-0.5
- RecentConversations: skeleton loading, empty state with MessageCircle icon, clickable list items linking to /qa
- DashboardPage: 3x StatCard grid + 3x ActionCard grid + RecentConversations card. Loads /api/stats and /api/stats/tokens on mount

---

### Task 6: 文档管理页面

**Files:** `FileTypeBadge.tsx`, `UploadZone.tsx`, `UploadProgress.tsx`, `DocToolbar.tsx`, `DocTable.tsx` in `frontend/src/components/documents/`; rewrite `pages/DocumentsPage.tsx`

Key design points:
- FileTypeBadge: color-coded badges per file extension
- UploadZone: dashed border with drag-over violet highlight + pulse animation. Processes files sequentially via api.upload()
- UploadProgress: Card with Progress bar + file list with status icons (CheckCircle2/XCircle/Loader2/Clock)
- DocToolbar: search Input + stats bar + batch delete Button + refresh Button
- DocTable: shadcn/ui Table with Checkbox, sortable headers (ArrowUpDown icon), alternating row colors, hover violet highlight, delete button visible on row hover
- DocumentsPage: state for docs, search, sort, pagination (PAGE_SIZE=20), multi-select delete. loadDocs() called on page/search/sort change

---

### Task 7: 智能问答页面

**Files:** `WelcomeScreen.tsx`, `ChatBubble.tsx`, `SourceCard.tsx`, `ConvList.tsx`, `ChatInput.tsx` in `frontend/src/components/qa/`; rewrite `pages/QAPage.tsx`

Key design points:
- WelcomeScreen: centered MessageCircle icon, gradient title, 3 example question chips
- ChatBubble: user=gradient bg right-aligned with User icon, assistant=white card left-aligned with Bot icon, markdown rendered via marked
- SourceCard: Accordion with Search icon trigger "检索到的文档片段 (N)", each chunk shows #N + sourceFile + score Badge (color-coded: >=0.7 green, >=0.4 amber, <0.4 red)
- ConvList: search Input + "新建对话" Button + scrollable list with active violet left border, delete X button on hover
- ChatInput: auto-resize textarea, Ctrl+Enter to send, violet Send button (disabled if empty), red Stop button during streaming
- QAPage: manages conversations, messages, streaming state. Uses api.stream() with AbortController. Shows bouncing dots animation during streaming

---

### Task 8: 报告生成页面

**Files:** `ReportForm.tsx`, `ReportOutput.tsx` in `frontend/src/components/report/`; rewrite `pages/ReportPage.tsx`

Key design points:
- ReportForm: collapsible sidebar (ChevronLeft/ChevronRight toggle), Select for report types loaded from /api/report/types, Input for title, Textarea for focus. Generate/Stop buttons
- ReportOutput: sticky toolbar with Copy (check animation) + Download MD buttons. prose rendering of markdown. Sources footer. Loader2 spinner during generation
- ReportPage: orchestrates streaming via api.stream('/api/report', ...). Auto-collapses form on completion

---

### Task 9: 使用统计页面

**Files:** `TokenOverview.tsx`, `DailyTable.tsx`, `SystemInfo.tsx` in `frontend/src/components/stats/`; rewrite `pages/StatsPage.tsx`

Key design points:
- TokenOverview: two gradient progress bars (input=blue-purple, output=green) + total in large violet text
- DailyTable: shadcn/ui Table with sorted date list (newest first), empty state row
- SystemInfo: icon+label+value rows with green pulse dot on "运行中" status
- StatsPage: 2-column grid (TokenOverview + DailyTable) + full-width SystemInfo

---

### Task 10: 初始化覆盖层

**File:** `frontend/src/components/InitOverlay.tsx`

Key design points:
- Full-screen violet overlay (bg-[#022b71]/95) with centered card
- EventSource connects to /api/init-progress
- Progress bar + status text + file detail
- Calls onDone() when init completes
- Cleanup: close EventSource on unmount

---

### Task 11: 服务端适配

**File:** `src/server/server.ts`

Changes:
1. Add `frontendDist` path constant pointing to `../../frontend/dist`
2. Serve frontend/dist as static (with fallback to public/)
3. Update CSP: allow 'unsafe-eval' in dev mode, add https://fonts.googleapis.com and https://fonts.gstatic.com
4. Update catch-all route to serve frontend/dist/index.html in production

---

### Task 12: 构建验证与 gitignore

1. Add `"fe:dev"`, `"fe:build"`, `"build:all"` scripts to root package.json
2. Add `frontend/dist/` and `frontend/node_modules/` to .gitignore
3. Run `npm run build` in frontend/ to verify production build
4. Run `npm run web` and test at http://localhost:3000
5. Final commit
