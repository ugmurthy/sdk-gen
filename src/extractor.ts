import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types';
import type { OpenAPISpec } from './parser.js';

type SchemaObject = OpenAPIV3.SchemaObject | OpenAPIV3_1.SchemaObject;
type ReferenceObject = OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject;
type ParameterObject = OpenAPIV3.ParameterObject | OpenAPIV3_1.ParameterObject;
type RequestBodyObject = OpenAPIV3.RequestBodyObject | OpenAPIV3_1.RequestBodyObject;
type ResponseObject = OpenAPIV3.ResponseObject | OpenAPIV3_1.ResponseObject;
type MediaTypeObject = OpenAPIV3.MediaTypeObject | OpenAPIV3_1.MediaTypeObject;

export interface ExtractedParameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required: boolean;
  type: string;
  schema: SchemaObject | ReferenceObject | undefined;
}

export interface ExtractedOperation {
  operationId: string;
  method: string;
  path: string;
  summary?: string;
  description?: string;
  pathParameters: ExtractedParameter[];
  queryParameters: ExtractedParameter[];
  requestBody?: {
    required: boolean;
    schema: SchemaObject | ReferenceObject;
  };
  responseSchema?: SchemaObject | ReferenceObject;
  isStreaming: boolean;
  streamingType?: 'sse' | 'ndjson';
}

export interface ExtractedSchema {
  name: string;
  schema: SchemaObject;
}

export interface ExtractedData {
  operations: ExtractedOperation[];
  schemas: ExtractedSchema[];
}

function isReferenceObject(obj: unknown): obj is ReferenceObject {
  return typeof obj === 'object' && obj !== null && '$ref' in obj;
}

function deriveOperationId(method: string, path: string): string {
  const parts = path
    .split('/')
    .filter(Boolean)
    .map((part, index) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        const paramName = part.slice(1, -1);
        return `By${capitalize(paramName)}`;
      }
      return index === 0 ? part : capitalize(part);
    });

  return `${method}${parts.map(capitalize).join('')}`;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getTypeFromSchema(schema: SchemaObject | ReferenceObject | undefined): string {
  if (!schema) return 'unknown';
  if (isReferenceObject(schema)) {
    const refName = schema.$ref.split('/').pop();
    return refName || 'unknown';
  }
  if (schema.type === 'array') {
    const items = schema.items as SchemaObject | ReferenceObject | undefined;
    return `${getTypeFromSchema(items)}[]`;
  }
  return schema.type as string || 'unknown';
}

function extractPathParameters(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1, -1));
}

function extractParameters(
  parameters: (ParameterObject | ReferenceObject)[] | undefined,
  pathParams: string[]
): { pathParameters: ExtractedParameter[]; queryParameters: ExtractedParameter[] } {
  const pathParameters: ExtractedParameter[] = [];
  const queryParameters: ExtractedParameter[] = [];

  // Add path parameters from URL pattern that might not be in parameters array
  for (const paramName of pathParams) {
    pathParameters.push({
      name: paramName,
      in: 'path',
      required: true,
      type: 'string',
      schema: { type: 'string' }
    });
  }

  if (!parameters) {
    return { pathParameters, queryParameters };
  }

  for (const param of parameters) {
    if (isReferenceObject(param)) continue;

    const extracted: ExtractedParameter = {
      name: param.name,
      in: param.in as ExtractedParameter['in'],
      required: param.required ?? false,
      type: getTypeFromSchema(param.schema as SchemaObject | ReferenceObject | undefined),
      schema: param.schema as SchemaObject | ReferenceObject | undefined
    };

    if (param.in === 'path') {
      // Update existing path param if found
      const existingIndex = pathParameters.findIndex(p => p.name === param.name);
      if (existingIndex >= 0) {
        pathParameters[existingIndex] = extracted;
      } else {
        pathParameters.push(extracted);
      }
    } else if (param.in === 'query') {
      queryParameters.push(extracted);
    }
  }

  return { pathParameters, queryParameters };
}

