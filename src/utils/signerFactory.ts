import { nip19, nip44 } from 'nostr-tools';
import { getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import { NostrSigner } from '@/types/nostr';

/**
 * Creates a NostrSigner instance from an nsec (private key).
 * Includes NIP-44 encryption/decryption support.
 * 
 * @param nsec - The nsec string (e.g., "nsec1...")
 * @returns Promise resolving to a NostrSigner with signing and NIP-44 capabilities
 * @throws Error if nsec format is invalid
 */
export async function createNsecSigner(nsec: string): Promise<NostrSigner> {
  const decoded = nip19.decode(nsec);
  if (decoded.type !== 'nsec') {
    throw new Error('Invalid nsec format');
  }
  
  const secretKey = decoded.data;
  
  return {
    getPublicKey: async () => getPublicKey(secretKey),
    signEvent: async (event) => finalizeEvent(event, secretKey),
    getRelays: async () => ({}),
    nip44: {
      encrypt: async (peer: string, plaintext: string) => {
        const conversationKey = nip44.v2.utils.getConversationKey(secretKey, peer);
        return nip44.v2.encrypt(plaintext, conversationKey);
      },
      decrypt: async (peer: string, ciphertext: string) => {
        const conversationKey = nip44.v2.utils.getConversationKey(secretKey, peer);
        return nip44.v2.decrypt(ciphertext, conversationKey);
      },
    },
  };
}
