#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

const program = new Command();

program
  .name('sdk-gen')
  .description('CLI tool that generates fully-typed SDK clients from OpenAPI specifications')
  .version(pkg.version);

program
  .argument('<spec-file>', 'Path to OpenAPI specification file (JSON or YAML)')
  .requiredOption('--lang <language>', 'Target language: ts or python')
  .requiredOption('--output <dir>', 'Output directory for generated SDK')
  .option('--package', 'Generate as publishable package')
  .option('--name <name>', 'Package name (required with --package)')
  .action(async (specFile: string, options: { lang: string; output: string; package?: boolean; name?: string }) => {
    if (options.lang !== 'ts' && options.lang !== 'python') {
      console.error('Error: --lang must be either "ts" or "python"');
      process.exit(1);
    }

    if (options.package && !options.name) {
      console.error('Error: --name is required when using --package');
      process.exit(1);
    }

    console.log(`Generating ${options.lang} SDK from ${specFile} to ${options.output}`);
  });

program.parse();
