import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import { Document, RAG_CONFIG } from './config';
import { ClaudeClient } from '../claude/client';

export class DocumentLoader {
  private claudeClient: ClaudeClient | null;

  constructor(claudeClient?: ClaudeClient) {
    this.claudeClient = claudeClient || null;
  }

  async loadFile(filePath: string): Promise<Document> {
    const ext = path.extname(filePath).toLowerCase();
    const absolutePath = path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`File not found: ${absolutePath}`);
    }

    let content: string;

    switch (ext) {
      case '.pdf':
        content = await this.loadPdf(absolutePath);
        break;
      case '.docx':
        content = await this.loadDocx(absolutePath);
        break;
      case '.txt':
      case '.md':
        content = fs.readFileSync(absolutePath, 'utf-8');
        break;
      case '.jpg':
      case '.jpeg':
      case '.png':
      case '.bmp':
      case '.webp':
        content = await this.loadImage(absolutePath);
        break;
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }

    return {
      filePath: absolutePath,
      content: content.trim(),
      metadata: {
        fileName: path.basename(filePath),
        fileType: ext,
        ingestedAt: new Date().toISOString(),
      },
    };
  }

  async loadDirectory(dirPath: string): Promise<Document[]> {
    const absolutePath = path.resolve(dirPath);

    if (!fs.statSync(absolutePath).isDirectory()) {
      throw new Error(`Not a directory: ${absolutePath}`);
    }

    const docs: Document[] = [];
    const files = this.walkDir(absolutePath);

    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      if (RAG_CONFIG.supportedExtensions.includes(ext as typeof RAG_CONFIG.supportedExtensions[number])) {
        try {
          const doc = await this.loadFile(file);
          docs.push(doc);
        } catch (err) {
          console.error(`Failed to load ${file}:`, (err as Error).message);
        }
      }
    }

    return docs;
  }

  private walkDir(dir: string): string[] {
    const results: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        results.push(...this.walkDir(fullPath));
      } else {
        results.push(fullPath);
      }
    }
    return results;
  }

  private async loadPdf(filePath: string): Promise<string> {
    const { PDFParse } = require('pdf-parse');
    const buffer = new Uint8Array(fs.readFileSync(filePath));
    const parser = new PDFParse({ data: buffer, disableFontFace: true });
    const result = await parser.getText();
    return result.text || '';
  }

  private async loadDocx(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  private async loadImage(filePath: string): Promise<string> {
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(1);
    const fileName = path.basename(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const uploadedAt = stats.mtime.toISOString().replace('T', ' ').slice(0, 19);
    const fileSizeKB = Math.round(stats.size / 1024);

    if (this.claudeClient) {
      try {
        const description = await this.claudeClient.describeImage(filePath);
        return `[图片文件] 文件名: ${fileName}\n格式: ${ext}\n文件大小: ${fileSizeMB}MB\n\n视觉内容描述：\n${description}`;
      } catch (_err) {
        // Vision API not available — generate a metadata-based description
      }
    }

    const keywords = fileName
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/([a-zA-Z])(\d)/g, '$1 $2')
      .replace(/(\d)([a-zA-Z])/g, '$1 $2');

    return `[图片文件] 文件名: ${fileName}
格式: ${ext}
文件大小: ${fileSizeMB}MB (${fileSizeKB}KB)
导入时间: ${uploadedAt}
提取关键词: ${keywords}

说明: 此图片为医疗器械研发/制造相关图片。可通过文件名关键词（${keywords}）进行检索。如需查看原图，请根据文件名"${fileName}"在文件系统中定位。`;
  }
}
