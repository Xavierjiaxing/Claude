export const RAG_CONFIG = {
  chunkSize: 500,
  chunkOverlap: 50,
  embeddingDim: 384,
  embeddingModel: 'Xenova/all-MiniLM-L6-v2',
  batchSize: 32,
  topK: 5,
  minSimilarity: 0.3,
  dbPath: './kb-data',
  supportedExtensions: ['.pdf', '.docx', '.txt', '.md', '.jpg', '.jpeg', '.png', '.bmp', '.webp'],
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
