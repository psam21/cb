import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { profileService, UserProfile, ProfileStats } from '@/services/business/ProfileBusinessService';
import { logger } from '@/services/core/LoggingService';

export interface UseUserProfileReturn {
  // Profile data
  profile: UserProfile | null;
  stats: ProfileStats | null;
  
  // Loading states
  isLoadingProfile: boolean;
  isLoadingStats: boolean;
  
  // Error states
  profileError: string | null;
  statsError: string | null;
  
  // Actions
  updateProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  refreshStats: () => Promise<void>;
  
  // Validation
  validateProfile: (profile: Partial<UserProfile>) => { isValid: boolean; errors: string[] };
}

export function useUserProfile(): UseUserProfileReturn {
  const { user, isAuthenticated } = useAuthStore();
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  
  // Loading states
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  
  // Error states
  const [profileError, setProfileError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

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

  // Load profile when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load stats when user changes
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    // Profile data
    profile,
    stats,
    
    // Loading states
    isLoadingProfile,
    isLoadingStats,
    
    // Error states
    profileError,
    statsError,
    
    // Actions
    updateProfile,
    refreshProfile,
    refreshStats,
    
    // Validation
    validateProfile
  };
}
