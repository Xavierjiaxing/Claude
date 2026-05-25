import { ClaudeClient } from './claude/client';
import { Logger } from './utils/logger';
import { runChatExample } from './examples/chatExample';
import { runSummarizationExample } from './examples/summarizationExample';
import { runCodeGenerationExample } from './examples/codeGenerationExample';

async function runBasicExample() {
  Logger.info('Running basic text message example...\n');
  
  const claude = new ClaudeClient();
  
  const response = await claude.sendTextMessage('Hello Claude! Can you tell me a joke?');
  
  Logger.success('Response received:');
  console.log('');
  console.log(response);
  console.log('');
}

async function runStreamingExample() {
  Logger.info('Running streaming response example...\n');
  
  const claude = new ClaudeClient();
  
  await claude.streamTextMessage(
    'Tell me a short story about a cat.',
    (chunk) => process.stdout.write(chunk)
  );
  
  console.log('\n');
  Logger.success('Stream completed!');
  console.log('');
}

async function main() {
  try {
    Logger.info('=== Claude API Project Demo ===');
    Logger.info('Initializing Claude API client...\n');

    await runBasicExample();
    await runStreamingExample();
    await runChatExample();
    await runSummarizationExample();
    await runCodeGenerationExample();

    Logger.success('All examples completed successfully!');

  } catch (error) {
    Logger.error('An error occurred:', error);
    process.exit(1);
  }
}

main();