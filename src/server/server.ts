import express from 'express';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { RagPipeline } from '../rag/ragPipeline';
import { Logger } from '../utils/logger';
import { createStatsRouter } from './routes/stats';
import { createDocumentsRouter } from './routes/documents';
import { createIngestRouter } from './routes/ingest';
import { createAskRouter } from './routes/ask';
import { createReportsRouter } from './routes/reports';
import crypto from 'crypto';

const DATA_DIR = path.resolve('./data');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadSessions(): Set<string> {
  ensureDataDir();
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const tokens: string[] = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf-8'));
      return new Set(tokens);
    }
  } catch { /* fresh start */ }
  return new Set();
}

function saveSessions(): void {
  ensureDataDir();
  fs.writeFileSync(SESSIONS_FILE, JSON.stringify([...VALID_TOKENS], null, 2), 'utf-8');
}

const VALID_TOKENS = loadSessions();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { error: '登录尝试过于频繁，请一分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

const ingestLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: '上传过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
});

function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction): void {
  // Allow static assets, login page, health, init-progress, and auth routes without token check
  if (/\.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$/.test(req.path) ||
      req.path === '/login.html' ||
      req.path === '/api/health' ||
      req.path === '/api/init-progress' ||
      req.path === '/api/auth/login' ||
      req.path === '/api/auth/logout') {
    next();
    return;
  }

  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ') || !VALID_TOKENS.has(auth.slice(7))) {
    // Page requests: let frontend JS handle auth check (redirects to /login.html)
    if (!req.path.startsWith('/api/')) {
      next();
      return;
    }
    // API requests: return 401
    res.status(401).json({ error: '未授权访问，请先登录' });
    return;
  }

  next();
}

export async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Security headers
  app.use((_req, res, next) => {
    const isDev = !fs.existsSync(frontendDist);
    const csp = [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net"
        : "script-src 'self' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data:",
      "connect-src 'self' ws://localhost:*",
      "font-src 'self' https://fonts.gstatic.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    res.setHeader('Content-Security-Policy', csp);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // CORS
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  const publicDir = path.resolve(__dirname, '../../public');
  const frontendDist = path.resolve(__dirname, '../../frontend/dist');

  // Auth routes (mounted before auth middleware)
  app.post('/api/auth/login', authLimiter, (req, res) => {
    const { password } = req.body;
    if (password === '721006') {
      const token = crypto.randomBytes(32).toString('hex');
      VALID_TOKENS.add(token);
      saveSessions();
      res.json({ token });
    } else {
      res.status(401).json({ error: '密码错误' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      VALID_TOKENS.delete(auth.slice(7));
      saveSessions();
    }
    res.json({ success: true });
  });

  // Auth middleware (protects everything else)
  app.use(authMiddleware);

  // Serve Vite production build if exists; otherwise fall back to public/
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));
    app.use(express.static(publicDir));
  } else {
    app.use(express.static(publicDir));
  }

  // Serve login page without auth
  app.get('/login.html', (_req, res) => {
    res.sendFile(path.join(publicDir, 'login.html'));
  });

  Logger.info('Starting server...');

  const pipeline = new RagPipeline();

  // Mount API routes (they'll auto-init via ensureInitialized on first use)
  app.use('/api/stats', apiLimiter, createStatsRouter(pipeline));
  app.use('/api/documents', apiLimiter, createDocumentsRouter(pipeline));
  app.use('/api/ingest', ingestLimiter, createIngestRouter(pipeline));
  app.use('/api/ask', apiLimiter, createAskRouter(pipeline));
  app.use('/api/report', apiLimiter, createReportsRouter(pipeline));

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      initialized: pipeline.isInitialized(),
    });
  });

  // SSE endpoint for model download progress during initialization
  let initInProgress = false;
  let initDone = false;
  let initError: string | null = null;
  const initClients: Set<express.Response> = new Set();

  app.get('/api/init-progress', async (_req, res) => {
    if (initDone) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();
      return;
    }

    if (initError) {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(`data: ${JSON.stringify({ type: 'error', message: initError })}\n\n`);
      res.end();
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });
    initClients.add(res);

    res.on('close', () => {
      initClients.delete(res);
    });

    if (!initInProgress) {
      initInProgress = true;

      const fileProgress = new Map<string, number>();
      let modelCount = 0;

      const broadcast = (data: object) => {
        const msg = `data: ${JSON.stringify(data)}\n\n`;
        for (const client of initClients) {
          client.write(msg);
        }
      };

      const onProgress = (info: any) => {
        if (info.file && info.progress !== undefined) {
          fileProgress.set(info.file, info.progress);
        } else if (info.status === 'done' && info.file) {
          fileProgress.set(info.file, 100);
        } else if (info.status === 'ready') {
          modelCount++;
        }

        let overall = 0;
        if (fileProgress.size > 0) {
          overall = Math.round(
            [...fileProgress.values()].reduce((a, b) => a + b, 0) / fileProgress.size
          );
        }

        broadcast({
          type: 'progress',
          overall,
          status: info.status,
          file: info.file || info.name || '',
          modelCount,
        });
      };

      Logger.info('Initializing knowledge base...');
      Logger.info('(First run may download embedding model ~90MB)');

      try {
        await pipeline.initialize(onProgress);
        initDone = true;
        Logger.success('Knowledge base ready');
        broadcast({ type: 'done' });
      } catch (err) {
        initError = (err as Error).message;
        Logger.error('Failed to initialize knowledge base:', err);
        broadcast({ type: 'error', message: initError });
      } finally {
        for (const client of initClients) {
          client.end();
        }
        initClients.clear();
      }
    }
  });

  app.get('/{*splat}', (_req, res) => {
    if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
      res.sendFile(path.join(frontendDist, 'index.html'));
    } else {
      res.sendFile(path.join(publicDir, 'index.html'));
    }
  });

  app.listen(PORT, () => {
    console.log(`\n  ✓ 医疗器械 AI 知识库已启动`);
    console.log(`  ✓ 浏览器打开: http://localhost:${PORT}\n`);
  });

  return app;
}

if (require.main === module || process.argv[1]?.endsWith('server.ts')) {
  createServer().catch((err) => {
    Logger.error('Failed to start server:', err);
    process.exit(1);
  });
}
