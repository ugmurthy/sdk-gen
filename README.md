# sdk-gen

CLI tool that generates fully-typed SDK clients from OpenAPI specifications.

## Features

- Generates **TypeScript** and **Python** SDK clients
- Supports OpenAPI 3.0 specifications (JSON or YAML)
- Streaming endpoint detection and support
- Optional publishable package generation with proper package files

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

| Option              | Description                                   |
| ------------------- | --------------------------------------------- |
| `--lang <language>` | Target language: `ts` or `python` (required)  |
| `--output <dir>`    | Output directory for generated SDK (required) |
| `--package`         | Generate as publishable package               |
| `--name <name>`     | Package name (required with `--package`)      |
| `--force`           | Overwrite existing files without prompting    |

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
