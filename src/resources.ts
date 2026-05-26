import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { BIP_REGISTRY, getBip } from "./data/bips.js";
import { BITCOIN_CORE_REGISTRY, getBitcoinCoreTopic } from "./data/bitcoin-core.js";

export function registerResources(server: McpServer): void {
  server.resource(
    "bip",
    new ResourceTemplate("bip:///{number}", {
      list: async () => ({
        resources: BIP_REGISTRY.map((bip) => ({
          uri: `bip:///${bip.number}`,
          name: `BIP-${bip.number}: ${bip.title}`,
          description: `${bip.status} | ${bip.type}${bip.layer ? ` | ${bip.layer}` : ""}`,
          mimeType: "text/markdown",
        })),
      }),
    }),
    async (uri, { number }) => {
      const bip = getBip(String(number));
      if (!bip) {
        return {
          contents: [{ uri: uri.href, text: `BIP ${number} not found in registry.`, mimeType: "text/plain" }],
        };
      }
      return {
        contents: [{ uri: uri.href, text: bip.content, mimeType: "text/markdown" }],
      };
    }
  );

  server.resource(
    "bitcoin-core",
    new ResourceTemplate("bitcoin-core:///{topic}", {
      list: async () => ({
        resources: BITCOIN_CORE_REGISTRY.map((entry) => ({
          uri: `bitcoin-core:///${entry.id}`,
          name: entry.title,
          description: entry.description,
          mimeType: "text/markdown",
        })),
      }),
    }),
    async (uri, { topic }) => {
      const entry = getBitcoinCoreTopic(String(topic));
      if (!entry) {
        return {
          contents: [{ uri: uri.href, text: `Topic "${topic}" not found in registry.`, mimeType: "text/plain" }],
        };
      }
      return {
        contents: [{ uri: uri.href, text: entry.content, mimeType: "text/markdown" }],
      };
    }
  );
}
