# PRD: SDK Client Generator

## Introduction

A CLI tool that generates fully-typed SDK clients in JavaScript/TypeScript and Python from valid OpenAPI 3.0/3.1 specification files (JSON or YAML). The generated SDKs provide type-safe API access with runtime validation, using Axios (JS/TS) and Requests (Python) as HTTP clients.

## Goals

- Parse and validate OpenAPI 3.0 and 3.1 specification files (JSON/YAML)
- Generate idiomatic, production-ready SDK clients for JS/TS and Python
- Provide full TypeScript types and Pydantic models with runtime validation
- Support Bearer token authentication
- Allow output as inline code or publishable package structure
- Generate human-readable, well-organized code

## User Stories

### US-001: Parse OpenAPI specification file
**Description:** As a developer, I want to provide an OpenAPI JSON or YAML file so that the tool can understand my API structure.

**Acceptance Criteria:**
- [ ] Accept file path as CLI argument
- [ ] Support `.json`, `.yaml`, and `.yml` extensions
- [ ] Validate against OpenAPI 3.0 and 3.1 schemas
- [ ] Display clear error messages for invalid specs
- [ ] Typecheck/lint passes

### US-002: Generate TypeScript SDK client
**Description:** As a developer, I want to generate a TypeScript SDK so I can consume my API with full type safety.

**Acceptance Criteria:**
- [ ] Generate one client class with methods for each API operation
- [ ] Method names derived from `operationId` or path+method
- [ ] Generate TypeScript interfaces for all request/response schemas
- [ ] Generate Zod schemas for runtime validation
- [ ] Use Axios as HTTP client
- [ ] Support Bearer token auth via constructor config
- [ ] Typecheck passes on generated code

### US-003: Generate Python SDK client
**Description:** As a developer, I want to generate a Python SDK so I can consume my API with type hints and validation.

**Acceptance Criteria:**
- [ ] Generate one client class with methods for each API operation
- [ ] Generate Pydantic models for all request/response schemas
- [ ] Use Requests as HTTP client
- [ ] Support Bearer token auth via constructor config
- [ ] Generated code passes mypy/pyright type checking
- [ ] Generated code passes ruff/flake8 linting

### US-004: Output as inline code
**Description:** As a developer, I want to generate SDK code directly into my project so I can use it immediately without publishing.

**Acceptance Criteria:**
- [ ] CLI flag `--output <directory>` to specify output location
- [ ] Generate source files directly (no package scaffolding)
- [ ] Overwrite existing files with confirmation prompt
- [ ] Typecheck/lint passes

### US-005: Output as publishable package
**Description:** As a developer, I want to generate a complete npm/pip package so I can publish and share the SDK.

**Acceptance Criteria:**
- [ ] CLI flag `--package` to enable package mode
- [ ] JS/TS: Generate `package.json`, `tsconfig.json`, build scripts
- [ ] Python: Generate `pyproject.toml`, `setup.py`, `__init__.py`
- [ ] Include README with usage examples
- [ ] Include appropriate `.gitignore`
- [ ] Typecheck/lint passes

### US-006: Handle path and query parameters
**Description:** As a developer, I want path and query parameters to be properly typed so I get autocomplete and validation.

**Acceptance Criteria:**
- [ ] Extract path parameters from OpenAPI paths (e.g., `/users/{id}`)
- [ ] Generate method signatures with required path params
- [ ] Generate optional query params as options object
- [ ] Runtime validation of parameter types
- [ ] Typecheck/lint passes

### US-007: Handle request bodies
**Description:** As a developer, I want request bodies to be typed and validated so I can't send malformed data.

**Acceptance Criteria:**
- [ ] Support `application/json` request bodies
- [ ] Generate typed request body parameter
- [ ] Validate request body against schema before sending
- [ ] Typecheck/lint passes

### US-008: Handle response types
**Description:** As a developer, I want responses to be typed and validated so I have confidence in the data I receive.

**Acceptance Criteria:**
- [ ] Parse response schemas from OpenAPI spec
- [ ] Generate return types for each operation
- [ ] Validate response data at runtime (optional, configurable)
- [ ] Handle different status codes (200, 201, etc.)
- [ ] Typecheck/lint passes

### US-009: Configure base URL and authentication
**Description:** As a developer, I want to configure the API base URL and auth token when instantiating the client.

