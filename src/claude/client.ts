import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { recordTokens } from '../server/tokenTracker';

dotenv.config();

export class ClaudeClient {
  private client: Anthropic;

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    this.client = new Anthropic({ apiKey: key });
  }

  async sendMessage(
    messages: Anthropic.MessageParam[],
    model: string = 'claude-3-sonnet-20240229',
    maxTokens: number = 1024,
    temperature: number = 0.7,
    system?: string
  ): Promise<Anthropic.Message> {
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
    });
    if (response.usage) {
      recordTokens(response.usage.input_tokens, response.usage.output_tokens);
    }
    return response;
  }

  async describeImage(imagePath: string): Promise<string> {
    const buffer = fs.readFileSync(imagePath);
    const base64 = buffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.bmp': 'image/bmp',
      '.webp': 'image/webp',
    };
    const mimeType = mimeMap[ext] || 'image/jpeg';
    const fileName = path.basename(imagePath);

    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请用中文详细描述以下图片的内容。这是一张医疗器械研发/制造相关的图片，文件名为"${fileName}"。请描述：关键视觉细节、可能涉及的工艺或质量信息、图中包含的文字（如标签、参数、批号、测量值等）、设备/产品/缺陷/图表的外观特征。控制在 300 字以内，以便存入知识库。`,
          },
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mimeType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
              data: base64,
            },
          } as Anthropic.ImageBlockParam,
        ],
      },
    ];

    const response = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      temperature: 0.3,
      messages,
    });

    const text = response.content
      .map((c) => (c.type === 'text' ? c.text : ''))
      .join('')
      .trim();

    if (!text || text.includes('[Unsupported Image]') || response.usage?.input_tokens < 100) {
      throw new Error('Image not processed by API (vision may not be enabled for this key)');
    }

    return text;
  }

  async sendTextMessage(
    text: string,
    model: string = 'claude-3-sonnet-20240229',
    maxTokens: number = 1024,
    temperature: number = 0.7
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [{ type: 'text', text }],
      },
    ];

    const response = await this.sendMessage(messages, model, maxTokens, temperature);
    return response.content
      .map((content) => (content.type === 'text' ? content.text : ''))
      .join('');
  }

  async streamMessage(
    messages: Anthropic.MessageParam[],
    model: string = 'claude-3-sonnet-20240229',
    maxTokens: number = 1024,
    temperature: number = 0.7,
    system?: string
  ) {
    return this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system,
      messages,
      stream: true,
    });
  }

  async sendChatCompletion(
    history: { role: 'user' | 'assistant'; content: string }[],
    model: string = 'claude-3-sonnet-20240229',
    maxTokens: number = 1024,
    temperature: number = 0.7
  ): Promise<string> {
    const messages: Anthropic.MessageParam[] = history.map((item) => ({
      role: item.role,
      content: [{ type: 'text', text: item.content }],
    }));

    const response = await this.sendMessage(messages, model, maxTokens, temperature);
    return response.content
      .map((content) => (content.type === 'text' ? content.text : ''))
      .join('');
  }

  async streamTextMessage(
    text: string,
    onChunk: (chunk: string) => void,
    model: string = 'claude-3-sonnet-20240229',
    maxTokens: number = 1024,
    temperature: number = 0.7
  ): Promise<void> {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: [{ type: 'text', text }],
      },
    ];

    const stream = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        onChunk(chunk.delta.text || '');
      }
    }
  }
}