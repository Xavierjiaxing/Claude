import { pipeline, env } from '@xenova/transformers';
import { RAG_CONFIG } from './config';

env.allowLocalModels = false;
env.remoteHost = 'https://hf-mirror.com/';

export class EmbeddingService {
  private extractor: any = null;
  private loaded = false;

  async initialize(): Promise<void> {
    if (this.loaded) return;
    this.extractor = await pipeline('feature-extraction', RAG_CONFIG.embeddingModel);
    this.loaded = true;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.loaded) await this.initialize();

    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += RAG_CONFIG.batchSize) {
      const batch = texts.slice(i, i + RAG_CONFIG.batchSize);
      const results = await Promise.all(
        batch.map((text) => this.extractor(text, { pooling: 'mean', normalize: true }))
      );
      for (const result of results) {
        embeddings.push(Array.from(result.data as Float32Array));
      }
    }

    return embeddings;
  }

  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }
}
