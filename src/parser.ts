import SwaggerParser from '@apidevtools/swagger-parser';
import { existsSync, readFileSync } from 'fs';
import { extname, resolve } from 'path';
import { load as yamlLoad } from 'js-yaml';
import type { OpenAPI, OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

export type OpenAPISpec = OpenAPIV3.Document | OpenAPIV3_1.Document;

export interface ParseOptions {
  fixNullable?: boolean;
}

const SUPPORTED_EXTENSIONS = ['.json', '.yaml', '.yml'];

/**
 * Converts OpenAPI 3.1-style nullable types (type: ["string", "null"]) 
 * to OpenAPI 3.0-style (type: "string", nullable: true)
 */
function convertNullableTypes(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(convertNullableTypes);
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (key === 'type' && Array.isArray(value)) {
        const types = value as string[];
        const nullIndex = types.indexOf('null');
        
        if (nullIndex !== -1 && types.length === 2) {
          const nonNullType = types.find(t => t !== 'null');
          result['type'] = nonNullType;
          result['nullable'] = true;
        } else if (nullIndex !== -1 && types.length > 2) {
          result['type'] = types.filter(t => t !== 'null');
          result['nullable'] = true;
        } else {
          result[key] = value;
        }
      } else {
        result[key] = convertNullableTypes(value);
      }
    }
    
    return result;
  }

  return obj;
}

/**
 * Detects if validation errors are related to 3.1-style nullable types
 */
function isNullableTypeError(errorMessage: string): boolean {
  const nullablePatterns = [
    /type must be string/i,
    /type must be equal to one of the allowed values/i,
    /must match exactly one schema in oneOf/i,
  ];
  
  return nullablePatterns.some(pattern => pattern.test(errorMessage));
}

export async function parseOpenAPISpec(specFile: string, options: ParseOptions = {}): Promise<OpenAPISpec> {
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
    let api: OpenAPI.Document;

    if (options.fixNullable) {
      const content = readFileSync(resolvedPath, 'utf-8');
      let parsed: unknown;
      
      if (ext === '.json') {
        parsed = JSON.parse(content);
      } else {
        parsed = yamlLoad(content);
      }
      
      const converted = convertNullableTypes(parsed) as OpenAPI.Document;
      api = await SwaggerParser.validate(converted) as OpenAPI.Document;
      console.log('Applied --fix-nullable: converted 3.1-style nullable types to 3.0 format');
    } else {
      api = await SwaggerParser.validate(resolvedPath) as OpenAPI.Document;
    }
    
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
      
      if (!options.fixNullable && isNullableTypeError(error.message)) {
        throw new Error(
          `Failed to validate OpenAPI specification:\n${error.message}\n\n` +
          `💡 Hint: This error may be caused by OpenAPI 3.1-style nullable types (e.g., type: ["string", "null"]).\n` +
          `   Try running with --fix-nullable to automatically convert them to 3.0 format.`
        );
      }
      
      throw new Error(`Failed to validate OpenAPI specification:\n${error.message}`);
    }
    throw error;
  }
}
