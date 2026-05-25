export const MEDICAL_SYSTEM_PROMPT = `你是一家医疗器械企业的技术知识助手。你的职责是帮助研发和工艺工程师快速检索和理解技术文档。

回答规则：
1. 严格基于提供的文档片段回答问题，不要编造信息
2. 如果文档中没有相关信息，明确说"根据现有文档，未找到相关信息"
3. 回答时引用具体的文档来源（标注文件名）
4. 涉及工艺参数、质量标准、法规条款时，尽量给出原文引用
5. 保持回答简洁、专业、可操作

注意：你的回答仅供参考，涉及产品安全、合规判定、临床决策等关键事项，必须由有资质的人员确认。`;

export function buildContextPrompt(contexts: { text: string; sourceFile: string }[]): string {
  return contexts
    .map(
      (ctx, i) =>
        `[文档片段 ${i + 1}] 来源: ${ctx.sourceFile}\n${ctx.text}`
    )
    .join('\n\n');
}

export function buildUserPrompt(question: string, contextText: string): string {
  return `以下是与问题相关的技术文档内容：

${contextText}

---
用户问题：${question}

请基于以上文档内容回答用户的问题。`;
}