**Acceptance Criteria:**
- [ ] Client constructor accepts `baseUrl` parameter
- [ ] Client constructor accepts `token` parameter for Bearer auth
- [ ] Token automatically added to `Authorization` header
- [ ] Allow updating token after instantiation
- [ ] Typecheck/lint passes

### US-010: CLI interface
**Description:** As a developer, I want a simple CLI to run the generator with various options.

**Acceptance Criteria:**
- [ ] Command: `sdk-gen <spec-file> --lang <ts|python> --output <dir>`
- [ ] `--package` flag for publishable package output
- [ ] `--name <sdk-name>` to customize generated package/class name
- [ ] `--help` displays usage information
- [ ] `--version` displays tool version
- [ ] Typecheck/lint passes

### US-011: Support Server-Sent Events (SSE) streaming
**Description:** As a developer, I want to consume SSE streaming endpoints so I can handle real-time data streams.

**Acceptance Criteria:**
- [ ] Detect SSE endpoints via `text/event-stream` content type in OpenAPI spec
- [ ] Generate async iterator/generator methods for streaming endpoints
- [ ] TypeScript: Return `AsyncIterable<T>` for typed event consumption
- [ ] Python: Return async generator with typed events
- [ ] Support connection abort/cancellation
- [ ] Typecheck/lint passes

### US-012: Support chunked/NDJSON streaming
**Description:** As a developer, I want to consume newline-delimited JSON streams so I can process data incrementally.

**Acceptance Criteria:**
- [ ] Detect NDJSON endpoints via `application/x-ndjson` or `application/stream+json` content type
- [ ] Generate async iterator methods that yield parsed JSON objects
- [ ] Validate each chunk against response schema
- [ ] Handle partial chunks and buffering correctly
- [ ] Typecheck/lint passes

## Functional Requirements

- FR-1: Parse OpenAPI 3.0 and 3.1 specification files in JSON or YAML format
- FR-2: Validate OpenAPI spec structure and report errors with line numbers
- FR-3: Generate TypeScript client using Axios with Zod runtime validation
- FR-4: Generate Python client using Requests with Pydantic models
- FR-5: Map OpenAPI types to language-native types (string→string, integer→number/int, etc.)
- FR-6: Generate methods for all operations with `operationId` or derived names
- FR-7: Handle path parameters by interpolating into URL
- FR-8: Handle query parameters as optional method arguments
- FR-9: Handle request bodies with type checking and validation
- FR-10: Parse and type response schemas for successful responses (2xx)
- FR-11: Support Bearer token authentication via client configuration
- FR-12: Generate inline code or full package structure based on CLI flag
- FR-13: For packages, generate appropriate manifest files (package.json/pyproject.toml)
- FR-14: CLI must provide clear error messages and help text
- FR-15: Detect streaming endpoints via content-type (`text/event-stream`, `application/x-ndjson`)
- FR-16: Generate async iterators for SSE endpoints returning typed events
- FR-17: Generate async iterators for NDJSON endpoints with chunk buffering and validation

## Non-Goals

- No support for Swagger 2.0 specifications
- No support for OAuth2 flows, API keys, or other auth methods (Bearer only)
- No WebSocket support (only SSE and NDJSON streaming)
- No automatic API documentation generation
- No mock server generation
- No support for XML request/response bodies
- No file upload/download handling (multipart/form-data)
- No automatic SDK versioning or changelog generation

## Technical Considerations

- Use `@apidevtools/swagger-parser` or similar for OpenAPI parsing/validation
- Use Handlebars or EJS for code generation templates
- TypeScript SDK should target ES2020+ with ESM output
- Python SDK should target Python 3.9+
- Consider using `commander` or `yargs` for CLI parsing
- Generated code should be formatted (Prettier for TS, Black for Python)
- For SSE streaming: use `eventsource` package (TS) or `sseclient-py` (Python)
- For NDJSON streaming: use Axios response streams (TS) or `requests` with `iter_lines` (Python)
- Python streaming methods should use `async/await` with `aiohttp` or `httpx` for async support

## Success Metrics

- Generated SDK compiles/type-checks without errors
- Generated SDK can make successful API calls to a real backend
- Code generation completes in under 5 seconds for typical specs (<100 endpoints)
- Generated code is readable and follows language conventions

## Open Questions

- Should we support generating both languages in a single run?
- Should we add support for custom HTTP client injection in the future?
- How should we handle circular references in OpenAPI schemas?
- Should we generate separate files per resource or a single client file?
