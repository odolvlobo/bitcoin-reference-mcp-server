import type { KnowledgeEntry } from "../types.js";

export const BITCOIN_CORE_REGISTRY: KnowledgeEntry[] = [
  {
    id: "repo-overview",
    title: "Bitcoin Core Repository Overview",
    description: "Top-level directory structure and build system overview",
    tags: ["repository", "structure", "build", "cmake", "overview"],
    content: `# Bitcoin Core Repository Overview

## Top-Level Directory Structure

| Directory | Purpose |
|-----------|---------|
| \`src/\` | All C++ source code |
| \`test/\` | Functional tests (Python), unit test runner |
| \`doc/\` | Documentation |
| \`contrib/\` | Developer tools, scripts, packaging helpers |
| \`share/\` | Desktop/man files |
| \`ci/\` | Continuous integration scripts |
| \`cmake/\` | CMake build modules |
| \`depends/\` | Dependency build system |

## Build System

- **Primary**: CMake (added ~v26, now preferred)
- **Legacy**: GNU Autotools (\`./autogen.sh && ./configure && make\`)
- **Dependencies**: \`depends/\` directory builds all deps from source for reproducible builds; used in release and Guix builds
- **Guix**: Reproducible build system used for official releases

## Key Source Subdirectories

| Path | Purpose |
|------|---------|
| \`src/consensus/\` | Consensus-critical validation helpers (no P2P, no mempool) |
| \`src/crypto/\` | Cryptographic primitives (SHA, RIPEMD, AES, ChaCha20) |
| \`src/interfaces/\` | Interface abstractions between node, wallet, and GUI |
| \`src/kernel/\` | Consensus engine library (libbitcoinkernel) |
| \`src/node/\` | Node-specific logic (mempool args, context, interfaces) |
| \`src/policy/\` | Non-consensus transaction/fee/relay policies |
| \`src/primitives/\` | Core data types: \`CBlock\`, \`CTransaction\`, \`CBlockHeader\` |
| \`src/rpc/\` | RPC server and command implementations |
| \`src/script/\` | Script interpreter, signing, standard scripts |
| \`src/secp256k1/\` | Bundled secp256k1 library (fork of bitcoin-core/secp256k1) |
| \`src/util/\` | General utilities (string, time, fs, args, logging) |
| \`src/wallet/\` | Wallet implementation (optional; separate library) |
| \`src/zmq/\` | ZeroMQ notification interface |

## Key Entry Points

| Binary | Main file |
|--------|-----------|
| \`bitcoind\` | \`src/bitcoind.cpp\` |
| \`bitcoin-cli\` | \`src/bitcoin-cli.cpp\` |
| \`bitcoin-wallet\` | \`src/bitcoin-wallet.cpp\` |
| \`bitcoin-tx\` | \`src/bitcoin-tx.cpp\` |
| \`bitcoin-util\` | \`src/bitcoin-util.cpp\` |

## Testing

| Directory | Purpose |
|-----------|---------|
| \`src/test/\` | C++ unit tests (Boost.Test framework) |
| \`test/functional/\` | Python functional tests |
| \`src/bench/\` | C++ benchmarks |

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "consensus",
    title: "Bitcoin Core: Consensus",
    description: "Consensus rules, validation, and the libbitcoinkernel library",
    tags: ["consensus", "validation", "chainstate", "blocks", "kernel"],
    content: `# Bitcoin Core: Consensus

## Overview

The consensus layer enforces the rules all full nodes agree on. In Bitcoin Core, consensus code is being progressively extracted into a standalone library (\`libbitcoinkernel\`) to make it easier to embed, audit, and test in isolation. Consensus code must never depend on policy, RPC, or wallet code.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/validation.h\` / \`src/validation.cpp\` | Central validation: \`ChainstateManager\`, \`Chainstate\`, \`BlockManager\` |
| \`src/consensus/tx_verify.h\` / \`tx_verify.cpp\` | Consensus-only tx checks: \`CheckTransaction()\`, \`CheckTxInputs()\`, \`SequenceLocks()\` |
| \`src/consensus/validation.h\` | \`BlockValidationState\`, \`TxValidationState\` error types |
| \`src/consensus/consensus.h\` | Core constants: \`MAX_BLOCK_WEIGHT\`, \`MAX_BLOCK_SIGOPS_COST\`, etc. |
| \`src/kernel/\` | Emerging libbitcoinkernel boundary |
| \`src/versionbits.h\` / \`versionbits.cpp\` | BIP-9 soft fork deployment state machine |
| \`src/deploymentinfo.cpp\` | Deployment info/names for each soft fork |
| \`src/chainparams.cpp\` | Chain parameters, consensus params, deployment configs |

## Key Classes

| Class | Purpose |
|-------|---------|
| \`ChainstateManager\` | Manages one or more \`Chainstate\` objects; top-level validation API |
| \`Chainstate\` | Active or snapshot chainstate; owns \`CCoinsViewCache\` |
| \`BlockManager\` | Block tree (\`CBlockIndex\`), block file management |
| \`CBlockIndex\` | In-memory block metadata (prev, height, work, file position) |
| \`ConsensusParams\` | Per-network consensus constants (max block weight, BIP heights, etc.) |
| \`ThresholdConditionCache\` | Caches BIP-9 state per block |

## Key Functions

| Function | File | Purpose |
|----------|------|---------|
| \`CheckBlock()\` | validation.cpp | Basic block structural checks |
| \`ConnectBlock()\` | validation.cpp | Apply block to UTXO set, validate all txs |
| \`DisconnectBlock()\` | validation.cpp | Undo block (reorg) |
| \`AcceptBlockHeader()\` | validation.cpp | Validate and store block header |
| \`ProcessNewBlock()\` | validation.cpp | Top-level block processing entry point |
| \`CheckTransaction()\` | consensus/tx_verify.cpp | Consensus tx validity (no context) |
| \`CheckTxInputs()\` | consensus/tx_verify.cpp | Input/output value checks |

## Script Verification Flags

Consensus-critical flags in \`src/script/interpreter.h\`:
\`SCRIPT_VERIFY_P2SH\`, \`SCRIPT_VERIFY_WITNESS\`, \`SCRIPT_VERIFY_TAPROOT\`, etc.

## Soft Fork Activation

Soft forks are deployed via BIP-9 (\`src/versionbits.cpp\`) or height-based activation (\`chainparams.cpp\`). The \`ThresholdState\` enum: DEFINED → STARTED → LOCKED_IN → ACTIVE / FAILED.

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "mempool",
    title: "Bitcoin Core: Transaction Mempool",
    description: "Unconfirmed transaction pool, policy, fee estimation, and eviction",
    tags: ["mempool", "fees", "rbf", "policy", "eviction", "unconfirmed"],
    content: `# Bitcoin Core: Transaction Mempool

## Overview

The mempool (\`CTxMemPool\`) holds valid but unconfirmed transactions that nodes relay and miners select for block inclusion. Mempool admission is governed by policy rules (not consensus), so different nodes may have different mempools.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/txmempool.h\` / \`txmempool.cpp\` | Core mempool: \`CTxMemPool\`, \`CTxMemPoolEntry\`, ancestor/descendant tracking |
| \`src/validation.h\` / \`validation.cpp\` | \`AcceptToMemoryPool()\`, \`MempoolAccept\` |
| \`src/policy/policy.h\` / \`policy.cpp\` | Relay policy: dust limits, standardness checks |
| \`src/policy/fees.h\` / \`fees.cpp\` | Fee estimation: \`CBlockPolicyEstimator\` |
| \`src/policy/rbf.h\` / \`rbf.cpp\` | Replace-by-Fee logic |
| \`src/node/mempool_args.h\` | Mempool configuration args (-maxmempool, -mempoolexpiry, -mempoolfullrbf) |
| \`src/node/mempool_persist.h\` | Mempool save/load on shutdown/startup |

## Key Classes

| Class | Purpose |
|-------|---------|
| \`CTxMemPool\` | The mempool itself; multiindex container of entries |
| \`CTxMemPoolEntry\` | Single mempool entry: tx + fee + ancestor/descendant stats |
| \`MempoolAccept\` | Transaction validation state machine for mempool admission |
| \`CBlockPolicyEstimator\` | Tracks confirmation times to estimate required fee rates |

## Mempool Admission Flow

1. \`AcceptToMemoryPool()\` → \`MempoolAccept::AcceptSingleTransaction()\`
2. Contextual validity checks (consensus + policy)
3. Ancestor/descendant limit checks
4. Fee rate checks (min relay fee, incremental relay fee)
5. RBF conflict resolution (if replacements exist)
6. Final ATMP: add to pool, evict if over size limit

## Key Policies

| Policy | Default | Flag |
|--------|---------|------|
| Max mempool size | 300 MB | \`-maxmempool\` |
| Min relay fee | 1 sat/vB | \`-minrelaytxfee\` |
| Dust limit | 546 sat (P2PKH) | output-type dependent |
| Max ancestors | 25 | \`-limitancestorcount\` |
| Max descendants | 25 | \`-limitdescendantcount\` |
| RBF | opt-in | \`-mempoolfullrbf\` for full RBF |

## Indexing

\`CTxMemPool\` uses Boost.MultiIndex with indices on: txid, wtxid, fee/size (mining score), entry time, ancestor fee rate.

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "p2p-networking",
    title: "Bitcoin Core: P2P Networking",
    description: "Peer connection management and P2P message processing",
    tags: ["p2p", "network", "peers", "connections", "messages", "inventory"],
    content: `# Bitcoin Core: P2P Networking

## Overview

Bitcoin Core's P2P layer is split into two main components: \`CConnman\` (connection management, I/O) and \`PeerManager\`/\`net_processing\` (protocol logic). This separation keeps networking concerns away from protocol logic.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/net.h\` / \`src/net.cpp\` | \`CConnman\`, \`CNode\`, socket management, I/O threads |
| \`src/net_processing.h\` / \`src/net_processing.cpp\` | \`PeerManager\`, P2P message dispatch and protocol logic |
| \`src/protocol.h\` | Message type constants (\`NetMsgType::\`), service flags, inventory types |
| \`src/addrman.h\` / \`src/addrman.cpp\` | Address manager: known peer addresses with reliability scoring |
| \`src/addrdb.h\` / \`src/addrdb.cpp\` | Peers.dat serialization |
| \`src/banman.h\` / \`src/banman.cpp\` | IP ban/discourage list |
| \`src/netbase.h\` | Network address types, proxy support |
| \`src/i2p.h\` / \`src/i2p.cpp\` | I2P transport support |
| \`src/torcontrol.h\` / \`src/torcontrol.cpp\` | Tor hidden service control |

## Key Classes

| Class | Purpose |
|-------|---------|
| \`CConnman\` | Manages all connections; spawns I/O threads; owns \`CNode\` objects |
| \`CNode\` | Single peer connection: socket, state, message queues, stats |
| \`PeerManager\` | Protocol logic; processes incoming messages; implements \`NetEventsInterface\` |
| \`Peer\` | Per-peer state used by \`PeerManager\` (separate from \`CNode\`) |
| \`CAddrMan\` | Stochastic address manager for peer discovery |
| \`CNetAddr\` | IPv4/IPv6/Tor/I2P address |
| \`CService\` | \`CNetAddr\` + port |

## Message Processing

P2P messages handled in \`PeerManager::ProcessMessage()\` (net_processing.cpp):

| Message | Purpose |
|---------|---------|
| \`version\` / \`verack\` | Handshake |
| \`inv\` | Inventory announcement (txs, blocks) |
| \`getdata\` | Request data by hash |
| \`tx\` | Transaction relay |
| \`block\` | Block delivery |
| \`headers\` | Block header relay (header-first sync) |
| \`addr\` / \`addrv2\` | Peer address gossip |
| \`ping\` / \`pong\` | Keepalive / latency measurement |
| \`getblocks\` / \`getheaders\` | Block discovery |
| \`notfound\` | Data not available |
| \`feefilter\` | Minimum fee rate filter |

## Service Flags

Defined in \`src/protocol.h\`:
\`NODE_NETWORK\` (1), \`NODE_BLOOM\` (4), \`NODE_WITNESS\` (8), \`NODE_COMPACT_FILTERS\` (64), \`NODE_NETWORK_LIMITED\` (1024).

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "wallet",
    title: "Bitcoin Core: Wallet",
    description: "Key management, UTXO tracking, transaction creation, and descriptor wallets",
    tags: ["wallet", "keys", "descriptors", "signing", "utxo", "coin-selection"],
    content: `# Bitcoin Core: Wallet

## Overview

The Bitcoin Core wallet is an optional module (compiled separately, linked to \`bitcoind\` and \`bitcoin-wallet\`). Modern Bitcoin Core uses descriptor wallets (BIP-0380 output descriptors) as the primary key management model, replacing the legacy key pool approach.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/wallet/wallet.h\` / \`wallet.cpp\` | \`CWallet\`: main wallet class, UTXO tracking, tx history |
| \`src/wallet/scriptpubkeyman.h\` / \`scriptpubkeyman.cpp\` | \`ScriptPubKeyMan\` interface, \`DescriptorScriptPubKeyMan\`, \`LegacyScriptPubKeyMan\` |
| \`src/wallet/coinselection.h\` / \`coinselection.cpp\` | Coin selection algorithms: BnB, knapsack, SRD |
| \`src/wallet/spend.h\` / \`spend.cpp\` | Transaction creation, fee calculation, change output |
| \`src/wallet/transaction.h\` | \`CWalletTx\`: wallet transaction with metadata |
| \`src/wallet/db.h\` | Wallet database abstraction |
| \`src/wallet/bdb.h\` / \`bdb.cpp\` | Berkeley DB backend (legacy) |
| \`src/wallet/sqlite.h\` / \`sqlite.cpp\` | SQLite backend (modern, default) |
| \`src/wallet/rpc/\` | Wallet RPC commands |
| \`src/wallet/feebumper.h\` | RBF fee bumping |

## Key Classes

| Class | Purpose |
|-------|---------|
| \`CWallet\` | Main wallet: owns SPKMs, tracks UTXOs, builds transactions |
| \`DescriptorScriptPubKeyMan\` | Manages keys via output descriptors; replaces legacy approach |
| \`LegacyScriptPubKeyMan\` | Legacy key pool management (still supported for old wallets) |
| \`CWalletTx\` | Wallet transaction wrapper with confirmation tracking |
| \`COutput\` | Spendable UTXO candidate |

## Descriptor Wallets

Modern wallets store output descriptors (e.g., \`wpkh(xpub/0/*)\`) rather than raw keys. Each descriptor generates a range of scriptPubKeys. Key benefits:
- Explicit key derivation paths
- Supports multisig, P2TR natively
- Import/export friendly

## Coin Selection

Three algorithms in \`src/wallet/coinselection.cpp\`:
1. **Branch and Bound (BnB)**: Exact match to avoid change; preferred
2. **Knapsack**: Greedy algorithm; fallback
3. **Single Random Draw (SRD)**: Randomized; privacy-preserving fallback

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "script-system",
    title: "Bitcoin Core: Script System",
    description: "Script interpreter, opcodes, standard script types, and signing",
    tags: ["script", "opcodes", "interpreter", "signing", "p2sh", "tapscript", "witness"],
    content: `# Bitcoin Core: Script System

## Overview

Bitcoin's script system is a stack-based, non-Turing-complete language. The interpreter (\`src/script/interpreter.cpp\`) is one of the most consensus-critical files in the codebase and handles all script evaluation including legacy, P2SH, SegWit v0, and Taproot/Tapscript.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/script/script.h\` / \`script.cpp\` | \`CScript\`, opcode constants, script utilities |
| \`src/script/interpreter.h\` / \`interpreter.cpp\` | \`EvalScript()\`, \`VerifyScript()\`, sighash computation |
| \`src/script/standard.h\` / \`standard.cpp\` | \`Solver()\`, \`GetScriptForDestination()\`, standard script types |
| \`src/script/sign.h\` / \`sign.cpp\` | \`SignTransaction()\`, \`ProduceSignature()\`, \`SignatureData\` |
| \`src/script/signingprovider.h\` | \`SigningProvider\` interface (key/script lookup) |
| \`src/script/descriptor.h\` / \`descriptor.cpp\` | Output descriptor parsing and expansion |
| \`src/script/miniscript.h\` | Miniscript policy language |

## Key Classes

| Class | Purpose |
|-------|---------|
| \`CScript\` | Byte-array subclass with opcode construction/iteration helpers |
| \`CScriptWitness\` | Witness stack for SegWit inputs |
| \`BaseSignatureChecker\` | Abstract interface for signature checking |
| \`TransactionSignatureChecker\` | Checks signatures against a transaction input |
| \`MutableTransactionSignatureChecker\` | Same but for CMutableTransaction |

## Script Execution

\`VerifyScript(scriptSig, scriptPubKey, witness, flags, checker)\`:
1. Evaluate scriptSig → initial stack
2. Evaluate scriptPubKey → result
3. If P2SH: deserialize and evaluate redeemScript
4. If witness v0: evaluate witness program (P2WPKH or P2WSH)
5. If witness v1 (Taproot): key-path or script-path evaluation

## SigVersion Enum

Controls which rules apply inside \`EvalScript()\`:
- \`BASE\`: Legacy script
- \`WITNESS_V0\`: SegWit v0 (BIP-0141/143)
- \`TAPROOT\`: Taproot key-path (BIP-0341)
- \`TAPSCRIPT\`: Taproot script-path (BIP-0342)

## Standard Script Types (\`TxoutType\`)

\`PUBKEY\`, \`PUBKEYHASH\`, \`SCRIPTHASH\`, \`MULTISIG\`, \`NULL_DATA\`, \`WITNESS_V0_KEYHASH\`, \`WITNESS_V0_SCRIPTHASH\`, \`WITNESS_V1_TAPROOT\`, \`WITNESS_UNKNOWN\`, \`NONSTANDARD\`.

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "rpc-api",
    title: "Bitcoin Core: RPC API",
    description: "JSON-RPC server, command registration, and available RPC methods",
    tags: ["rpc", "api", "json-rpc", "commands", "http", "cli"],
    content: `# Bitcoin Core: RPC API

## Overview

Bitcoin Core exposes a JSON-RPC 1.1 API over HTTP (default port 8332 mainnet, 18332 testnet). Commands are registered in a table and dispatched by the RPC server. The \`bitcoin-cli\` tool is the primary client.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/rpc/server.h\` / \`server.cpp\` | RPC server: command table, dispatch, auth, HTTP listener |
| \`src/rpc/blockchain.cpp\` | Block/chain RPC: \`getblock\`, \`getblockheader\`, \`getchaintips\`, etc. |
| \`src/rpc/mining.cpp\` | Mining RPC: \`getblocktemplate\`, \`submitblock\`, \`getmininginfo\` |
| \`src/rpc/net.cpp\` | Network RPC: \`getpeerinfo\`, \`addnode\`, \`getnetworkinfo\` |
| \`src/rpc/rawtransaction.cpp\` | Tx RPC: \`createrawtransaction\`, \`signrawtransaction\`, \`sendrawtransaction\` |
| \`src/rpc/util.h\` / \`util.cpp\` | RPC helpers: \`RPCArg\`, \`RPCResult\`, \`RPCExamples\`, \`UniValue\` helpers |
| \`src/wallet/rpc/\` | Wallet-specific RPC commands |
| \`src/httpserver.h\` / \`httpserver.cpp\` | libevent-based HTTP server |

## RPC Command Registration

Commands registered via \`RegisterRPCCommand()\` with a \`CRPCCommand\` struct containing name, actor function, argnames, and category. Commands are organized by category:

\`"blockchain"\`, \`"control"\`, \`"generating"\`, \`"mining"\`, \`"network"\`, \`"rawtransactions"\`, \`"util"\`, \`"wallet"\`, \`"zmq"\`.

## Key RPC Categories

### Blockchain
\`getblock\`, \`getblockchaininfo\`, \`getblockcount\`, \`getblockhash\`, \`getblockheader\`, \`getchaintips\`, \`getdifficulty\`, \`getmempoolinfo\`, \`getrawmempool\`, \`gettxout\`, \`gettxoutsetinfo\`

### Transactions
\`createrawtransaction\`, \`decoderawtransaction\`, \`getrawtransaction\`, \`sendrawtransaction\`, \`signrawtransactionwithkey\`, \`testmempoolaccept\`

### Network
\`addnode\`, \`getaddednodeinfo\`, \`getconnectioncount\`, \`getnettotals\`, \`getnetworkinfo\`, \`getpeerinfo\`, \`listbanned\`, \`setban\`

### Mining
\`getblocktemplate\`, \`getmininginfo\`, \`getnetworkhashps\`, \`submitblock\`, \`submitheader\`

## RPC Over HTTP

- **Authentication**: \`-rpcuser\`/\`-rpcpassword\` or cookie file (\`.cookie\` in datadir)
- **HTTP Methods**: Only POST
- **Format**: JSON-RPC 1.1 (id, method, params fields)
- **Port**: 8332 (mainnet), 18332 (testnet3), 18443 (regtest)

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "mining",
    title: "Bitcoin Core: Mining",
    description: "Block template construction, transaction selection, and GBT protocol",
    tags: ["mining", "block-template", "gbt", "miner", "coinbase", "fees"],
    content: `# Bitcoin Core: Mining

## Overview

Bitcoin Core provides block template construction via the \`getblocktemplate\` RPC (BIP-0022/BIP-0023) and the \`BlockAssembler\` class. It does not perform actual proof-of-work; that is handled by external mining software (ASICs, pools).

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/miner.h\` / \`src/miner.cpp\` | \`BlockAssembler\`: constructs block templates |
| \`src/rpc/mining.cpp\` | \`getblocktemplate\`, \`submitblock\`, \`getmininginfo\` RPC |
| \`src/node/miner.h\` | Node-level miner interface |

## Key Classes

| Class | Purpose |
|-------|---------|
| \`BlockAssembler\` | Constructs a \`CBlockTemplate\` from mempool transactions |
| \`CBlockTemplate\` | Block + per-tx fee/sigops data for mining |

## Block Template Construction (\`BlockAssembler::CreateNewBlock()\`)

1. Lock mempool
2. Set block header (version, prev hash, time, bits)
3. Add coinbase transaction (placeholder; miner fills scriptSig/outputs)
4. Select transactions from mempool by ancestor fee rate (highest first)
5. Respect block weight limit (MAX_BLOCK_WEIGHT = 4,000,000 WU)
6. Respect sigops cost limit (MAX_BLOCK_SIGOPS_COST = 80,000)
7. Compute witness commitment (SegWit coinbase output)
8. Return \`CBlockTemplate\`

## Transaction Selection

Transactions sorted by "modified fee rate" (fee / ancestor weight). \`BlockAssembler\` uses a package-aware selection: if adding a tx would exceed limits, try ancestors too.

## GetBlockTemplate (GBT) Protocol

BIP-0022 defines the JSON structure for \`getblocktemplate\`. Key fields:
- \`transactions\`: ordered list of txs (data, txid, fee, sigops, weight)
- \`coinbasevalue\`: total block subsidy + fees available
- \`target\`: difficulty target
- \`version\`, \`previousblockhash\`, \`curtime\`, \`bits\`
- \`longpollid\`: for long-poll updates

## Witness Commitment

SegWit requires a commitment in the coinbase:
\`OP_RETURN OP_36 0xaa21a9ed <32-byte witness merkle root hash>\`

Computed in \`GenerateCoinbaseCommitment()\`.

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "chainstate-utxo",
    title: "Bitcoin Core: Chainstate and UTXO Set",
    description: "UTXO set management, CCoinsView hierarchy, and database backend",
    tags: ["utxo", "chainstate", "coins", "leveldb", "database", "coinsview"],
    content: `# Bitcoin Core: Chainstate and UTXO Set

## Overview

The UTXO (Unspent Transaction Output) set is the definitive state of who owns what in Bitcoin. Bitcoin Core manages it through a layered \`CCoinsView\` hierarchy with a LevelDB backend, an in-memory cache, and optional snapshot support.

## Key Source Files

| File | Purpose |
|------|---------|
| \`src/coins.h\` / \`src/coins.cpp\` | \`Coin\`, \`CCoinsView\`, \`CCoinsViewCache\`, \`CCoinsMap\` |
| \`src/txdb.h\` / \`src/txdb.cpp\` | \`CCoinsViewDB\`: LevelDB-backed UTXO storage |
| \`src/validation.h\` / \`validation.cpp\` | \`Chainstate\` owns and manages the view hierarchy |
| \`src/kernel/coinstats.h\` | UTXO set statistics (total supply, hash) |
| \`src/node/utxo_snapshot.h\` | AssumeUTXO snapshot loading/saving |

## CCoinsView Hierarchy

\`\`\`
CCoinsViewDB         (LevelDB on disk)
    └── CCoinsViewErrorCatcher
        └── CCoinsViewCache    (in-memory cache, per Chainstate)
            └── CCoinsViewCache  (temporary validation cache, per block)
\`\`\`

## Key Types

| Type | Purpose |
|------|---------|
| \`COutPoint\` | (txid, n) — identifies a specific output |
| \`Coin\` | CTxOut + height + coinbase flag (one UTXO entry) |
| \`CCoinsMap\` | \`std::unordered_map<COutPoint, CCoinsCacheEntry>\` |
| \`CCoinsViewCache\` | Read-through cache over a backing CCoinsView |
| \`CCoinsViewDB\` | LevelDB backend (actual persistence) |

## LevelDB Schema

Keys: \`'C' + outpoint_data\` → \`coin_data\` (using compact serialization).
Also stores: block index (\`'b'\`), txindex (\`'t'\`), best block hash (\`'B'\`).

## UTXO Cache Management

- Cache size controlled by \`-dbcache\` (default 450 MB)
- Flush triggered when cache exceeds size limit or during clean shutdown
- \`CCoinsViewCache::Flush()\` writes dirty coins to backing view
- \`Chainstate::ForceFlushStateToDisk()\` with \`FlushStateMode\` enum

## AssumeUTXO

Allows fast bootstrapping by loading a trusted UTXO set snapshot. Background full validation continues after loading. Config in \`src/kernel/chainparams.cpp\` (\`AssumeUtxo()\`).

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
  {
    id: "validation-pipeline",
    title: "Bitcoin Core: Validation Pipeline",
    description: "End-to-end transaction and block validation flow",
    tags: ["validation", "atmp", "mempool", "connectblock", "pipeline", "flow"],
    content: `# Bitcoin Core: Validation Pipeline

## Overview

This document maps the end-to-end validation pipeline for transactions and blocks in Bitcoin Core, from network receipt to chainstate update.

## Transaction Validation Pipeline

### Entry Points
- P2P: \`PeerManager::ProcessMessage()\` → \`CNode::PushTxToValidation()\`
- RPC: \`sendrawtransaction\` → \`BroadcastTransaction()\`
- Wallet: \`CWallet::CommitTransaction()\`

### ATMP Flow (\`AcceptToMemoryPool\`)

\`\`\`
AcceptToMemoryPool(mempool, tx, ...)
  └── MempoolAccept::AcceptSingleTransaction()
        ├── PreChecks()          // basic validity, policy checks
        │     ├── CheckTransaction()   // consensus: no dups, value ranges
        │     ├── IsStandardTx()       // policy: script types, sizes
        │     ├── CheckFinalTx()       // nLockTime/nSequence
        │     └── CheckTransactionInputs()  // UTXO existence, value
        ├── ReplacementChecks()  // RBF rules (BIP-125)
        ├── PolicyScriptChecks() // script verification (policy flags)
        ├── ConsensusScriptChecks() // script verification (consensus flags)
        └── Finalize()           // add to pool, update ancestor stats
\`\`\`

## Block Validation Pipeline

### Entry Points
- P2P: \`ProcessNewBlock()\` called from \`PeerManager\`
- RPC: \`submitblock\`

### Block Validation Flow

\`\`\`
ProcessNewBlock(block, ...)
  ├── CheckBlock()              // structural validity (no UTXO needed)
  │     ├── CheckBlockHeader()  // PoW, timestamp
  │     ├── CheckTransactions() // each tx: CheckTransaction()
  │     └── Merkle root check
  ├── AcceptBlock()             // store block, update block index
  │     └── AcceptBlockHeader()
  └── ActivateBestChain()       // advance to best chain tip
        └── ConnectTip()
              └── ConnectBlock()  // apply block to chainstate
                    ├── CheckInputScripts()   // script verification
                    ├── UpdateCoins()         // spend inputs, add outputs
                    └── UndoBlock recording   // for reorgs
\`\`\`

## Script Verification

\`CheckInputScripts()\` verifies all inputs using \`VerifyScript()\` with the appropriate \`SCRIPT_VERIFY_*\` flags. Parallel verification via \`CCheckQueue\` (thread pool).

## Key Constants

| Constant | Value | File |
|----------|-------|------|
| \`MAX_BLOCK_WEIGHT\` | 4,000,000 | consensus/consensus.h |
| \`MAX_BLOCK_SIGOPS_COST\` | 80,000 | consensus/consensus.h |
| \`MAX_STANDARD_TX_WEIGHT\` | 400,000 | policy/policy.h |
| \`MIN_RELAY_TX_FEE\` | 1000 sat/kB | policy/policy.h |

---
> **PLACEHOLDER**: Detailed content to be expanded.`,
  },
];

export function getBitcoinCoreTopic(id: string): KnowledgeEntry | undefined {
  return BITCOIN_CORE_REGISTRY.find((e) => e.id === id);
}

export function searchBitcoinCore(query: string): KnowledgeEntry[] {
  const q = query.toLowerCase();
  return BITCOIN_CORE_REGISTRY.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.tags.some((t) => t.toLowerCase().includes(q)) ||
      e.content.toLowerCase().includes(q)
  );
}
