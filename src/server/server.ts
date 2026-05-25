import express from 'express';
import path from 'path';
import { RagPipeline } from '../rag/ragPipeline';
import { Logger } from '../utils/logger';
import { createStatsRouter } from './routes/stats';
import { createDocumentsRouter } from './routes/documents';
import { createIngestRouter } from './routes/ingest';
import { createAskRouter } from './routes/ask';
import { createReportsRouter } from './routes/reports';

export async function createServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  const publicDir = path.resolve(__dirname, '../../public');
  app.use(express.static(publicDir));

  Logger.info('Initializing knowledge base...');
  Logger.info('(First run may download embedding model ~90MB)');

  const pipeline = new RagPipeline();
  await pipeline.initialize();

  Logger.success('Knowledge base ready');

  app.use('/api/stats', createStatsRouter(pipeline));
  app.use('/api/documents', createDocumentsRouter(pipeline));
  app.use('/api/ingest', createIngestRouter(pipeline));
  app.use('/api/ask', createAskRouter(pipeline));
  app.use('/api/report', createReportsRouter(pipeline));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
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
