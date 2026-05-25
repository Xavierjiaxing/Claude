import dotenv from 'dotenv';
dotenv.config();
import Anthropic from '@anthropic-ai/sdk';

async function main() {
  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    
    console.log('Sending request to Claude...');
    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 100,
      messages: [{ role: 'user', content: 'Say hello' }],
    });
    
    console.log('Success! Response:', response.content[0]?.type === 'text' ? response.content[0].text : JSON.stringify(response.content));
  } catch (err: any) {
    console.error('Error type:', err?.constructor?.name);
    console.error('Error message:', err?.message);
    console.error('Status:', err?.status);
    console.error('Full error:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
  }
}

main();