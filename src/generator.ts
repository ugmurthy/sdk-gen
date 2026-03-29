import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { ExtractedData, ExtractedOperation, ExtractedSchema } from './extractor.js';
import { renderInterfaces, renderZodSchemas, renderClient, renderGroupedClient, renderPythonModels, renderPythonClient, renderPythonStreamingClient, setSchemaMap } from './templates/index.js';
import { hasServiceGrouping, groupOperationsByService, getOriginalOperationIds, type GroupedOperations } from './nameMapper.js';
import prettier from 'prettier';

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

function isReferenceObject(obj: unknown): obj is ReferenceObject {
  return typeof obj === 'object' && obj !== null && '$ref' in obj;
}

function formatSchemaType(schema: SchemaObject | ReferenceObject | undefined, schemas: ExtractedSchema[]): string {
  if (!schema) return 'unknown';
  if (isReferenceObject(schema)) {
    return schema.$ref.split('/').pop() || 'unknown';
  }
  if (schema.type === 'array') {
    const items = (schema as OpenAPIV3.ArraySchemaObject).items as SchemaObject | ReferenceObject | undefined;
    return `array of ${formatSchemaType(items, schemas)}`;
  }
  let typeStr = (schema.type as string) || 'object';
  if (schema.format) {
    typeStr += ` (${schema.format})`;
  }
  if (schema.enum) {
    typeStr += ` enum: [${schema.enum.map(v => `\`${v}\``).join(', ')}]`;
  }
  return typeStr;
}

function resolveSchema(schema: SchemaObject | ReferenceObject | undefined, schemas: ExtractedSchema[]): SchemaObject | undefined {
  if (!schema) return undefined;
  if (isReferenceObject(schema)) {
    const refName = schema.$ref.split('/').pop();
    const found = schemas.find(s => s.name === refName);
    return found?.schema;
  }
  return schema as SchemaObject;
}

function renderSchemaTable(
  schema: SchemaObject | ReferenceObject | undefined,
  schemas: ExtractedSchema[],
  indent: string = ''
): string {
  if (!schema) return '';

  const resolved = resolveSchema(schema, schemas);
  if (!resolved) return '';

  let properties: Record<string, SchemaObject | ReferenceObject> | undefined;
  let requiredFields: string[] = [];

  if (resolved.type === 'object' || resolved.properties) {
    properties = resolved.properties as Record<string, SchemaObject | ReferenceObject> | undefined;
    requiredFields = (resolved.required as string[]) || [];
  } else if (resolved.type === 'array') {
    const items = (resolved as OpenAPIV3.ArraySchemaObject).items as SchemaObject | ReferenceObject | undefined;
    const resolvedItems = resolveSchema(items, schemas);
    if (resolvedItems?.properties) {
      properties = resolvedItems.properties as Record<string, SchemaObject | ReferenceObject> | undefined;
      requiredFields = (resolvedItems.required as string[]) || [];
    }
  }

  if (!properties || Object.keys(properties).length === 0) return '';

  let table = `${indent}| Property | Type | Required | Description |\n`;
  table += `${indent}|----------|------|----------|-------------|\n`;

  for (const [propName, propSchema] of Object.entries(properties)) {
    const typeStr = formatSchemaType(propSchema, schemas);
    const isRequired = requiredFields.includes(propName);
    const desc = !isReferenceObject(propSchema) ? ((propSchema as SchemaObject).description || '') : '';
    table += `${indent}| \`${propName}\` | ${typeStr} | ${isRequired ? 'Yes' : 'No'} | ${desc.replace(/\|/g, '\\|').replace(/\n/g, ' ')} |\n`;
  }

  return table;
}

