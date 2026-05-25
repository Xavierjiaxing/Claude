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
