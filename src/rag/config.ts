export const RAG_CONFIG = {
  chunkSize: 500,
  chunkOverlap: 50,
  embeddingDim: 512,
  embeddingModelZH: 'Xenova/bge-small-zh-v1.5',
  embeddingModelEN: 'Xenova/bge-small-en-v1.5',
  batchSize: 32,
  topK: 5,
  minSimilarity: 0.3,
  dbPath: './kb-data',
  supportedExtensions: ['.pdf', '.docx', '.txt', '.md', '.svg', '.jpg', '.jpeg', '.png', '.bmp', '.webp'],
} as const;

export interface Document {
  filePath: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface Chunk {
  id: string;
  text: string;
  sourceFile: string;
  chunkIndex: number;
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  chunk: Chunk;
  score: number;
}
