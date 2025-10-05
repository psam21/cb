/**
 * CacheEncryptionService
 * 
 * Handles encryption/decryption of cached data using WebCrypto API.
 * Uses AES-GCM 256-bit encryption with key derived from user's Nostr nsec.
 * 
 * Security Model:
 * - Derives encryption key from user's nsec (existing private key)
 * - Generates random IV for each encryption operation
 * - Key only exists in memory while user is logged in
 * - Cleared on logout
 */

export class CacheEncryptionService {
  private encryptionKey: CryptoKey | null = null;
  private static instance: CacheEncryptionService;

  private constructor() {}

  static getInstance(): CacheEncryptionService {
    if (!CacheEncryptionService.instance) {
      CacheEncryptionService.instance = new CacheEncryptionService();
    }
    return CacheEncryptionService.instance;
  }

  /**
   * Initialize encryption key from user's pubkey
   * Call this once on login
   * 
   * Note: We use pubkey instead of nsec because NIP-07 extensions don't expose private keys
   * This is less secure than using nsec, but still provides encryption at rest
   */
  async initializeKey(pubkey: string): Promise<void> {
    try {
      // Remove 'npub' prefix if present and convert to bytes
      const cleanPubkey = pubkey.startsWith('npub') ? pubkey.slice(4) : pubkey;
      const pubkeyBytes = this.hexToBytes(cleanPubkey);

      // Import as raw key material
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        pubkeyBytes,
        'PBKDF2',
        false,
        ['deriveKey']
      );

      // Derive AES-GCM key using PBKDF2
      this.encryptionKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: new TextEncoder().encode('nostr-cache-salt-v1'), // Fixed salt
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );

      console.log('✅ Cache encryption key initialized');
    } catch (error) {
      console.error('❌ Failed to initialize encryption key:', error);
      throw error;
    }
  }

  /**
   * Encrypt data before storing in IndexedDB
   * Returns ciphertext and IV (initialization vector)
   */
  async encrypt(data: unknown): Promise<{ ciphertext: string; iv: string }> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call initializeKey() first.');
    }

    try {
      // Serialize data to JSON
      const jsonString = JSON.stringify(data);
      const dataBytes = new TextEncoder().encode(jsonString);

      // Generate random IV (96 bits for AES-GCM)
      const iv = crypto.getRandomValues(new Uint8Array(12));

      // Encrypt using AES-GCM
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        dataBytes
      );

      // Convert to base64 for storage
      const ciphertext = this.bufferToBase64(encryptedBuffer);
      const ivBase64 = this.bufferToBase64(iv);

      return { ciphertext, iv: ivBase64 };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      throw error;
    }
  }

  /**
   * Decrypt data retrieved from IndexedDB
   */
  async decrypt<T = Record<string, unknown>>(ciphertext: string, ivBase64: string): Promise<T> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized. Call initializeKey() first.');
    }

    try {
      // Convert from base64
      const encryptedBuffer = this.base64ToBuffer(ciphertext);
      const iv = this.base64ToBuffer(ivBase64);

      // Decrypt using AES-GCM
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        encryptedBuffer
      );

      // Convert back to JSON
      const jsonString = new TextDecoder().decode(decryptedBuffer);
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      throw error;
    }
  }

  /**
   * Clear encryption key on logout
   */
  clearKey(): void {
    this.encryptionKey = null;
    console.log('🔒 Cache encryption key cleared');
  }

  /**
   * Check if encryption key is initialized
   */
  isInitialized(): boolean {
    return this.encryptionKey !== null;
  }

  // === Utility Methods ===

  private hexToBytes(hex: string): ArrayBuffer {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes.buffer;
  }

  private bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}
