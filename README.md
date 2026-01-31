# sdk-gen

CLI tool that generates fully-typed SDK clients from OpenAPI specifications.

## Features

- Generates **TypeScript** and **Python** SDK clients
- Supports OpenAPI 3.0 specifications (JSON or YAML)
- Streaming endpoint detection and support
- Optional publishable package generation with proper package files
- **Name mappings** for customizing operation/schema names and grouping operations into services
- **OpenAPI 3.1 nullable fix** for compatibility with 3.0-style code generators

## Installation

```bash
npm install
npm run build
```

### Global CLI (optional)

To use `sdk-gen` as a global command:

```bash
npm link
```

Alternatively, run via npm or node directly (see examples below).

## Usage

```bash
sdk-gen <spec-file> --lang <ts|python> --output <dir> [options]
```

### Options

| Option              | Description                                        |
| ------------------- | -------------------------------------------------- |
| `--lang <language>` | Target language: `ts` or `python` (required)       |
| `--output <dir>`    | Output directory for generated SDK (required)      |
| `--package`         | Generate as publishable package                    |
| `--name <name>`     | Package name (required with `--package`)           |
| `--force`           | Overwrite existing files without prompting         |
| `--fix-nullable`    | Convert OpenAPI 3.1-style nullable types to 3.0 format |
| `--mappings <file>` | JSON file with name mappings for operations and schemas |

## Examples

### Generate TypeScript SDK from YAML

```bash
sdk-gen ./api-spec.yaml --lang ts --output ./sdk
```

### Generate Python SDK from JSON

```bash
sdk-gen ./openapi.json --lang python --output ./python-sdk
```

### Generate a publishable TypeScript package

```bash
sdk-gen ./petstore.yaml --lang ts --output ./petstore-sdk --package --name petstore-client
```

### Generate a publishable Python package

```bash
sdk-gen ./api.yaml --lang python --output ./my-api-sdk --package --name my-api-client
```

### Force overwrite existing files

```bash
sdk-gen ./spec.yaml --lang ts --output ./sdk --force
```

### Fix OpenAPI 3.1 nullable types

```bash
sdk-gen ./spec.yaml --lang ts --output ./sdk --fix-nullable
```

### Use custom name mappings

```bash
# First run generates a default mappings file if it doesn't exist
sdk-gen ./spec.yaml --lang ts --output ./sdk --mappings ./mappings.json

# Edit mappings.json, then re-run to apply mappings
sdk-gen ./spec.yaml --lang ts --output ./sdk --mappings ./mappings.json
```

## Name Mappings

The `--mappings` option allows you to customize operation and schema names in the generated SDK, and optionally group operations into service classes.

### How It Works

1. **First run**: If the mappings file doesn't exist, sdk-gen generates a default template with all operations and schemas mapped to their original names, then exits.
2. **Edit the file**: Customize the mappings as needed.
3. **Re-run**: Run sdk-gen again to generate the SDK with your custom mappings applied.

### Mappings File Format

```json
{
  "operations": {
    "getApiV2Health": "getApiV2Health",
    "getApiV2AuthMe": { "service": "auth", "method": "me" },
    "postApiV2AuthApiKeys": { "service": "auth", "method": "createApiKey" },
    "getApiV2Users": { "service": "users", "method": "list" },
    "getApiV2UsersById": { "service": "users", "method": "get" }
  },
  "schemas": {
    "UserResponse": "User",
    "CreateUserRequest": "CreateUserInput"
  }
}
```

### Mapping Types

#### Simple String Mapping
Rename an operation or schema:
```json
"getApiV2Health": "healthCheck"
```

#### Service Grouping
Group operations into service classes with custom method names:
```json
"getApiV2UsersById": { "service": "users", "method": "get" }
```

This generates a `users` service with a `get()` method instead of a flat `getApiV2UsersById()` function.

### Example Output

With service grouping, your SDK usage changes from:

```typescript
// Without mappings (flat functions)
const user = await client.getApiV2UsersById({ id: '123' });

// With service grouping
const user = await client.users.get({ id: '123' });
```

## Example with test fixture

```bash
# If globally linked
sdk-gen ./test-fixtures/petstore.yaml --lang ts --output ./generated-sdk

# Or via npm
npm start -- ./test-fixtures/petstore.yaml --lang ts --output ./generated-sdk

# Or via node directly
node dist/cli.js ./test-fixtures/petstore.yaml --lang ts --output ./generated-sdk
```

## License

MIT