function renderOperationDetails(
  op: ExtractedOperation,
  schemas: ExtractedSchema[],
  methodPrefix: string
): string {
  const params = getParamsList(op);
  let block = `#### \`${methodPrefix}${op.operationId}(${params.join(', ')})\`\n\n`;

  const desc = op.description || op.summary;
  if (desc) {
    block += `${desc}\n\n`;
  }

  if (op.pathParameters.length > 0) {
    block += `**Path Parameters:**\n\n`;
    block += `| Parameter | Type | Required | Description |\n`;
    block += `|-----------|------|----------|-------------|\n`;
    for (const p of op.pathParameters) {
      const typeStr = formatSchemaType(p.schema, schemas);
      block += `| \`${p.name}\` | ${typeStr} | ${p.required ? 'Yes' : 'No'} | |\n`;
    }
    block += '\n';
  }

  if (op.queryParameters.length > 0) {
    block += `**Query Parameters:**\n\n`;
    block += `| Parameter | Type | Required | Description |\n`;
    block += `|-----------|------|----------|-------------|\n`;
    for (const p of op.queryParameters) {
      const typeStr = formatSchemaType(p.schema, schemas);
      block += `| \`${p.name}\` | ${typeStr} | ${p.required ? 'Yes' : 'No'} | |\n`;
    }
    block += '\n';
  }

  if (op.requestBody) {
    const refName = isReferenceObject(op.requestBody.schema)
      ? op.requestBody.schema.$ref.split('/').pop()
      : null;
    block += `**Request Body:**${refName ? ` \`${refName}\`` : ''}\n\n`;
    const table = renderSchemaTable(op.requestBody.schema, schemas);
    if (table) {
      block += table + '\n';
    }
  }

  if (op.responseSchema) {
    const refName = isReferenceObject(op.responseSchema)
      ? op.responseSchema.$ref.split('/').pop()
      : null;
    block += `**Response:**${refName ? ` \`${refName}\`` : ''}\n\n`;
    const table = renderSchemaTable(op.responseSchema, schemas);
    if (table) {
      block += table + '\n';
    }
  }

  if (!op.isStreaming) {
    block += `**Cancellation:** Pass an \`AbortSignal\` via \`${
      op.pathParameters.length > 0 || op.queryParameters.length > 0 || op.requestBody
        ? 'params.signal'
        : 'options.signal'
    }\` to cancel the request.\n\n`;
  }

  block += `---\n\n`;
  return block;
}

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

  // Check if service grouping is enabled
  let clientContent: string;
  if (hasServiceGrouping()) {
    const originalIds = getOriginalOperationIds(data);
    const groupedOps = groupOperationsByService(data.operations, originalIds);
    clientContent = renderGroupedClient(groupedOps, data.schemas, clientName);
  } else {
    clientContent = renderClient(data.operations, data.schemas, clientName);
  }

  files.push({
    path: 'client.ts',
    content: clientContent,
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
  const useGrouping = hasServiceGrouping();
  const originalIds = getOriginalOperationIds(data);
  const groupedOps = useGrouping ? groupOperationsByService(data.operations, originalIds) : null;
  
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
    const exampleCall = getMethodCallString(nonStreamingOp, groupedOps);
    readme += `
// Example API call
const response = await client.${exampleCall}(/* params */);
`;
  }

  readme += `\`\`\`
`;

  if (hasStreaming && streamingOp) {
    const streamingCall = getMethodCallString(streamingOp, groupedOps);
    readme += `
## Streaming

\`\`\`typescript
// Streaming example
for await (const chunk of client.${streamingCall}(/* params */)) {
  console.log(chunk);
}
\`\`\`
`;
  }

  readme += `
## API Methods

`;

  if (useGrouping && groupedOps) {
    for (const [serviceName, ops] of Object.entries(groupedOps)) {
      readme += `### ${serviceName}\n\n`;
      for (const op of ops) {
        const params = getParamsList(op);
        readme += `- \`${serviceName}.${op.operationId}(${params.join(', ')})\`${op.isStreaming ? ' - Streaming' : ''}\n`;
      }
      readme += '\n';
    }
  } else {
    for (const op of data.operations) {
      const params = getParamsList(op);
      readme += `- \`${op.operationId}(${params.join(', ')})\`${op.isStreaming ? ' - Streaming' : ''}\n`;
    }
  }

  readme += `\n## API Reference\n\n`;

  if (useGrouping && groupedOps) {
    for (const [serviceName, ops] of Object.entries(groupedOps)) {
      readme += `### ${serviceName}\n\n`;
      for (const op of ops) {
        readme += renderOperationDetails(op, data.schemas, `${serviceName}.`);
      }
    }
  } else {
    for (const op of data.operations) {
      readme += renderOperationDetails(op, data.schemas, '');
    }
  }

  readme += `
## License

MIT
`;

  return readme;
}

