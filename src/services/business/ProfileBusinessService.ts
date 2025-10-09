import { bech32 } from '@scure/base';
import { logger } from '@/services/core/LoggingService';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';
import { NostrSigner } from '@/types/nostr';

export interface UserProfile {
  display_name: string;
  about: string;
  picture: string;
  website: string;
  banner: string;
  bot: boolean;
  birthday: string;
  nip05?: string;  // NIP-05 identifier (e.g., "alice@example.com")
  lud06?: string;  // LNURL for lightning tips (legacy)
  lud16?: string;  // Lightning address (modern, e.g., "user@domain.com")
}

export interface User {
  pubkey: string;
  npub: string;
  profile: UserProfile;
}

export interface ProfileStats {
  productsCreated: number;
  lastActive: number;
}

export class ProfileBusinessService {
  private static instance: ProfileBusinessService;

  private constructor() {}

  public static getInstance(): ProfileBusinessService {
    if (!ProfileBusinessService.instance) {
      ProfileBusinessService.instance = new ProfileBusinessService();
    }
    return ProfileBusinessService.instance;
  }

  /**
   * Sign in existing user with NIP-07 extension
   * Orchestrates authentication flow using existing methods
   * @param signer NostrSigner from NIP-07 extension
   * @returns User object with pubkey, npub, and profile
   */
  public async signInWithExtension(signer: NostrSigner): Promise<{
    success: boolean;
    user?: User;
    error?: string;
  }> {
    try {
      logger.info('Starting sign-in with extension', {
        service: 'ProfileBusinessService',
        method: 'signInWithExtension',
      });

      // 1. Get pubkey from signer
      const pubkey = await signer.getPublicKey();
      logger.info('Public key received from signer', {
        pubkey: pubkey.substring(0, 8) + '...',
      });

      // 2. Convert to npub
      const npub = this.pubkeyToNpub(pubkey);

      // 3. Fetch profile from relays (with defaults if not found)
      let profile: UserProfile;
      try {
        const fetchedProfile = await this.getUserProfile(pubkey);
        if (fetchedProfile) {
          profile = this.formatProfileForDisplay(fetchedProfile);
        } else {
          // Use defaults if no profile found
          profile = this.formatProfileForDisplay({
            display_name: '',
            about: '',
            picture: '',
            website: '',
            banner: '',
            bot: false,
            birthday: '',
          });
        }
      } catch (profileError) {
        logger.warn('Failed to fetch profile, using defaults', {
          error: profileError instanceof Error ? profileError.message : 'Unknown error',
        });
        // Use defaults on error
        profile = this.formatProfileForDisplay({
          display_name: '',
          about: '',
          picture: '',
          website: '',
          banner: '',
          bot: false,
          birthday: '',
        });
      }

      // 4. Return User object
      const user: User = {
        pubkey,
        npub,
        profile,
      };

      logger.info('Sign-in completed successfully', {
        pubkey: pubkey.substring(0, 8) + '...',
        npub: npub.substring(0, 12) + '...',
        display_name: profile.display_name,
      });

      return {
        success: true,
        user,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign-in failed';
      logger.error('Sign-in with extension failed', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ProfileBusinessService',
        method: 'signInWithExtension',
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Convert pubkey to npub (bech32 encoded)
   */
  public pubkeyToNpub(pubkey: string): string {
    try {
      if (!pubkey || pubkey.length !== 64) {
        throw new AppError(
          'Invalid pubkey format',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.VALIDATION,
          ErrorSeverity.HIGH
        );
      }

      const words = bech32.toWords(Buffer.from(pubkey, 'hex'));
      const npub = bech32.encode('npub', words, 1000);
      
      logger.debug('Converted pubkey to npub', { pubkey: pubkey.substring(0, 8) + '...', npub: npub.substring(0, 12) + '...' });
      return npub;
    } catch (error) {
      logger.error('Failed to convert pubkey to npub', error instanceof Error ? error : new Error('Unknown error'));
      throw new AppError(
        'Failed to convert pubkey to npub',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.HIGH
      );
    }
  }

  /**
   * Convert npub to pubkey (hex decoded)
   */
  public npubToPubkey(npub: string): string | null {
    try {
      if (!npub.startsWith('npub1')) {
        return null;
      }
      const decoded = bech32.decode(npub, 1000);
      const pubkey = Buffer.from(bech32.fromWords(decoded.words)).toString('hex');
      return pubkey.length === 64 ? pubkey : null; // Validate hex length
    } catch {
      return null;
    }
  }

  /**
   * Parse NIP-24 profile metadata from Nostr event
   */
  public parseProfileMetadata(event: { id: string; content: string | object }): UserProfile {
    try {
      const content = typeof event.content === 'string' ? JSON.parse(event.content) : event.content;
      
      const profile: UserProfile = {
        display_name: content.display_name || content.name || '',
        about: content.about || content.bio || '',
        picture: content.picture || content.avatar || '',
        website: content.website || content.url || '',
        banner: content.banner || '',
        bot: Boolean(content.bot),
        birthday: content.birthday || '',
        nip05: content.nip05 || undefined,
        lud06: content.lud06 || undefined,
        lud16: content.lud16 || undefined,
      };

      logger.debug('Parsed profile metadata', { 
        display_name: profile.display_name,
        hasAbout: !!profile.about,
        hasPicture: !!profile.picture,
        hasWebsite: !!profile.website,
        hasNip05: !!profile.nip05,
        hasLud16: !!profile.lud16,
      });

      return profile;
    } catch (error) {
      logger.error('Failed to parse profile metadata', error instanceof Error ? error : new Error('Unknown error'));
      throw new AppError(
        'Failed to parse profile metadata',
        ErrorCode.VALIDATION_ERROR,
        HttpStatus.BAD_REQUEST,
        ErrorCategory.VALIDATION,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Get profile statistics for a user
   */
  public async getProfileStats(pubkey: string): Promise<ProfileStats> {
    try {
      // Import shop service to get product count
      const { shopBusinessService } = await import('./ShopBusinessService');
      const products = await shopBusinessService.listProducts();
      
      const stats: ProfileStats = {
        productsCreated: products.length,
        lastActive: products.length > 0 ? Math.max(...products.map(p => p.publishedAt)) : 0,
      };

      logger.debug('Generated profile stats', { 
        pubkey: pubkey.substring(0, 8) + '...',
        productsCreated: stats.productsCreated,
        lastActive: stats.lastActive
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get profile stats', error instanceof Error ? error : new Error('Unknown error'));
      throw new AppError(
        'Failed to get profile stats',
        ErrorCode.INTERNAL_ERROR,
        HttpStatus.INTERNAL_SERVER_ERROR,
        ErrorCategory.INTERNAL,
        ErrorSeverity.MEDIUM
      );
    }
  }

  /**
   * Validate profile data
   */
  public validateProfile(profile: Partial<UserProfile>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (profile.display_name && profile.display_name.length > 100) {
      errors.push('Display name must be 100 characters or less');
    }

    if (profile.about && profile.about.length > 1000) {
      errors.push('About section must be 1000 characters or less');
    }

    if (profile.website && !this.isValidUrl(profile.website)) {
      errors.push('Website must be a valid URL');
    }

    if (profile.picture && !this.isValidUrl(profile.picture)) {
      errors.push('Picture must be a valid URL');
    }

    if (profile.banner && !this.isValidUrl(profile.banner)) {
      errors.push('Banner must be a valid URL');
    }

    if (profile.birthday && !this.isValidDate(profile.birthday)) {
      errors.push('Birthday must be a valid date (YYYY-MM-DD)');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Format profile for display
   */
  public formatProfileForDisplay(profile: UserProfile): UserProfile {
    return {
      display_name: profile.display_name || 'Anonymous',
      about: profile.about || 'No description provided',
      picture: profile.picture || '',
      website: profile.website || '',
      banner: profile.banner || '',
      bot: profile.bot || false,
      birthday: profile.birthday || '',
      nip05: profile.nip05 || undefined,
      lud06: profile.lud06 || undefined,
      lud16: profile.lud16 || undefined,
    };
  }

  /**
   * Fetch user profile from Nostr relays
   */
  public async getUserProfile(pubkey: string): Promise<UserProfile | null> {
    try {
      logger.info('Fetching user profile from relays', { pubkey: pubkey.substring(0, 8) + '...' });
      
      // Import relay service
      const { genericRelayService } = await import('@/services/generic/GenericRelayService');
      
      // Query for Kind 0 (profile) events from this pubkey
      const events = await genericRelayService.queryEvents([{
        kinds: [0], // Kind 0 = profile events
        authors: [pubkey],
        limit: 1
      }]);

      if (!events.success || events.events.length === 0) {
        logger.info('No profile events found for user', { pubkey: pubkey.substring(0, 8) + '...' });
        return null;
      }

      // Parse the most recent profile event
      const profileEvent = events.events[0];
      const profile = this.parseProfileMetadata(profileEvent);
      
      logger.info('Profile fetched successfully', { 
        display_name: profile.display_name,
        hasPicture: !!profile.picture,
        hasAbout: !!profile.about
      });

      return profile;
    } catch (error) {
      logger.error('Failed to fetch user profile', error instanceof Error ? error : new Error('Unknown error'), {
        service: 'ProfileBusinessService',
        method: 'getUserProfile',
        pubkey: pubkey.substring(0, 8) + '...'
      });
      return null;
    }
  }

  /**
   * Create a Kind 0 metadata event from user profile
   */
  public async createProfileEvent(
    profile: UserProfile,
    signer: NostrSigner
  ): Promise<{ success: boolean; event?: Omit<import('@/types/nostr').NostrEvent, 'id' | 'sig'>; error?: string }> {
    try {
      logger.info('Creating Kind 0 profile metadata event', {
        service: 'ProfileBusinessService',
        method: 'createProfileEvent',
        hasDisplayName: !!profile.display_name,
        hasPicture: !!profile.picture,
        hasNip05: !!profile.nip05,
      });

      const pubkey = await signer.getPublicKey();
      const now = Math.floor(Date.now() / 1000);

      // Validate profile before creating event
      const validation = this.validateProfile(profile);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Profile validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Create Kind 0 event content (JSON stringified profile metadata)
      const content = JSON.stringify({
        name: profile.display_name || '',
        display_name: profile.display_name || '',
        about: profile.about || '',
        picture: profile.picture || '',
        banner: profile.banner || '',
        website: profile.website || '',
        nip05: profile.nip05 || undefined,
        lud06: profile.lud06 || undefined, // Legacy LNURL
        lud16: profile.lud16 || undefined, // Lightning address
        bot: profile.bot || false,
        birthday: profile.birthday || '',
      });

      // Create Kind 0 event structure
      const event: Omit<import('@/types/nostr').NostrEvent, 'id' | 'sig'> = {
        kind: 0, // Kind 0 = user metadata
        pubkey,
        created_at: now,
        tags: [], // Kind 0 events don't typically have tags
        content,
      };

      logger.info('Kind 0 event created successfully', {
        service: 'ProfileBusinessService',
        method: 'createProfileEvent',
        pubkey: pubkey.substring(0, 8) + '...',
        contentLength: content.length,
      });

      return {
        success: true,
        event,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create profile event';
      logger.error('Failed to create profile event', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ProfileBusinessService',
        method: 'createProfileEvent',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Publish profile to Nostr relays
   */
  public async publishProfile(
    profile: UserProfile,
    signer: NostrSigner
  ): Promise<{
    success: boolean;
    eventId?: string;
    publishedRelays: string[];
    failedRelays: string[];
    error?: string;
  }> {
    try {
      logger.info('Publishing profile to relays', {
        service: 'ProfileBusinessService',
        method: 'publishProfile',
        hasDisplayName: !!profile.display_name,
      });

      // Create Kind 0 event
      const eventResult = await this.createProfileEvent(profile, signer);
      if (!eventResult.success || !eventResult.event) {
        return {
          success: false,
          publishedRelays: [],
          failedRelays: [],
          error: eventResult.error || 'Failed to create profile event',
        };
      }

      // Sign the event
      const { signEvent } = await import('@/services/generic/GenericEventService');
      const signingResult = await signEvent(eventResult.event, signer);

      if (!signingResult.success || !signingResult.signedEvent) {
        return {
          success: false,
          publishedRelays: [],
          failedRelays: [],
          error: signingResult.error || 'Failed to sign profile event',
        };
      }

      // Publish to relays
      const { publishEvent } = await import('@/services/generic/GenericRelayService');
      const publishResult = await publishEvent(signingResult.signedEvent, signer);

      if (!publishResult.success) {
        return {
          success: false,
          eventId: signingResult.signedEvent.id,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
          error: publishResult.error || 'Failed to publish to all relays',
        };
      }

      logger.info('Profile published successfully', {
        service: 'ProfileBusinessService',
        method: 'publishProfile',
        eventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays.length,
        failedRelays: publishResult.failedRelays.length,
      });

      return {
        success: true,
        eventId: signingResult.signedEvent.id,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish profile';
      logger.error('Failed to publish profile', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ProfileBusinessService',
        method: 'publishProfile',
        error: errorMessage,
      });

      return {
        success: false,
        publishedRelays: [],
        failedRelays: [],
        error: errorMessage,
      };
    }
  }

  /**
   * Update user profile - validates, creates event, signs, and publishes
   * Main entry point for profile updates
   */
  public async updateUserProfile(
    updates: Partial<UserProfile>,
    currentProfile: UserProfile,
    signer: NostrSigner
  ): Promise<{ success: boolean; error?: string; eventId?: string; publishedRelays?: string[]; failedRelays?: string[] }> {
    try {
      logger.info('Updating user profile', {
        service: 'ProfileBusinessService',
        method: 'updateUserProfile',
        updatedFields: Object.keys(updates),
      });

      // Merge updates with current profile
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...updates,
      };

      // Validate merged profile
      const validation = this.validateProfile(updatedProfile);
      if (!validation.isValid) {
        return {
          success: false,
          error: `Profile validation failed: ${validation.errors.join(', ')}`,
        };
      }

      // Publish to Nostr
      const publishResult = await this.publishProfile(updatedProfile, signer);

      if (!publishResult.success) {
        return {
          success: false,
          error: publishResult.error,
          eventId: publishResult.eventId,
          publishedRelays: publishResult.publishedRelays,
          failedRelays: publishResult.failedRelays,
        };
      }

      logger.info('User profile updated successfully', {
        service: 'ProfileBusinessService',
        method: 'updateUserProfile',
        eventId: publishResult.eventId,
        publishedRelays: publishResult.publishedRelays.length,
      });

      return {
        success: true,
        eventId: publishResult.eventId,
        publishedRelays: publishResult.publishedRelays,
        failedRelays: publishResult.failedRelays,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      logger.error('Failed to update profile', error instanceof Error ? error : new Error(errorMessage), {
        service: 'ProfileBusinessService',
        method: 'updateUserProfile',
        error: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }
}

export const profileService = ProfileBusinessService.getInstance();