function extractRequestBody(
  requestBody: RequestBodyObject | ReferenceObject | undefined
): ExtractedOperation['requestBody'] | undefined {
  if (!requestBody || isReferenceObject(requestBody)) return undefined;

  const jsonContent = requestBody.content?.['application/json'];
  if (!jsonContent?.schema) return undefined;

  return {
    required: requestBody.required ?? false,
    schema: jsonContent.schema as SchemaObject | ReferenceObject
  };
}

function extractResponseSchema(
  responses: OpenAPIV3.ResponsesObject | OpenAPIV3_1.ResponsesObject | undefined
): SchemaObject | ReferenceObject | undefined {
  if (!responses) return undefined;

  // Look for 2xx responses
  for (const code of ['200', '201', '202', '203', '204']) {
    const response = responses[code];
    if (!response || isReferenceObject(response)) continue;

    const content = (response as ResponseObject).content;
    if (!content) continue;

    // Check for JSON content first
    const jsonContent = content['application/json'];
    if (jsonContent?.schema) {
      return jsonContent.schema as SchemaObject | ReferenceObject;
    }

    // Check for SSE content
    const sseContent = content['text/event-stream'];
    if (sseContent?.schema) {
      return sseContent.schema as SchemaObject | ReferenceObject;
    }

    // Check for NDJSON content
    const ndjsonContent = content['application/x-ndjson'];
    if (ndjsonContent?.schema) {
      return ndjsonContent.schema as SchemaObject | ReferenceObject;
    }
  }

  return undefined;
}

function detectStreaming(
  responses: OpenAPIV3.ResponsesObject | OpenAPIV3_1.ResponsesObject | undefined
): { isStreaming: boolean; streamingType?: 'sse' | 'ndjson' } {
  if (!responses) return { isStreaming: false };

  for (const code of ['200', '201', '202']) {
    const response = responses[code];
    if (!response || isReferenceObject(response)) continue;

    const content = (response as ResponseObject).content;
    if (!content) continue;

    if ('text/event-stream' in content) {
      return { isStreaming: true, streamingType: 'sse' };
    }
    if ('application/x-ndjson' in content) {
      return { isStreaming: true, streamingType: 'ndjson' };
    }
  }

  return { isStreaming: false };
}

export function extractOperations(spec: OpenAPISpec): ExtractedOperation[] {
  const operations: ExtractedOperation[] = [];

  if (!spec.paths) return operations;

  for (const [path, pathItem] of Object.entries(spec.paths)) {
    if (!pathItem) continue;

    const pathParams = extractPathParameters(path);
    const methods = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'] as const;

    for (const method of methods) {
      const operation = pathItem[method];
      if (!operation) continue;

      const operationId = operation.operationId || deriveOperationId(method, path);
      const { pathParameters, queryParameters } = extractParameters(
        operation.parameters as (ParameterObject | ReferenceObject)[] | undefined,
        pathParams
      );
      const requestBody = extractRequestBody(
        operation.requestBody as RequestBodyObject | ReferenceObject | undefined
      );
      const responseSchema = extractResponseSchema(operation.responses);
      const { isStreaming, streamingType } = detectStreaming(operation.responses);

      operations.push({
        operationId,
        method: method.toUpperCase(),
        path,
        summary: operation.summary,
        description: operation.description,
        pathParameters,
        queryParameters,
        requestBody,
        responseSchema,
        isStreaming,
        streamingType
      });
    }
  }

  return operations;
}

export function extractSchemas(spec: OpenAPISpec): ExtractedSchema[] {
  const schemas: ExtractedSchema[] = [];

  const components = spec.components;
  if (!components?.schemas) return schemas;

  for (const [name, schema] of Object.entries(components.schemas)) {
    if (isReferenceObject(schema)) continue;
    schemas.push({ name, schema: schema as SchemaObject });
  }

  return schemas;
}

export function extractAll(spec: OpenAPISpec): ExtractedData {
  return {
    operations: extractOperations(spec),
    schemas: extractSchemas(spec)
  };
}
