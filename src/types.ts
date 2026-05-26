export interface BipEntry {
  number: string;    // 4-digit padded, e.g. "0001", "0341"
  title: string;
  status: string;    // Draft | Proposed | Active | Final | Replaced | Withdrawn | Rejected | Deferred | Obsolete
  type: string;      // Standards Track | Informational | Process
  layer?: string;    // Consensus (soft fork) | Consensus (hard fork) | Peer Services | API/RPC | Applications
  content: string;   // Full markdown document (placeholder)
}

export interface KnowledgeEntry {
  id: string;          // slug, e.g. "mempool", "consensus"
  title: string;
  description: string; // one-line summary for listings
  tags: string[];      // keywords for search
  content: string;     // Full markdown document (placeholder)
}
