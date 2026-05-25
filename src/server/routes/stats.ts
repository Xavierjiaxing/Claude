import { Router } from 'express';
import { RagPipeline } from '../../rag/ragPipeline';

export function createStatsRouter(pipeline: RagPipeline): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const stats = await pipeline.getStats();
      const docs = await pipeline.listDocuments();
      res.json({ totalChunks: stats.totalChunks, totalDocuments: docs.length });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
