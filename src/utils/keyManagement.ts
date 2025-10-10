/**
 * Key Management Utilities
 * 
 * Pure utility functions for Nostr key generation and encoding/decoding.
 * Wraps nostr-tools functionality with no business logic or storage.
 * 
 * @module utils/keyManagement
 */

import { generateSecretKey, getPublicKey } from 'nostr-tools/pure';
import { nip19 } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Generate a new Nostr key pair
 * 
 * Creates a cryptographically secure random key pair using nostr-tools.
 * Returns both hex and bech32-encoded (nsec/npub) formats.
 * 
 * @returns Object containing secret key, public key, and encoded formats
 * @throws Error if key generation fails
 * 
 * @example
 * const keys = generateKeys();
 * console.log(keys.nsec); // "nsec1..."
 * console.log(keys.npub); // "npub1..."
 */
export function generateKeys(): {
  secretKey: Uint8Array;
  pubkey: string;
  nsec: string;
  npub: string;
} {
  try {
    // Generate cryptographically secure random secret key
    const secretKey = generateSecretKey();
    
    // Derive public key from secret key
    const pubkey = getPublicKey(secretKey);
    
    // Encode keys in bech32 format (NIP-19)
    const nsec = nip19.nsecEncode(secretKey);
    const npub = nip19.npubEncode(pubkey);
    
    // Validate key lengths (nsec and npub should both be 63 characters)
    if (nsec.length !== 63 || npub.length !== 63) {
      throw new Error('Invalid key encoding length');
    }
    
    // Verify roundtrip encoding/decoding works
    const decodedSecret = nip19.decode(nsec);
    if (decodedSecret.type !== 'nsec') {
      throw new Error('Failed to verify nsec encoding');
    }
    
    const decodedPubkey = nip19.decode(npub);
    if (decodedPubkey.type !== 'npub') {
      throw new Error('Failed to verify npub encoding');
    }
    
    return {
      secretKey,
      pubkey,
      nsec,
      npub,
    };
  } catch (error) {
    console.error('Key generation failed:', error);
    throw new Error('Failed to generate Nostr keys. Please try again.');
  }
}

/**
 * Decode nsec to hex secret key
 * 
 * @param nsec - Bech32-encoded secret key (nsec1...)
 * @returns Hex-encoded secret key
 * @throws Error if decoding fails or invalid format
 * 
 * @example
 * const secretKeyHex = decodeNsec("nsec1...");
 */
export function decodeNsec(nsec: string): string {
  try {
    const decoded = nip19.decode(nsec);
    
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid nsec format');
    }
    
    // Convert Uint8Array to hex string
    return bytesToHex(decoded.data);
  } catch (error) {
    console.error('Failed to decode nsec:', error);
    throw new Error('Invalid nsec format. Please check your secret key.');
  }
}

/**
 * Decode npub to hex public key
 * 
 * @param npub - Bech32-encoded public key (npub1...)
 * @returns Hex-encoded public key
 * @throws Error if decoding fails or invalid format
 * 
 * @example
 * const pubkeyHex = decodeNpub("npub1...");
 */
export function decodeNpub(npub: string): string {
  try {
    const decoded = nip19.decode(npub);
    
    if (decoded.type !== 'npub') {
      throw new Error('Invalid npub format');
    }
    
    return decoded.data;
  } catch (error) {
    console.error('Failed to decode npub:', error);
    throw new Error('Invalid npub format. Please check your public key.');
  }
}

/**
 * Validate nsec format
 * 
 * Checks if a string is a valid bech32-encoded nsec key.
 * Does not verify cryptographic validity, only format.
 * 
 * @param nsec - String to validate
 * @returns true if valid nsec format
 * 
 * @example
 * if (isValidNsec(userInput)) {
 *   // Process nsec
 * }
 */
export function isValidNsec(nsec: string): boolean {
  try {
    const decoded = nip19.decode(nsec);
    return decoded.type === 'nsec' && nsec.length === 63;
  } catch {
    return false;
  }
}

/**
 * Validate npub format
 * 
 * Checks if a string is a valid bech32-encoded npub key.
 * Does not verify cryptographic validity, only format.
 * 
 * @param npub - String to validate
 * @returns true if valid npub format
 * 
 * @example
 * if (isValidNpub(userInput)) {
 *   // Process npub
 * }
 */
export function isValidNpub(npub: string): boolean {
  try {
    const decoded = nip19.decode(npub);
    return decoded.type === 'npub' && npub.length === 63;
  } catch {
    return false;
  }
}
