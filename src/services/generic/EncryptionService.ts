/**
 * EncryptionService.ts
 * Generic Layer - NIP-44 Encryption/Decryption
 * 
 * Handles NIP-44 encrypted payloads (version 2) for private messaging.
 * Uses @noble/ciphers for ChaCha20 encryption with HMAC-SHA256 authentication.
 * 
 * Protocol: secp256k1 ECDH + HKDF + ChaCha20 + HMAC-SHA256
 * Security Audit: Cure53 (December 2023)
 * 
 * @see https://github.com/nostr-protocol/nips/blob/master/44.md
 */

import { nip44 } from 'nostr-tools';
import { hexToBytes } from '@noble/hashes/utils';
import type { NostrSigner } from '@/types/nostr';

export class EncryptionService {
  /**
   * Encrypt a message using NIP-44
   * 
   * @param senderPrivateKey - Sender's private key (hex string)
   * @param recipientPublicKey - Recipient's public key (hex string)
   * @param plaintext - Message to encrypt
   * @returns Base64-encoded ciphertext
   * @throws Error if encryption fails
   */
  static encrypt(
    senderPrivateKey: string,
    recipientPublicKey: string,
    plaintext: string
  ): string {
    try {
      // nip44.v2.utils.getConversationKey expects Uint8Array for private key, string for public key
      const conversationKey = nip44.v2.utils.getConversationKey(
        hexToBytes(senderPrivateKey),
        recipientPublicKey
      );
      const ciphertext = nip44.v2.encrypt(plaintext, conversationKey);
      return ciphertext;
    } catch (error) {
      throw new Error(
        `NIP-44 encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt a message using NIP-44
   * 
   * @param recipientPrivateKey - Recipient's private key (hex string)
   * @param senderPublicKey - Sender's public key (hex string)
   * @param ciphertext - Base64-encoded ciphertext
   * @returns Decrypted plaintext
   * @throws Error if decryption fails or authentication fails
   */
  static decrypt(
    recipientPrivateKey: string,
    senderPublicKey: string,
    ciphertext: string
  ): string {
    try {
      // nip44.v2.utils.getConversationKey expects Uint8Array for private key, string for public key
      const conversationKey = nip44.v2.utils.getConversationKey(
        hexToBytes(recipientPrivateKey),
        senderPublicKey
      );
      const plaintext = nip44.v2.decrypt(ciphertext, conversationKey);
      return plaintext;
    } catch (error) {
      throw new Error(
        `NIP-44 decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Encrypt a message using NIP-07 signer (browser extension)
   * 
   * @param signer - NIP-07 signer instance
   * @param recipientPublicKey - Recipient's public key (hex string)
   * @param plaintext - Message to encrypt
   * @returns Base64-encoded ciphertext
   * @throws Error if signer doesn't support NIP-44 or encryption fails
   */
  static async encryptWithSigner(
    signer: NostrSigner,
    recipientPublicKey: string,
    plaintext: string
  ): Promise<string> {
    if (!signer.nip44) {
      throw new Error('Signer does not support NIP-44 encryption');
    }

    try {
      const ciphertext = await signer.nip44.encrypt(recipientPublicKey, plaintext);
      return ciphertext;
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('denied') || error.message.includes('rejected'))) {
        throw new Error('Encryption denied by user');
      }
      throw new Error(
        `NIP-44 encryption with signer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Decrypt a message using NIP-07 signer (browser extension)
   * 
   * @param signer - NIP-07 signer instance
   * @param senderPublicKey - Sender's public key (hex string)
   * @param ciphertext - Base64-encoded ciphertext
   * @returns Decrypted plaintext
   * @throws Error if signer doesn't support NIP-44 or decryption fails
   */
  static async decryptWithSigner(
    signer: NostrSigner,
    senderPublicKey: string,
    ciphertext: string
  ): Promise<string> {
    if (!signer.nip44) {
      throw new Error('Signer does not support NIP-44 decryption');
    }

    try {
      const plaintext = await signer.nip44.decrypt(senderPublicKey, ciphertext);
      return plaintext;
    } catch (error) {
      if (error instanceof Error && 
          (error.message.includes('denied') || error.message.includes('rejected'))) {
        throw new Error('Decryption denied by user');
      }
      throw new Error(
        `NIP-44 decryption with signer failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
