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
import { createNsecSigner } from '@/utils/signerFactory';
import { GenericBlossomService } from '@/services/generic/GenericBlossomService';
import { ProfileBusinessService, UserProfile } from '@/services/business/ProfileBusinessService';
import { GenericEventService } from '@/services/generic/GenericEventService';
import { GenericRelayService } from '@/services/generic/GenericRelayService';
import { NostrSigner } from '@/types/nostr';
import { logger } from '@/services/core/LoggingService';
import { nip19, getPublicKey } from 'nostr-tools';

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
   * Generate Nostr keys
   * 
   * Delegates to keyManagement utility for key generation.
   * Caller (hook) is responsible for storing nsec in Zustand.
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
   * 
   * @param file - Image file to upload
   * @param nsec - User's private key (nsec1...)
   * @returns Blossom URL (https://cdn.satellite.earth/<hash>)
   * @throws Error if upload fails
   */
  public async uploadAvatar(file: File, nsec: string): Promise<string> {
    try {
      logger.info('Uploading avatar to Blossom', {
        service: 'AuthBusinessService',
        method: 'uploadAvatar',
        fileName: file.name,
        fileSize: file.size,
      });

      // Create signer from nsec
      const signer = await this.createSignerFromNsec(nsec);

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
   * 
   * @param profile - User profile data
   * @param nsec - User's private key (nsec1...)
   * @returns true if published successfully
   * @throws Error if publishing fails
   */
  public async publishProfile(profile: UserProfile, nsec: string): Promise<boolean> {
    try {
      logger.info('Publishing profile (Kind 0)', {
        service: 'AuthBusinessService',
        method: 'publishProfile',
        displayName: profile.display_name,
      });

      // Create signer from nsec
      const signer = await this.createSignerFromNsec(nsec);

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
   * Creates and publishes a welcome text note to verify the signer
   * works for both Kind 0 (profile) and Kind 1 (text note) events.
   * This is a silent operation - no UI notification shown to user.
   * 
   * @param nsec - User's private key (nsec1...)
   * @returns true if published successfully
   * @throws Error if publishing fails
   */
  public async publishWelcomeNote(nsec: string): Promise<boolean> {
    try {
      logger.info('Publishing welcome note (Kind 1) - Silent verification', {
        service: 'AuthBusinessService',
        method: 'publishWelcomeNote',
      });

      // Create signer from nsec
      const signer = await this.createSignerFromNsec(nsec);
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
   * 
   * @param displayName - User's display name (for filename)
   * @param npub - User's public key
   * @param nsec - User's private key
   */
  public createBackupFile(displayName: string, npub: string, nsec: string): void {
    try {
      logger.info('Creating backup file', {
        service: 'AuthBusinessService',
        method: 'createBackupFile',
        displayName,
      });

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
   * Create NostrSigner from nsec
   * 
   * Creates a signer implementation with NIP-44 support.
   * 
   * @param nsec - User's private key (nsec1...)
   * @returns NostrSigner implementation
   * @throws Error if nsec format is invalid
   * @private
   */
  private async createSignerFromNsec(nsec: string): Promise<NostrSigner> {
    return await createNsecSigner(nsec);
  }

  /**
   * Sign in with nsec (private key)
   * 
   * For mobile users or those without browser extension.
   * Validates nsec and fetches profile. Caller (hook) stores nsec in Zustand.
   * 
   * @param nsec - User's private key (nsec1...)
   * @returns Sign-in result with user data
   * @throws Error if nsec is invalid or profile fetch fails
   */
  public async signInWithNsec(nsec: string): Promise<{
    success: boolean;
    user?: {
      pubkey: string;
      npub: string;
      profile: UserProfile;
    };
    error?: string;
  }> {
    try {
      logger.info('Sign-in with nsec initiated', {
        service: 'AuthBusinessService',
        method: 'signInWithNsec',
      });

      // Validate nsec format
      if (!nsec || !nsec.startsWith('nsec1')) {
        throw new Error('Invalid nsec format. Must start with nsec1...');
      }

      // Decode nsec to validate and get pubkey
      let pubkey: string;
      try {
        const decoded = nip19.decode(nsec);
        if (decoded.type !== 'nsec') {
          throw new Error('Invalid nsec format');
        }
        
        // Derive pubkey from secret key
        pubkey = getPublicKey(decoded.data);
      } catch (error) {
        throw new Error('Invalid nsec. Please check your private key.');
      }

      logger.info('Nsec validated', {
        pubkey: pubkey.substring(0, 8) + '...',
      });

      // Create signer for profile fetch
      const signer = await this.createSignerFromNsec(nsec);

      // Fetch user profile using ProfileBusinessService
      const profileResult = await this.profileService.signInWithExtension(signer);

      if (!profileResult.success || !profileResult.user) {
        throw new Error(profileResult.error || 'Failed to fetch profile');
      }

      logger.info('Sign-in with nsec successful', {
        pubkey: pubkey.substring(0, 8) + '...',
        display_name: profileResult.user.profile.display_name,
      });

      return {
        success: true,
        user: profileResult.user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in with nsec failed';
      logger.error('Sign-in with nsec failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'AuthBusinessService',
        method: 'signInWithNsec',
      });
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

// Export singleton instance
export const authBusinessService = AuthBusinessService.getInstance();
