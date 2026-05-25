import { Router } from 'express';
import { RagPipeline } from '../../rag/ragPipeline';
import { REPORT_TEMPLATES } from '../reportTemplates';
import { ReportType } from '../apiTypes';
import { buildContextPrompt, buildUserPrompt } from '../../cli/prompts';
import { ClaudeClient } from '../../claude/client';

export function createReportsRouter(pipeline: RagPipeline): Router {
  const router = Router();
  const claudeClient = new ClaudeClient();

  router.post('/', async (req, res) => {
    try {
      const { type, title, focus } = req.body;

      if (!type || !REPORT_TEMPLATES[type as ReportType]) {
        res.status(400).json({ error: `无效的报告类型: ${type}。可选: ${Object.keys(REPORT_TEMPLATES).join(', ')}` });
        return;
      }

      const template = REPORT_TEMPLATES[type as ReportType];

      const searchQuery = [focus, title, template.name].filter(Boolean).join(' ');
      const searchResults = await pipeline.embedService.embedSingle(searchQuery);
      const results = await pipeline.vectorStore.search(searchResults, 8);

      if (results.length === 0) {
        res.json({
          report: '根据现有知识库中的文档，未找到与所选主题相关的信息，无法生成报告。\n\n建议先导入相关技术文档。',
          sources: [],
        });
        return;
      }

      const contexts = results.map((r) => ({
        text: r.chunk.text,
        sourceFile: r.chunk.sourceFile.replace(/\\/g, '/').split('/').pop() || r.chunk.sourceFile,
      }));

      const contextText = buildContextPrompt(contexts);
      const userPrompt = template.buildPrompt(contextText, title, focus);

      const messages: any[] = [
        {
          role: 'user',
          content: [{ type: 'text', text: `${template.systemPrompt}\n\n${userPrompt}` }],
        },
      ];

      const response = await claudeClient.sendMessage(messages, 'claude-sonnet-4-6', 4096, 0.3);

      const report =
        response.content
          .filter((c: any) => c.type === 'text')
          .map((c: any) => c.text)
          .join('') || '未能生成报告。';

      const sources = [...new Set(contexts.map((c) => c.sourceFile))];

      res.json({ report, sources });
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
