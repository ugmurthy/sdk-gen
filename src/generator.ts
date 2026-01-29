import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import type { ExtractedData } from './extractor.js';
import { renderInterfaces, renderZodSchemas, renderClient, renderPythonModels, renderPythonClient, renderPythonStreamingClient, setSchemaMap } from './templates/index.js';

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

export function generatePythonSDK(
  data: ExtractedData,
  clientName: string = 'ApiClient'
): GeneratedFile[] {
  setSchemaMap(data.schemas);
  
  const files: GeneratedFile[] = [];

  if (data.schemas.length > 0) {
    files.push({
      path: 'models.py',
      content: renderPythonModels(data.schemas),
    });
  }

  files.push({
    path: 'client.py',
    content: renderPythonClient(data.operations, data.schemas, clientName),
  });

  // Add streaming client if there are streaming operations
  const hasStreamingOps = data.operations.some(op => op.isStreaming);
  if (hasStreamingOps) {
    files.push({
      path: 'streaming_client.py',
      content: renderPythonStreamingClient(data.operations, data.schemas, clientName),
    });
  }

  files.push({
    path: '__init__.py',
    content: generatePythonInitFile(data.schemas.length > 0, clientName, data.schemas.map(s => s.name), hasStreamingOps),
  });

  return files;
}

function generatePythonInitFile(hasSchemas: boolean, clientName: string, schemaNames: string[], hasStreaming: boolean = false): string {
  const lines: string[] = [];
  
  if (hasSchemas) {
    lines.push(`from .models import ${schemaNames.join(', ')}`);
  }
  lines.push(`from .client import ${clientName}, ${clientName}Config`);
  if (hasStreaming) {
    lines.push(`from .streaming_client import ${clientName}Streaming, ${clientName}StreamingConfig`);
  }
  lines.push('');
  
  const exports = hasSchemas 
    ? [...schemaNames, clientName, `${clientName}Config`]
    : [clientName, `${clientName}Config`];
  
  if (hasStreaming) {
    exports.push(`${clientName}Streaming`, `${clientName}StreamingConfig`);
  }
  
  lines.push(`__all__ = [${exports.map(e => `"${e}"`).join(', ')}]`);
  lines.push('');
  
  return lines.join('\n');
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
