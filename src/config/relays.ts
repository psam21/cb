/**
 * Nostr Relay Configuration
 * 
 * This file contains the list of Nostr relays used for publishing products and messages.
 * Only the most reliable and fastest relays are included based on performance testing.
 * 
 * Each relay includes:
 * - url: WebSocket URL for the relay
 * - name: Human-readable name for display
 * - description: Brief description of the relay with response time
 * - region: Geographic region for optimization
 * - reliability: Reliability rating (high/medium/low)
 */

export interface RelayConfig {
  url: string;
  name: string;
  description: string;
  region: string;
  reliability: 'high' | 'medium' | 'low';
  // Relay-specific configuration
  requiresAuth?: boolean;
  // Core Protocol NIPs
  supportsNip01?: boolean;  // Basic Protocol Flow
  supportsNip02?: boolean;  // Contact List and Petnames
  supportsNip03?: boolean;  // OpenTimestamps Attestations
  supportsNip04?: boolean;  // Encrypted Direct Message (deprecated)
  supportsNip09?: boolean;  // Event Deletion
  supportsNip11?: boolean;  // Relay Information Document
  supportsNip13?: boolean;  // Proof of Work
  // Enhanced Features NIPs
  supportsNip15?: boolean;  // End of Stored Events Notice
  supportsNip16?: boolean;  // Event Treatment
  supportsNip17?: boolean;  // Private Direct Messages
  supportsNip20?: boolean;  // Command Results
  supportsNip22?: boolean;  // Event created_at Limits
  supportsNip23?: boolean;  // Long-form Content
  supportsNip24?: boolean;  // Extra metadata fields and tags
  supportsNip25?: boolean;  // Reactions
  supportsNip26?: boolean;  // Delegated Event Signing
  supportsNip28?: boolean;  // Public Chat
  // Advanced Features NIPs
  supportsNip33?: boolean;  // Parameterized Replaceable Events
  supportsNip40?: boolean;  // Expiration Timestamp
  supportsNip42?: boolean;  // Authentication
  supportsNip44?: boolean;  // Encrypted Payloads (Versioned)
  supportsNip45?: boolean;  // Counting Events
  supportsNip47?: boolean;  // Nostr Wallet Connect (NWC)
  supportsNip50?: boolean;  // Search Capability
  supportsNip51?: boolean;  // Lists
  supportsNip52?: boolean;  // Calendar Events
  supportsNip53?: boolean;  // Live Activities
  supportsNip54?: boolean;  // Wiki
  supportsNip56?: boolean;  // Reporting
  supportsNip57?: boolean;  // Lightning Zaps
  supportsNip58?: boolean;  // Badges
  supportsNip59?: boolean;  // Gift Wrap
  supportsNip60?: boolean;  // Cashu Wallets
  supportsNip61?: boolean;  // Nutzaps (P2PK Cashu tokens)
  supportsNip62?: boolean;  // Request to Vanish
  supportsNip65?: boolean;  // Relay List Metadata
  supportsNip70?: boolean;  // Protected events
  supportsNip72?: boolean;  // Moderated Communities
  supportsNip77?: boolean;  // Negentropy syncing
  supportsNip78?: boolean;  // Application-specific data
  supportsNip119?: boolean; // AND operator for filters
  // Custom query parameters or headers
  customHeaders?: Record<string, string>;
  queryParams?: Record<string, string>;
  // Rate limiting and connection settings
  rateLimit?: {
    requestsPerMinute: number;
    burstSize: number;
  };
  // Connection preferences
  preferWss?: boolean;
  fallbackUrl?: string;
}

