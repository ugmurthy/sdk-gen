import Handlebars from 'handlebars';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ExtractedSchema, ExtractedOperation } from '../extractor.js';
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;

function isReferenceObject(obj: unknown): obj is ReferenceObject {
  return typeof obj === 'object' && obj !== null && '$ref' in obj;
}

function createSchemaFingerprint(schema: SchemaObject): string {
  if (schema.properties) {
    return Object.keys(schema.properties).sort().join(',');
  }
  return '';
}

let schemaFingerprintMap: Map<string, string> = new Map();

export function setSchemaMap(schemas: ExtractedSchema[]): void {
  schemaFingerprintMap = new Map();
  for (const s of schemas) {
    const fingerprint = createSchemaFingerprint(s.schema);
    if (fingerprint) {
      schemaFingerprintMap.set(fingerprint, s.name);
    }
  }
}

function openApiTypeToTs(schema: SchemaObject | ReferenceObject | undefined): string {
  if (!schema) return 'unknown';
  
  if (isReferenceObject(schema)) {
    const refName = schema.$ref.split('/').pop();
    return refName || 'unknown';
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return schema.enum.map(e => `'${e}'`).join(' | ');
    }
    return 'string';
  }
  if (schema.type === 'integer' || schema.type === 'number') return 'number';
  if (schema.type === 'boolean') return 'boolean';
  if (schema.type === 'array') {
    const items = schema.items as SchemaObject | ReferenceObject | undefined;
    if (items && isReferenceObject(items)) {
      const refName = items.$ref.split('/').pop();
      return `${refName}[]`;
    }
    return `${openApiTypeToTs(items)}[]`;
  }
  if (schema.type === 'object') {
    const fingerprint = createSchemaFingerprint(schema);
    if (fingerprint && schemaFingerprintMap.has(fingerprint)) {
      return schemaFingerprintMap.get(fingerprint)!;
    }
    if (schema.additionalProperties) {
      const valueType = openApiTypeToTs(schema.additionalProperties as SchemaObject);
      return `Record<string, ${valueType}>`;
    }
    return 'Record<string, unknown>';
  }

  return 'unknown';
}

function openApiTypeToZod(schema: SchemaObject | ReferenceObject | undefined): string {
  if (!schema) return 'z.unknown()';

  if (isReferenceObject(schema)) {
    const refName = schema.$ref.split('/').pop();
    return `${refName}Schema`;
  }

  if (schema.type === 'string') {
    if (schema.enum) {
      return `z.enum([${schema.enum.map(e => `'${e}'`).join(', ')}])`;
    }
    if (schema.format === 'date-time') return 'z.string().datetime()';
    if (schema.format === 'email') return 'z.string().email()';
    if (schema.format === 'uri') return 'z.string().url()';
    return 'z.string()';
  }
  if (schema.type === 'integer') return 'z.number().int()';
  if (schema.type === 'number') return 'z.number()';
  if (schema.type === 'boolean') return 'z.boolean()';
  if (schema.type === 'array') {
    const items = schema.items as SchemaObject | ReferenceObject | undefined;
    if (items && isReferenceObject(items)) {
      const refName = items.$ref.split('/').pop();
      return `z.array(${refName}Schema)`;
    }
    return `z.array(${openApiTypeToZod(items)})`;
  }
  if (schema.type === 'object') {
    if (schema.additionalProperties) {
      const valueType = openApiTypeToZod(schema.additionalProperties as SchemaObject);
      return `z.record(z.string(), ${valueType})`;
    }
    return 'z.record(z.string(), z.unknown())';
  }

  return 'z.unknown()';
}

export interface TemplateSchemaProperty {
  name: string;
  tsType: string;
  zodType: string;
  required: boolean;
  description?: string;
}

export interface TemplateSchema {
  name: string;
  description?: string;
  properties: TemplateSchemaProperty[];
}

