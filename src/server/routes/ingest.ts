import { Router } from 'express';
import { RagPipeline } from '../../rag/ragPipeline';
import { upload } from '../uploadMiddleware';
import { Logger } from '../../utils/logger';

export function createIngestRouter(pipeline: RagPipeline): Router {
  const router = Router();

  router.post('/', upload.array('files', 20), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: '未上传任何文件' });
        return;
      }

      let totalChunks = 0;
      const details: { fileName: string; chunkCount: number }[] = [];

      for (const file of files) {
        try {
          const result = await pipeline.ingestFile(file.path);
          totalChunks += result.chunks;
          details.push({ fileName: file.originalname, chunkCount: result.chunks });
        } catch (err) {
          details.push({ fileName: file.originalname, chunkCount: 0 });
          Logger.error(`Failed to ingest ${file.originalname}:`, (err as Error).message);
        }
      }

      Logger.success(`Ingested ${files.length} file(s), ${totalChunks} chunk(s)`);
      res.json({ files: files.length, chunks: totalChunks, details });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.post('/path', async (req, res) => {
    try {
      const { path: inputPath } = req.body;
      if (!inputPath) {
        res.status(400).json({ error: '缺少 path 参数' });
        return;
      }
      const result = await pipeline.ingestPath(inputPath);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
}
