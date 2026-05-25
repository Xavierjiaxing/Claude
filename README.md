# Claude API Project

A Node.js project for interacting with Claude AI API from Anthropic.

## Features

- Simple and intuitive API client for Claude
- Support for text messages and chat completions
- Streaming responses support
- Multiple model support (Claude 3 Sonnet, Opus, Haiku)

## Prerequisites

- Node.js >= 18.0.0
- An Anthropic API key (sign up at [Anthropic](https://www.anthropic.com))

## Installation

```bash
npm install
```

## Configuration

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Anthropic API key:
   ```
   ANTHROPIC_API_KEY=your_api_key_here
   ```

## Usage

### Basic Usage

```typescript
import { ClaudeClient } from './claude/client';

const claude = new ClaudeClient();

// Send a simple text message
const response = await claude.sendTextMessage('Hello Claude!');
console.log(response);

// Send a chat completion with history
const chatHistory = [
  { role: 'user', content: 'Hi!' },
  { role: 'assistant', content: 'Hello! How can I help you?' },
  { role: 'user', content: 'What is AI?' },
];
const chatResponse = await claude.sendChatCompletion(chatHistory);
console.log(chatResponse);

// Streaming response
await claude.streamTextMessage(
  'Tell me a story.',
  (chunk) => process.stdout.write(chunk)
);
```

## Running Examples

```bash
npm start
```

## Available Scripts

- `npm start` - Run the main example
- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run with ts-node (same as start)

## Project Structure

```
src/
├── claude/
│   └── client.ts        # Claude API client implementation
├── examples/
│   ├── chatExample.ts           # Chat history example
│   ├── summarizationExample.ts  # Text summarization example
│   └── codeGenerationExample.ts # Code generation example
├── utils/
│   └── logger.ts        # Logger utility
└── index.ts             # Main entry point
```

## API Documentation

### ClaudeClient

#### Constructor
```typescript
new ClaudeClient(apiKey?: string)
```

#### Methods

- `sendTextMessage(text, model, maxTokens, temperature)` - Send a simple text message
- `sendChatCompletion(history, model, maxTokens, temperature)` - Send a chat completion with history
- `sendMessage(messages, model, maxTokens, temperature)` - Send raw messages to the API
- `streamTextMessage(text, onChunk, model, maxTokens, temperature)` - Stream response

### Supported Models

- `claude-3-sonnet-20240229` (default)
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

## License

ISC