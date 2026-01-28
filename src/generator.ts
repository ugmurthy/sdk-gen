import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { ExtractedData } from './extractor.js';
import { renderInterfaces, renderZodSchemas, renderClient, setSchemaMap } from './templates/index.js';

export interface GeneratorOptions {
  outputDir: string;
  language: 'ts' | 'python';
  packageMode?: boolean;
  packageName?: string;
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export function generateTypeScriptSDK(
  data: ExtractedData,
  clientName: string = 'ApiClient'
): GeneratedFile[] {
  setSchemaMap(data.schemas);
  
  const files: GeneratedFile[] = [];

  if (data.schemas.length > 0) {
    files.push({
      path: 'types.ts',
      content: renderInterfaces(data.schemas),
    });

    files.push({
      path: 'schemas.ts',
      content: renderZodSchemas(data.schemas),
    });
  }

  files.push({
    path: 'client.ts',
    content: renderClient(data.operations, data.schemas, clientName),
  });

  files.push({
    path: 'index.ts',
    content: generateIndexFile(data.schemas.length > 0, clientName),
  });

  return files;
}

function generateIndexFile(hasSchemas: boolean, clientName: string): string {
  const lines: string[] = [];
  
  if (hasSchemas) {
    lines.push("export * from './types.js';");
    lines.push("export * from './schemas.js';");
  }
  lines.push(`export { ${clientName}, ${clientName}Config } from './client.js';`);
  
  return lines.join('\n') + '\n';
}

export function writeGeneratedFiles(
  files: GeneratedFile[],
  outputDir: string,
  overwrite: boolean = false
): void {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const file of files) {
    const filePath = join(outputDir, file.path);
    
    if (existsSync(filePath) && !overwrite) {
      console.log(`Skipping ${file.path} (already exists)`);
      continue;
    }

    writeFileSync(filePath, file.content, 'utf-8');
    console.log(`Generated ${file.path}`);
  }
}
