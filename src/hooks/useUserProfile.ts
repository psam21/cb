import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { profileService, UserProfile, ProfileStats } from '@/services/business/ProfileBusinessService';
import { logger } from '@/services/core/LoggingService';
import { NostrSigner } from '@/types/nostr';

export interface UseUserProfileReturn {
  // Profile data
  profile: UserProfile | null;
  stats: ProfileStats | null;
  
  // Loading states
  isLoadingProfile: boolean;
  isLoadingStats: boolean;
  isPublishing: boolean;
  isLoadingContributions: boolean;
  isVerifyingNip05: boolean;
  
  // Error states
  profileError: string | null;
  statsError: string | null;
  publishError: string | null;
  
  // Publishing results
  lastPublished: number | null;
  publishedRelays: string[];
  failedRelays: string[];
  
  // Contributions
  contributionsCount: number;
  
  // NIP-05 Verification
  isNip05Verified: boolean;
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  publishProfile: (updates: Partial<UserProfile>, signer: NostrSigner) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshStats: () => Promise<void>;
  verifyNip05: (identifier: string, pubkey: string) => Promise<boolean>;
  
  // Validation
  validateProfile: (profile: Partial<UserProfile>) => { isValid: boolean; errors: string[] };
  validateProfileFields: (profile: Partial<UserProfile>) => { [key: string]: string };
}

