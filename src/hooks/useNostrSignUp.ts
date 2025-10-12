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
import { useAuthStore } from '@/stores/useAuthStore';
import { createNsecSigner } from '@/utils/signerFactory';
import { AppError } from '@/errors/AppError';
import { ErrorCode, HttpStatus, ErrorCategory, ErrorSeverity } from '@/errors/ErrorTypes';

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
 * Sign-up step numbers (now 2 steps)
 */
type SignUpStep = 1 | 2;

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
  generateKeysAndMoveToBackup: () => Promise<void>; // Auto-generates and moves to step 2
  previousStep: () => void;
  goToStep: (step: SignUpStep) => void;
  
  // Backup creation (Step 2)
  createBackup: () => void;
  
  // Completion (after Step 2)
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
  const previousStep = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1) as SignUpStep);
    setError(null);
  }, []);
  
  const goToStep = useCallback((step: SignUpStep) => {
    setCurrentStep(step);
    setError(null);
  }, []);
  
  // Generate keys and move to backup step (automatic from Step 1 → Step 2)
  const generateKeysAndMoveToBackup = useCallback(async () => {
    try {
      setError(null);
      setIsGeneratingKeys(true);
      
      console.log('Generating Nostr keys...');
      
      // 1. Generate keys
      const keys = authBusinessService.generateNostrKeys();
      setGeneratedKeys(keys);
      
      // Store nsec in Zustand (hook responsibility, not service)
      useAuthStore.getState().setNsec(keys.nsec);
      
      console.log('Keys generated:', { npub: keys.npub });

      // Create signer once for all operations (hook responsibility)
      const signer = await createNsecSigner(keys.nsec);
      
      // 2. Upload avatar if provided
      let uploadedAvatarUrl: string | null = null;
      if (formData.avatarFile) {
        console.log('Uploading avatar...');
        setIsUploadingAvatar(true);
        
        try {
          uploadedAvatarUrl = await authBusinessService.uploadAvatar(formData.avatarFile, signer);
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
      
      await authBusinessService.publishProfile(profile, signer);
      console.log('Profile published successfully');
      
      // 4. Publish welcome note (Kind 1) - Silent verification
      console.log('Publishing welcome note (silent)...');
      await authBusinessService.publishWelcomeNote(signer);
      console.log('Welcome note published (silent)');
      
      setIsPublishingProfile(false);
      setIsGeneratingKeys(false);
      
      // Authenticate user in auth store
      useAuthStore.getState().setUser({
        pubkey: keys.pubkey,
        npub: keys.npub,
        profile: {
          display_name: formData.displayName,
          about: formData.bio || '',
          picture: uploadedAvatarUrl || '',
          website: '',
          banner: '',
          bot: false,
          birthday: '',
        },
      });
      
      console.log('User authenticated after sign-up');
      
      // Success - move to backup step automatically
      setCurrentStep(2);
    } catch (err) {
      console.error('Key generation/publishing failed:', err);
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to generate keys and publish profile',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.HIGH
          );
      setError(appError.message);
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
        throw new AppError(
          'No keys generated. Please go back to Step 2.',
          ErrorCode.VALIDATION_ERROR,
          HttpStatus.BAD_REQUEST,
          ErrorCategory.VALIDATION,
          ErrorSeverity.MEDIUM
        );
      }
      
      console.log('Creating backup file...');
      authBusinessService.createBackupFile(
        formData.displayName,
        generatedKeys.npub,
        generatedKeys.nsec
      );
      
      console.log('Backup file downloaded successfully');
      setIsCreatingBackup(false);
    } catch (err) {
      console.error('Backup creation failed:', err);
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to create backup file',
            ErrorCode.INTERNAL_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.INTERNAL,
            ErrorSeverity.MEDIUM
          );
      setError(appError.message);
      setIsCreatingBackup(false);
    }
  }, [formData.displayName, generatedKeys]);
  
  // Complete sign-up
  const completeSignUp = useCallback(() => {
    console.log('Sign-up complete - nsec persisted for seamless app usage');
    
    // Note: nsec is now persisted in Zustand and will be available throughout the app
    // User can sign events using their nsec without needing a browser extension
    
    // Redirect to home page happens in component
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
    previousStep,
    goToStep,
    
    // Actions
    generateKeysAndMoveToBackup,
    createBackup,
    completeSignUp,
  };
}
