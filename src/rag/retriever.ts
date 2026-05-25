import { EmbeddingService } from './embeddingService';
import { VectorStore } from './vectorStore';
import { RAG_CONFIG, SearchResult } from './config';

export class Retriever {
  constructor(
    private embedService: EmbeddingService,
    private vectorStore: VectorStore
  ) {}

  async retrieve(query: string, topK: number = RAG_CONFIG.topK): Promise<SearchResult[]> {
    const queryVector = await this.embedService.embedSingle(query);
    const results = await this.vectorStore.search(queryVector, topK);
    return results.filter((r) => r.score >= RAG_CONFIG.minSimilarity);
  }
}
