import { Router } from 'express';
import { RagPipeline } from '../../rag/ragPipeline';

export function createDocumentsRouter(pipeline: RagPipeline): Router {
  const router = Router();

  router.get('/', async (req, res) => {
    try {
      const allDocs = await pipeline.listDocuments();

      const search = (req.query.search as string || '').toLowerCase().trim();
      let filtered = allDocs;
      if (search) {
        filtered = allDocs.filter((doc: any) =>
          (doc.fileName || '').toLowerCase().includes(search) ||
          (doc.filePath || '').toLowerCase().includes(search) ||
          (doc.fileType || '').toLowerCase().includes(search)
        );
      }

      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize as string) || 20));
      const total = filtered.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const documents = filtered.slice(start, start + pageSize);

      res.json({ documents, total, page, pageSize, totalPages });
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
