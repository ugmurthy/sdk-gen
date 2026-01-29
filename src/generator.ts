import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import type { ExtractedData, ExtractedOperation } from './extractor.js';
import { renderInterfaces, renderZodSchemas, renderClient, renderPythonModels, renderPythonClient, renderPythonStreamingClient, setSchemaMap } from './templates/index.js';
import prettier from 'prettier';

export interface GeneratorOptions {
  outputDir: string;
  language: 'ts' | 'python';
  packageMode?: boolean;
  packageName?: string;
}

export interface PackageOptions {
  name: string;
  description?: string;
  version?: string;
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

export function generateTypeScriptPackageFiles(
  data: ExtractedData,
  options: PackageOptions,
  clientName: string = 'ApiClient'
): GeneratedFile[] {
  const sdkFiles = generateTypeScriptSDK(data, clientName);
  
  const srcFiles = sdkFiles.map(f => ({
    path: `src/${f.path}`,
    content: f.content,
  }));

  const packageJson = generateTsPackageJson(options, data.operations);
  const tsconfig = generateTsConfig();
  const readme = generateTsReadme(options, clientName, data);
  const gitignore = generateTsGitignore();

  return [
    ...srcFiles,
    { path: 'package.json', content: packageJson },
    { path: 'tsconfig.json', content: tsconfig },
    { path: 'README.md', content: readme },
    { path: '.gitignore', content: gitignore },
  ];
}

function generateTsPackageJson(options: PackageOptions, operations: ExtractedOperation[]): string {
  const hasStreaming = operations.some(op => op.isStreaming);
  const deps: Record<string, string> = {
    axios: '^1.6.0',
    zod: '^3.22.0',
  };

  const pkg = {
    name: options.name,
    version: options.version || '1.0.0',
    description: options.description || `SDK client for ${options.name}`,
    type: 'module',
    main: './dist/index.js',
    types: './dist/index.d.ts',
    exports: {
      '.': {
        types: './dist/index.d.ts',
        import: './dist/index.js',
      },
    },
    files: ['dist'],
    scripts: {
      build: 'tsc',
      prepublishOnly: 'npm run build',
    },
    dependencies: deps,
    devDependencies: {
      typescript: '^5.3.0',
    },
    engines: {
      node: '>=18.0.0',
    },
  };

  return JSON.stringify(pkg, null, 2) + '\n';
}

function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2020',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      outDir: './dist',
      rootDir: './src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*'],
    exclude: ['node_modules', 'dist'],
  };

  return JSON.stringify(config, null, 2) + '\n';
}

function generateTsReadme(options: PackageOptions, clientName: string, data: ExtractedData): string {
  const hasStreaming = data.operations.some(op => op.isStreaming);
  const nonStreamingOp = data.operations.find(op => !op.isStreaming);
  const streamingOp = data.operations.find(op => op.isStreaming);

  let readme = `# ${options.name}

${options.description || `TypeScript SDK client for ${options.name}`}

## Installation

\`\`\`bash
npm install ${options.name}
\`\`\`

## Usage

\`\`\`typescript
import { ${clientName} } from '${options.name}';

const client = new ${clientName}({
  baseUrl: 'https://api.example.com',
  token: 'your-api-token', // Optional
});
`;

  if (nonStreamingOp) {
    readme += `
// Example API call
const response = await client.${nonStreamingOp.operationId}(/* params */);
`;
  }

  readme += `\`\`\`
`;

  if (hasStreaming && streamingOp) {
    readme += `
## Streaming

\`\`\`typescript
// Streaming example
for await (const chunk of client.${streamingOp.operationId}(/* params */)) {
  console.log(chunk);
}
\`\`\`
`;
  }

  readme += `
## API Methods

`;

  for (const op of data.operations) {
    const params: string[] = [];
    if (op.pathParameters.length > 0) {
      params.push(...op.pathParameters.map(p => p.name));
    }
    if (op.queryParameters.length > 0) {
      params.push('options?');
    }
    if (op.requestBody) {
      params.push('body');
    }
    if (op.isStreaming) {
      params.push('signal?');
    }
    
    readme += `- \`${op.operationId}(${params.join(', ')})\`${op.isStreaming ? ' - Streaming' : ''}\n`;
  }

  readme += `
## License

MIT
`;

  return readme;
}

function generateTsGitignore(): string {
  return `node_modules/
dist/
*.log
.DS_Store
`;
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

async function formatTypeScriptFile(content: string, filePath: string): Promise<string> {
  try {
    return await prettier.format(content, {
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'es5',
      printWidth: 100,
      tabWidth: 2,
    });
  } catch {
    console.warn(`Warning: Could not format ${filePath} with Prettier`);
    return content;
  }
}

function formatPythonFile(content: string, filePath: string): string {
  try {
    const result = execSync('black --quiet -', {
      input: content,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return result;
  } catch {
    console.warn(`Warning: Could not format ${filePath} with Black (is Black installed?)`);
    return content;
  }
}

export async function writeGeneratedFiles(
  files: GeneratedFile[],
  outputDir: string,
  overwrite: boolean = false
): Promise<void> {
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  for (const file of files) {
    const filePath = join(outputDir, file.path);
    const fileDir = dirname(filePath);
    
    if (!existsSync(fileDir)) {
      mkdirSync(fileDir, { recursive: true });
    }
    
    if (existsSync(filePath) && !overwrite) {
      console.log(`Skipping ${file.path} (already exists)`);
      continue;
    }

    let content = file.content;
    
    if (file.path.endsWith('.ts')) {
      content = await formatTypeScriptFile(content, file.path);
    } else if (file.path.endsWith('.py')) {
      content = formatPythonFile(content, file.path);
    }

    writeFileSync(filePath, content, 'utf-8');
    console.log(`Generated ${file.path}`);
  }
}
