import { Router } from 'express';
import path from 'path';
import { RagPipeline } from '../../rag/ragPipeline';
import { REPORT_TEMPLATES } from '../reportTemplates';
import { ReportType } from '../apiTypes';
import { buildContextPrompt, buildUserPrompt } from '../../cli/prompts';
import { ClaudeClient } from '../../claude/client';
import { compareImages } from '../../claude/imageClient';
import { recordTokens } from '../tokenTracker';

export function createReportsRouter(pipeline: RagPipeline): Router {
  const router = Router();
  const claudeClient = new ClaudeClient();

  router.post('/', async (req, res) => {
    try {
      const { type, title, focus, sourceFiles, stream: doStream } = req.body;
      const hasSourceFilter = Array.isArray(sourceFiles) && sourceFiles.length > 0;

      if (!type || !REPORT_TEMPLATES[type as ReportType]) {
        res.status(400).json({ error: `无效的报告类型: ${type}。可选: ${Object.keys(REPORT_TEMPLATES).join(', ')}` });
        return;
      }

      const template = REPORT_TEMPLATES[type as ReportType];
      const isVersionCompare = type === 'sop-version-compare';

      let contextText: string;
      let sources: string[];

      if (isVersionCompare) {
        // Version comparison: use selected files if provided, otherwise match by name
        let matchedDocs: { fileName: string; filePath: string }[];

        if (hasSourceFilter) {
          const allDocs = await pipeline.listDocuments();
          const filterSet = new Set(sourceFiles);
          matchedDocs = allDocs.filter((d) => filterSet.has(d.filePath));
        } else if (title) {
          const allDocs = await pipeline.listDocuments();
          const searchTerm = title.toLowerCase();
          matchedDocs = allDocs.filter((d) =>
            d.fileName.toLowerCase().includes(searchTerm) ||
            d.filePath.toLowerCase().includes(searchTerm)
          );
        } else {
          matchedDocs = [];
        }

        if (matchedDocs.length < 2) {
          const hint = hasSourceFilter
            ? `在文档列表中仅勾选了 ${matchedDocs.length} 份文档。版本对比报告需要至少 2 份文档。\n\n请在文档管理页签中勾选需要对比的两个或更多版本。`
            : `在知识库中以 "${title}" 为关键词搜索，仅找到 ${matchedDocs.length} 份匹配文档。\n\n版本对比报告需要至少 2 份相关文档（如同一 SOP 的不同版本）。`;
          res.json({ report: `## 版本对比无法执行\n\n${hint}`, sources: matchedDocs.map((d) => d.fileName) });
          return;
        }

        const targetPaths = matchedDocs.map((d) => d.filePath);
        const chunksBySource = await pipeline.vectorStore.getChunksBySource(targetPaths);

        if (chunksBySource.length < 2) {
          res.json({
            report: '未能从匹配的文档中提取到足够的文本内容进行对比。',
            sources: matchedDocs.map((d) => d.fileName),
          });
          return;
        }

        // Build text context from chunks
        contextText = chunksBySource
          .map((c, i) => {
            const doc = matchedDocs.find((d) => d.filePath === c.sourceFile);
            const versionLabel = doc?.fileName || c.sourceFile.split(/[\\/]/).pop() || `版本 ${i + 1}`;
            return `## 版本 ${i + 1}：${versionLabel}\n\n${c.text}`;
          })
          .join('\n\n---\n\n');

        // Direct visual comparison for image files (Kimi K2.6 vision)
        const imageExts = ['.png', '.jpg', '.jpeg', '.bmp', '.webp'];
        const imageDocs = matchedDocs.filter((d) => {
          const ext = path.extname(d.filePath).toLowerCase();
          return imageExts.includes(ext);
        });

        let visualComparison = '';
        if (imageDocs.length >= 2) {
          try {
            visualComparison = await compareImages(imageDocs[0].filePath, imageDocs[1].filePath);
            if (visualComparison) {
              contextText = `## 直接视觉对比结果\n\n以下为 Kimi K2.6 对两张图片的直接视觉对比分析：\n\n${visualComparison}\n\n---\n\n${contextText}`;
            }
          } catch (err) {
            console.error('[reports] Visual comparison failed:', (err as Error).message);
          }
        }

        sources = matchedDocs.map((d) => d.fileName);
      } else {
        // Standard generation: vector search, optionally filtered by selected files
        const searchQuery = [focus, title, template.name].filter(Boolean).join(' ');
        const searchVector = await pipeline.embedService.embedSingle(searchQuery);
        const topK = hasSourceFilter ? 40 : 20; // fetch more when filtering
        const results = await pipeline.vectorStore.search(searchVector, topK);

        if (results.length === 0) {
          res.json({
            report: '根据现有知识库中的文档，未找到与所选主题相关的信息，无法生成报告。\n\n建议先导入相关技术文档。',
            sources: [],
          });
          return;
        }

        let filtered = results;
        if (hasSourceFilter) {
          const filterSet = new Set(sourceFiles);
          filtered = results.filter((r) => filterSet.has(r.chunk.sourceFile));
          if (filtered.length === 0) {
            res.json({
              report: '在选定的文档中未找到与主题相关的内容。请扩大文档选择范围或调整查询关键词。',
              sources: [],
            });
            return;
          }
        }

        const contexts = filtered.map((r) => ({
          text: r.chunk.text,
          sourceFile: r.chunk.sourceFile.replace(/\\/g, '/').split('/').pop() || r.chunk.sourceFile,
        }));

        contextText = buildContextPrompt(contexts);
        sources = [...new Set(contexts.map((c) => c.sourceFile))];
      }

      const userPrompt = template.buildPrompt(contextText, title, focus);

      if (doStream) {
        // SSE streaming report generation
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });

        const stream = await claudeClient.streamMessage(
          [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
          'claude-sonnet-4-6',
          8192,
          0.3,
          template.systemPrompt
        );

        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
              const text = event.delta.text || '';
              res.write(`data: ${JSON.stringify({ type: 'chunk', text })}\n\n`);
            }
            if (event.type === 'message_stop' && (event as any).message?.usage) {
              const usage = (event as any).message.usage;
              recordTokens(usage.input_tokens, usage.output_tokens);
            }
          }
          res.write(`data: ${JSON.stringify({ type: 'done', sources })}\n\n`);
        } catch (err) {
          res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
        }
        res.end();
      } else {
        const response = await claudeClient.sendMessage(
          [{ role: 'user', content: [{ type: 'text', text: userPrompt }] }],
          'claude-sonnet-4-6',
          8192,
          0.3,
          template.systemPrompt
        );

        const report =
          response.content
            .filter((c: any) => c.type === 'text')
            .map((c: any) => c.text)
            .join('') || '未能生成报告。';

        res.json({ report, sources });
      }
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  router.get('/types', (_req, res) => {
    const types = Object.entries(REPORT_TEMPLATES).map(([key, tpl]) => ({
      type: key,
      name: tpl.name,
      description: tpl.description,
    }));
    res.json({ types });
  });

  return router;
}
