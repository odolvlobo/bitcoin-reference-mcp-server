# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- Build: `pnpm build` (tsc → `dist/`)
- Type-check only: `pnpm typecheck`
- Watch build: `pnpm dev`
- Run compiled server: `pnpm start` (stdio MCP transport; logs "Bitcoin Reference MCP Server running on stdio" to stderr)

No test runner or linter is configured. Package manager pinned to pnpm 11.3.0 (`packageManager` field). Requires Node 20+.

## Architecture

Single-process MCP server built on `@modelcontextprotocol/sdk` with stdio transport. Entry point [src/index.ts](src/index.ts) constructs one `McpServer`, then delegates registration to three modules in order:

1. [src/resources.ts](src/resources.ts) — URI-based resources via `ResourceTemplate`. Two families: `bip:///{number}` and `bitcoin-core:///{topic}`. Each template supplies a `list` callback that enumerates the in-memory registry plus a read handler that returns markdown content.
2. [src/tools.ts](src/tools.ts) — six tools registered with zod schemas: `list_bips`, `get_bip`, `search_bips`, `list_bitcoin_core_topics`, `get_bitcoin_core_topic`, `search_bitcoin_core`. All filtering/search is in-memory case-insensitive substring matching against the registry arrays.
3. [src/prompts.ts](src/prompts.ts) — five investigation prompt templates: `analyze_bip_implementation`, `find_feature_implementation`, `review_consensus_code`, `trace_transaction_lifecycle`, `understand_subsystem`. Prompts hydrate from the local registry when an arg references a known entry; otherwise they fall back to a generic instruction string.

### Data layer

`src/data/` holds two static arrays exported as `BIP_REGISTRY` and `BITCOIN_CORE_REGISTRY`. Both register their own `get*` and `search*` helpers consumed by tools/resources/prompts. Schema in [src/types.ts](src/types.ts):

- `BipEntry` — `number` is a 4-digit zero-padded string ("0001", "0341"); lookup helpers must accept unpadded input from users.
- `KnowledgeEntry` — keyed by `id` slug (e.g. `mempool`, `consensus`, `script-system`); `tags` array drives filtering.

`content` fields hold full markdown documents inline as template literals — registries are curated snapshots, not generated. Adding a BIP or topic = appending an object literal to the relevant data file; no build step beyond `tsc`.

### Module resolution

`tsconfig.json` uses `module: NodeNext` with `strict: true`. All intra-project imports must use the `.js` extension even though the source is `.ts` (e.g. `import { getBip } from "./data/bips.js"`). `rootDir: src`, `outDir: dist`, `declaration: true`.

### Registration contract

When adding a new tool/resource/prompt: define it in the matching `register*` function, keep zod schemas in the same file, and reuse the existing `get*`/`search*` registry helpers rather than re-implementing lookup. Tools return `{ content: [{ type: "text", text }] }`. Resources return `{ contents: [{ uri, text, mimeType }] }`. Prompts return `{ messages: [{ role: "user", content: { type: "text", text } }] }`.
