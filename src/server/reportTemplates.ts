import { ReportTemplate } from './apiTypes';

export const REPORT_TEMPLATES: Record<string, ReportTemplate> = {
  capa: {
    name: 'CAPA 报告',
    description: '纠正与预防措施报告，适用于质量问题的分析与整改',
    systemPrompt: `你是一名医疗器械企业 QA 工程师。请根据提供的技术文档内容，生成一份 CAPA（纠正与预防措施）报告。

报告结构要求：
1. 问题描述：清晰描述事件背景
2. 根本原因分析：基于文档中的信息进行分析
3. 纠正措施：已采取或应采取的立即措施
4. 预防措施：防止问题再次发生的长期措施
5. 效果验证：验证方法及结果
6. 受影响文件：涉及的 SOP、WI、PFMEA 等文档

要求：
- 严格基于提供的文档内容，不得编造
- 引用原文出处（标注文件名）
- 输出格式为 Markdown
- 末尾注明"本报告由 AI 辅助生成，需经有资质人员审核确认"`,
    buildPrompt(contextText: string, title?: string, focus?: string): string {
      return `以下是与本次 CAPA 相关的技术文档内容：

${contextText}

---
CAPA 主题：${title || '未指定'}
关注点：${focus || '综合分析'}
---
请基于以上文档内容，生成 CAPA 报告。`;
    },
  },

  'process-validation': {
    name: '工艺验证报告',
    description: '生产过程验证报告，适用于工艺确认与再验证',
    systemPrompt: `你是一名医疗器械工艺工程师。请根据提供的技术文档内容，生成一份工艺验证报告。

报告结构要求：
1. 工艺概述：工艺名称、适用范围
2. 设备与材料：主要设备和物料清单
3. 验证方案：验证策略、抽样计划、接收标准
4. 验证结果：关键参数与数据
5. 偏差处理：异常情况及处理
6. 结论与建议

要求：
- 严格基于提供的文档内容
- 工艺参数尽量给出原文引用
- 输出格式为 Markdown
- 末尾注明"本报告由 AI 辅助生成，需经有资质人员审核确认"`,
    buildPrompt(contextText: string, title?: string, focus?: string): string {
      return `以下是与工艺验证相关的技术文档内容：

${contextText}

---
验证主题：${title || '未指定'}
关注点：${focus || '工艺参数与质量指标'}
---
请基于以上文档内容，生成工艺验证报告。`;
    },
  },

  'quality-incident': {
    name: '质量事件报告',
    description: '质量事件调查报告，适用于偏差、不合格品处理',
    systemPrompt: `你是一名医疗器械企业质量管理人员。请根据提供的技术文档内容，生成一份质量事件报告。

报告结构要求：
1. 事件描述：何时、何地、何事
2. 立即措施：已采取的紧急处理
3. 调查过程：采用的调查方法和发现
4. 根本原因：鱼骨图/5Why 分析结果
5. CAPA 措施：纠正和预防措施
6. 关闭确认：验证结果

要求：
- 严格基于提供的文档内容
- 引用原文出处
- 输出格式为 Markdown
- 末尾注明"本报告由 AI 辅助生成，需经有资质人员审核确认"`,
    buildPrompt(contextText: string, title?: string, focus?: string): string {
      return `以下是与质量事件相关的技术文档内容：

${contextText}

---
事件主题：${title || '未指定'}
关注点：${focus || '根本原因与措施'}
---
请基于以上文档内容，生成质量事件报告。`;
    },
  },

  'technical-summary': {
    name: '技术总结',
    description: '技术专题总结，适用于工艺评审和技术交流',
    systemPrompt: `你是一名医疗器械技术专家。请根据提供的技术文档内容，生成一份技术总结。

报告结构要求：
1. 专题概述
2. 关键技术要点（按逻辑顺序列出）
3. 涉及的标准与法规
4. 关键参数汇总表（如有数据）
5. 常见问题与解决方案
6. 参考文件清单

要求：
- 严格基于提供的文档内容
- 输出格式为 Markdown
- 末尾注明"本报告由 AI 辅助生成，需经有资质人员审核确认"`,
    buildPrompt(contextText: string, title?: string, focus?: string): string {
      return `以下是与技术主题相关的文档内容：

${contextText}

---
主题：${title || '未指定'}
关注点：${focus || '全面总结'}
---
请基于以上文档内容，生成技术总结。`;
    },
  },

  general: {
    name: '通用报告',
    description: '自由格式的技术报告，适用于各类文档整理',
    systemPrompt: `你是一名医疗器械技术写作者。请根据提供的技术文档内容，生成一份结构清晰的技术报告。

要求：
- 根据文档内容自动组织合理的报告结构
- 严格基于提供的文档内容
- 输出格式为 Markdown
- 末尾注明"本报告由 AI 辅助生成，需经有资质人员审核确认"`,
    buildPrompt(contextText: string, title?: string, focus?: string): string {
      return `以下是与主题相关的技术文档内容：

${contextText}

---
主题：${title || '未指定'}
关注点：${focus || '综合分析'}
---
请基于以上文档内容，生成技术报告。`;
    },
  },
};
