import { ClaudeClient } from '../claude/client';
import { Logger } from '../utils/logger';

export async function runSummarizationExample() {
  try {
    Logger.info('Running summarization example...\n');
    
    const claude = new ClaudeClient();
    
    const longText = `Artificial Intelligence (AI) refers to the simulation of human intelligence processes by machines, especially computer systems. These processes include learning, reasoning, and self-correction. AI has become an integral part of modern technology, powering everything from voice assistants like Siri and Alexa to advanced data analytics and autonomous vehicles.

There are several types of AI, including narrow AI, which is designed to perform a specific task, and general AI, which would possess the ability to understand, learn, and apply knowledge across a wide range of tasks. Currently, most AI systems are narrow AI, but research continues to advance towards more general forms of intelligence.

Machine learning, a subset of AI, uses algorithms that learn from data without being explicitly programmed. Deep learning, a further subset, uses neural networks with multiple layers to process complex patterns in data. These technologies have enabled breakthroughs in image recognition, natural language processing, and predictive analytics.

The applications of AI are vast and growing. In healthcare, AI helps diagnose diseases and develop new drugs. In finance, it detects fraud and manages investments. In transportation, it powers self-driving cars. As AI continues to evolve, it promises to transform many aspects of daily life, though it also raises important ethical and societal questions about privacy, job displacement, and accountability.`;
    
    const prompt = `Please summarize the following text in 3-4 sentences:

${longText}`;
    
    const response = await claude.sendTextMessage(prompt, 'claude-3-sonnet-20240229', 500, 0.3);
    
    console.log('Summary:');
    console.log(response);
    console.log('');
    
  } catch (error) {
    Logger.error('Summarization example failed:', error);
  }
}