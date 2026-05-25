import { ClaudeClient } from '../claude/client';
import { Logger } from '../utils/logger';

export async function runChatExample() {
  try {
    Logger.info('Running chat history example...\n');
    
    const claude = new ClaudeClient();
    
    const chatHistory = [
      { role: 'user' as const, content: 'Hi Claude, how are you?' },
      { role: 'assistant' as const, content: 'I am an AI assistant created by Anthropic. I don\'t have feelings, but I am here to help you with any questions you might have!' },
      { role: 'user' as const, content: 'That\'s good to know. Can you explain quantum computing in simple terms?' },
    ];
    
    const response = await claude.sendChatCompletion(chatHistory);
    
    console.log('Assistant:', response);
    console.log('');
    
  } catch (error) {
    Logger.error('Chat example failed:', error);
  }
}