import SwaggerParser from '@apidevtools/swagger-parser';
import { existsSync } from 'fs';
import { extname, resolve } from 'path';
import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document;

const SUPPORTED_EXTENSIONS = ['.json', '.yaml', '.yml'];

export async function parseOpenAPISpec(specFile: string): Promise<OpenAPISpec> {
  const resolvedPath = resolve(specFile);
  
  if (!existsSync(resolvedPath)) {
    throw new Error(`File not found: ${resolvedPath}`);
  }

  const ext = extname(resolvedPath).toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    throw new Error(
      `Unsupported file extension "${ext}". Supported extensions: ${SUPPORTED_EXTENSIONS.join(', ')}`
    );
  }

  try {
    const api = await SwaggerParser.validate(resolvedPath) as OpenAPI.Document;
    
    if (!('openapi' in api)) {
      throw new Error('Only OpenAPI 3.0 and 3.1 specifications are supported. Swagger 2.0 is not supported.');
    }

    const version = api.openapi;
    if (!version.startsWith('3.0') && !version.startsWith('3.1')) {
      throw new Error(`Unsupported OpenAPI version: ${version}. Only 3.0.x and 3.1.x are supported.`);
    }

    return api as OpenAPISpec;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('is not a valid')) {
        throw new Error(`Invalid OpenAPI specification:\n${error.message}`);
      }
      if (error.message.includes('ENOENT')) {
        throw new Error(`File not found: ${resolvedPath}`);
      }
      if (error.message.includes('YAML') || error.message.includes('JSON')) {
        throw new Error(`Failed to parse file as ${ext === '.json' ? 'JSON' : 'YAML'}:\n${error.message}`);
      }
      throw new Error(`Failed to validate OpenAPI specification:\n${error.message}`);
    }
    throw error;
  }
}
