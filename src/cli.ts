#!/usr/bin/env node
import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import { parseOpenAPISpec } from './parser.js';
import { extractAll } from './extractor.js';
import { generateTypeScriptSDK, generatePythonSDK, writeGeneratedFiles } from './generator.js';

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
  .option('--force', 'Overwrite existing files without prompting')
  .action(async (specFile: string, options: { lang: string; output: string; package?: boolean; name?: string; force?: boolean }) => {
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

      const outputDir = resolve(options.output);
      console.log(`Generating ${options.lang} SDK to ${outputDir}`);

      const files = options.lang === 'ts' 
        ? generateTypeScriptSDK(extracted)
        : generatePythonSDK(extracted);

      const existingFiles = files.filter(f => existsSync(join(outputDir, f.path)));
      
      if (existingFiles.length > 0 && !options.force) {
        console.log(`\nThe following files already exist:`);
        existingFiles.forEach(f => console.log(`  - ${f.path}`));
        
        const shouldOverwrite = await promptConfirmation('Overwrite existing files? (y/n): ');
        if (!shouldOverwrite) {
          console.log('Aborted.');
          process.exit(0);
        }
      }

      await writeGeneratedFiles(files, outputDir, options.force || existingFiles.length > 0);
      const langName = options.lang === 'ts' ? 'TypeScript' : 'Python';
      console.log(`\nSuccessfully generated ${langName} SDK in ${outputDir}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      } else {
        console.error('An unexpected error occurred');
      }
      process.exit(1);
    }
  });

async function promptConfirmation(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

program.parse();
