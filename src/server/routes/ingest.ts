import { Router } from 'express';
import fs from 'fs';
import { RagPipeline } from '../../rag/ragPipeline';
import { upload } from '../uploadMiddleware';
import { Logger } from '../../utils/logger';

// Detect and fix UTF-8 filenames mis-decoded as Latin-1 by multer/busboy
// When a filename is already correct, this returns it unchanged
function fixEncoding(name: string): string {
  if (!/[\x80-\xFF]/.test(name)) return name; // Pure ASCII
  // Try Latin-1 → UTF-8 re-encoding
  const fixed = Buffer.from(name, 'latin1').toString('utf8');
  // If the "fixed" version has replacement chars (�), keep original
  if (fixed.includes('�')) return name;
  // If fixed has more printable Chinese-range chars, use it
  const countCJK = (s: string) => (s.match(/[一-鿿]/g) || []).length;
  return countCJK(fixed) >= countCJK(name) ? fixed : name;
}

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
        // Detect and fix Latin-1 misinterpreted UTF-8 filenames
        const originalName = fixEncoding(file.originalname);
        try {
          const result = await pipeline.ingestFile(file.path, originalName);
          totalChunks += result.chunks;
          details.push({ fileName: originalName, chunkCount: result.chunks });
        } catch (err) {
          details.push({ fileName: originalName, chunkCount: 0 });
          Logger.error(`Failed to ingest ${originalName}:`, (err as Error).message);
        } finally {
          fs.unlink(file.path, () => {});
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
