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
 * Publishing status for background operations
 */
type PublishingStatus = 'idle' | 'uploading' | 'publishing-profile' | 'publishing-note' | 'complete' | 'error';

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
  isCreatingBackup: boolean;
  
  // Background publishing states
  isPublishingInBackground: boolean;
  publishingStatus: PublishingStatus;
  publishingMessage: string;
  publishingError: string | null;
  
  // Error states
  error: string | null;
  
  // Form data setters
  setDisplayName: (name: string) => void;
  setBio: (bio: string) => void;
  setAvatarFile: (file: File | null) => void;
  
  // Step actions
  generateKeysAndMoveToStep2: () => Promise<void>; // Fast - only generates keys and moves to step 2
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
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  
  // Background publishing states
  const [isPublishingInBackground, setIsPublishingInBackground] = useState(false);
  const [publishingStatus, setPublishingStatus] = useState<PublishingStatus>('idle');
  const [publishingMessage, setPublishingMessage] = useState('');
  const [publishingError, setPublishingError] = useState<string | null>(null);
  
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
  
  // Publish profile in background (non-blocking)
  const publishInBackground = useCallback(async (keys: GeneratedKeys) => {
    try {
      setIsPublishingInBackground(true);
      setPublishingStatus('idle');
      setPublishingError(null);
      
      console.log('Starting background publishing...');
      
      // Create signer once for all operations
      const signer = await createNsecSigner(keys.nsec);
      
      // 1. Upload avatar if provided
      let uploadedAvatarUrl: string | null = null;
      if (formData.avatarFile) {
        console.log('Uploading avatar in background...');
        setPublishingStatus('uploading');
        setPublishingMessage('Uploading profile picture...');
        
        try {
          uploadedAvatarUrl = await authBusinessService.uploadAvatar(formData.avatarFile, signer);
          setAvatarUrl(uploadedAvatarUrl);
          console.log('Avatar uploaded:', uploadedAvatarUrl);
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError);
          setPublishingError('Avatar upload failed. You can update it later from your profile.');
          // Continue without avatar - not critical
        }
      }
      
      // 2. Publish profile (Kind 0)
      console.log('Publishing profile in background...');
      setPublishingStatus('publishing-profile');
      setPublishingMessage('Publishing profile to Nostr relays...');
      
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
      
      // Update user in auth store with actual avatar URL
      if (uploadedAvatarUrl) {
        useAuthStore.getState().setUser({
          pubkey: keys.pubkey,
          npub: keys.npub,
          profile: {
            ...profile,
            picture: uploadedAvatarUrl,
          },
        });
      }
      
      // 3. Publish welcome note (Kind 1) - Silent verification
      console.log('Publishing welcome note in background...');
      setPublishingStatus('publishing-note');
      setPublishingMessage('Publishing welcome note...');
      
      await authBusinessService.publishWelcomeNote(signer);
      console.log('Welcome note published');
      
      // Success!
      setPublishingStatus('complete');
      setPublishingMessage('Profile published successfully!');
      console.log('Background publishing complete');
    } catch (err) {
      console.error('Background publishing failed:', err);
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to publish profile',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.MEDIUM
          );
      setPublishingStatus('error');
      setPublishingError(appError.message);
      setPublishingMessage('Publishing failed. You can update your profile later.');
    } finally {
      setIsPublishingInBackground(false);
    }
  }, [formData]);
  
  // Generate keys and move to step 2 (fast - local operation only)
  const generateKeysAndMoveToStep2 = useCallback(async () => {
    try {
      setError(null);
      setIsGeneratingKeys(true);
      
      console.log('Generating Nostr keys...');
      
      // 1. Generate keys (fast - local operation)
      const keys = authBusinessService.generateNostrKeys();
      setGeneratedKeys(keys);
      
      // Store nsec in Zustand (hook responsibility, not service)
      useAuthStore.getState().setNsec(keys.nsec);
      
      console.log('Keys generated:', { npub: keys.npub });
      
      // Authenticate user in auth store immediately with placeholder profile
      useAuthStore.getState().setUser({
        pubkey: keys.pubkey,
        npub: keys.npub,
        profile: {
          display_name: formData.displayName,
          about: formData.bio || '',
          picture: '', // Will be updated after upload completes
          website: '',
          banner: '',
          bot: false,
          birthday: '',
        },
      });
      
      console.log('User authenticated with placeholder profile');
      
      setIsGeneratingKeys(false);
      
      // Success - move to backup step immediately
      setCurrentStep(2);
      
      // Start background publishing (non-blocking)
      publishInBackground(keys);
    } catch (err) {
      console.error('Key generation failed:', err);
      const appError = err instanceof AppError 
        ? err 
        : new AppError(
            err instanceof Error ? err.message : 'Failed to generate keys',
            ErrorCode.NOSTR_ERROR,
            HttpStatus.INTERNAL_SERVER_ERROR,
            ErrorCategory.AUTHENTICATION,
            ErrorSeverity.HIGH
          );
      setError(appError.message);
      setIsGeneratingKeys(false);
    }
  }, [formData, publishInBackground]);
  
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
    isCreatingBackup,
    
    // Background publishing
    isPublishingInBackground,
    publishingStatus,
    publishingMessage,
    publishingError,
    
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
    generateKeysAndMoveToStep2,
    createBackup,
    completeSignUp,
  };
}
