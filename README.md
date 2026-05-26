# Bitcoin Reference MCP Server

A local MCP server assisting AI in accessing authoritative Bitcoin reference information.

There are two authoritative sources of technical design information about the design, structure, and implementation of the Bitcoin protocol: BIPs (`https://github.com/bitcoin/bips`) and the Bitcoin Core source code (`https://github.com/bitcoin/bitcoin`). This server provides efficient access to those sources.

## Purpose

This MCP server provides Bitcoin protocol reference material in tool-friendly form so an AI assistant can answer implementation-focused questions quickly and consistently.

Primary scope:

- Bitcoin Improvement Proposals (BIPs)
- Bitcoin Core architecture and subsystem knowledge
- Prompt templates for repeatable protocol/code investigations

## Features Provided

### 1. Resources

The server publishes two resource families:

- BIP resources
  - URI pattern: bip:///{number}
  - Backing store: local in-repo BIP registry
  - Output format: text/markdown

- Bitcoin Core topic resources
  - URI pattern: bitcoin-core:///{topic}
  - Backing store: local in-repo topic registry
  - Output format: text/markdown

### 2. Tools

Implemented tools:

- list_bips
  - Lists BIPs with optional filters: status, type, layer
- get_bip
  - Returns full local document content for one BIP number
- search_bips
  - Keyword search over BIP title/content/type/layer
- list_bitcoin_core_topics
  - Lists indexed Bitcoin Core topics with optional tag filter
- get_bitcoin_core_topic
  - Returns full local document content for one topic id
- search_bitcoin_core
  - Keyword search across Bitcoin Core topic entries

### 3. Prompts

Implemented prompt templates:

- analyze_bip_implementation
- find_feature_implementation
- review_consensus_code
- trace_transaction_lifecycle
- understand_subsystem

These prompts are designed to drive structured technical analysis workflows against BIPs and Bitcoin Core code.

## Implementation Details

- Runtime model
  - TypeScript MCP server using @modelcontextprotocol/sdk
  - Stdio transport for local agent integration

- Registration model
  - resources.ts registers URI-based resources
  - tools.ts registers searchable/queryable tools with zod-validated arguments
  - prompts.ts registers reusable investigation prompts

- Data model
  - src/data/bips.ts contains BIP registry entries
  - src/data/bitcoin-core.ts contains Bitcoin Core topic entries
  - Current datasets are curated local snapshots and include placeholder sections intended for expansion

- Search behavior
  - Local in-memory keyword matching against registry content
  - No external network dependency required for baseline operation

## Features This Server May Provide

The following are practical extensions that align with this server's purpose.

- Live sync from bitcoin/bips
  - Implementation: scheduled pull or fetch from official repo, parse mediawiki/rst/markdown into normalized local records

- Live sync from bitcoin/bitcoin docs and selected source indexes
  - Implementation: periodic extraction of targeted docs and code metadata, then expose as topic resources

- Semantic retrieval layer
  - Implementation: Postgres + PGVector index over BIPs, Optech, devwiki, and curated discussions; add MCP tools for semantic query

- Provenance and citation output
  - Implementation: include source URL, commit hash, and file path metadata in all tool responses

## Other Potential Sources to Index

Additional sources that may be indexed by this MCP server:

- `https://github.com/bitcoin-core/bitcoin-devwiki`
  - Content: architecture notes, wallet internals, P2P behavior, testing workflows
  - Implementation: clone locally and index with filesystem-style ingestion into topic registry or vector store

- bip-registry
  - Content: BIPs formatted as markdown/json for easier machine parsing
  - Implementation: treat as secondary structured source for enrichment and comparison against official BIP text

- Bitcoin OpTech (`https://bitcoinops.org`)
  - Content: curated technical explainers and historical context for Bitcoin Core changes
  - Implementation: scrape/archive selected pages and index in semantic store for contextual retrieval

- ChatBTC (`https://github.com/bitcoinsearch`)
  - Content: implementation discussion and rationale history
  - Implementation: mirror legally accessible datasets and expose via topic lookup and semantic search tools

## Development

- Build: pnpm build
- Type-check: pnpm typecheck
- Run (compiled): pnpm start

## Installation

### Prerequisites

- Node.js 20+
- pnpm 11+

### Quick Start

1. Clone this repository.
2. Install dependencies.
3. Build the server.

   ```bash
   pnpm install
   pnpm build
   ```

4. (Optional) Verify it starts:

```bash
pnpm start
```

Expected startup log on stderr:

```text
Bitcoin Reference MCP Server running on stdio
```

## Access From MCP Clients

This server is exposed over stdio. Most MCP-enabled clients use the same server definition shape.

Use this definition, replacing the path with your local absolute path to dist/index.js:

```json
{
  "mcpServers": {
    "bitcoin-reference": {
      "command": "node",
      "args": [
        "C:/absolute/path/to/Bitcoin Reference MCP Server/dist/index.js"
      ]
    }
  }
}
```

### Claude

1. Open your Claude MCP configuration (commonly `claude_desktop_config.json`).
2. Add the `bitcoin-reference` server entry under `mcpServers`.
3. Restart Claude.
4. In a chat, confirm tool availability by asking Claude to call `list_bips`.

### Gemini

1. Open the MCP server configuration used by your Gemini client/runtime.
2. Add the same `bitcoin-reference` stdio server entry under `mcpServers`.
3. Restart the Gemini client/session.
4. Validate connectivity by requesting a tool call such as `list_bitcoin_core_topics`.

### GitHub Copilot

1. Open MCP server settings in your Copilot-enabled environment (for example, VS Code MCP server configuration).
2. Register the `bitcoin-reference` stdio server with the same command/args.
3. Reload the editor window.
4. In Copilot Chat (agent/tool mode), ask it to run `search_bips` with a query like `taproot`.

### Troubleshooting

- If the client cannot start the server, verify the `dist/index.js` path is absolute and correct.
- If tools do not appear, rebuild (`pnpm build`) and restart the client.
- If `node` is not found, use an absolute path to the Node executable in `command`.

## Notes

- This repository currently focuses on deterministic local reference access and structured prompting.
- For consensus-critical use, treat outputs as research assistance and verify directly against upstream source repositories.