export interface TemplateOperation {
  operationId: string;
  method: string;
  lowerMethod: string;
  path: string;
  summary?: string;
  description?: string;
  pathParameters: Array<{ name: string; tsType: string; required: boolean }>;
  queryParameters: Array<{ name: string; tsType: string; required: boolean }>;
  hasParams: boolean;
  hasQueryParams: boolean;
  requestBody?: {
    required: boolean;
    tsType: string;
  };
  responseType: string;
  responseSchemaName?: string;
  hasResponseSchema: boolean;
  isStreaming: boolean;
  streamingType?: 'sse' | 'ndjson';
  isSse: boolean;
}

export function prepareSchemas(schemas: ExtractedSchema[]): TemplateSchema[] {
  return schemas.map(schema => {
    const properties: TemplateSchemaProperty[] = [];
    const schemaObj = schema.schema as SchemaObject;
    const required = new Set(schemaObj.required || []);

    if (schemaObj.properties) {
      for (const [propName, propSchema] of Object.entries(schemaObj.properties)) {
        properties.push({
          name: propName,
          tsType: openApiTypeToTs(propSchema as SchemaObject | ReferenceObject),
          zodType: openApiTypeToZod(propSchema as SchemaObject | ReferenceObject),
          required: required.has(propName),
          description: (propSchema as SchemaObject).description,
        });
      }
    }

    return {
      name: schema.name,
      description: schemaObj.description,
      properties,
    };
  });
}

export function prepareOperations(operations: ExtractedOperation[], schemaNames: string[] = []): TemplateOperation[] {
  const schemaSet = new Set(schemaNames);
  
  return operations.map(op => {
    const pathParams = op.pathParameters.map(p => ({
      name: p.name,
      tsType: openApiTypeToTs(p.schema),
      required: p.required,
    }));

    const queryParams = op.queryParameters.map(p => ({
      name: p.name,
      tsType: openApiTypeToTs(p.schema),
      required: p.required,
    }));

    let responseType = 'void';
    let responseSchemaName: string | undefined;
    let hasResponseSchema = false;

    if (op.responseSchema) {
      if (isReferenceObject(op.responseSchema)) {
        responseSchemaName = op.responseSchema.$ref.split('/').pop();
        responseType = responseSchemaName || 'unknown';
        hasResponseSchema = true;
      } else {
        responseType = openApiTypeToTs(op.responseSchema);
      }
    }

    return {
      operationId: op.operationId,
      method: op.method,
      lowerMethod: op.method.toLowerCase(),
      path: op.path,
      summary: op.summary,
      description: op.description,
      pathParameters: pathParams,
      queryParameters: queryParams,
      hasParams: pathParams.length > 0 || queryParams.length > 0 || !!op.requestBody,
      hasQueryParams: queryParams.length > 0,
      requestBody: op.requestBody ? {
        required: op.requestBody.required,
        tsType: openApiTypeToTs(op.requestBody.schema),
      } : undefined,
      responseType,
      responseSchemaName,
      hasResponseSchema,
      isStreaming: op.isStreaming,
      streamingType: op.streamingType,
      isSse: op.streamingType === 'sse',
    };
  });
}

export function loadTemplate(language: 'typescript' | 'python', templateName: string): HandlebarsTemplateDelegate {
  const templatePath = join(__dirname, language, `${templateName}.hbs`);
  const templateContent = readFileSync(templatePath, 'utf-8');
  return Handlebars.compile(templateContent);
}

export function renderInterfaces(schemas: ExtractedSchema[]): string {
  const template = loadTemplate('typescript', 'interfaces');
  return template({ schemas: prepareSchemas(schemas) });
}

export function renderZodSchemas(schemas: ExtractedSchema[]): string {
  const template = loadTemplate('typescript', 'zod-schemas');
  return template({ schemas: prepareSchemas(schemas) });
}

export function renderClient(
  operations: ExtractedOperation[],
  schemas: ExtractedSchema[],
  clientName: string = 'ApiClient'
): string {
  setSchemaMap(schemas);
  const template = loadTemplate('typescript', 'client');
  const schemaNames = schemas.map(s => s.name);
  return template({
    operations: prepareOperations(operations, schemaNames),
    clientName,
    schemaNames,
    hasSchemas: schemaNames.length > 0,
  });
}