function getMethodCallString(
  op: ExtractedOperation,
  groupedOps: GroupedOperations | null
): string {
  if (!groupedOps) {
    return op.operationId;
  }
  
  for (const [serviceName, ops] of Object.entries(groupedOps)) {
    const found = ops.find(o => o.operationId === op.operationId);
    if (found) {
      return `${serviceName}.${found.operationId}`;
    }
  }
  return op.operationId;
}

function getParamsList(op: ExtractedOperation): string[] {
  const params: string[] = [];
  const hasParams = op.pathParameters.length > 0 || op.queryParameters.length > 0 || !!op.requestBody;
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
  } else if (!hasParams) {
    params.push('options?');
  }
  return params;
}

function generateTsGitignore(): string {
  return `node_modules/
dist/
*.log
.DS_Store
`;
}

export function generatePythonPackageFiles(
  data: ExtractedData,
  options: PackageOptions,
  clientName: string = 'ApiClient'
): GeneratedFile[] {
  const sdkFiles = generatePythonSDK(data, clientName);
  
  const packageName = options.name.replace(/-/g, '_');
  
  const srcFiles = sdkFiles.map(f => ({
    path: `${packageName}/${f.path}`,
    content: f.content,
  }));

  const pyprojectToml = generatePyprojectToml(options, data.operations);
  const setupPy = generateSetupPy(options, data.operations);
  const readme = generatePythonReadme(options, clientName, data);
  const gitignore = generatePythonGitignore();

  return [
    ...srcFiles,
    { path: 'pyproject.toml', content: pyprojectToml },
    { path: 'setup.py', content: setupPy },
    { path: 'README.md', content: readme },
    { path: '.gitignore', content: gitignore },
  ];
}

function generatePyprojectToml(options: PackageOptions, operations: ExtractedOperation[]): string {
  const hasStreaming = operations.some(op => op.isStreaming);
  const packageName = options.name.replace(/-/g, '_');
  
  const dependencies = ['pydantic>=2.0.0', 'requests>=2.28.0'];
  if (hasStreaming) {
    dependencies.push('httpx>=0.24.0');
  }
  
  return `[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "${options.name}"
version = "${options.version || '1.0.0'}"
description = "${options.description || `SDK client for ${options.name}`}"
readme = "README.md"
requires-python = ">=3.9"
license = {text = "MIT"}
dependencies = [
${dependencies.map(d => `    "${d}",`).join('\n')}
]

[project.optional-dependencies]
dev = [
    "mypy>=1.0.0",
    "types-requests>=2.28.0",
]

[tool.setuptools.packages.find]
where = ["."]
include = ["${packageName}*"]

[tool.mypy]
python_version = "3.9"
strict = true
`;
}

function generateSetupPy(options: PackageOptions, operations: ExtractedOperation[]): string {
  const hasStreaming = operations.some(op => op.isStreaming);
  const packageName = options.name.replace(/-/g, '_');
  
  const dependencies = ["'pydantic>=2.0.0'", "'requests>=2.28.0'"];
  if (hasStreaming) {
    dependencies.push("'httpx>=0.24.0'");
  }
  
  return `#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Backwards-compatible setup.py for ${options.name}."""

from setuptools import setup, find_packages

setup(
    name="${options.name}",
    version="${options.version || '1.0.0'}",
    description="${options.description || `SDK client for ${options.name}`}",
    long_description=open("README.md").read(),
    long_description_content_type="text/markdown",
    python_requires=">=3.9",
    packages=find_packages(),
    install_requires=[
        ${dependencies.join(',\n        ')},
    ],
    extras_require={
        "dev": [
            "mypy>=1.0.0",
            "types-requests>=2.28.0",
        ],
    },
)
`;
}

