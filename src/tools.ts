import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { BIP_REGISTRY, getBip, searchBips } from "./data/bips.js";
import { BITCOIN_CORE_REGISTRY, getBitcoinCoreTopic, searchBitcoinCore } from "./data/bitcoin-core.js";

export function registerTools(server: McpServer): void {
  server.tool(
    "list_bips",
    "List all Bitcoin Improvement Proposals in the registry, with optional filters",
    {
      status: z.string().optional().describe("Filter by status: Draft, Active, Final, Replaced, Withdrawn, etc."),
      type: z.string().optional().describe("Filter by type: 'Standards Track', 'Informational', or 'Process'"),
      layer: z.string().optional().describe("Filter by layer: 'Consensus (soft fork)', 'Peer Services', 'Applications', etc."),
    },
    async ({ status, type, layer }) => {
      let results = BIP_REGISTRY;
      if (status) {
        const s = status.toLowerCase();
        results = results.filter((b) => b.status.toLowerCase().includes(s));
      }
      if (type) {
        const t = type.toLowerCase();
        results = results.filter((b) => b.type.toLowerCase().includes(t));
      }
      if (layer) {
        const l = layer.toLowerCase();
        results = results.filter((b) => (b.layer ?? "").toLowerCase().includes(l));
      }

      if (results.length === 0) {
        return { content: [{ type: "text" as const, text: "No BIPs match the given filters." }] };
      }

      const lines = results.map((b) => {
        const layerPart = b.layer ? ` | ${b.layer}` : "";
        return `BIP-${b.number}: ${b.title}\n  Status: ${b.status} | Type: ${b.type}${layerPart}`;
      });
      return { content: [{ type: "text" as const, text: lines.join("\n\n") }] };
    }
  );

  server.tool(
    "get_bip",
    "Retrieve the full document for a specific Bitcoin Improvement Proposal",
    {
      number: z.string().describe("BIP number, e.g. '1', '0001', '341', '0341'. Leading zeros are optional."),
    },
    async ({ number }) => {
      const bip = getBip(number);
      if (!bip) {
        return {
          content: [
            {
              type: "text" as const,
              text: `BIP ${number} not found. Use list_bips to see available BIPs.`,
            },
          ],
        };
      }
      return { content: [{ type: "text" as const, text: bip.content }] };
    }
  );

  server.tool(
    "search_bips",
    "Search Bitcoin Improvement Proposals by keyword across title, content, type, and layer",
    {
      query: z.string().describe("Search query, e.g. 'schnorr', 'segwit', 'replace-by-fee', 'taproot'"),
    },
    async ({ query }) => {
      const results = searchBips(query);
      if (results.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No BIPs found matching "${query}".` }],
        };
      }
      const lines = results.map((b) => {
        const layerPart = b.layer ? ` | ${b.layer}` : "";
        return `BIP-${b.number}: ${b.title}\n  Status: ${b.status} | Type: ${b.type}${layerPart}`;
      });
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${results.length} BIP(s) matching "${query}":\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    }
  );

  server.tool(
    "list_bitcoin_core_topics",
    "List all Bitcoin Core knowledge base topics available in this server",
    {
      tag: z.string().optional().describe("Filter by tag keyword, e.g. 'consensus', 'wallet', 'rpc', 'p2p'"),
    },
    async ({ tag }) => {
      let results = BITCOIN_CORE_REGISTRY;
      if (tag) {
        const t = tag.toLowerCase();
        results = results.filter(
          (e) =>
            e.tags.some((k) => k.toLowerCase().includes(t)) ||
            e.id.toLowerCase().includes(t) ||
            e.title.toLowerCase().includes(t)
        );
      }

      if (results.length === 0) {
        return { content: [{ type: "text" as const, text: "No topics match the given filter." }] };
      }

      const lines = results.map((e) => `${e.id}\n  ${e.title}\n  ${e.description}\n  Tags: ${e.tags.join(", ")}`);
      return { content: [{ type: "text" as const, text: lines.join("\n\n") }] };
    }
  );

  server.tool(
    "get_bitcoin_core_topic",
    "Retrieve the full knowledge document for a specific Bitcoin Core topic",
    {
      topic: z.string().describe(
        "Topic ID, e.g. 'mempool', 'consensus', 'p2p-networking', 'wallet', 'script-system', 'rpc-api', 'mining', 'chainstate-utxo', 'validation-pipeline', 'repo-overview'"
      ),
    },
    async ({ topic }) => {
      const entry = getBitcoinCoreTopic(topic);
      if (!entry) {
        return {
          content: [
            {
              type: "text" as const,
              text: `Topic "${topic}" not found. Use list_bitcoin_core_topics to see available topics.`,
            },
          ],
        };
      }
      return { content: [{ type: "text" as const, text: entry.content }] };
    }
  );

  server.tool(
    "search_bitcoin_core",
    "Search Bitcoin Core knowledge base by keyword across all topics",
    {
      query: z.string().describe("Search query, e.g. 'utxo', 'mempool eviction', 'schnorr', 'descriptor wallet'"),
    },
    async ({ query }) => {
      const results = searchBitcoinCore(query);
      if (results.length === 0) {
        return {
          content: [{ type: "text" as const, text: `No topics found matching "${query}".` }],
        };
      }
      const lines = results.map((e) => `${e.id}: ${e.title}\n  ${e.description}`);
      return {
        content: [
          {
            type: "text" as const,
            text: `Found ${results.length} topic(s) matching "${query}":\n\n${lines.join("\n\n")}`,
          },
        ],
      };
    }
  );
}
