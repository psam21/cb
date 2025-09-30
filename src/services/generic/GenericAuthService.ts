/**
 * Generic authentication service for Nostr signer management
 * Handles all authentication operations following CultureBridge patterns
 */
import { logger } from '../core/LoggingService';
import { AppError } from '../../errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '../../errors/ErrorTypes';
import { NostrSigner, NostrEvent } from '../../types/nostr';
import { nip19 } from 'nostr-tools';

export interface AuthenticationContext {
  method: 'nsec' | 'signer';
  nsec?: string;
  signer?: NostrSigner;
  signedEvent?: NostrEvent;
}

export interface AuthenticationResult {
  success: boolean;
  npub?: string;
  pubkey?: string;
  error?: string;
}

export interface SignerDetectionResult {
  isAvailable: boolean;
  signer?: NostrSigner;
  error?: string;
}

/**
 * Generic authentication service for centralized auth operations
 */
export class GenericAuthService {
  private static instance: GenericAuthService;

  private constructor() {}

  /**
   * Get singleton instance of GenericAuthService
   */
  public static getInstance(): GenericAuthService {
    if (!GenericAuthService.instance) {
      GenericAuthService.instance = new GenericAuthService();
    }
    return GenericAuthService.instance;
  }

  /**
   * Detect if a Nostr signer is available in the browser
   */
  public async detectSigner(): Promise<SignerDetectionResult> {
    try {
      logger.info('Detecting Nostr signer', {
        service: 'GenericAuthService',
        method: 'detectSigner',
      });

      if (typeof window === 'undefined') {
        return {
          isAvailable: false,
          error: 'Not in browser environment',
        };
      }

      if (!window.nostr) {
        return {
          isAvailable: false,
          error: 'No Nostr signer detected',
        };
      }

      // Check if signer has required methods
      if (typeof window.nostr.getPublicKey !== 'function' || 
          typeof window.nostr.signEvent !== 'function') {
        return {
          isAvailable: false,
          error: 'Signer missing required methods',
        };
      }

      // Test the signer by getting public key
      try {
        const pubkey = await window.nostr.getPublicKey();
        if (!pubkey) {
          return {
            isAvailable: false,
            error: 'Signer returned empty public key',
          };
        }

        logger.info('Nostr signer detected successfully', {
          service: 'GenericAuthService',
          method: 'detectSigner',
          pubkey: pubkey.substring(0, 8) + '...',
        });

        return {
          isAvailable: true,
          signer: window.nostr,
        };
      } catch (signerError) {
        const errorMessage = signerError instanceof Error ? signerError.message : 'Signer test failed';
        logger.warn('Signer test failed', {
          service: 'GenericAuthService',
          method: 'detectSigner',
          error: errorMessage,
        });

        return {
          isAvailable: false,
          error: `Signer test failed: ${errorMessage}`,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error detecting Nostr signer', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'detectSigner',
        error: errorMessage,
      });

      return {
        isAvailable: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get the current signer instance
   */
  public async getSigner(): Promise<NostrSigner> {
    const detection = await this.detectSigner();
    
    if (!detection.isAvailable || !detection.signer) {
      throw new AppError(
        'No Nostr signer available',
        ErrorCode.SIGNER_NOT_DETECTED,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { detectionError: detection.error }
      );
    }

    return detection.signer;
  }

  /**
   * Authenticate using a Nostr signer
   */
  public async authenticateWithSigner(signer: NostrSigner): Promise<AuthenticationResult> {
    try {
      logger.info('Authenticating with Nostr signer', {
        service: 'GenericAuthService',
        method: 'authenticateWithSigner',
      });

      // Get public key from signer
      const pubkey = await signer.getPublicKey();
      if (!pubkey) {
        return {
          success: false,
          error: 'Signer returned empty public key',
        };
      }

      // Convert to npub format
      const npub = nip19.npubEncode(pubkey);

      logger.info('Authentication successful', {
        service: 'GenericAuthService',
        method: 'authenticateWithSigner',
        npub: npub.substring(0, 8) + '...',
        pubkey: pubkey.substring(0, 8) + '...',
      });

      return {
        success: true,
        npub,
        pubkey,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      
      // Determine specific error type
      let errorCode = ErrorCode.SIGNER_ERROR;
      let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
      
      if (errorMessage.includes('locked') || errorMessage.includes('Locked')) {
        errorCode = ErrorCode.SIGNER_LOCKED;
        httpStatus = HttpStatus.UNAUTHORIZED;
      } else if (errorMessage.includes('not found') || errorMessage.includes('not available')) {
        errorCode = ErrorCode.SIGNER_NOT_DETECTED;
        httpStatus = HttpStatus.BAD_REQUEST;
      }

      logger.error('Signer authentication error', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'authenticateWithSigner',
        error: errorMessage,
        errorCode,
        httpStatus,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Create an authentication context from a signer
   */
  public async createAuthContext(signer: NostrSigner): Promise<AuthenticationContext> {
    try {
      logger.info('Creating authentication context', {
        service: 'GenericAuthService',
        method: 'createAuthContext',
      });

      // Test the signer
      const pubkey = await signer.getPublicKey();
      if (!pubkey) {
      throw new AppError(
        'Signer returned empty public key',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH
      );
      }

      return {
        method: 'signer',
        signer,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create auth context';
      logger.error('Error creating authentication context', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'createAuthContext',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to create authentication context',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Verify that a signer is still available and working
   */
  public async verifySigner(signer: NostrSigner): Promise<boolean> {
    try {
      logger.debug('Verifying signer availability', {
        service: 'GenericAuthService',
        method: 'verifySigner',
      });

      // Test by getting public key
      const pubkey = await signer.getPublicKey();
      return !!pubkey;
    } catch (error) {
      logger.warn('Signer verification failed', {
        service: 'GenericAuthService',
        method: 'verifySigner',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Get public key from signer
   */
  public async getPublicKey(signer: NostrSigner): Promise<string> {
    try {
      const pubkey = await signer.getPublicKey();
      if (!pubkey) {
      throw new AppError(
        'Signer returned empty public key',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH
      );
      }
      return pubkey;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get public key';
      logger.error('Error getting public key', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'getPublicKey',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to get public key from signer',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Get npub from signer
   */
  public async getNpub(signer: NostrSigner): Promise<string> {
    try {
      const pubkey = await this.getPublicKey(signer);
      return nip19.npubEncode(pubkey);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get npub';
      logger.error('Error getting npub', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'getNpub',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to get npub from signer',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.UNAUTHORIZED,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Sign an event using a signer
   */
  public async signEvent(
    event: Omit<NostrEvent, 'id' | 'sig'>,
    signer: NostrSigner
  ): Promise<NostrEvent> {
    try {
      logger.info('Signing event with signer', {
        service: 'GenericAuthService',
        method: 'signEvent',
        eventKind: event.kind,
        pubkey: event.pubkey.substring(0, 8) + '...',
      });

      const signedEvent = await signer.signEvent(event);

      logger.info('Event signed successfully', {
        service: 'GenericAuthService',
        method: 'signEvent',
        eventId: signedEvent.id,
        eventKind: event.kind,
      });

      return signedEvent;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Event signing failed';
      logger.error('Error signing event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'signEvent',
        eventKind: event.kind,
        error: errorMessage,
      });

      throw new AppError(
        'Failed to sign event',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Get relays from signer (if available)
   */
  public async getRelays(signer: NostrSigner): Promise<Record<string, { read: boolean; write: boolean }> | null> {
    try {
      if (typeof signer.getRelays === 'function') {
        return await signer.getRelays();
      }
      return null;
    } catch (error) {
      logger.warn('Failed to get relays from signer', {
        service: 'GenericAuthService',
        method: 'getRelays',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Check if signer supports NIP-04 encryption
   */
  public supportsEncryption(signer: NostrSigner): boolean {
    return !!(signer.nip04 && 
              typeof signer.nip04.encrypt === 'function' && 
              typeof signer.nip04.decrypt === 'function');
  }

  /**
   * Encrypt message using signer's NIP-04 implementation
   */
  public async encryptMessage(
    signer: NostrSigner,
    peer: string,
    plaintext: string
  ): Promise<string> {
    if (!this.supportsEncryption(signer)) {
      throw new AppError(
        'Signer does not support encryption',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM
      );
    }

    try {
      return await signer.nip04!.encrypt(peer, plaintext);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Encryption failed';
      logger.error('Error encrypting message', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'encryptMessage',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to encrypt message',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }

  /**
   * Decrypt message using signer's NIP-04 implementation
   */
  public async decryptMessage(
    signer: NostrSigner,
    peer: string,
    ciphertext: string
  ): Promise<string> {
    if (!this.supportsEncryption(signer)) {
      throw new AppError(
        'Signer does not support encryption',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.MEDIUM
      );
    }

    try {
      return await signer.nip04!.decrypt(peer, ciphertext);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Decryption failed';
      logger.error('Error decrypting message', error instanceof Error ? error : new Error(errorMessage), {
        service: 'GenericAuthService',
        method: 'decryptMessage',
        error: errorMessage,
      });

      throw new AppError(
        'Failed to decrypt message',
        ErrorCode.SIGNER_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.AUTHENTICATION,
        ErrorSeverity.HIGH,
        { originalError: errorMessage }
      );
    }
  }
}

// Export singleton instance
export const genericAuthService = GenericAuthService.getInstance();

// Export convenience functions
export const detectSigner = () => genericAuthService.detectSigner();
export const getSigner = () => genericAuthService.getSigner();
export const authenticateWithSigner = (signer: NostrSigner) => genericAuthService.authenticateWithSigner(signer);
export const createAuthContext = (signer: NostrSigner) => genericAuthService.createAuthContext(signer);
export const verifySigner = (signer: NostrSigner) => genericAuthService.verifySigner(signer);
export const getPublicKey = (signer: NostrSigner) => genericAuthService.getPublicKey(signer);
export const getNpub = (signer: NostrSigner) => genericAuthService.getNpub(signer);
export const signEvent = (event: Omit<NostrEvent, 'id' | 'sig'>, signer: NostrSigner) => genericAuthService.signEvent(event, signer);
export const getRelays = (signer: NostrSigner) => genericAuthService.getRelays(signer);
export const supportsEncryption = (signer: NostrSigner) => genericAuthService.supportsEncryption(signer);
export const encryptMessage = (signer: NostrSigner, peer: string, plaintext: string) => genericAuthService.encryptMessage(signer, peer, plaintext);
export const decryptMessage = (signer: NostrSigner, peer: string, ciphertext: string) => genericAuthService.decryptMessage(signer, peer, ciphertext);