function generatePythonReadme(options: PackageOptions, clientName: string, data: ExtractedData): string {
  const hasStreaming = data.operations.some(op => op.isStreaming);
  const nonStreamingOp = data.operations.find(op => !op.isStreaming);
  const streamingOp = data.operations.find(op => op.isStreaming);
  const packageName = options.name.replace(/-/g, '_');

  let readme = `# ${options.name}

${options.description || `Python SDK client for ${options.name}`}

## Installation

\`\`\`bash
pip install ${options.name}
\`\`\`

## Usage

\`\`\`python
from ${packageName} import ${clientName}

client = ${clientName}(
    base_url="https://api.example.com",
    token="your-api-token",  # Optional
)
`;

  if (nonStreamingOp) {
    const snakeName = toSnakeCase(nonStreamingOp.operationId);
    readme += `
# Example API call
response = client.${snakeName}(...)
`;
  }

  readme += `\`\`\`
`;

  if (hasStreaming && streamingOp) {
    const snakeName = toSnakeCase(streamingOp.operationId);
    readme += `
## Streaming

\`\`\`python
import asyncio
from ${packageName} import ${clientName}Streaming

async def main():
    client = ${clientName}Streaming(
        base_url="https://api.example.com",
        token="your-api-token",
    )
    
    async for chunk in client.${snakeName}(...):
        print(chunk)

asyncio.run(main())
\`\`\`
`;
  }

  readme += `
## API Methods

`;

  for (const op of data.operations) {
    const snakeName = toSnakeCase(op.operationId);
    const params: string[] = [];
    if (op.pathParameters.length > 0) {
      params.push(...op.pathParameters.map(p => toSnakeCase(p.name)));
    }
    if (op.requestBody) {
      params.push('body');
    }
    if (op.queryParameters.length > 0) {
      params.push('**kwargs');
    }
    
    readme += `- \`${snakeName}(${params.join(', ')})\`${op.isStreaming ? ' - Streaming (async)' : ''}\n`;
  }

  readme += `\n## API Reference\n\n`;

  for (const op of data.operations) {
    const snakeName = toSnakeCase(op.operationId);
    const pyParams: string[] = [];
    if (op.pathParameters.length > 0) {
      pyParams.push(...op.pathParameters.map(p => toSnakeCase(p.name)));
    }
    if (op.requestBody) {
      pyParams.push('body');
    }
    if (op.queryParameters.length > 0) {
      pyParams.push('**kwargs');
    }

    let block = `#### \`${snakeName}(${pyParams.join(', ')})\`\n\n`;

    const desc = op.description || op.summary;
    if (desc) {
      block += `${desc}\n\n`;
    }

    if (op.pathParameters.length > 0) {
      block += `**Path Parameters:**\n\n`;
      block += `| Parameter | Type | Required | Description |\n`;
      block += `|-----------|------|----------|-------------|\n`;
      for (const p of op.pathParameters) {
        const typeStr = formatSchemaType(p.schema, data.schemas);
        block += `| \`${toSnakeCase(p.name)}\` | ${typeStr} | ${p.required ? 'Yes' : 'No'} | |\n`;
      }
      block += '\n';
    }

    if (op.queryParameters.length > 0) {
      block += `**Query Parameters:**\n\n`;
      block += `| Parameter | Type | Required | Description |\n`;
      block += `|-----------|------|----------|-------------|\n`;
      for (const p of op.queryParameters) {
        const typeStr = formatSchemaType(p.schema, data.schemas);
        block += `| \`${toSnakeCase(p.name)}\` | ${typeStr} | ${p.required ? 'Yes' : 'No'} | |\n`;
      }
      block += '\n';
    }

    if (op.requestBody) {
      const refName = isReferenceObject(op.requestBody.schema)
        ? op.requestBody.schema.$ref.split('/').pop()
        : null;
      block += `**Request Body:**${refName ? ` \`${refName}\`` : ''}\n\n`;
      const table = renderSchemaTable(op.requestBody.schema, data.schemas);
      if (table) {
        block += table + '\n';
      }
    }

    if (op.responseSchema) {
      const refName = isReferenceObject(op.responseSchema)
        ? op.responseSchema.$ref.split('/').pop()
        : null;
      block += `**Response:**${refName ? ` \`${refName}\`` : ''}\n\n`;
      const table = renderSchemaTable(op.responseSchema, data.schemas);
      if (table) {
        block += table + '\n';
      }
    }

    block += `---\n\n`;
    readme += block;
  }

  readme += `
## Requirements

- Python 3.9+
- pydantic >= 2.0.0
- requests >= 2.28.0
${hasStreaming ? '- httpx >= 0.24.0 (for streaming)\n' : ''}
## License

MIT
`;

  return readme;
}

function generatePythonGitignore(): string {
  return `__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg
.mypy_cache/
.pytest_cache/
.venv/
venv/
ENV/
.DS_Store
`;
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .replace(/^_/, '')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
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
