import fs from 'fs';
import path from 'path';
import { ClaudeClient } from '../claude/client';
import { DocumentLoader } from './documentLoader';
import { TextSplitter } from './textSplitter';
import { EmbeddingService } from './embeddingService';
import { VectorStore } from './vectorStore';
import { Retriever } from './retriever';
import { buildContextPrompt, buildUserPrompt, MEDICAL_SYSTEM_PROMPT } from '../cli/prompts';
import { Logger } from '../utils/logger';

export class RagPipeline {
  private docLoader: DocumentLoader;
  private textSplitter: TextSplitter;
  embedService: EmbeddingService;
  vectorStore: VectorStore;
  private retriever: Retriever;
  private claudeClient: ClaudeClient;

  constructor() {
    this.claudeClient = new ClaudeClient();
    this.docLoader = new DocumentLoader(this.claudeClient);
    this.textSplitter = new TextSplitter();
    this.embedService = new EmbeddingService();
    this.vectorStore = new VectorStore();
    this.retriever = new Retriever(this.embedService, this.vectorStore);
  }

  async initialize(): Promise<void> {
    await this.embedService.initialize();
    await this.vectorStore.initialize();
  }

  async ingestPath(inputPath: string): Promise<{ files: number; chunks: number }> {
    const absolutePath = fs.existsSync(inputPath) ? require('fs').realpathSync(inputPath) : inputPath;
    const isDir = fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory();

    if (isDir) {
      const docs = await this.docLoader.loadDirectory(absolutePath);
      if (docs.length === 0) {
        Logger.warning('No supported documents found in the path');
        return { files: 0, chunks: 0 };
      }

      let totalChunks = 0;
      for (const doc of docs) {
        await this.vectorStore.deleteBySource(doc.filePath);
        const chunks = this.textSplitter.split(doc);
        if (chunks.length === 0) continue;

        const texts = chunks.map((c) => c.text);
        const vectors = await this.embedService.embed(texts);
        await this.vectorStore.addChunks(chunks, vectors);
        totalChunks += chunks.length;
      }

      Logger.success(`Ingested ${docs.length} file(s), ${totalChunks} chunk(s)`);
      return { files: docs.length, chunks: totalChunks };
    } else {
      return this.ingestFile(absolutePath);
    }
  }

  async ingestFile(filePath: string): Promise<{ files: number; chunks: number }> {
    const doc = await this.docLoader.loadFile(filePath);
    await this.vectorStore.deleteBySource(doc.filePath);
    const chunks = this.textSplitter.split(doc);
    if (chunks.length === 0) {
      Logger.warning('No content extracted from file');
      return { files: 0, chunks: 0 };
    }

    const texts = chunks.map((c) => c.text);
    const vectors = await this.embedService.embed(texts);
    await this.vectorStore.addChunks(chunks, vectors);
    Logger.success(`Ingested 1 file, ${chunks.length} chunk(s)`);
    return { files: 1, chunks: chunks.length };
  }

  async ask(question: string): Promise<string> {
    const searchResults = await this.retriever.retrieve(question);

    if (searchResults.length === 0) {
      return '根据现有知识库中的文档，未找到与您问题相关的信息。\n\n建议：\n1. 确认相关文档是否已导入知识库\n2. 尝试使用不同的关键词提问';
    }

    const contexts = searchResults.map((r) => ({
      text: r.chunk.text,
      sourceFile: r.chunk.sourceFile.replace(/\\/g, '/').split('/').pop() || r.chunk.sourceFile,
    }));

    const contextText = buildContextPrompt(contexts);
    const userPrompt = buildUserPrompt(question, contextText);

    const messages: any[] = [
      {
        role: 'user',
        content: [{ type: 'text', text: `${MEDICAL_SYSTEM_PROMPT}\n\n${userPrompt}` }],
      },
    ];

    const response = await this.claudeClient.sendMessage(messages, 'claude-sonnet-4-6', 2048, 0.3);

    const answer =
      response.content
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('') || '未能生成回答。';

    const sources = [...new Set(contexts.map((c) => c.sourceFile))];
    const sourceNote = `\n\n---\n📄 参考文档：${sources.join('、')}`;

    return answer + sourceNote;
  }

  async getStats(): Promise<{ totalChunks: number }> {
    return this.vectorStore.stats();
  }

  async listDocuments(): Promise<{ fileName: string; filePath: string; fileType: string; chunkCount: number; ingestedAt: string }[]> {
    const docs = await this.vectorStore.listDocuments();
    const result = [];
    for (const doc of docs) {
      const chunkCount = await this.vectorStore.getDocumentChunkCount(doc.sourceFile);
      result.push({
        fileName: (doc.metadata.fileName as string) || doc.sourceFile.split(/[\\/]/).pop() || doc.sourceFile,
        filePath: doc.sourceFile,
        fileType: (doc.metadata.fileType as string) || '',
        chunkCount,
        ingestedAt: (doc.metadata.ingestedAt as string) || '',
      });
    }
    return result;
  }

  async deleteDocument(sourceFile: string): Promise<void> {
    await this.vectorStore.deleteDocument(sourceFile);
    // Also delete the physical uploaded file if it exists under uploads/
    try {
      const uploadsDir = path.resolve('./uploads');
      if (sourceFile.startsWith(uploadsDir) && fs.existsSync(sourceFile)) {
        fs.unlinkSync(sourceFile);
      }
    } catch (_) {
      // Physical file may have already been removed or never existed
    }
  }

  async askStream(
    question: string,
    onChunk: (chunk: string) => void,
    conversationHistory?: { role: string; content: string }[]
  ): Promise<{ answer: string; sources: string[] }> {
    const searchResults = await this.retriever.retrieve(question);

    if (searchResults.length === 0) {
      const msg = '根据现有知识库中的文档，未找到与您问题相关的信息。\n\n建议：\n1. 确认相关文档是否已导入知识库\n2. 尝试使用不同的关键词提问';
      onChunk(msg);
      return { answer: msg, sources: [] };
    }

    const contexts = searchResults.map((r) => ({
      text: r.chunk.text,
      sourceFile: r.chunk.sourceFile.replace(/\\/g, '/').split('/').pop() || r.chunk.sourceFile,
    }));

    const contextText = buildContextPrompt(contexts);
    const userPrompt = buildUserPrompt(question, contextText);

    const messages: any[] = [];

    if (conversationHistory && conversationHistory.length > 0) {
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: `${MEDICAL_SYSTEM_PROMPT}\n\n以下是与问题相关的技术文档内容：\n${contextText}` }],
      });
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role,
          content: [{ type: 'text', text: msg.content }],
        });
      }
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: question }],
      });
    } else {
      messages.push({
        role: 'user',
        content: [{ type: 'text', text: `${MEDICAL_SYSTEM_PROMPT}\n\n${userPrompt}` }],
      });
    }

    let answer = '';
    const stream = await this.claudeClient.streamMessage(messages, 'claude-sonnet-4-6', 2048, 0.3);

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        const text = chunk.delta.text || '';
        answer += text;
        onChunk(text);
      }
    }

    const sources = [...new Set(contexts.map((c) => c.sourceFile))];
    return { answer, sources };
  }

  async clearKnowledgeBase(): Promise<void> {
    await this.vectorStore.clear();
  }
}
