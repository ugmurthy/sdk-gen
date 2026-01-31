# AGENTS.md

## Commands
- **Build**: `npm run build` (compiles TypeScript and copies templates to dist/)
- **Typecheck**: `npm run typecheck`
- **Run CLI**: `npm start -- <spec-file> --lang <ts|python> --output <dir>`
- No test framework configured

## Architecture
CLI tool that generates TypeScript/Python SDK clients from OpenAPI 3.0 specs.

**Source files** (`src/`):
- `cli.ts` - Commander-based CLI entry point
- `parser.ts` - OpenAPI spec parsing (YAML/JSON)
- `extractor.ts` - Extracts operations and schemas from parsed spec
- `generator.ts` - Generates SDK files using Handlebars templates
- `nameMapper.ts` - Custom operation/schema name mappings
- `templates/` - Handlebars templates for TypeScript and Python output

**Key deps**: `@apidevtools/swagger-parser`, `commander`, `handlebars`, `prettier`

## Code Style
- ESM modules (`"type": "module"`) with `.js` extensions in imports
- TypeScript strict mode, target ES2020, NodeNext module resolution
- Use explicit types; avoid `any`
- Error handling: throw Error with descriptive messages
- Prefer `const`; use camelCase for variables/functions, PascalCase for types
