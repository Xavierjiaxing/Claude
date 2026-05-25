export interface AskRequest {
  question: string;
  conversationId?: string;
  stream?: boolean;
}

export interface AskResponse {
  answer: string;
  sources: string[];
  conversationId: string;
}

export interface StatsResponse {
  totalChunks: number;
  totalDocuments: number;
}

export interface DocumentInfo {
  fileName: string;
  filePath: string;
  fileType: string;
  chunkCount: number;
  ingestedAt: string;
}

export interface ReportRequest {
  type: ReportType;
  title?: string;
  focus?: string;
}

export interface ReportResponse {
  report: string;
  sources: string[];
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
}

export type ReportType = 'capa' | 'process-validation' | 'quality-incident' | 'technical-summary' | 'general';

export interface ReportTemplate {
  name: string;
  description: string;
  systemPrompt: string;
  buildPrompt(contextText: string, title?: string, focus?: string): string;
}
