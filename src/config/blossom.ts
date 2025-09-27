/**
 * Blossom Configuration
 * 
 * Centralized configuration for Blossom file hosting following Nostr's decentralized ethos.
 * Supports both user-owned infrastructure and shared fallback servers.
 */

export interface BlossomServerConfig {
  url: string;
  name: string;
  type: 'user-owned' | 'shared';
  reliability: 'high' | 'medium' | 'low';
  description: string;
}

/**
 * Primary Blossom servers (shared infrastructure)
 * Used as fallback when user-owned servers are unavailable
 */
export const SHARED_BLOSSOM_SERVERS: BlossomServerConfig[] = [
  {
    url: 'https://blossom.nostr.build',
    name: 'Nostr.build Blossom',
    type: 'shared',
    reliability: 'high',
    description: 'Primary shared Blossom server by Nostr.build'
  },
  {
    url: 'https://blosstr.com',
    name: 'Blosstr',
    type: 'shared',
    reliability: 'high',
    description: 'Alternative shared Blossom server'
  }
];

/**
 * User-owned Blossom server patterns
 * Following Nostr's self-sovereignty principles
 */
export const USER_OWNED_PATTERNS = {
  blossomBand: 'https://{npub}.blossom.band',
  blosstrCom: 'https://{npub}.blosstr.com',
} as const;

/**
 * Default configuration
 */
export const BLOSSOM_CONFIG = {
  // Prefer user-owned infrastructure (Nostr ethos)
  preferUserOwned: true,
  
  // Primary user-owned pattern
  primaryUserPattern: USER_OWNED_PATTERNS.blossomBand,
  
  // Fallback to shared servers if user-owned fails
  enableSharedFallback: true,
  
  // Primary shared server for fallback
  primarySharedServer: SHARED_BLOSSOM_SERVERS[0],
  
  // Maximum file size (100MB)
  maxFileSize: 100 * 1024 * 1024,
  
  // Connection timeout (10 seconds)
  connectionTimeout: 10000,
} as const;

/**
 * Construct user-specific Blossom URL
 */
export function constructUserBlossomUrl(
  userNpub: string, 
  imageHash: string, 
  pattern: string = BLOSSOM_CONFIG.primaryUserPattern
): string {
  return pattern.replace('{npub}', userNpub) + `/${imageHash}`;
}

/**
 * Get fallback shared server URL
 */
export function getSharedBlossomUrl(
  imageHash: string,
  serverIndex: number = 0
): string {
  const server = SHARED_BLOSSOM_SERVERS[serverIndex] || SHARED_BLOSSOM_SERVERS[0];
  return `${server.url}/${imageHash}`;
}

/**
 * Get all supported Blossom domains for Next.js image configuration
 */
export function getAllBlossomDomains(): string[] {
  const userOwnedDomains = Object.values(USER_OWNED_PATTERNS).map(pattern => {
    const url = new URL(pattern.replace('{npub}', 'example'));
    return `*.${url.hostname.replace('example.', '')}`;
  });
  
  const sharedDomains = SHARED_BLOSSOM_SERVERS.map(server => {
    const url = new URL(server.url);
    return url.hostname;
  });
  
  return [...userOwnedDomains, ...sharedDomains];
}
