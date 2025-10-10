/**
 * Authentication Business Service
 * 
 * SOA-compliant orchestration service for authentication and key management.
 * Handles sign-up workflow coordination without implementing low-level logic.
 * 
 * @module services/business/AuthBusinessService
 */

import { generateKeys } from '@/utils/keyManagement';
import { createBackupFile } from '@/utils/keyExport';
import { GenericBlossomService } from '@/services/generic/GenericBlossomService';
import { ProfileBusinessService, UserProfile } from '@/services/business/ProfileBusinessService';
import { GenericEventService } from '@/services/generic/GenericEventService';
import { GenericRelayService } from '@/services/generic/GenericRelayService';
import { useAuthStore } from '@/stores/useAuthStore';
import { NostrSigner } from '@/types/nostr';
import { logger } from '@/services/core/LoggingService';
import { nip19 } from 'nostr-tools';

/**
 * Result of key generation
 */
export interface KeyGenerationResult {
  nsec: string;
  npub: string;
  pubkey: string;
}

/**
 * Authentication Business Service
 * Orchestrates sign-up workflow with delegation to utilities and services
 */
export class AuthBusinessService {
  private static instance: AuthBusinessService;
  
  private blossomService: GenericBlossomService;
  private profileService: ProfileBusinessService;
  private eventService: GenericEventService;
  private relayService: GenericRelayService;

  private constructor() {
    this.blossomService = GenericBlossomService.getInstance();
    this.profileService = ProfileBusinessService.getInstance();
    this.eventService = GenericEventService.getInstance();
    this.relayService = GenericRelayService.getInstance();
  }

  public static getInstance(): AuthBusinessService {
    if (!AuthBusinessService.instance) {
      AuthBusinessService.instance = new AuthBusinessService();
    }
    return AuthBusinessService.instance;
  }