export const NOSTR_RELAYS: RelayConfig[] = [
  {
    url: 'wss://relay.damus.io',
    name: 'Damus Relay',
    description: 'Official relay for Damus app (strfry) - 315ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic protocol flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip22: true,  // Event created_at Limits
    supportsNip28: true,  // Public Chat
    supportsNip40: true,  // Expiration Timestamp
    rateLimit: { requestsPerMinute: 60, burstSize: 10 }
  },
  {
    url: 'wss://nos.lol',
    name: 'Nos.lol',
    description: 'Popular general purpose relay (strfry) - 194ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic protocol flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip22: true,  // Event created_at Limits
    supportsNip28: true,  // Public Chat
    supportsNip40: true,  // Expiration Timestamp
    rateLimit: { requestsPerMinute: 120, burstSize: 20 }
  },
  {
    url: 'wss://relay.snort.social',
    name: 'Snort Social',
    description: 'Official relay for Snort Social app (strfry) - 280ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic protocol flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip22: true,  // Event created_at Limits
    supportsNip28: true,  // Public Chat
    supportsNip40: true,  // Expiration Timestamp
    rateLimit: { requestsPerMinute: 90, burstSize: 15 }
  },
  {
    url: 'wss://relay.nostr.band',
    name: 'Nostr.band',
    description: 'Nostr.band explorer relay with search - 298ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic protocol flow
    supportsNip11: true,  // Relay Information Document
    supportsNip15: true,  // End of Stored Events Notice
    supportsNip20: true,  // Command Results
    supportsNip33: true,  // Parameterized Replaceable Events
    supportsNip45: true,  // Counting Events
    supportsNip50: true,  // Search Capability
    rateLimit: { requestsPerMinute: 80, burstSize: 12 }
  },
  {
    url: 'wss://relay.primal.net',
    name: 'Primal',
    description: 'Official relay for Primal app (strfry) - 328ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic protocol flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip22: true,  // Event created_at Limits
    supportsNip28: true,  // Public Chat
    supportsNip40: true,  // Expiration Timestamp
    rateLimit: { requestsPerMinute: 100, burstSize: 15 }
  },
  {
    url: 'wss://offchain.pub',
    name: 'Offchain Pub',
    description: 'Reliable public relay (strfry) - 356ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic protocol flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip22: true,  // Event created_at Limits
    supportsNip28: true,  // Public Chat
    supportsNip40: true,  // Expiration Timestamp
    rateLimit: { requestsPerMinute: 80, burstSize: 12 }
  },
  {
    url: 'wss://shu01.shugur.net',
    name: 'Shugur Network',
    description: 'Enterprise-grade distributed HA relay cluster - 35+ NIPs including Time Capsules, Calendar, Zaps, Encryption, Communities, Cashu Wallets',
    region: 'Global',
    reliability: 'high',
    // Core Protocol NIPs (NIP-01 through NIP-11)
    supportsNip01: true,  // Basic Protocol Flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip03: true,  // OpenTimestamps Attestations
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    // Enhanced Features NIPs (NIP-15 through NIP-26)
    supportsNip15: true,  // End of Stored Events Notice
    supportsNip16: true,  // Event Treatment
    supportsNip17: true,  // Private Direct Messages
    supportsNip20: true,  // Command Results
    supportsNip22: true,  // Event created_at Limits
    supportsNip23: true,  // Long-form Content
    supportsNip24: true,  // Extra metadata fields and tags
    supportsNip25: true,  // Reactions
    supportsNip26: true,  // Delegated Event Signing
    // Advanced Features NIPs (NIP-28 through NIP-65)
    supportsNip28: true,  // Public Chat
    supportsNip33: true,  // Parameterized Replaceable Events
    supportsNip40: true,  // Expiration Timestamp
    supportsNip42: true,  // Authentication
    supportsNip44: true,  // Encrypted Payloads (Versioned)
    supportsNip45: true,  // Counting Events
    supportsNip47: true,  // Nostr Wallet Connect (NWC)
    supportsNip50: true,  // Search Capability
    supportsNip51: true,  // Lists
    supportsNip52: true,  // Calendar Events
    supportsNip53: true,  // Live Activities
    supportsNip54: true,  // Wiki
    supportsNip56: true,  // Reporting
    supportsNip57: true,  // Lightning Zaps
    supportsNip58: true,  // Badges
    supportsNip59: true,  // Gift Wrap
    supportsNip60: true,  // Cashu Wallets
    supportsNip61: true,  // Nutzaps (P2PK Cashu tokens)
    supportsNip65: true,  // Relay List Metadata
    supportsNip72: true,  // Moderated Communities
    supportsNip78: true,  // Application-specific data
    rateLimit: { requestsPerMinute: 120, burstSize: 20 }
  },
  {
    url: 'wss://nostr.wine',
    name: 'Nostr Wine',
    description: 'High-performance relay with paid tiers (free tier available) - Global CDN, NIP-17 DMs',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic Protocol Flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip17: true,  // Private Direct Messages
    supportsNip40: true,  // Expiration Timestamp
    supportsNip42: true,  // Authentication
    supportsNip44: true,  // Encrypted Payloads (Versioned)
    supportsNip50: true,  // Search Capability
    supportsNip59: true,  // Gift Wrap
    supportsNip65: true,  // Relay List Metadata
    rateLimit: { requestsPerMinute: 120, burstSize: 20 }
  },
  {
    url: 'wss://relay.0xchat.com',
    name: '0xchat Relay',
    description: 'Dedicated NIP-17 messaging relay - optimized for private DMs and group chats',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,  // Basic Protocol Flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip17: true,  // Private Direct Messages
    supportsNip40: true,  // Expiration Timestamp
    supportsNip44: true,  // Encrypted Payloads (Versioned)
    supportsNip59: true,  // Gift Wrap
    rateLimit: { requestsPerMinute: 100, burstSize: 15 }
  },
  {
    url: 'wss://relay.nostr.wirednet.jp',
    name: 'WiredNet (Japan)',
    description: 'Japan-based relay for Asia-Pacific coverage - strfry implementation',
    region: 'Asia-Pacific',
    reliability: 'high',
    supportsNip01: true,  // Basic Protocol Flow
    supportsNip02: true,  // Contact List and Petnames
    supportsNip04: true,  // Encrypted Direct Message (deprecated)
    supportsNip09: true,  // Event Deletion
    supportsNip11: true,  // Relay Information Document
    supportsNip15: true,  // End of Stored Events Notice
    supportsNip40: true,  // Expiration Timestamp
    rateLimit: { requestsPerMinute: 100, burstSize: 15 }
  }
];

