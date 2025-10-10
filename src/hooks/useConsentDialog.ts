/**
 * Hook for managing user consent dialog for multi-file operations
 * Integrates UserConsentDialog with business logic
 * 
 * NOTE: Consent dialog is only needed for browser extension users who get
 * multiple signature popups. Users who signed in with nsec don't need this
 * because signing happens automatically without popups.
 */

import { useState, useCallback } from 'react';
import { logger } from '../services/core/LoggingService';
import { BatchUploadConsent } from '../services/generic/GenericBlossomService';
import { useAuthStore } from '../stores/useAuthStore';

export interface UseConsentDialogReturn {
  // Dialog state
  isOpen: boolean;
  consent: BatchUploadConsent | null;
  
  // Dialog actions
  showConsentDialog: (files: File[]) => Promise<boolean>;
  acceptConsent: () => void;
  cancelConsent: () => void;
  closeDialog: () => void;
}

export const useConsentDialog = (): UseConsentDialogReturn => {
  const nsec = useAuthStore((state) => state.nsec);
  const [isOpen, setIsOpen] = useState(false);
  const [consent, setConsent] = useState<BatchUploadConsent | null>(null);
  const [resolveConsent, setResolveConsent] = useState<((accepted: boolean) => void) | null>(null);

  const showConsentDialog = useCallback(async (files: File[]): Promise<boolean> => {
    // Skip consent dialog for nsec users - they don't get browser extension popups
    if (nsec) {
      logger.info('Skipping consent dialog for nsec user (auto-signing enabled)', {
        hook: 'useConsentDialog',
        method: 'showConsentDialog',
        fileCount: files.length,
        hasNsec: true
      });
      return true; // Auto-approve
    }

    return new Promise((resolve) => {
      logger.info('Showing consent dialog for extension user', {
        hook: 'useConsentDialog',
        method: 'showConsentDialog',
        fileCount: files.length,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        hasNsec: false
      });

      // Create consent object
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const estimatedTimePerFile = 3.5; // seconds
      const estimatedTime = Math.ceil(files.length * estimatedTimePerFile);

      const consentData: BatchUploadConsent = {
        fileCount: files.length,
        totalSize,
        estimatedTime,
        requiredApprovals: files.length,
        userAccepted: false,
        timestamp: Date.now(),
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        }))
      };

      setConsent(consentData);
      setResolveConsent(() => resolve);
      setIsOpen(true);
      
      console.log('[useConsentDialog] State updated - isOpen should be true now');
    });
  }, [nsec]);

  const acceptConsent = useCallback(() => {
    logger.info('User accepted consent', {
      hook: 'useConsentDialog',
      method: 'acceptConsent',
      fileCount: consent?.fileCount || 0
    });

    if (consent) {
      setConsent(prev => prev ? { ...prev, userAccepted: true } : null);
    }

    if (resolveConsent) {
      resolveConsent(true);
      setResolveConsent(null);
    }

    setIsOpen(false);
  }, [consent, resolveConsent]);

  const cancelConsent = useCallback(() => {
    logger.info('User cancelled consent', {
      hook: 'useConsentDialog',
      method: 'cancelConsent',
      fileCount: consent?.fileCount || 0
    });

    if (resolveConsent) {
      resolveConsent(false);
      setResolveConsent(null);
    }

    setIsOpen(false);
  }, [consent, resolveConsent]);

  const closeDialog = useCallback(() => {
    logger.info('Closing consent dialog', {
      hook: 'useConsentDialog',
      method: 'closeDialog'
    });

    if (resolveConsent) {
      resolveConsent(false);
      setResolveConsent(null);
    }

    setIsOpen(false);
  }, [resolveConsent]);

  return {
    isOpen,
    consent,
    showConsentDialog,
    acceptConsent,
    cancelConsent,
    closeDialog
  };
};
