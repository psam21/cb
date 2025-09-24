import { bech32 } from '@scure/base';
import { logger } from '@/services/core/LoggingService';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

export interface UserProfile {
  display_name: string;
  about: string;
  picture: string;
  website: string;
  banner: string;
  bot: boolean;
  birthday: string;
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
        birthday: content.birthday || ''
      };

      logger.debug('Parsed profile metadata', { 
        display_name: profile.display_name,
        hasAbout: !!profile.about,
        hasPicture: !!profile.picture,
        hasWebsite: !!profile.website
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
      birthday: profile.birthday || ''
    };
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
