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
