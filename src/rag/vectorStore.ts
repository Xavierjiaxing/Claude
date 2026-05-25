import * as lancedb from '@lancedb/lancedb';
import { Chunk, RAG_CONFIG, SearchResult } from './config';
import path from 'path';

interface LanceRow {
  id: string;
  vector: number[];
  text: string;
  sourceFile: string;
  chunkIndex: number;
  metadata: string;
}

export interface DocumentInfo {
  sourceFile: string;
  metadata: Record<string, unknown>;
}

function escapeSql(s: string): string {
  return s.replace(/'/g, "''");
}

export class VectorStore {
  private db: any = null;
  private table: any = null;
  private dbPath: string;
  private initialized = false;

  constructor(dbPath?: string) {
    this.dbPath = path.resolve(dbPath || RAG_CONFIG.dbPath);
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;
    this.db = await lancedb.connect(this.dbPath);
    const tableNames = await this.db.tableNames();
    if (tableNames.includes('chunks')) {
      this.table = await this.db.openTable('chunks');
    }
    this.initialized = true;
  }

  async addChunks(chunks: Chunk[], vectors: number[][]): Promise<void> {
    if (!this.initialized) await this.initialize();

    if (chunks.length !== vectors.length) {
      throw new Error(`Chunks count ${chunks.length} != vectors count ${vectors.length}`);
    }

    const rows: LanceRow[] = chunks.map((chunk, i) => ({
      id: chunk.id,
      vector: vectors[i],
      text: chunk.text,
      sourceFile: chunk.sourceFile,
      chunkIndex: chunk.chunkIndex,
      metadata: JSON.stringify(chunk.metadata),
    }));

    if (this.table) {
      await this.table.add(rows);
    } else {
      this.table = await this.db.createTable('chunks', rows);
    }
  }

  async search(queryVector: number[], topK: number = RAG_CONFIG.topK): Promise<SearchResult[]> {
    if (!this.initialized) await this.initialize();
    if (!this.table) return [];

    const results = await this.table
      .search(queryVector)
      .limit(topK)
      .toArray();

    return results.map((row: any) => ({
      chunk: {
        id: row.id,
        text: row.text,
        sourceFile: row.sourceFile,
        chunkIndex: row.chunkIndex,
        metadata: JSON.parse(row.metadata || '{}'),
      },
      score: row._distance ?? 0,
    }));
  }

  async clear(): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (this.table) {
      await this.db.dropTable('chunks');
      this.table = null;
    }
  }

  async stats(): Promise<{ totalChunks: number }> {
    if (!this.initialized) await this.initialize();
    if (!this.table) return { totalChunks: 0 };
    const count = await this.table.countRows();
    return { totalChunks: count };
  }

  async deleteBySource(filePath: string): Promise<void> {
    if (!this.initialized) await this.initialize();
    if (!this.table) return;
    await this.table.delete(`sourceFile = '${escapeSql(filePath)}'`);
  }

  async listDocuments(): Promise<DocumentInfo[]> {
    if (!this.initialized) await this.initialize();
    if (!this.table) return [];

    const rows = await this.table.query().toArray();
    const seen = new Set<string>();
    const docs: DocumentInfo[] = [];

    for (const row of rows) {
      if (!seen.has(row.sourceFile)) {
        seen.add(row.sourceFile);
        docs.push({
          sourceFile: row.sourceFile,
          metadata: JSON.parse(row.metadata || '{}'),
        });
      }
    }
    return docs;
  }

  async getDocumentChunkCount(sourceFile: string): Promise<number> {
    if (!this.initialized) await this.initialize();
    if (!this.table) return 0;
    try {
      const rows = await this.table
        .query()
        .filter(`sourceFile = '${escapeSql(sourceFile)}'`)
        .toArray();
      return rows.length;
    } catch {
      return 0;
    }
  }

  async deleteDocument(sourceFile: string): Promise<void> {
    await this.deleteBySource(sourceFile);
  }
}
