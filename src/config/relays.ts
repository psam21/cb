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
  supportsNip01?: boolean;
  supportsNip15?: boolean;
  supportsNip20?: boolean;
  supportsNip26?: boolean;
  supportsNip33?: boolean;
  supportsNip40?: boolean;
  supportsNip42?: boolean;
  supportsNip50?: boolean;
  supportsNip65?: boolean;
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
    description: 'Official relay for Damus app - 315ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,
    supportsNip15: true,
    supportsNip20: true,
    supportsNip42: true,
    supportsNip50: true,
    rateLimit: { requestsPerMinute: 60, burstSize: 10 }
  },
  {
    url: 'wss://nos.lol',
    name: 'Nos.lol',
    description: 'Popular general purpose relay - 194ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,
    supportsNip15: true,
    supportsNip20: true,
    supportsNip42: true,
    supportsNip50: true,
    rateLimit: { requestsPerMinute: 120, burstSize: 20 }
  },
  {
    url: 'wss://relay.snort.social',
    name: 'Snort Social',
    description: 'Official relay for Snort Social app - 280ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,
    supportsNip15: true,
    supportsNip20: true,
    supportsNip42: true,
    supportsNip50: true,
    supportsNip65: true,
    rateLimit: { requestsPerMinute: 90, burstSize: 15 }
  },
  {
    url: 'wss://relay.nostr.band',
    name: 'Nostr.band',
    description: 'Official relay for Nostr.band explorer - 298ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,
    supportsNip15: true,
    supportsNip20: true,
    supportsNip42: true,
    supportsNip50: true,
    rateLimit: { requestsPerMinute: 80, burstSize: 12 }
  },
  {
    url: 'wss://relay.primal.net',
    name: 'Primal',
    description: 'Official relay for Primal app - 328ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,
    supportsNip15: true,
    supportsNip20: true,
    supportsNip42: true,
    supportsNip50: true,
    rateLimit: { requestsPerMinute: 100, burstSize: 15 }
  },
  {
    url: 'wss://offchain.pub',
    name: 'Offchain Pub',
    description: 'Reliable public relay - 356ms response time',
    region: 'Global',
    reliability: 'high',
    supportsNip01: true,
    supportsNip15: true,
    supportsNip20: true,
    supportsNip42: true,
    supportsNip50: true,
    rateLimit: { requestsPerMinute: 80, burstSize: 12 }
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
