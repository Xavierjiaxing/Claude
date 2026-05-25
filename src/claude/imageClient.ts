import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.KIMI_API_KEY,
  baseURL: 'https://api.moonshot.cn/v1',
  timeout: 60000,
});

export async function describeImage(imagePath: string): Promise<string> {
  const buffer = fs.readFileSync(imagePath);
  const base64 = buffer.toString('base64');
  const ext = path.extname(imagePath).toLowerCase();
  const fileName = path.basename(imagePath);

  const mimeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.bmp': 'image/bmp',
    '.webp': 'image/webp',
  };

  const response = await client.chat.completions.create({
    model: 'kimi-k2.6',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请详细描述以下图片的内容。这是一张医疗器械研发/制造相关的图片，文件名为"${fileName}"。
要求逐项描述：
1. 图片整体内容：什么类型的图（照片/图表/显微镜图/曲线图/示意图等）
2. 图中所有文字：标签、参数、批号、测量值、坐标轴标注、图例等（逐字抄录）
3. 图中的数字数据：数值、百分比、尺寸、温度、压力等定量信息
4. 图表解读：如果包含曲线图、柱状图、表格，请解读其趋势和含义
5. 缺陷或异常特征：如果有产品/材料外观，描述可见的缺陷、颜色变化、结构特征
控制在 500 字以内。`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeMap[ext] || 'image/jpeg'};base64,${base64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 1024,
    temperature: 1,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Direct visual comparison of two images. Sends both images in a single API call
 * to Kimi K2.6 and asks it to identify pixel-level differences.
 */
export async function compareImages(imagePathA: string, imagePathB: string): Promise<string> {
  const MAX_TOTAL_BYTES = 5 * 1024 * 1024; // 5MB per image
  const bufferA = fs.readFileSync(imagePathA);
  const bufferB = fs.readFileSync(imagePathB);

  if (bufferA.length > MAX_TOTAL_BYTES || bufferB.length > MAX_TOTAL_BYTES) {
    return ''; // Images too large for visual comparison, fall back to text
  }

  const base64A = bufferA.toString('base64');
  const base64B = bufferB.toString('base64');

  const getMime = (ext: string): string => {
    const m: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.bmp': 'image/bmp', '.webp': 'image/webp',
    };
    return m[ext] || 'image/jpeg';
  };

  const extA = path.extname(imagePathA).toLowerCase();
  const extB = path.extname(imagePathB).toLowerCase();
  const nameA = path.basename(imagePathA);
  const nameB = path.basename(imagePathB);

  const response = await client.chat.completions.create({
    model: 'kimi-k2.6',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `请对比分析以下两张图片的差异。这是医疗器械文档的版本对比。

图片 A（旧版）：${nameA}
图片 B（新版）：${nameB}

请逐项对比：
1. 图片类型是否相同（照片/图表/示意图等）
2. 图中文字内容的增减或修改
3. 数字数据的变动
4. 图表元素的变化
5. 新增或删除的视觉元素
6. 总体差异总结

要求：
- 如果两张图完全相同，请明确说明"经视觉对比，两张图片内容完全一致"
- 如果图片类型完全不同，直接说明类型不匹配
- 控制在 500 字以内`,
          },
          { type: 'image_url', image_url: { url: `data:${getMime(extA)};base64,${base64A}` } },
          { type: 'image_url', image_url: { url: `data:${getMime(extB)};base64,${base64B}` } },
        ],
      },
    ],
    max_tokens: 2048,
    temperature: 1,
  });

  return response.choices[0]?.message?.content || '';
}
