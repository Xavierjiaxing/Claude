import { ClaudeClient } from '../claude/client';
import { Logger } from '../utils/logger';

export async function runCodeGenerationExample() {
  try {
    Logger.info('Running code generation example...\n');
    
    const claude = new ClaudeClient();
    
    const prompt = `Write a TypeScript function that:
1. Takes an array of numbers as input
2. Returns the sum of all even numbers in the array
3. Includes proper type annotations
4. Has a comment explaining what it does`;
    
    const response = await claude.sendTextMessage(prompt, 'claude-3-sonnet-20240229', 500, 0.2);
    
    console.log('Generated code:');
    console.log(response);
    console.log('');
    
  } catch (error) {
    Logger.error('Code generation example failed:', error);
  }
}