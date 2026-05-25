import { Router } from 'express';
import { RagPipeline } from '../../rag/ragPipeline';

export function createDocumentsRouter(pipeline: RagPipeline): Router {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const docs = await pipeline.listDocuments();
      res.json({ documents: docs });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.delete('/', async (req, res) => {
    try {
      const { sourceFile } = req.body;
      if (!sourceFile) {
        res.status(400).json({ error: '缺少 sourceFile 参数' });
        return;
      }
      await pipeline.deleteDocument(sourceFile);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
