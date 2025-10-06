/**
 * NIP-05 Verification Utilities
 * 
 * Implements Nostr Improvement Proposal 05 for identity verification
 * https://github.com/nostr-protocol/nips/blob/master/05.md
 */

import { logger } from '@/services/core/LoggingService';

export interface NIP05Result {
  pubkey: string;
  name: string;
  domain: string;
}

/**
 * Extract NIP-05 identifier from profile metadata
 * Format: name@domain.com or just domain.com (implies _@domain.com)
 */
export function extractNIP05(nip05String: string | undefined): { name: string; domain: string } | null {
  if (!nip05String) return null;

  const parts = nip05String.split('@');
  
  if (parts.length === 1) {
    // Just domain (e.g., "example.com" means "_@example.com")
    return { name: '_', domain: parts[0] };
  } else if (parts.length === 2) {
    // Full identifier (e.g., "alice@example.com")
    return { name: parts[0], domain: parts[1] };
  }
  
  return null;
}

/**
 * Verify NIP-05 identifier and get pubkey
 * 
 * @param nip05 - NIP-05 identifier (e.g., "alice@example.com")
 * @param expectedPubkey - Optional pubkey to verify against
 * @returns NIP05Result if valid, null otherwise
 */
export async function verifyNIP05(
  nip05: string,
  expectedPubkey?: string
): Promise<NIP05Result | null> {
  try {
    const parsed = extractNIP05(nip05);
    if (!parsed) {
      logger.debug('Invalid NIP-05 format', {
        service: 'nip05',
        method: 'verifyNIP05',
        nip05,
      });
      return null;
    }

    const { name, domain } = parsed;

    // Construct well-known URL
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(name)}`;

    logger.debug('Verifying NIP-05', {
      service: 'nip05',
      method: 'verifyNIP05',
      url,
    });

    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      logger.debug('NIP-05 verification failed: HTTP error', {
        service: 'nip05',
        method: 'verifyNIP05',
        status: response.status,
        url,
      });
      return null;
    }

    const data = await response.json();

    // Check if name exists in response
    if (!data.names || !(name in data.names)) {
      logger.debug('NIP-05 verification failed: name not found', {
        service: 'nip05',
        method: 'verifyNIP05',
        name,
        availableNames: Object.keys(data.names || {}),
      });
      return null;
    }

    const pubkey = data.names[name];

    // Verify pubkey if provided
    if (expectedPubkey && pubkey !== expectedPubkey) {
      logger.warn('NIP-05 pubkey mismatch', {
        service: 'nip05',
        method: 'verifyNIP05',
        expected: expectedPubkey,
        actual: pubkey,
      });
      return null;
    }

    logger.info('✅ NIP-05 verified successfully', {
      service: 'nip05',
      method: 'verifyNIP05',
      name,
      domain,
      pubkey: pubkey.substring(0, 8) + '...',
    });

    return {
      pubkey,
      name,
      domain,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      logger.debug('NIP-05 verification timeout', {
        service: 'nip05',
        method: 'verifyNIP05',
        nip05,
      });
    } else {
      logger.debug('NIP-05 verification error', {
        service: 'nip05',
        method: 'verifyNIP05',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
    return null;
  }
}

/**
 * Get display name from NIP-05 identifier
 * If verified, returns the name part (before @)
 * 
 * @param nip05 - NIP-05 identifier
 * @param pubkey - Pubkey to verify against
 * @returns Display name or null
 */
export async function getDisplayNameFromNIP05(
  nip05: string | undefined,
  pubkey: string
): Promise<string | null> {
  if (!nip05) return null;

  try {
    const result = await verifyNIP05(nip05, pubkey);
    if (!result) return null;

    // If name is "_", use domain as display name
    if (result.name === '_') {
      return result.domain;
    }

    // Otherwise use name@domain format for clarity
    return `${result.name}@${result.domain}`;
  } catch {
    return null;
  }
}
