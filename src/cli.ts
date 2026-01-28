#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseOpenAPISpec } from './parser.js';
import { extractAll } from './extractor.js';
import { renderInterfaces, renderZodSchemas, renderClient } from './templates/index.js';

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

    try {
      const spec = await parseOpenAPISpec(specFile);
      console.log(`Parsed OpenAPI ${spec.openapi} specification: ${spec.info.title} v${spec.info.version}`);

      const extracted = extractAll(spec);
      console.log(`Found ${extracted.operations.length} operations and ${extracted.schemas.length} schemas`);
      
      const streamingOps = extracted.operations.filter(op => op.isStreaming);
      if (streamingOps.length > 0) {
        console.log(`Detected ${streamingOps.length} streaming endpoint(s)`);
      }

      console.log(`Generating ${options.lang} SDK to ${options.output}`);

      if (options.lang === 'ts') {
        const interfaces = renderInterfaces(extracted.schemas);
        const zodSchemas = renderZodSchemas(extracted.schemas);
        const client = renderClient(extracted.operations, extracted.schemas);
        console.log('\n--- Generated Interfaces ---\n', interfaces);
        console.log('\n--- Generated Zod Schemas ---\n', zodSchemas);
        console.log('\n--- Generated Client ---\n', client);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

program.parse();
