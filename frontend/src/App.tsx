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
  if (isLoading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
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
