import { CliCommands } from './cli/commands';

async function main() {
  const args = process.argv.slice(2);

  const cli = new CliCommands();

  if (args.length > 0) {
    await cli.handleOneShot(args);
  } else {
    await cli.startRepl();
  }
}

main();
