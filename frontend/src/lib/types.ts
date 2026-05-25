export interface DocumentInfo {
  fileName: string;
  filePath: string;
  fileType: string;
  chunkCount: number;
  ingestedAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
  chunks?: ChunkInfo[];
}

export interface ChunkInfo {
  text: string;
  sourceFile: string;
  score: number;
}

export interface StatsResponse {
  totalChunks: number;
  totalDocuments: number;
}

export interface TokenStats {
  inputTokens: number;
  outputTokens: number;
  dailyHistory: DailyTokenEntry[];
}

export interface DailyTokenEntry {
  date: string;
  inputTokens: number;
  outputTokens: number;
}

export interface ReportType {
  type: string;
  name: string;
  description: string;
}

export interface DocumentsResponse {
  documents: DocumentInfo[];
  total: number;
  page: number;
  totalPages: number;
}
