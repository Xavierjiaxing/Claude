import multer from 'multer';
import path from 'path';
import { RAG_CONFIG } from '../rag/config';

const UPLOAD_DIR = path.resolve('./uploads');
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    // Fix Latin-1 → UTF-8 mis-decoding of Chinese filenames
    const decodedName = Buffer.from(file.originalname, 'latin1').toString('utf8');
    const safeName = decodedName.replace(/[^a-zA-Z0-9._\-一-鿿㐀-䶿]/g, '_');
    cb(null, `${timestamp}-${safeName}`);
  },
});

function fileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.pdf', '.docx', '.txt', '.md', '.svg', '.jpg', '.jpeg', '.png', '.bmp', '.webp'];
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}。支持的类型: ${RAG_CONFIG.supportedExtensions.join(', ')}`));
  }
}

export const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } });
