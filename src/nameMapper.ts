import { readFileSync, writeFileSync, existsSync } from 'fs';
import type { ExtractedData, ExtractedOperation } from './extractor.js';

export interface OperationMapping {
  service: string;
  method: string;
}

export interface NameMappings {
  operations?: Record<string, string | OperationMapping>;
  schemas?: Record<string, string>;
}

export interface GroupedOperations {
  [serviceName: string]: ExtractedOperation[];
}

let mappings: NameMappings = {};

/**
 * Load mappings from a JSON file.
 * If file doesn't exist, returns false (caller should generate defaults).
 * If file is empty or invalid, uses empty mappings.
 */
export function loadMappings(path: string): boolean {
  if (!existsSync(path)) {
    return false;
  }

  try {
    const content = readFileSync(path, 'utf-8').trim();
    mappings = content ? JSON.parse(content) : {};
    return true;
  } catch (e) {
    console.warn(`Warning: Could not parse ${path}, using no mappings`);
    mappings = {};
    return true;
  }
}

/**
 * Generate a default mappings file from extracted data.
 * Maps each name to itself so user can edit as needed.
 * Shows example of service grouping in comments.
 */
export function generateDefaultMappings(data: ExtractedData, outputPath: string): void {
  const defaultMappings: NameMappings = {
    operations: {},
    schemas: {},
  };

  for (const op of data.operations) {
    // Default: simple string mapping (no grouping)
    defaultMappings.operations![op.operationId] = op.operationId;
  }

  for (const schema of data.schemas) {
    defaultMappings.schemas![schema.name] = schema.name;
  }

  // Add example comment as a special key
  const example = {
    _comment: 'To group operations into services, use: { "service": "auth", "method": "me" }',
    _example: { service: 'auth', method: 'me' },
    ...defaultMappings,
  };

  writeFileSync(outputPath, JSON.stringify(example, null, 2) + '\n');
  console.log(`Generated default mappings file: ${outputPath}`);
  console.log('Edit this file to customize operation and schema names, then re-run the generator.');
  console.log('To group operations into services, change string values to: { "service": "serviceName", "method": "methodName" }');
}

/**
 * Check if mapping is a service grouping (object with service/method).
 */
function isOperationMapping(value: string | OperationMapping): value is OperationMapping {
  return typeof value === 'object' && 'service' in value && 'method' in value;
}

/**
 * Convert kebab-case or other invalid identifiers to valid camelCase.
 */
function toCamelCase(str: string): string {
  return str.replace(/[^a-zA-Z0-9]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
}

/**
 * Get mapped operation name, or original if no mapping exists.
 * Returns the method name for grouped operations.
 * Always sanitizes the result to ensure valid identifier.
 */
export function mapOperationName(name: string): string {
  const mapping = mappings.operations?.[name];
  if (!mapping) return name;
  const rawName = isOperationMapping(mapping) ? mapping.method : mapping;
  return toCamelCase(rawName);
}

/**
 * Get service name for an operation, or undefined if not grouped.
 */
export function getOperationService(name: string): string | undefined {
  const mapping = mappings.operations?.[name];
  if (mapping && isOperationMapping(mapping)) {
    return mapping.service;
  }
  return undefined;
}

/**
 * Get mapped schema name, or original if no mapping exists.
 */
export function mapSchemaName(name: string): string {
  return mappings.schemas?.[name] ?? name;
}

/**
 * Check if any operations use service grouping.
 */
export function hasServiceGrouping(): boolean {
  if (!mappings.operations) return false;
  return Object.values(mappings.operations).some(isOperationMapping);
}

/**
 * Get all unique service names from mappings.
 */
export function getServiceNames(): string[] {
  if (!mappings.operations) return [];
  const services = new Set<string>();
  for (const value of Object.values(mappings.operations)) {
    if (isOperationMapping(value)) {
      services.add(value.service);
    }
  }
  return Array.from(services).sort();
}

/**
 * Apply mappings to extracted data, returning a new ExtractedData with mapped names.
 * Also groups operations by service if service mappings are used.
 */
export function applyMappings(data: ExtractedData): ExtractedData {
  return {
    operations: data.operations.map(op => ({
      ...op,
      operationId: mapOperationName(op.operationId),
      // Store original operationId for service lookup
      _originalOperationId: op.operationId,
    } as ExtractedOperation & { _originalOperationId: string })),
    schemas: data.schemas.map(schema => ({
      ...schema,
      name: mapSchemaName(schema.name),
    })),
  };
}

/**
 * Group operations by service name.
 * Operations without a service go into '_default' group.
 */
export function groupOperationsByService(
  operations: ExtractedOperation[],
  originalOperationIds: string[]
): GroupedOperations {
  const groups: GroupedOperations = {};

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const originalId = originalOperationIds[i] || op.operationId;
    const serviceName = getOperationService(originalId) || '_default';

    if (!groups[serviceName]) {
      groups[serviceName] = [];
    }
    groups[serviceName].push(op);
  }

  return groups;
}

/**
 * Get the original operation IDs before mapping was applied.
 * Used to look up service assignments.
 */
export function getOriginalOperationIds(data: ExtractedData): string[] {
  return data.operations.map(op => {
    const opWithOriginal = op as ExtractedOperation & { _originalOperationId?: string };
    return opWithOriginal._originalOperationId || op.operationId;
  });
}

/**
 * Reset mappings (useful for testing).
 */
export function resetMappings(): void {
  mappings = {};
}
