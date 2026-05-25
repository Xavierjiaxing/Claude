import { Router } from 'express';
import { RagPipeline } from '../../rag/ragPipeline';
import {
  createConversation,
  getConversation,
  addMessage,
  listConversations,
  deleteConversation,
} from '../conversationStore';

export function createAskRouter(pipeline: RagPipeline): Router {
  const router = Router();

  router.post('/', async (req, res) => {
    try {
      const { question, conversationId, stream } = req.body;

      if (!question || typeof question !== 'string') {
        res.status(400).json({ error: '缺少 question 参数' });
        return;
      }

      const convId = conversationId || createConversation().id;
      const conv = getConversation(convId);

      const history = conv
        ? conv.messages.map((m) => ({ role: m.role, content: m.content }))
        : undefined;

      if (stream) {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
          'X-Conversation-Id': convId,
        });

        let fullAnswer = '';
        let sources: string[] = [];

        try {
          const result = await pipeline.askStream(
            question,
            (chunk) => {
              fullAnswer += chunk;
              res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
            },
            history
          );
          sources = result.sources;
          fullAnswer = result.answer;
        } catch (err) {
          res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
          res.end();
          return;
        }

        addMessage(convId, 'user', question);
        addMessage(convId, 'assistant', fullAnswer, sources);

        res.write(`data: ${JSON.stringify({ type: 'done', sources, conversationId: convId })}\n\n`);
        res.end();
      } else {
        addMessage(convId, 'user', question);

        const result = await pipeline.askStream(question, () => {}, history);
        addMessage(convId, 'assistant', result.answer, result.sources);

        res.json({ answer: result.answer, sources: result.sources, conversationId: convId });
      }
    } catch (err) {
      if (!res.headersSent) {
        res.status(500).json({ error: (err as Error).message });
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', message: (err as Error).message })}\n\n`);
        res.end();
      }
    }
  });

  router.get('/conversations', (_req, res) => {
    res.json({ conversations: listConversations() });
  });

  router.delete('/conversations/:id', (req, res) => {
    const ok = deleteConversation(req.params.id);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: '对话不存在' });
    }
  });

  return router;
}