export function useUserProfile(): UseUserProfileReturn {
  const { user, isAuthenticated, setUser } = useAuthStore();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  
  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Error states
  const [profileError, setProfileError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  
  // Publishing results
  const [lastPublished, setLastPublished] = useState<number | null>(null);
  const [publishedRelays, setPublishedRelays] = useState<string[]>([]);
  const [failedRelays, setFailedRelays] = useState<string[]>([]);

  // Contributions state
  const [contributionsCount, setContributionsCount] = useState(0);
  const [isLoadingContributions, setIsLoadingContributions] = useState(true);

  // NIP-05 verification state
  const [isNip05Verified, setIsNip05Verified] = useState(false);
  const [isVerifyingNip05, setIsVerifyingNip05] = useState(false);

  /**
   * Load user profile from auth store
   */
  const loadProfile = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setProfile(null);
      setStats(null);
      return;
    }

    try {
      setIsLoadingProfile(true);
      setProfileError(null);

      // Get profile from user data
      const userProfile = user.profile;
      
      // Format profile for display
      const formattedProfile = profileService.formatProfileForDisplay(userProfile);
      setProfile(formattedProfile);

      logger.debug('Profile loaded successfully', { 
        display_name: formattedProfile.display_name,
        hasPicture: !!formattedProfile.picture
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      setProfileError(errorMessage);
      logger.error('Failed to load profile', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoadingProfile(false);
    }
  }, [user, isAuthenticated]);

  /**
   * Load profile statistics
   */
  const loadStats = useCallback(async () => {
    if (!user?.pubkey || !isAuthenticated) {
      setStats(null);
      return;
    }

    try {
      setIsLoadingStats(true);
      setStatsError(null);

      const profileStats = await profileService.getProfileStats(user.pubkey);
      setStats(profileStats);

      logger.debug('Profile stats loaded successfully', { 
        productsCreated: profileStats.productsCreated,
        lastActive: profileStats.lastActive
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile stats';
      setStatsError(errorMessage);
      logger.error('Failed to load profile stats', error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setIsLoadingStats(false);
    }
  }, [user?.pubkey, isAuthenticated]);

  /**
   * Update profile data
   */
  const updateProfile = useCallback(async (updates: Partial<UserProfile>): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      logger.warn('Cannot update profile: user not authenticated');
      return false;
    }

    try {
      setProfileError(null);

      // Validate profile updates
      const validation = profileService.validateProfile(updates);
      if (!validation.isValid) {
        setProfileError(validation.errors.join(', '));
        logger.warn('Profile validation failed', { errors: validation.errors });
        return false;
      }

      // Update profile in auth store
      const updatedProfile = { ...user.profile, ...updates };
      
      // Update user in store (this would need to be implemented in useAuthStore)
      // For now, we'll update local state
      setProfile(profileService.formatProfileForDisplay(updatedProfile));

      logger.info('Profile updated successfully', { 
        updates: Object.keys(updates),
        display_name: updatedProfile.display_name
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      setProfileError(errorMessage);
      logger.error('Failed to update profile', error instanceof Error ? error : new Error(errorMessage));
      return false;
    }
  }, [user, isAuthenticated]);

  /**
   * Publish profile to Nostr network
   */
  const publishProfile = useCallback(async (updates: Partial<UserProfile>, signer: NostrSigner): Promise<boolean> => {
    if (!user || !isAuthenticated) {
      logger.warn('Cannot publish profile: user not authenticated');
      setPublishError('User not authenticated');
      return false;
    }

    if (!profile) {
      logger.warn('Cannot publish profile: no current profile');
      setPublishError('No current profile loaded');
      return false;
    }

    try {
      setIsPublishing(true);
      setPublishError(null);
      setPublishedRelays([]);
      setFailedRelays([]);

      logger.info('Publishing profile to Nostr', {
        hook: 'useUserProfile',
        method: 'publishProfile',
        updatedFields: Object.keys(updates),
      });

      // Call ProfileBusinessService to publish
      const result = await profileService.updateUserProfile(updates, profile, signer);

      if (!result.success) {
        setPublishError(result.error || 'Failed to publish profile');
        setPublishedRelays(result.publishedRelays || []);
        setFailedRelays(result.failedRelays || []);
        logger.error('Profile publishing failed', new Error(result.error || 'Unknown error'));
        return false;
      }

      // Update local state with merged profile
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);

      // Update auth store
      if (setUser && user) {
        setUser({
          ...user,
          profile: updatedProfile,
        });
      }

      // Track publishing results
      setLastPublished(Date.now());
      setPublishedRelays(result.publishedRelays || []);
      setFailedRelays(result.failedRelays || []);

      logger.info('Profile published successfully', {
        hook: 'useUserProfile',
        method: 'publishProfile',
        eventId: result.eventId,
        publishedRelays: result.publishedRelays?.length || 0,
        failedRelays: result.failedRelays?.length || 0,
      });

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to publish profile';
      setPublishError(errorMessage);
      logger.error('Failed to publish profile', error instanceof Error ? error : new Error(errorMessage));
      return false;
    } finally {
      setIsPublishing(false);
    }
  }, [user, isAuthenticated, profile, setUser]);

  /**
   * Refresh profile data
   */
  const refreshProfile = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  /**
   * Refresh profile statistics
   */
  const refreshStats = useCallback(async () => {
    await loadStats();
  }, [loadStats]);

  /**
   * Validate profile data
   */
  const validateProfile = useCallback((profile: Partial<UserProfile>) => {
    return profileService.validateProfile(profile);
  }, []);

  /**
   * Validate profile fields and return field-specific errors
   */
  const validateProfileFields = useCallback((profile: Partial<UserProfile>): { [key: string]: string } => {
    // Import validation utility
    const errors: { [key: string]: string } = {};

    if (profile.display_name && profile.display_name.length > 100) {
      errors.display_name = 'Display name must be 100 characters or less';
    }

    if (profile.about && profile.about.length > 1000) {
      errors.about = 'About section must be 1000 characters or less';
    }

    if (profile.website && !/^https?:\/\/.+/.test(profile.website)) {
      errors.website = 'Website must be a valid URL';
    }

    if (profile.picture && !/^https?:\/\/.+/.test(profile.picture)) {
      errors.picture = 'Picture must be a valid URL';
    }

    if (profile.banner && !/^https?:\/\/.+/.test(profile.banner)) {
      errors.banner = 'Banner must be a valid URL';
    }

    if (profile.birthday && !/^\d{4}-\d{2}-\d{2}$/.test(profile.birthday)) {
      errors.birthday = 'Birthday must be in YYYY-MM-DD format';
    }

    if (profile.nip05 && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(profile.nip05)) {
      errors.nip05 = 'NIP-05 must be in format: name@domain.com';
    }

    if (profile.lud16 && !/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(profile.lud16)) {
      errors.lud16 = 'Lightning address must be in format: user@domain.com';
    }

    if (profile.lud06 && !profile.lud06.toLowerCase().startsWith('lnurl1')) {
      errors.lud06 = 'LNURL must start with "lnurl1"';
    }

    return errors;
  }, []);

  /**
   * Load contributions count
   */
  const loadContributions = useCallback(async () => {
    if (!user?.pubkey || !isAuthenticated) {
      setIsLoadingContributions(false);
      setContributionsCount(0);
      return;
    }

    try {
      setIsLoadingContributions(true);
      const { fetchHeritageByAuthor } = await import('@/services/business/HeritageContentService');
      const contributions = await fetchHeritageByAuthor(user.pubkey);
      setContributionsCount(contributions.length);

      logger.debug('Contributions count loaded', { 
        pubkey: user.pubkey.substring(0, 8) + '...',
        count: contributions.length
      });
    } catch (error) {
      logger.error('Failed to load contributions count', error instanceof Error ? error : new Error('Unknown error'));
      setContributionsCount(0);
    } finally {
      setIsLoadingContributions(false);
    }
  }, [user?.pubkey, isAuthenticated]);

  /**
   * Verify NIP-05 identifier
   */
  const verifyNip05 = useCallback(async (identifier: string, pubkey: string): Promise<boolean> => {
    if (!identifier || !pubkey) {
      setIsNip05Verified(false);
      return false;
    }

    try {
      setIsVerifyingNip05(true);
      const { verifyNIP05 } = await import('@/utils/nip05');
      const result = await verifyNIP05(identifier, pubkey);
      const verified = result !== null;
      setIsNip05Verified(verified);

      logger.debug('NIP-05 verification completed', { 
        identifier,
        pubkey: pubkey.substring(0, 8) + '...',
        verified
      });

      return verified;
    } catch (error) {
      logger.error('NIP-05 verification failed', error instanceof Error ? error : new Error('Unknown error'));
      setIsNip05Verified(false);
      return false;
    } finally {
      setIsVerifyingNip05(false);
    }
  }, []);

  // Load profile when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load stats when user changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Load contributions when user changes
  useEffect(() => {
    loadContributions();
  }, [loadContributions]);

  // Verify NIP-05 when profile loads or changes
  useEffect(() => {
    const verifyOnLoad = async () => {
      if (profile?.nip05 && user?.pubkey) {
        await verifyNip05(profile.nip05, user.pubkey);
      } else {
        setIsNip05Verified(false);
      }
    };
    verifyOnLoad();
  }, [profile?.nip05, user?.pubkey, verifyNip05]);

  return {
    // Profile data
    profile,
    stats,
    
    // Loading states
    isLoadingProfile,
    isLoadingStats,
    isPublishing,
    isLoadingContributions,
    isVerifyingNip05,
    
    // Error states
    profileError,
    statsError,
    publishError,
    
    // Publishing results
    lastPublished,
    publishedRelays,
    failedRelays,
    
    // Contributions
    contributionsCount,
    
    // NIP-05 Verification
    isNip05Verified,
    
    // Actions
    updateProfile,
    publishProfile,
    refreshProfile,
    refreshStats,
    verifyNip05,
    
    // Validation
    validateProfile,
    validateProfileFields,
  };
}
