import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getBip } from "./data/bips.js";
import { getBitcoinCoreTopic } from "./data/bitcoin-core.js";

export function registerPrompts(server: McpServer): void {
  server.prompt(
    "analyze_bip_implementation",
    "Generate a structured investigation prompt for finding and analyzing how a BIP is implemented in Bitcoin Core",
    {
      bip_number: z.string().describe("BIP number to analyze, e.g. '141', '341'"),
      focus: z.string().optional().describe("Optional focus area, e.g. 'activation logic', 'test coverage', 'edge cases'"),
    },
    async ({ bip_number, focus }) => {
      const bip = getBip(bip_number);
      const bipRef = bip
        ? `BIP-${bip.number}: ${bip.title} (${bip.status}, ${bip.type}${bip.layer ? `, ${bip.layer}` : ""})`
        : `BIP-${bip_number.padStart(4, "0")} (not in local registry)`;

      const focusPart = focus ? `\n\nFocus specifically on: ${focus}` : "";

      const text = `Analyze the Bitcoin Core implementation of ${bipRef}.${focusPart}

Investigation checklist:

1. **Source code location**
   - Search git history for BIP-${bip_number.padStart(4, "0")} references: \`git log --all --grep="BIP[- ]${bip_number}"\`
   - Search source for BIP number in comments: \`grep -r "BIP.${bip_number}" src/\`
   - Identify the primary implementation file(s)

2. **Consensus-critical code**
   - Locate the core validation logic in \`src/validation.cpp\`, \`src/script/interpreter.cpp\`, or \`src/consensus/\`
   - Identify which \`SCRIPT_VERIFY_*\` flags enable this feature
   - Find the script version (BASE, WITNESS_V0, TAPROOT, TAPSCRIPT) relevant to this BIP

3. **Activation mechanism** (for consensus soft forks)
   - Find the deployment entry in \`src/chainparams.cpp\` or relevant chainparams
   - Check \`src/versionbits.cpp\` for BIP-9 state machine (if applicable)
   - Identify the activation height/time for mainnet, testnet, regtest

4. **Policy vs. consensus**
   - Distinguish consensus rules (all nodes must enforce) from policy rules (\`src/policy/\`)
   - Note any \`-maxscriptsize\`, fee, or relay policy interactions

5. **Test coverage**
   - Unit tests: \`src/test/\` — search for relevant test files
   - Functional tests: \`test/functional/\` — find Python tests exercising this feature
   - Script tests: \`src/test/data/script_tests.json\` (for script-level features)

6. **Serialization and P2P**
   - Check \`src/primitives/\` for any serialization changes
   - Check \`src/net_processing.cpp\` for new message types or peer requirements

7. **RPC exposure**
   - Find any RPC methods that expose or configure this feature
   - Check for new fields in existing RPC responses

8. **Known issues and edge cases**
   - Search GitHub issues and PRs for the BIP number
   - Look for TODO/FIXME comments near the implementation

Provide: file paths with line numbers, key function names, activation parameters, and a summary of how the implementation matches the BIP specification.`;

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
      };
    }
  );

  server.prompt(
    "find_feature_implementation",
    "Generate a prompt for systematically locating where a Bitcoin protocol feature is implemented in Bitcoin Core",
    {
      feature: z.string().describe("Feature to locate, e.g. 'fee estimation', 'HTLC script validation', 'bloom filters', 'compact blocks'"),
      suspected_subsystem: z.string().optional().describe("Suspected subsystem, e.g. 'mempool', 'p2p', 'wallet', 'script'"),
    },
    async ({ feature, suspected_subsystem }) => {
      const subsystemHint = suspected_subsystem
        ? `\n\nStart in the ${suspected_subsystem} subsystem (use \`get_bitcoin_core_topic\` tool with id "${suspected_subsystem}" for key files).`
        : "";

      const text = `Locate and document the Bitcoin Core implementation of: **${feature}**${subsystemHint}

Step-by-step approach:

1. **Keyword search**
   - \`grep -ri "${feature.split(" ")[0]}" src/ --include="*.h" --include="*.cpp" -l\`
   - Try synonyms and related terms
   - Search comments and documentation: \`grep -ri "${feature}" doc/ test/\`

2. **Entry point identification**
   - Is this triggered by RPC? Check \`src/rpc/\`
   - Is this triggered by P2P messages? Check \`src/net_processing.cpp\`
   - Is this triggered by wallet? Check \`src/wallet/\`
   - Is this part of validation? Check \`src/validation.cpp\`, \`src/consensus/\`

3. **Call chain tracing**
   - From the entry point, trace the call chain to the core logic
   - Note which data structures are read/written
   - Identify thread safety considerations (look for \`cs_main\`, \`mempool.cs\`, mutex usage)

4. **Configuration and parameters**
   - Find any CLI args (\`-flag\`) that control this feature
   - Check \`src/init.cpp\` for initialization
   - Find relevant constants in \`src/policy/\` or \`src/consensus/\`

5. **Subsystem boundaries**
   - Which subsystems does this feature cross? (validation ↔ mempool ↔ p2p ↔ wallet)
   - How are results communicated across subsystem boundaries?

6. **Test files**
   - Find unit tests: \`grep -r "${feature.split(" ")[0]}" src/test/\`
   - Find functional tests: \`grep -ri "${feature.split(" ")[0]}" test/functional/\`

Report: primary file(s), key function(s), data flow summary, and any non-obvious design decisions.`;

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
      };
    }
  );

  server.prompt(
    "review_consensus_code",
    "Generate a checklist-based review prompt for consensus-critical Bitcoin Core code changes",
    {
      description: z.string().describe("Brief description of the change being reviewed, e.g. 'adds new script opcode', 'modifies block weight calculation'"),
      relevant_bips: z.string().optional().describe("Comma-separated BIP numbers relevant to this change, e.g. '341,342'"),
    },
    async ({ description, relevant_bips }) => {
      const bipRefs = relevant_bips
        ? relevant_bips
            .split(",")
            .map((n) => n.trim())
            .map((n) => {
              const bip = getBip(n);
              return bip ? `BIP-${bip.number} (${bip.title})` : `BIP-${n.padStart(4, "0")}`;
            })
            .join(", ")
        : "None specified";

      const text = `Review the following consensus-critical Bitcoin Core change for correctness, completeness, and safety.

**Change**: ${description}
**Relevant BIPs**: ${bipRefs}

## Consensus Correctness

- [ ] Does the implementation exactly match the BIP specification? Identify any divergence.
- [ ] Are all edge cases from the BIP handled? (empty stacks, maximum sizes, boundary values)
- [ ] Is the behavior on invalid input well-defined and consistent with the spec?
- [ ] Does the change affect transaction/block validity in a way that could split the network?
- [ ] Are legacy (pre-softfork) transactions still valid under the new rules?

## Activation and Compatibility

- [ ] Is this gated behind a \`SCRIPT_VERIFY_*\` flag or version check?
- [ ] Is there a correct BIP-9 deployment entry in \`src/chainparams.cpp\`?
- [ ] Does regtest have a way to activate this for testing?
- [ ] Are pre-activation and post-activation code paths both tested?

## Code Quality and Safety

- [ ] Is consensus-critical logic in \`src/consensus/\` or \`src/script/\` (not mixed with policy/RPC)?
- [ ] Are there any integer overflow risks? (especially: fee arithmetic, weight calculations)
- [ ] Are stack depth limits enforced?
- [ ] Is there any possibility of non-deterministic execution? (UB, implementation-defined behavior)
- [ ] Does the code handle all error paths without aborting or behaving undefined?

## Testing

- [ ] Are there unit tests covering the new consensus rules? (\`src/test/\`)
- [ ] Are there functional tests exercising the feature end-to-end? (\`test/functional/\`)
- [ ] Do script tests cover the new opcodes/rules? (\`src/test/data/script_tests.json\`)
- [ ] Are invalid/mallformed inputs tested (not just the happy path)?
- [ ] Is there a test that verifies pre-activation behavior is unchanged?

## Documentation

- [ ] Are BIP references cited in comments near the implementation?
- [ ] Is the change documented in \`doc/release-notes.md\`?
- [ ] Are any new RPC fields or options documented?

Provide specific file:line references for any findings.`;

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
      };
    }
  );

  server.prompt(
    "trace_transaction_lifecycle",
    "Generate a prompt for tracing the complete lifecycle of a Bitcoin transaction through Bitcoin Core",
    {
      tx_type: z.string().optional().describe("Transaction type to trace, e.g. 'P2TR key-path', 'P2WPKH', 'RBF replacement', 'coinbase'. Defaults to standard P2WPKH."),
      entry_point: z.string().optional().describe("How the transaction enters: 'rpc' (sendrawtransaction) or 'p2p' (received from peer). Defaults to both."),
    },
    async ({ tx_type, entry_point }) => {
      const txDesc = tx_type ?? "standard P2WPKH";
      const entryDesc = entry_point ?? "both RPC and P2P entry";

      const text = `Trace the complete lifecycle of a ${txDesc} transaction through Bitcoin Core, from ${entryDesc} to confirmed in the chain.

## Phase 1: Transaction Receipt

**RPC path** (\`sendrawtransaction\`):
- \`src/rpc/rawtransaction.cpp\`: \`sendrawtransaction\` RPC handler
- Decode raw hex → \`CMutableTransaction\` → \`CTransaction\`
- Call \`BroadcastTransaction()\` → \`AcceptToMemoryPool()\`

**P2P path** (received \`tx\` message):
- \`src/net_processing.cpp\`: \`ProcessMessage()\` for \`NetMsgType::TX\`
- Deserialize → \`CTransaction\`
- Call \`AcceptToMemoryPool()\`

## Phase 2: Mempool Admission (\`AcceptToMemoryPool\`)

Trace through \`src/validation.cpp\` (\`MempoolAccept\`):
1. \`PreChecks()\`: basic validity, standardness, UTXO existence, fee check
2. \`ConsensusScriptChecks()\`: \`VerifyScript()\` for all inputs
3. If replacing: \`ReplacementChecks()\` (BIP-125 RBF rules)
4. \`Finalize()\`: add to \`CTxMemPool\`, update ancestor stats, signal to peers

Trace which \`SCRIPT_VERIFY_*\` flags are used at each stage.

## Phase 3: Relay to Peers

- \`PeerManager\` receives \`TransactionAddedToMempool\` signal
- \`src/net_processing.cpp\`: announces via \`inv\` messages to peers
- Peers request via \`getdata\`, receive full \`tx\` message
- \`-feefilter\`: only relay to peers whose fee filter allows this tx

## Phase 4: Mining

- \`BlockAssembler::CreateNewBlock()\` in \`src/miner.cpp\`
- Selects transactions by ancestor fee rate from \`CTxMemPool\`
- Assigns position in block; builds coinbase with witness commitment
- Miner submits block via \`submitblock\` RPC or \`src/net_processing.cpp\`

## Phase 5: Block Reception and Validation

- \`ProcessNewBlock()\` → \`CheckBlock()\` → \`AcceptBlock()\` → \`ConnectTip()\`
- \`ConnectBlock()\` in \`src/validation.cpp\`:
  - Verifies all inputs via \`CheckInputScripts()\`
  - Updates UTXO set: spend inputs, add outputs (\`UpdateCoins()\`)
  - Records undo data for potential reorg
- Transaction removed from mempool: \`CTxMemPool::removeForBlock()\`

## Phase 6: Chainstate Update

- \`CCoinsViewCache\` updated with new UTXOs
- Flushed to \`CCoinsViewDB\` (LevelDB) according to \`FlushStateMode\`
- \`CBlockIndex\` updated: height, work, file position
- Wallet rescans if relevant outputs appear (\`BlockConnected\` signal)

For the ${txDesc} transaction specifically, focus on: how the script is verified at Phase 2/5, and any special handling in \`src/script/interpreter.cpp\`.`;

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
      };
    }
  );

  server.prompt(
    "understand_subsystem",
    "Generate a deep-dive investigation prompt for a specific Bitcoin Core subsystem",
    {
      subsystem: z.string().describe(
        "Subsystem to understand. One of: mempool, consensus, p2p-networking, wallet, script-system, rpc-api, mining, chainstate-utxo, validation-pipeline, repo-overview"
      ),
      depth: z.enum(["overview", "deep"]).optional().describe("'overview' for high-level map, 'deep' for implementation details. Defaults to 'overview'."),
    },
    async ({ subsystem, depth }) => {
      const entry = getBitcoinCoreTopic(subsystem);
      const entryInfo = entry
        ? `\n\nLocal knowledge base entry available: use \`get_bitcoin_core_topic\` with id "${subsystem}" for key files and classes.`
        : `\n\nNote: "${subsystem}" not found in local knowledge base. Use list_bitcoin_core_topics to find available topics.`;

      const depthStr = depth ?? "overview";

      const overviewQuestions = `
## Overview Questions

1. **Purpose**: What problem does this subsystem solve? What invariants does it maintain?
2. **Key files**: List the 3–5 most important source files with one-line descriptions.
3. **Key classes/structs**: What are the main data structures? What do they own/represent?
4. **Entry points**: How do external callers interact with this subsystem? (function names)
5. **Thread model**: What locks/mutexes protect this subsystem's state?
6. **Signals/callbacks**: What events does it emit? What does it listen to?
7. **Configuration**: What \`-arg\` options control its behavior?
8. **Interfaces to other subsystems**: What does it call? What calls it?`;

      const deepQuestions = `
## Deep-Dive Questions

1. **Data structures in detail**: Walk through the key container types and their indices/lookup patterns.
2. **Critical algorithms**: What are the core algorithms? What is their complexity?
3. **Error handling**: How are errors propagated? What are the failure modes?
4. **Persistence**: What state survives restart? How is it serialized?
5. **Performance characteristics**: What are the bottlenecks? What is cached vs. computed?
6. **Security considerations**: What attack surfaces does this subsystem present? How are they mitigated?
7. **Historical evolution**: What major refactors has this subsystem undergone? (search git log)
8. **Known technical debt**: What are the open TODOs and long-standing issues?
9. **Test coverage**: Which unit/functional tests cover this subsystem?
10. **Libbitcoinkernel boundary**: Is this subsystem in scope for the kernel library?`;

      const questions = depthStr === "deep"
        ? overviewQuestions + "\n" + deepQuestions
        : overviewQuestions;

      const text = `Produce a ${depthStr === "deep" ? "comprehensive deep-dive" : "high-level overview"} of the Bitcoin Core **${subsystem}** subsystem.${entryInfo}
${questions}

Start by reading the key header files (they document public interfaces). Then trace a typical operation from entry to exit. Cite specific file:line references for all claims.`;

      return {
        messages: [{ role: "user" as const, content: { type: "text" as const, text } }],
      };
    }
  );
}
