import type { BipEntry } from "../types.js";

export const BIP_REGISTRY: BipEntry[] = [
  {
    number: "0001",
    title: "BIP Purpose and Guidelines",
    status: "Active",
    type: "Process",
    content: `# BIP-0001: BIP Purpose and Guidelines

| Field | Value |
|-------|-------|
| Status | Active |
| Type | Process |
| Created | 2011-08-19 |

## Abstract

BIP-0001 defines the purpose, workflow, and requirements of the Bitcoin Improvement Proposal (BIP) process. It establishes three BIP types (Standards Track, Informational, Process), documents the lifecycle states (Draft → Proposed → Active/Final/Rejected/Withdrawn/Deferred/Replaced/Obsolete), and specifies formatting requirements.

## Key Technical Details

- **BIP Types**: Standards Track (protocol changes), Informational (design issues, guidelines), Process (procedures, tools — like this BIP itself)
- **Lifecycle states**: Draft → Proposed → Active (Process/Informational) or Final (Standards Track)
- **Layers for Standards Track**: Consensus (soft fork), Consensus (hard fork), Peer Services, API/RPC, Applications
- **BIP Editors**: Responsible for merging BIPs into the bitcoin/bips repository and maintaining the index
- **Formatting**: MediaWiki format historically; some newer BIPs use Markdown (BIP-0002 clarifies)

## Bitcoin Core Implementation

Not applicable — process document only.

## Related BIPs

- BIP-0002: BIP Process, revised (supersedes this BIP in some respects)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0001.mediawiki`,
  },
  {
    number: "0009",
    title: "Version bits with timeout and delay",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0009: Version bits with timeout and delay

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2015-10-04 |

## Abstract

BIP-0009 defines a mechanism for deploying multiple soft forks in parallel using bit flags in the block version field. Miners signal readiness by setting specific bits; when a threshold is reached within a difficulty period, the soft fork locks in and activates after one more period.

## Key Technical Details

- **Version field**: Block header nVersion used as bit field (bits 0–28); bit 29–31 set to 0b001 (0x20000000 mask)
- **State machine**: DEFINED → STARTED → LOCKED_IN → ACTIVE (or FAILED if timeout reached)
- **Signaling window**: Each retarget period (2016 blocks) is a "period"; 95% of blocks in a period must signal for LOCKED_IN
- **Timeout**: Each deployment has a start time and timeout (Unix timestamps); prevents indefinite signaling
- **Parallel deployments**: Up to 29 soft forks can be deployed simultaneously using different bits
- **Threshold**: 1916/2016 blocks (95%) required to lock in; configurable per deployment

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/versionbits.h\` | State machine types and \`VersionBitsCache\` |
| \`src/versionbits.cpp\` | \`AbstractThresholdConditionChecker\`, state transition logic |
| \`src/chainparams.cpp\` | Deployment parameters (start, timeout, bit) for each soft fork |
| \`src/miner.cpp\` | Block template sets version bits during mining |
| \`src/validation.cpp\` | Validates block version and checks deployment state |

Key types: \`ThresholdState\` (enum), \`BIP9Deployment\` (struct in chainparams).

## Related BIPs

- BIP-0068, BIP-0112 (CSV): first deployments using BIP9
- BIP-0141 (SegWit): deployed via BIP9

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0009.mediawiki`,
  },
  {
    number: "0016",
    title: "Pay to Script Hash",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0016: Pay to Script Hash

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2012-01-03 |
| Activated | Block 173805 (April 2012) |

## Abstract

Pay to Script Hash (P2SH) allows sending to a hash of a spending script rather than the script itself. The scriptPubKey form is \`OP_HASH160 <scriptHash> OP_EQUAL\`. The spender provides the redeem script and any required signatures. This moves complexity (multi-sig, time-locks) from sender to recipient.

## Key Technical Details

- **scriptPubKey**: \`OP_HASH160 <20-byte-hash> OP_EQUAL\` (exactly 23 bytes)
- **scriptSig**: \`<data> ... <redeemScript>\` — serialized script pushed last
- **Validation**: Script interpreter detects P2SH pattern, evaluates redeemScript against preceding stack items
- **Hash**: HASH160 = RIPEMD160(SHA256(redeemScript))
- **Addresses**: Base58Check with version byte 0x05 (prefix "3" on mainnet)
- **Activation**: Flag day activation (not BIP9), required >50% miner enforcement

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/script/standard.cpp\` | \`IsPayToScriptHash()\`, \`Solver()\` pattern detection |
| \`src/script/interpreter.cpp\` | P2SH evaluation in \`EvalScript()\` |
| \`src/script/standard.h\` | \`TxoutType::SCRIPTHASH\` enum value |
| \`src/policy/policy.cpp\` | P2SH relay policy |

Key function: \`IsPayToScriptHash(const CScript&)\` returns true for the 23-byte P2SH pattern.

## Related BIPs

- BIP-0013: Address Format for pay-to-script-hash
- BIP-0141: Extends concept to witness scripts (P2WSH)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0016.mediawiki`,
  },
  {
    number: "0032",
    title: "Hierarchical Deterministic Wallets",
    status: "Final",
    type: "Informational",
    layer: "Applications",
    content: `# BIP-0032: Hierarchical Deterministic Wallets

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Informational |
| Layer | Applications |
| Created | 2012-02-11 |

## Abstract

BIP-0032 defines a method for deriving a tree of key pairs from a single master seed. A master extended key (xprv/xpub) can derive child keys at arbitrary depths using child key derivation (CKD) functions. This allows generating an unlimited number of addresses from one backup.

## Key Technical Details

- **Extended keys**: 512-bit values = 256-bit key + 256-bit chain code; serialized as xprv/xpub (78 bytes + checksum)
- **Child Key Derivation (CKD)**: \`HMAC-SHA512(chain_code, key || index)\` produces child key and chain code
- **Hardened derivation**: Index ≥ 0x80000000 (denoted with '). Uses private key as HMAC input; public key cannot derive hardened children
- **Normal derivation**: Index < 0x80000000. Public key can derive child public keys (watch-only possible)
- **Path notation**: m/0'/1/2' — m = master, numbers = child indices, ' = hardened
- **Depth limit**: Specification supports 256 levels; practical limit is much lower

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/key.h\` | \`CExtKey\`, \`CExtPubKey\` structs |
| \`src/key.cpp\` | \`CExtKey::Derive()\`, \`CExtPubKey::Derive()\` |
| \`src/wallet/scriptpubkeyman.cpp\` | Descriptor-based HD wallet management |

Key types: \`CExtKey\` (private extended key), \`CExtPubKey\` (public extended key). Both have \`Derive(child, index)\` method.

## Related BIPs

- BIP-0039: Mnemonic seed generation (feeds into BIP32 master key)
- BIP-0044: Standard derivation path structure
- BIP-0084: Derivation scheme for P2WPKH
- BIP-0086: Derivation scheme for P2TR

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki`,
  },
  {
    number: "0039",
    title: "Mnemonic code for generating deterministic keys",
    status: "Final",
    type: "Informational",
    layer: "Applications",
    content: `# BIP-0039: Mnemonic code for generating deterministic keys

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Informational |
| Layer | Applications |
| Created | 2013-09-10 |

## Abstract

BIP-0039 defines a method to encode entropy as a human-readable mnemonic word list, and to derive a binary seed from that mnemonic (with optional passphrase) using PBKDF2. The seed is the input to BIP-0032 master key generation.

## Key Technical Details

- **Entropy**: 128–256 bits (multiples of 32); checksum = first ENT/32 bits of SHA256(entropy)
- **Word list**: 2048 words (11 bits each); mnemonic length = (ENT + CS) / 11 words (12–24 words)
- **Seed derivation**: \`PBKDF2(mnemonic, "mnemonic" + passphrase, 2048, HMAC-SHA512, 64 bytes)\`
- **Passphrase**: Optional 25th word; empty string if not used. Different passphrases = different wallets
- **Wordlists**: English (canonical), plus Chinese, Japanese, Korean, Spanish, French, Italian, Czech, Portuguese
- **Not in scope**: BIP-0039 does not define derivation paths (that is BIP-0044)

## Bitcoin Core Implementation

Bitcoin Core does not implement BIP-0039 mnemonic generation internally. The BIP-0039 wordlist and PBKDF2 derivation are not included in Bitcoin Core's wallet.

Bitcoin Core's \`bitcoin-wallet\` tool and the descriptor-based wallet use their own seed handling. Third-party libraries (e.g., libbitcoin, trezor-crypto) implement BIP-0039.

## Related BIPs

- BIP-0032: Uses the seed produced by BIP-0039
- BIP-0044: Defines the derivation path structure

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki`,
  },
  {
    number: "0044",
    title: "Multi-Account Hierarchy for Deterministic Wallets",
    status: "Final",
    type: "Standards Track",
    layer: "Applications",
    content: `# BIP-0044: Multi-Account Hierarchy for Deterministic Wallets

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Applications |
| Created | 2014-04-24 |

## Abstract

BIP-0044 defines a standard five-level BIP-0032 path structure for HD wallets: m / purpose' / coin_type' / account' / change / address_index. This enables interoperability between wallets.

## Key Technical Details

- **Path structure**: \`m / 44' / coin_type' / account' / change / address_index\`
- **Purpose**: Always 44' for BIP-0044 (per BIP-0043)
- **Coin type**: 0' = Bitcoin mainnet, 1' = testnet (all coins); registered at SLIP-0044
- **Account**: Starts at 0'. Each account is an independent subtree; user-visible account separation
- **Change**: 0 = external chain (receiving addresses), 1 = internal chain (change addresses)
- **Address index**: Sequential, starting at 0; soft limit of 20 gap before stopping discovery

## Bitcoin Core Implementation

Bitcoin Core's modern descriptor wallet does not strictly follow BIP-0044 paths. Legacy wallet used a flat key pool. Descriptor wallets use output descriptor syntax (e.g., \`pkh(xpub.../0/*)\`) rather than implicit BIP-0044 paths.

Users importing BIP-0044 wallets from other software can use descriptors with the appropriate path.

## Related BIPs

- BIP-0032: Key derivation
- BIP-0039: Mnemonic seed
- BIP-0049: P2SH-P2WPKH derivation (purpose = 49')
- BIP-0084: P2WPKH derivation (purpose = 84')
- BIP-0086: P2TR derivation (purpose = 86')

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0044.mediawiki`,
  },
  {
    number: "0065",
    title: "OP_CHECKLOCKTIMEVERIFY",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0065: OP_CHECKLOCKTIMEVERIFY (CLTV)

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2014-10-01 |
| Activated | Block 388381 (December 2015) |

## Abstract

BIP-0065 repurposes OP_NOP2 as OP_CHECKLOCKTIMEVERIFY. When executed, it checks that the transaction's nLockTime is at least as large as the top stack item. This makes outputs unspendable until a specified time or block height.

## Key Technical Details

- **Opcode**: OP_CHECKLOCKTIMEVERIFY (0xb1), formerly OP_NOP2
- **Stack**: Reads top stack item as the locktime threshold; does not pop it
- **nLockTime semantics**: Value < 500000000 = block height; ≥ 500000000 = Unix timestamp
- **Consistency requirement**: nLockTime and CLTV argument must use the same units (both height or both time)
- **nSequence requirement**: Input's nSequence must not be 0xFFFFFFFF (final), otherwise nLockTime is ignored
- **Soft fork**: OP_NOP2 was a no-op; CLTV makes it fail if constraint not met — backward compatible

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/script/interpreter.cpp\` | \`OP_CHECKLOCKTIMEVERIFY\` case in \`EvalScript()\` |
| \`src/script/script.h\` | \`OP_CHECKLOCKTIMEVERIFY = OP_NOP2\` constant |
| \`src/consensus/tx_verify.cpp\` | \`CheckFinalTx()\` validates nLockTime |

## Related BIPs

- BIP-0068: Relative lock-time (companion; uses nSequence)
- BIP-0112: OP_CHECKSEQUENCEVERIFY (relative CLTV analog)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0065.mediawiki`,
  },
  {
    number: "0068",
    title: "Relative lock-time using consensus-enforced sequence numbers",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0068: Relative lock-time using consensus-enforced sequence numbers

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2015-05-28 |
| Activated | Block 419328 (July 2016, with CSV) |

## Abstract

BIP-0068 repurposes the nSequence field of transaction inputs to encode relative lock-times. A transaction input cannot be included in a block until the referenced output is at least N blocks or N×512 seconds old.

## Key Technical Details

- **Disable flag**: Bit 31 of nSequence = 1 disables relative locktime (input treated as final for this purpose)
- **Type flag**: Bit 22 = 0 means block-based; bit 22 = 1 means time-based (512-second granularity)
- **Value**: Bits 0–15 encode the relative lock-time (0–65535 blocks, or 0–65535 × 512 seconds ≈ 388 days)
- **Interaction with nLockTime**: When BIP-0068 applies, nSequence must be < 0xFFFFFFFE for nLockTime to be meaningful
- **Median-time-past**: Time-based relative locktime uses MTP of ancestor block, not header timestamp

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/consensus/tx_verify.cpp\` | \`CheckSequenceLocks()\`, \`SequenceLocks()\` |
| \`src/validation.cpp\` | Calls sequence lock checks during block validation |
| \`src/txmempool.cpp\` | Checks sequence locks for mempool admission |
| \`src/policy/policy.h\` | \`SEQUENCE_LOCKTIME_DISABLE_FLAG\`, \`SEQUENCE_LOCKTIME_TYPE_FLAG\` constants |

## Related BIPs

- BIP-0065: Absolute lock-time (OP_CLTV)
- BIP-0112: OP_CHECKSEQUENCEVERIFY (uses BIP-0068 semantics in scripts)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0068.mediawiki`,
  },
  {
    number: "0112",
    title: "CHECKSEQUENCEVERIFY",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0112: CHECKSEQUENCEVERIFY (CSV)

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2015-08-10 |
| Activated | Block 419328 (July 2016) |

## Abstract

BIP-0112 repurposes OP_NOP3 as OP_CHECKSEQUENCEVERIFY. It checks that the spending transaction's input sequence number is at least as large as the top stack item interpreted using BIP-0068 relative lock-time semantics.

## Key Technical Details

- **Opcode**: OP_CHECKSEQUENCEVERIFY (0xb2), formerly OP_NOP3
- **Stack**: Reads top stack item as relative locktime threshold; does not pop
- **Semantics**: Uses BIP-0068 nSequence encoding (block-based or time-based relative locktime)
- **Disable flag**: If bit 31 of stack argument or nSequence is set, CSV is a no-op
- **Use case**: Payment channels (Lightning Network pre-image), escrow, vault constructions
- **Soft fork**: OP_NOP3 was a no-op; CSV fails if constraint not met — backward compatible

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/script/interpreter.cpp\` | \`OP_CHECKSEQUENCEVERIFY\` case in \`EvalScript()\` |
| \`src/script/script.h\` | \`OP_CHECKSEQUENCEVERIFY = OP_NOP3\` constant |
| \`src/consensus/tx_verify.cpp\` | \`CheckSequenceLocks()\` implements BIP-0068 logic |

## Related BIPs

- BIP-0068: Defines nSequence relative lock-time encoding (required prerequisite)
- BIP-0065: OP_CHECKLOCKTIMEVERIFY (absolute time-lock analog)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0112.mediawiki`,
  },
  {
    number: "0125",
    title: "Opt-in Full Replace-by-Fee Signaling",
    status: "Final",
    type: "Standards Track",
    layer: "Peer Services",
    content: `# BIP-0125: Opt-in Full Replace-by-Fee Signaling

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Peer Services |
| Created | 2015-12-04 |

## Abstract

BIP-0125 defines a signaling mechanism where unconfirmed transactions can indicate they are willing to be replaced by higher-fee versions. A transaction signals opt-in RBF by setting at least one input's nSequence to ≤ 0xFFFFFFFD.

## Key Technical Details

- **Signal**: Any input with nSequence ≤ 0xFFFFFFFD (i.e., not 0xFFFFFFFE or 0xFFFFFFFF) opts in
- **Replacement rules** (all must be met):
  1. Replaced transaction signals opt-in
  2. Replacement does not introduce new unconfirmed inputs (unless they also signal opt-in)
  3. Replacement has absolute fee ≥ sum of replaced transactions' fees
  4. Replacement pays fee rate ≥ minimum relay fee rate
  5. Replacement does not evict more than 100 transactions
- **Policy only**: Not a consensus rule; nodes may have different policies
- **Full RBF**: Bitcoin Core added \`-mempoolfullrbf\` flag (v24.0) to replace any unconfirmed tx regardless of signaling

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/policy/rbf.h\` / \`rbf.cpp\` | \`IsRBFOptIn()\`, \`GetEntriesForConflicts()\`, \`HasNoNewUnconfirmed()\` |
| \`src/txmempool.cpp\` | Conflict detection and replacement logic |
| \`src/validation.cpp\` | \`AcceptToMemoryPoolWorker()\` calls RBF checks |
| \`src/node/mempool_args.cpp\` | \`-mempoolfullrbf\` option handling |

Key function: \`IsRBFOptIn(const CTransaction&, const CTxMemPool&)\`.

## Related BIPs

- BIP-0068: nSequence semantics (BIP-0125 uses nSequence for signaling)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0125.mediawiki`,
  },
  {
    number: "0141",
    title: "Segregated Witness (Consensus layer)",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0141: Segregated Witness (Consensus layer)

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2015-12-21 |
| Activated | Block 481824 (August 2017) |

## Abstract

BIP-0141 defines Segregated Witness (SegWit), which moves signature data (witness) outside the traditional transaction structure. This fixes transaction malleability, introduces a new block weight metric that gives witness data a 75% discount, and enables new script versioning for future soft forks.

## Key Technical Details

- **Block weight**: weight = (stripped_size × 3) + total_size; max weight = 4,000,000 (≈1MB stripped + 3MB witness)
- **Witness field**: New field in transactions, committed to block via witness merkle tree in coinbase output
- **Script versioning**: Witness version (0–16) allows future consensus changes without hard fork
- **Version 0 programs**:
  - 20-byte: P2WPKH (pay to witness public key hash)
  - 32-byte: P2WSH (pay to witness script hash)
- **Malleability fix**: Witness data not covered by txid (uses wtxid for witness commitment)
- **Coinbase commitment**: \`OP_RETURN\` output with witness reserved value and witness root

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/validation.cpp\` | \`CheckBlock()\`, \`ConnectBlock()\` — weight checks, witness commitment |
| \`src/script/interpreter.cpp\` | \`VerifyScript()\` with \`SCRIPT_VERIFY_WITNESS\` flag |
| \`src/consensus/tx_verify.cpp\` | \`CheckTxInputs()\` |
| \`src/primitives/transaction.h\` | \`CTxIn\` with \`scriptWitness\`, \`CTransaction::HasWitness()\` |
| \`src/core_write.cpp\` | Witness serialization |

Key flags: \`SCRIPT_VERIFY_WITNESS\`, \`SCRIPT_VERIFY_NULLDUMMY\`.

## Related BIPs

- BIP-0143: Signature hash for v0 witness programs
- BIP-0144: Peer services (serialization)
- BIP-0173: Bech32 address format
- BIP-0340/341/342: Taproot (witness version 1)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0141.mediawiki`,
  },
  {
    number: "0143",
    title: "Transaction Signature Verification for Version 0 Witness Program",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0143: Transaction Signature Verification for Version 0 Witness Program

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2016-01-03 |

## Abstract

BIP-0143 defines a new transaction digest algorithm (sighash) for SegWit version 0 witness programs. The new algorithm commits to additional fields (amount, scriptCode, sequence, outputs) to prevent certain attacks and enable offline signing without full UTXO set access.

## Key Technical Details

- **Double SHA256** of serialized fields (not the old OP_CODESEPARATOR-affected scriptCode)
- **Committed fields**: nVersion, hashPrevouts, hashSequence, outpoint, scriptCode, amount, nSequence, hashOutputs, nLockTime, sighash type
- **Amount commitment**: Signer commits to the value of the input being spent (prevents fee sniping on offline devices)
- **SIGHASH_ALL**: hashPrevouts = dSHA256(all outpoints), hashOutputs = dSHA256(all outputs)
- **SIGHASH_SINGLE / SIGHASH_NONE**: hashPrevouts = 0, different hashOutputs handling
- **SIGHASH_ANYONECANPAY**: hashPrevouts = 0, hashSequence = 0

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/script/interpreter.cpp\` | \`SignatureHashScriptCode()\`, SegWit v0 sighash computation |
| \`src/script/sign.cpp\` | \`SignatureData\`, signing helpers |
| \`src/script/signingprovider.h\` | Key/script provider interfaces |

Key function: \`SignatureHash(script, tx, nIn, nHashType, amount, sigversion)\`.

## Related BIPs

- BIP-0141: SegWit consensus layer (defines v0 programs)
- BIP-0340: Schnorr signatures (BIP-0341 defines new sighash for v1)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0143.mediawiki`,
  },
  {
    number: "0144",
    title: "Segregated Witness (Peer Services)",
    status: "Final",
    type: "Standards Track",
    layer: "Peer Services",
    content: `# BIP-0144: Segregated Witness (Peer Services)

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Peer Services |
| Created | 2016-01-08 |

## Abstract

BIP-0144 defines the peer-to-peer serialization format for SegWit transactions and the network service bit used to advertise SegWit support. It complements BIP-0141 (consensus) and BIP-0143 (sighash) for the network layer.

## Key Technical Details

- **Serialization marker**: Extended format starts with marker \`0x00\` followed by flag \`0x01\` after version field
- **Witness field**: Each input has a witness field (count + stack items); non-witness inputs have an empty witness (\`0x00\`)
- **Service bit**: \`NODE_WITNESS\` = (1 << 3) = 8; advertised in version message
- **GetData**: New inventory type \`MSG_WITNESS_TX\` = 0x40000001, \`MSG_WITNESS_BLOCK\` = 0x40000002
- **Strippable**: Legacy serialization (without marker/witness) remains valid for legacy nodes

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/primitives/transaction.h\` | \`CTransaction\` serialization with witness marker/flag |
| \`src/serialize.h\` | Witness serialization helpers |
| \`src/net.h\` | \`NODE_WITNESS\` service flag |
| \`src/net_processing.cpp\` | \`MSG_WITNESS_TX\`, \`MSG_WITNESS_BLOCK\` handling |
| \`src/protocol.h\` | Inventory type constants |

## Related BIPs

- BIP-0141: Consensus layer (defines witness structure)
- BIP-0143: Signature hash for v0 programs

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0144.mediawiki`,
  },
  {
    number: "0173",
    title: "Base32 address format for native v0-16 witness outputs",
    status: "Final",
    type: "Standards Track",
    layer: "Applications",
    content: `# BIP-0173: Base32 address format for native v0-16 witness outputs (Bech32)

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Applications |
| Created | 2017-03-20 |

## Abstract

BIP-0173 defines Bech32, a base32 encoding with BCH error-detection checksum, used to encode native SegWit (witness version 0) addresses. Bech32 addresses are case-insensitive, have better error detection, and are easier to read/transcribe than Base58Check.

## Key Technical Details

- **Charset**: \`qpzry9x8gf2tvdw0s3jn54khce6mua7l\` (32 characters, no ambiguous chars like 0/O/1/I)
- **Format**: \`<hrp> 1 <data> <checksum>\` where HRP = human-readable part ("bc" mainnet, "tb" testnet)
- **Separator**: Digit \`1\` separates HRP from data
- **Checksum**: 6 characters, BCH code over GF(2^5); detects up to 4 errors in strings up to 89 chars
- **Witness version 0**: P2WPKH = 20-byte program, P2WSH = 32-byte program
- **Case**: Lowercase recommended; uppercase accepted (for QR); mixed case invalid
- **BIP-0350 supersedes for v1+**: Bech32m (different constant) used for Taproot and future versions

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/bech32.h\` / \`src/bech32.cpp\` | Bech32 encode/decode |
| \`src/key_io.cpp\` | \`EncodeDestination()\`, \`DecodeDestination()\` |
| \`src/script/standard.h\` | \`WitnessV0KeyHash\`, \`WitnessV0ScriptHash\` destination types |

Key functions: \`bech32::Encode()\`, \`bech32::Decode()\`.

## Related BIPs

- BIP-0141: SegWit (defines witness programs)
- BIP-0350: Bech32m (for v1+ witness addresses)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki`,
  },
  {
    number: "0340",
    title: "Schnorr Signatures for secp256k1",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0340: Schnorr Signatures for secp256k1

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2020-01-19 |
| Activated | Block 709632 (November 2021, with Taproot) |

## Abstract

BIP-0340 specifies 64-byte Schnorr signatures for the secp256k1 elliptic curve. Compared to ECDSA, Schnorr signatures are provably secure, support native multi-signature aggregation (MuSig), are batch-verifiable, and have simpler implementation.

## Key Technical Details

- **Signature format**: (R, s) — 32-byte x-coordinate of R + 32-byte s; 64 bytes total (no DER encoding)
- **Key encoding**: 32-byte x-coordinate only (implicit even Y coordinate); "x-only public keys"
- **Signing**: Deterministic nonce k = HMAC-SHA256(private_key, message, random auxiliary data)
- **Tagged hashes**: \`tagged_hash(tag, data) = SHA256(SHA256(tag) || SHA256(tag) || data)\`; prevents cross-protocol attacks
- **Verification**: Given (R, s, P, m): check s·G = R + tagged_hash(R||P||m)·P
- **Batch verification**: Can verify many signatures simultaneously faster than individually
- **Security proof**: Provably secure under DL assumption in ROM (unlike ECDSA which requires additional assumptions)

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/secp256k1/include/secp256k1_schnorrsig.h\` | \`secp256k1_schnorrsig_sign32()\`, \`secp256k1_schnorrsig_verify()\` |
| \`src/secp256k1/src/modules/schnorrsig/\` | Schnorr signature implementation |
| \`src/pubkey.h\` / \`src/pubkey.cpp\` | \`XOnlyPubKey\` type, \`XOnlyPubKey::VerifySchnorr()\` |
| \`src/script/interpreter.cpp\` | Schnorr signature verification in Taproot |

Key types: \`XOnlyPubKey\` (32-byte x-only public key).

## Related BIPs

- BIP-0341: Taproot (uses Schnorr as the signing algorithm for key-path spends)
- BIP-0342: Tapscript (uses Schnorr for script-path spends)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki`,
  },
  {
    number: "0341",
    title: "Taproot: SegWit version 1 spending rules",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0341: Taproot: SegWit version 1 spending rules

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2020-01-19 |
| Activated | Block 709632 (November 2021) |

## Abstract

BIP-0341 defines Taproot, a SegWit version 1 spending scheme. Outputs are pay-to-taproot (P2TR): a tweaked x-only public key. Spending can be via key-path (single Schnorr signature) or script-path (reveal one leaf of a Merkle tree of scripts). This provides privacy (key-path looks like any other key spend) and flexibility (arbitrary scripts hidden until needed).

## Key Technical Details

- **scriptPubKey**: \`OP_1 <32-byte-tweaked-pubkey>\` (34 bytes)
- **Key-path spend**: Witness = just a 64-byte Schnorr signature; optimal privacy and efficiency
- **Script-path spend**: Witness = \`<script-args> <leaf-script> <control-block>\`
- **Taptweak**: \`P_tweaked = P + tagged_hash("TapTweak", P || merkle_root)·G\`; if no scripts: merkle_root = empty
- **MAST (Merklized Abstract Syntax Tree)**: Scripts organized as leaf nodes in a binary Merkle tree; only the executed script and its Merkle path revealed
- **TapLeaf**: \`tagged_hash("TapLeaf", version || compact_size(script) || script)\`
- **TapBranch**: \`tagged_hash("TapBranch", min(a,b) || max(a,b))\`
- **Control block**: leaf version + parity bit + internal pubkey + Merkle path
- **Annex**: Optional extra data in witness prefixed with 0x50; reserved for future extensions

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/script/interpreter.cpp\` | \`VerifyTaprootCommitment()\`, key-path and script-path validation |
| \`src/script/script.h\` | \`TAPROOT_LEAF_TAPSCRIPT\`, \`TAPROOT_CONTROL_*\` constants |
| \`src/pubkey.h\` | \`XOnlyPubKey\`, \`ComputeTapTweakedKey()\` |
| \`src/script/standard.cpp\` | \`TaprootBuilder\`, \`GetScriptForDestination(WitnessV1Taproot)\` |
| \`src/script/standard.h\` | \`WitnessV1Taproot\` destination type |

Key classes: \`TaprootBuilder\` (construct tap tree), \`TaprootSpendData\` (spending info).

## Related BIPs

- BIP-0340: Schnorr signatures (key-path signing)
- BIP-0342: Tapscript (script-path validation rules)
- BIP-0350: Bech32m (P2TR address encoding)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki`,
  },
  {
    number: "0342",
    title: "Validation of Taproot Scripts",
    status: "Final",
    type: "Standards Track",
    layer: "Consensus (soft fork)",
    content: `# BIP-0342: Validation of Taproot Scripts (Tapscript)

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Consensus (soft fork) |
| Created | 2020-01-19 |
| Activated | Block 709632 (November 2021, with Taproot) |

## Abstract

BIP-0342 defines Tapscript, the scripting language used for Taproot script-path spends (leaf version 0xc0). Tapscript modifies script validation rules to use Schnorr signatures, removes some limits, and introduces OP_SUCCESS opcodes for future extensions.

## Key Technical Details

- **Applies to**: Taproot script-path spends with leaf version 0xc0 (TAPROOT_LEAF_TAPSCRIPT)
- **Schnorr signatures only**: OP_CHECKSIG, OP_CHECKSIGVERIFY, OP_CHECKSIGADD use Schnorr; ECDSA removed for new keys
- **Key format**: 32-byte x-only public keys in Tapscript (not compressed 33-byte)
- **OP_CHECKSIGADD**: New opcode (replaces OP_NOP8); enables efficient k-of-n multisig without OP_CHECKMULTISIG
- **OP_SUCCESS opcodes**: Previously-undefined opcodes (e.g., OP_SUCCESS126) make the script succeed unconditionally; reserved for future soft forks
- **Script limits relaxed**: No 10,000-byte script size limit, no 201 opcode limit (per-input weight budget instead)
- **Empty pubkey**: If pubkey is empty, signature must be empty (unknown key type handling for future keys)
- **Sighash**: Tagged hash with "TapSighash" tag; commits to all inputs/outputs and Taproot-specific fields

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/script/interpreter.cpp\` | Tapscript execution path in \`EvalScript()\`, \`OP_CHECKSIGADD\` |
| \`src/script/script.h\` | \`TAPROOT_LEAF_TAPSCRIPT\`, OP_SUCCESS opcode list |
| \`src/script/interpreter.h\` | \`SigVersion::TAPSCRIPT\` enum value |

Key: \`SigVersion::TAPSCRIPT\` controls which validation rules apply inside \`EvalScript()\`.

## Related BIPs

- BIP-0340: Schnorr signatures (used exclusively in Tapscript)
- BIP-0341: Taproot (defines script-path spend structure)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0342.mediawiki`,
  },
  {
    number: "0350",
    title: "Bech32m format for v1+ witness addresses",
    status: "Final",
    type: "Standards Track",
    layer: "Applications",
    content: `# BIP-0350: Bech32m format for v1+ witness addresses

| Field | Value |
|-------|-------|
| Status | Final |
| Type | Standards Track |
| Layer | Applications |
| Created | 2020-12-16 |

## Abstract

BIP-0350 defines Bech32m, a modification of Bech32 (BIP-0173) that fixes a checksum weakness. Bech32m is used for witness version 1 and higher native SegWit addresses (e.g., P2TR/Taproot). Witness version 0 addresses (P2WPKH, P2WSH) continue to use original Bech32.

## Key Technical Details

- **Constant change**: Bech32 uses constant \`1\`; Bech32m uses constant \`0x2bc830a3\` in the checksum polynomial
- **Motivation**: Bech32 has a weakness where inserting or deleting 'q' before the last 'p' produces a valid checksum; Bech32m fixes this
- **Applicability**: Witness version 0 → Bech32 (BIP-0173). Witness version 1-16 → Bech32m (this BIP)
- **Address format**: Identical structure to Bech32; only the checksum constant differs
- **P2TR addresses**: 62-character Bech32m strings on mainnet (hrp "bc" + separator "1" + 58 data+checksum chars)

## Bitcoin Core Implementation

| File | Purpose |
|------|---------|
| \`src/bech32.h\` / \`src/bech32.cpp\` | \`bech32::Encoding\` enum (\`BECH32\`, \`BECH32M\`), decode returns encoding type |
| \`src/key_io.cpp\` | Selects Bech32 vs Bech32m based on witness version |
| \`src/script/standard.h\` | \`WitnessV1Taproot\` destination type |

Key: \`bech32::Decode()\` returns \`{encoding, hrp, data}\` where encoding distinguishes Bech32 vs Bech32m.

## Related BIPs

- BIP-0173: Bech32 (v0 witness addresses; still used for P2WPKH, P2WSH)
- BIP-0341: Taproot (v1 witness program that uses Bech32m)

---
> **PLACEHOLDER**: Full BIP text will be added. Reference: https://github.com/bitcoin/bips/blob/master/bip-0350.mediawiki`,
  },
];

export function getBip(numberInput: string): BipEntry | undefined {
  const normalized = numberInput.replace(/^0+/, "").padStart(4, "0");
  return BIP_REGISTRY.find((b) => b.number === normalized);
}

export function searchBips(query: string): BipEntry[] {
  const q = query.toLowerCase();
  return BIP_REGISTRY.filter(
    (b) =>
      b.title.toLowerCase().includes(q) ||
      b.content.toLowerCase().includes(q) ||
      (b.layer ?? "").toLowerCase().includes(q) ||
      b.type.toLowerCase().includes(q)
  );
}