// Helper functions
export const getRelayUrls = (): string[] => {
  return NOSTR_RELAYS.map(relay => relay.url);
};

export const getAllRelayInfo = (): RelayConfig[] => {
  return NOSTR_RELAYS;
};

export const getRelayInfo = (url: string): RelayConfig | undefined => {
  return NOSTR_RELAYS.find(relay => relay.url === url);
};

// Environment-specific relay configurations
export const getRelaysForEnvironment = (environment: 'development' | 'staging' | 'production'): string[] => {
  switch (environment) {
    case 'development':
      // Use only the most reliable relays for development
      return NOSTR_RELAYS
        .filter(relay => relay.reliability === 'high')
        .slice(0, 2)
        .map(relay => relay.url);
    
    case 'staging':
      // Use more relays for staging testing
      return NOSTR_RELAYS
        .filter(relay => relay.reliability === 'high')
        .slice(0, 3)
        .map(relay => relay.url);
    
    case 'production':
    default:
      // Use all high-reliability relays for production
      return NOSTR_RELAYS
        .filter(relay => relay.reliability === 'high')
        .map(relay => relay.url);
  }
};

// Get relay URLs with environment override support
export const getRelayUrlsWithOverride = (environment: string, customRelays?: string): string[] => {
  // If custom relays are provided via environment variable, use them
  if (customRelays) {
    return customRelays.split(',').map(url => url.trim()).filter(url => url.length > 0);
  }
  
  // Otherwise, use environment-specific defaults
  return getRelaysForEnvironment(environment as 'development' | 'staging' | 'production');
};
