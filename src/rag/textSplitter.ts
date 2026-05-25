import { Chunk, Document, RAG_CONFIG } from './config';

export class TextSplitter {
  split(doc: Document): Chunk[] {
    const paragraphs = doc.content.split(/\n\s*\n/);
    const chunks: Chunk[] = [];

    let currentChunk = '';
    let chunkIndex = 0;

    for (const para of paragraphs) {
      const trimmed = para.replace(/\s+/g, ' ').trim();
      if (!trimmed) continue;

      if ((currentChunk + ' ' + trimmed).length > RAG_CONFIG.chunkSize && currentChunk) {
        chunks.push(this.makeChunk(doc, currentChunk.trim(), chunkIndex++));
        currentChunk = this.getOverlap(currentChunk) + ' ' + trimmed;
      } else {
        currentChunk = currentChunk ? currentChunk + '\n\n' + trimmed : trimmed;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(this.makeChunk(doc, currentChunk.trim(), chunkIndex));
    }

    return chunks;
  }

  private getOverlap(text: string): string {
    const words = text.split(/\s+/);
    const overlapWords = Math.min(RAG_CONFIG.chunkOverlap, words.length);
    return words.slice(-overlapWords).join(' ');
  }

  private makeChunk(doc: Document, text: string, index: number): Chunk {
    return {
      id: `${doc.metadata.fileName || doc.filePath}_chunk_${index}`,
      text,
      sourceFile: doc.filePath,
      chunkIndex: index,
      metadata: { ...doc.metadata },
    };
  }
}
