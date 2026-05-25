import { pipeline, env } from '@xenova/transformers';
import { RAG_CONFIG } from './config';

env.allowLocalModels = false;
env.remoteHost = 'https://hf-mirror.com/';

function detectLanguage(text: string): 'zh' | 'en' {
  let cjk = 0;
  let total = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if ((code >= 0x4E00 && code <= 0x9FFF) || (code >= 0x3400 && code <= 0x4DBF)) {
      cjk++;
    }
    if (code > 127 || (code >= 0x20 && code <= 0x7E)) total++;
  }
  return total > 0 && cjk / total >= 0.3 ? 'zh' : 'en';
}

function padTo(targetDim: number, vec: number[]): number[] {
  if (vec.length >= targetDim) return vec.slice(0, targetDim);
  return [...vec, ...new Array(targetDim - vec.length).fill(0)];
}

export class EmbeddingService {
  private extractorZH: any = null;
  private extractorEN: any = null;
  private loaded = false;
  private enDim = 384;

  async initialize(progress_callback?: (info: any) => void): Promise<void> {
    if (this.loaded) return;
    this.extractorZH = await pipeline('feature-extraction', RAG_CONFIG.embeddingModelZH, {
      progress_callback,
    });
    this.extractorEN = await pipeline('feature-extraction', RAG_CONFIG.embeddingModelEN, {
      progress_callback,
    });
    this.loaded = true;
  }

  private async embedWithModel(
    texts: string[], extractor: any, sourceDim: number
  ): Promise<number[][]> {
    const targetDim = RAG_CONFIG.embeddingDim;
    const results: number[][] = [];
    for (let i = 0; i < texts.length; i += RAG_CONFIG.batchSize) {
      const batch = texts.slice(i, i + RAG_CONFIG.batchSize);
      const outputs = await Promise.all(
        batch.map((text) => extractor(text, { pooling: 'mean', normalize: true }))
      );
      for (const out of outputs) {
        const vec = Array.from(out.data as Float32Array);
        results.push(sourceDim === targetDim ? vec : padTo(targetDim, vec));
      }
    }
    return results;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (!this.loaded) await this.initialize();

    const zhTexts: { idx: number; text: string }[] = [];
    const enTexts: { idx: number; text: string }[] = [];

    for (let i = 0; i < texts.length; i++) {
      const lang = detectLanguage(texts[i]);
      if (lang === 'zh') zhTexts.push({ idx: i, text: texts[i] });
      else enTexts.push({ idx: i, text: texts[i] });
    }

    const results: number[][] = new Array(texts.length);

    if (zhTexts.length > 0) {
      const zhVectors = await this.embedWithModel(
        zhTexts.map((t) => t.text), this.extractorZH, RAG_CONFIG.embeddingDim
      );
      zhTexts.forEach((t, j) => { results[t.idx] = zhVectors[j]; });
    }

    if (enTexts.length > 0) {
      const enVectors = await this.embedWithModel(
        enTexts.map((t) => t.text), this.extractorEN, this.enDim
      );
      enTexts.forEach((t, j) => { results[t.idx] = enVectors[j]; });
    }

    return results;
  }

  async embedSingle(text: string): Promise<number[]> {
    const results = await this.embed([text]);
    return results[0];
  }
}
