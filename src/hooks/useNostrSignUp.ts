/**
 * useNostrSignUp Hook
 * 
 * State management hook for sign-up workflow orchestration.
 * Manages 4-step wizard state and calls AuthBusinessService.
 * 
 * @module hooks/useNostrSignUp
 */

import { useState, useCallback } from 'react';
import { authBusinessService } from '@/services/business/AuthBusinessService';
import { UserProfile } from '@/services/business/ProfileBusinessService';

/**
 * Sign-up form data
 */
interface SignUpFormData {
  displayName: string;
  bio: string;
  avatarFile: File | null;
}

/**
 * Generated keys
 */
interface GeneratedKeys {
  nsec: string;
  npub: string;
  pubkey: string;
}

/**
 * Sign-up step numbers
 */
type SignUpStep = 1 | 2 | 3 | 4;

/**
 * Hook return type
 */
interface UseNostrSignUpReturn {
  // Current state
  currentStep: SignUpStep;
  formData: SignUpFormData;
  generatedKeys: GeneratedKeys | null;
  avatarUrl: string | null;
  
  // Loading states
  isGeneratingKeys: boolean;
  isUploadingAvatar: boolean;
  isPublishingProfile: boolean;
  isCreatingBackup: boolean;
  
  // Error states
  error: string | null;
  
  // Form data setters
  setDisplayName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarFile: (file: File | null) => void;
  
  // Step actions
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: SignUpStep) => void;
  
  // Key generation (Step 2)
  generateKeys: () => Promise<void>;
  
  // Backup creation (Step 3)
  createBackup: () => void;
  
  // Completion (Step 4)
  completeSignUp: () => void;
}

/**
 * Sign-up workflow state management
 */
export function useNostrSignUp(): UseNostrSignUpReturn {
  // Step state
  const [currentStep, setCurrentStep] = useState<SignUpStep>(1);
  
  // Form data
  const [formData, setFormData] = useState<SignUpFormData>({
    displayName: '',
    bio: '',
    avatarFile: null,
  });
  
  // Generated keys
  const [generatedKeys, setGeneratedKeys] = useState<GeneratedKeys | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  
  // Loading states
  const [isGeneratingKeys, setIsGeneratingKeys] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isPublishingProfile, setIsPublishingProfile] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Form data setters
  const setDisplayName = useCallback((name: string) => {
    setFormData(prev => ({ ...prev, displayName: name }));
  }, []);
  
  const setBio = useCallback((bio: string) => {
    setFormData(prev => ({ ...prev, bio }));
  }, []);
  
  const setAvatarFile = useCallback((file: File | null) => {
    setFormData(prev => ({ ...prev, avatarFile: file }));
  }, []);
  
  // Step navigation
  const nextStep = useCallback(() => {
    setCurrentStep(prev => Math.min(4, prev + 1) as SignUpStep);
    setError(null);
  }, []);
  
  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1) as SignUpStep);
    setError(null);
  }, []);
  
  const goToStep = useCallback((step: SignUpStep) => {
    setCurrentStep(step);
    setError(null);
  }, []);
  
  // Generate keys (Step 2)
  const generateKeys = useCallback(async () => {
    try {
      setError(null);
      setIsGeneratingKeys(true);
      
      console.log('Generating Nostr keys...');
      
      // 1. Generate keys
      const keys = authBusinessService.generateNostrKeys();
      setGeneratedKeys(keys);
      
      console.log('Keys generated:', { npub: keys.npub });
      
      // 2. Upload avatar if provided
      let uploadedAvatarUrl: string | null = null;
      if (formData.avatarFile) {
        console.log('Uploading avatar...');
        setIsUploadingAvatar(true);
        
        try {
          uploadedAvatarUrl = await authBusinessService.uploadAvatar(formData.avatarFile);
          setAvatarUrl(uploadedAvatarUrl);
          console.log('Avatar uploaded:', uploadedAvatarUrl);
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
          // Continue without avatar - not critical
        } finally {
          setIsUploadingAvatar(false);
        }
      }
      
      // 3. Publish profile (Kind 0)
      console.log('Publishing profile...');
      setIsPublishingProfile(true);
      
      const profile: UserProfile = {
        display_name: formData.displayName,
        about: formData.bio || '',
        picture: uploadedAvatarUrl || '',
        website: '',
        banner: '',
        bot: false,
        birthday: '',
      };
      
      await authBusinessService.publishProfile(profile);
      console.log('Profile published successfully');
      
      // 4. Publish welcome note (Kind 1) - Silent verification
      console.log('Publishing welcome note (silent)...');
      await authBusinessService.publishWelcomeNote();
      console.log('Welcome note published (silent)');
      
      setIsPublishingProfile(false);
      setIsGeneratingKeys(false);
      
      // Success - allow moving to next step
    } catch (err) {
      console.error('Key generation/publishing failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate keys and publish profile');
      setIsGeneratingKeys(false);
      setIsUploadingAvatar(false);
      setIsPublishingProfile(false);
    }
  }, [formData]);
  
  // Create backup (Step 3)
  const createBackup = useCallback(() => {
    try {
      setError(null);
      setIsCreatingBackup(true);
      
      if (!generatedKeys) {
        throw new Error('No keys generated. Please go back to Step 2.');
      }
      
      console.log('Creating backup file...');
      authBusinessService.createBackupFile(
        formData.displayName,
        generatedKeys.npub
      );
      
      console.log('Backup file downloaded successfully');
      setIsCreatingBackup(false);
    } catch (err) {
      console.error('Backup creation failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to create backup file');
      setIsCreatingBackup(false);
    }
  }, [formData.displayName, generatedKeys]);
  
  // Complete sign-up (Step 4)
  const completeSignUp = useCallback(() => {
    console.log('Sign-up complete - clearing nsec from memory');
    
    // Clear nsec from Zustand (user must use backup or extension now)
    authBusinessService.clearNsec();
    
    // Redirect to sign-in page happens in component
  }, []);
  
  return {
    // State
    currentStep,
    formData,
    generatedKeys,
    avatarUrl,
    
    // Loading
    isGeneratingKeys,
    isUploadingAvatar,
    isPublishingProfile,
    isCreatingBackup,
    
    // Error
    error,
    
    // Form setters
    setDisplayName,
    setBio,
    setAvatarFile,
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    
    // Actions
    generateKeys,
    createBackup,
    completeSignUp,
  };
}