  /**
   * Generate Nostr keys and store nsec in Zustand
   * 
   * Delegates to keyManagement utility for key generation.
   * Stores nsec in auth store (in-memory only, never persisted).
   * 
   * @returns Generated keys (nsec, npub, pubkey)
   * @throws Error if key generation fails
   */
  public generateNostrKeys(): KeyGenerationResult {
    try {
      logger.info('Generating Nostr keys', {
        service: 'AuthBusinessService',
        method: 'generateNostrKeys',
      });

      // Delegate to utility (pure function, no side effects)
      const keys = generateKeys();

      // Store nsec in Zustand (in-memory only)
      useAuthStore.getState().setNsec(keys.nsec);

      logger.info('Keys generated successfully', {
        npub: keys.npub,
      });

      return {
        nsec: keys.nsec,
        npub: keys.npub,
        pubkey: keys.pubkey,
      };
    } catch (error) {
      logger.error('Key generation failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'AuthBusinessService',
        method: 'generateNostrKeys',
      });
      throw error;
    }
  }

  /**
   * Upload avatar image to Blossom server
   * 
   * Delegates to GenericBlossomService for file upload.
   * Uses temporary signer created from nsec in Zustand.
   * 
   * @param file - Image file to upload
   * @returns Blossom URL (https://cdn.satellite.earth/<hash>)
   * @throws Error if upload fails or no nsec in store
   */
  public async uploadAvatar(file: File): Promise<string> {
    try {
      logger.info('Uploading avatar to Blossom', {
        service: 'AuthBusinessService',
        method: 'uploadAvatar',
        fileName: file.name,
        fileSize: file.size,
      });

      // Create temporary signer from nsec in Zustand
      const signer = this.createTemporarySigner();

      // Delegate to GenericBlossomService
      const result = await this.blossomService.uploadFile(file, signer);

      if (!result.success || !result.metadata?.url) {
        throw new Error(result.error || 'Avatar upload failed');
      }

      logger.info('Avatar uploaded successfully', {
        url: result.metadata.url,
      });

      return result.metadata.url;
    } catch (error) {
      logger.error('Avatar upload failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'AuthBusinessService',
        method: 'uploadAvatar',
      });
      throw error;
    }
  }

  /**
   * Publish user profile (Kind 0 event)
   * 
   * Delegates to ProfileBusinessService for profile publishing.
   * Uses temporary signer created from nsec in Zustand.
   * 
   * @param profile - User profile data
   * @returns true if published successfully
   * @throws Error if publishing fails or no nsec in store
   */
  public async publishProfile(profile: UserProfile): Promise<boolean> {
    try {
      logger.info('Publishing profile (Kind 0)', {
        service: 'AuthBusinessService',
        method: 'publishProfile',
        displayName: profile.display_name,
      });

      // Create temporary signer from nsec in Zustand
      const signer = this.createTemporarySigner();

      // Delegate to ProfileBusinessService (SHARED method, same as sign-in)
      await this.profileService.publishProfile(profile, signer);

      logger.info('Profile published successfully');

      return true;
    } catch (error) {
      logger.error('Profile publishing failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'AuthBusinessService',
        method: 'publishProfile',
      });
      throw error;
    }
  }

  /**
   * Publish welcome note (Kind 1 event) - Silent verification
   * 
   * Creates and publishes a welcome text note to verify the temporary signer
   * works for both Kind 0 (profile) and Kind 1 (text note) events.
   * This is a silent operation - no UI notification shown to user.
   * 
   * @returns true if published successfully
   * @throws Error if publishing fails or no nsec in store
   */
  public async publishWelcomeNote(): Promise<boolean> {
    try {
      logger.info('Publishing welcome note (Kind 1) - Silent verification', {
        service: 'AuthBusinessService',
        method: 'publishWelcomeNote',
      });

      // Create temporary signer from nsec in Zustand
      const signer = this.createTemporarySigner();
      const pubkey = await signer.getPublicKey();

      // Welcome message content
      const content = `🌍✨ Kicking off something truly beautiful — preserving our Culture and Heritage on Nostr for generations to come! 👶🌱 🚀📚 With Culture Bridge, I'm setting out to protect and share our community's timeless stories 📜🏛️ 🌈📖 Can't wait to celebrate the wisdom, traditions, and heritage that unite us all 🤝💫

#community #storytelling #traditions #culture #heritage #humanity #inclusivity #art #music #history #Culture-Bridge #CultureBridge #nostr`;

      // Create Kind 1 event (text note)
      const event = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['t', 'community'],
          ['t', 'storytelling'],
          ['t', 'traditions'],
          ['t', 'culture'],
          ['t', 'heritage'],
          ['t', 'humanity'],
          ['t', 'inclusivity'],
          ['t', 'art'],
          ['t', 'music'],
          ['t', 'history'],
          ['t', 'Culture-Bridge'],
          ['t', 'CultureBridge'],
          ['t', 'nostr'],
        ],
        content,
        pubkey,
      };

      // Sign event
      const signResult = await this.eventService.signEvent(event, signer);
      
      if (!signResult.success || !signResult.signedEvent) {
        throw new Error(signResult.error || 'Failed to sign welcome note');
      }

      // Publish to relays (3 arguments: event, signer, optional onProgress)
      await this.relayService.publishEvent(signResult.signedEvent, signer);

      logger.info('Welcome note published successfully (silent)', {
        eventId: signResult.signedEvent.id,
      });

      return true;
    } catch (error) {
      logger.error('Welcome note publishing failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'AuthBusinessService',
        method: 'publishWelcomeNote',
      });
      // Don't throw - this is a nice-to-have verification, not critical
      return false;
    }
  }

  /**
   * Create and download backup file
   * 
   * Delegates to keyExport utility for backup file generation.
   * Uses nsec from Zustand and provided user data.
   * 
   * @param displayName - User's display name (for filename)
   * @param npub - User's public key
   * @throws Error if no nsec in store
   */
  public createBackupFile(displayName: string, npub: string): void {
    try {
      logger.info('Creating backup file', {
        service: 'AuthBusinessService',
        method: 'createBackupFile',
        displayName,
      });

      // Get nsec from Zustand
      const nsec = useAuthStore.getState().nsec;
      if (!nsec) {
        throw new Error('No secret key found. Please generate keys first.');
      }

      // Delegate to utility
      createBackupFile(displayName, npub, nsec);

      logger.info('Backup file created successfully');
    } catch (error) {
      logger.error('Backup file creation failed', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'AuthBusinessService',
        method: 'createBackupFile',
      });
      throw error;
    }
  }

  /**
   * Create temporary NostrSigner from nsec in Zustand
   * 
   * Creates a signer implementation for signing events during sign-up.
   * Uses the nsec stored in Zustand (in-memory only).
   * 
   * @returns NostrSigner implementation
   * @throws Error if no nsec in store
   * @private
   */
  private createTemporarySigner(): NostrSigner {
    const nsec = useAuthStore.getState().nsec;
    if (!nsec) {
      throw new Error('No secret key found. Please generate keys first.');
    }

    // Decode nsec to get secret key bytes
    const decoded = nip19.decode(nsec);
    if (decoded.type !== 'nsec') {
      throw new Error('Invalid secret key format');
    }

    const secretKey = decoded.data;

    // Create NostrSigner implementation
    const signer: NostrSigner = {
      getPublicKey: async () => {
        // Derive public key from secret key
        const { getPublicKey } = await import('nostr-tools/pure');
        return getPublicKey(secretKey);
      },
      
      signEvent: async (event) => {
        // Sign event with secret key
        const { finalizeEvent } = await import('nostr-tools/pure');
        return finalizeEvent(event, secretKey);
      },
      
      getRelays: async () => {
        // Return empty relays object (not using extension relays)
        return {};
      },
    };

    return signer;
  }

  /**
   * Clear nsec from Zustand
   * 
   * Called after sign-up completion to remove nsec from memory.
   * User must use backup file or browser extension after this.
   */
  public clearNsec(): void {
    logger.info('Clearing nsec from memory', {
      service: 'AuthBusinessService',
      method: 'clearNsec',
    });
    useAuthStore.getState().setNsec(null);
  }
}

// Export singleton instance
export const authBusinessService = AuthBusinessService.getInstance();
