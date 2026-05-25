import * as readline from 'readline';
import { RagPipeline } from '../rag/ragPipeline';
import { Logger } from '../utils/logger';

export class CliCommands {
  private pipeline: RagPipeline;
  private rl: readline.Interface;
  private running = false;

  constructor() {
    this.pipeline = new RagPipeline();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: '\n🔬 KB > ',
    });
  }

  async startRepl(): Promise<void> {
    Logger.info('=== 医疗器械 AI 知识库 ===');
    Logger.info('初始化中...');

    try {
      await this.pipeline.initialize();
      Logger.success('知识库就绪');
      console.log('输入 help 查看命令，输入 exit 退出\n');
    } catch (err) {
      Logger.error('初始化失败:', err);
      process.exit(1);
    }

    this.rl.prompt();
    this.rl.on('line', async (line: string) => {
      const input = line.trim();
      if (!input) {
        this.rl.prompt();
        return;
      }

      try {
        await this.handleCommand(input);
      } catch (err) {
        Logger.error('命令执行出错:', (err as Error).message);
      }

      if (this.rl) {
        this.rl.prompt();
      }
    });

    this.rl.on('close', () => {
      console.log('\n再见！');
      process.exit(0);
    });
  }

  async handleOneShot(args: string[]): Promise<void> {
    await this.pipeline.initialize();

    if (args.length < 1) {
      Logger.error('Usage: npm run kb -- <command> [args]');
      process.exit(1);
    }

    const command = args[0];
    const rest = args.slice(1).join(' ');

    switch (command) {
      case 'ingest':
        if (!rest) {
          Logger.error('Usage: npm run kb -- ingest <path>');
          process.exit(1);
        }
        await this.pipeline.ingestPath(rest);
        break;
      case 'ask':
        if (!rest) {
          Logger.error('Usage: npm run kb -- ask <question>');
          process.exit(1);
        }
        console.log();
        const answer = await this.pipeline.ask(rest);
        console.log(answer);
        console.log();
        break;
      case 'stats':
        const stats = await this.pipeline.getStats();
        console.log(`\n知识库状态：共 ${stats.totalChunks} 个文本片段\n`);
        break;
      case 'clear':
        await this.pipeline.clearKnowledgeBase();
        Logger.success('知识库已清空');
        break;
      default:
        Logger.error(`Unknown command: ${command}`);
        process.exit(1);
    }

    process.exit(0);
  }

  private async handleCommand(input: string): Promise<void> {
    const parts = input.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'ask': {
        const question = args.join(' ');
        if (!question) {
          console.log('用法: ask <问题>');
          return;
        }
        console.log('\n检索中...');
        const answer = await this.pipeline.ask(question);
        console.log(`\n${answer}`);
        break;
      }

      case 'ingest': {
        const targetPath = args[0];
        if (!targetPath) {
          console.log('用法: ingest <文件或目录路径>');
          return;
        }
        console.log(`正在导入: ${targetPath}`);
        await this.pipeline.ingestPath(targetPath);
        break;
      }

      case 'stats': {
        const stats = await this.pipeline.getStats();
        console.log(`\n知识库状态：共 ${stats.totalChunks} 个文本片段\n`);
        break;
      }

      case 'clear': {
        console.log('\n确定要清空知识库吗？输入 yes 确认');
        const answer = await this.question('确认: ');
        if (answer.toLowerCase() === 'yes') {
          await this.pipeline.clearKnowledgeBase();
          Logger.success('知识库已清空');
        } else {
          console.log('已取消');
        }
        break;
      }

      case 'help':
        console.log(`
可用命令：
  ask <问题>         - 向知识库提问
  ingest <路径>      - 导入文档（支持文件或目录）
  stats              - 查看知识库状态
  clear              - 清空知识库
  help               - 显示帮助
  exit               - 退出
        `);
        break;

      case 'exit':
      case 'quit':
        this.rl.close();
        break;

      default:
        console.log(`未知命令: ${cmd}。输入 help 查看可用命令。`);
    }
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }
}
