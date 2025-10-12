/**
 * Hook for managing complete multi-attachment workflows
 * Combines attachment management, media upload, and product operations
 */

import { useState, useCallback } from 'react';
import { logger } from '../services/core/LoggingService';
import { useAttachmentManager } from './useAttachmentManager';
import { useMediaUpload } from './useMediaUpload';
import { useShopPublishing } from './useShopPublishing';
import { useProductEditing } from './useProductEditing';
import { ProductEventData } from '../services/nostr/NostrEventService';
import { NostrSigner } from '../types/nostr';

export interface WorkflowState {
  currentStep: 'idle' | 'selecting' | 'validating' | 'uploading' | 'creating' | 'editing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  canProceed: boolean;
  canCancel: boolean;
  canRetry: boolean;
}

export interface UseMultiAttachmentWorkflowReturn {
  // State
  workflowState: WorkflowState;
  attachmentManager: ReturnType<typeof useAttachmentManager>;
  mediaUpload: ReturnType<typeof useMediaUpload>;
  shopPublishing: ReturnType<typeof useShopPublishing>;
  productEditing: ReturnType<typeof useProductEditing>;
  
  // Workflow Actions
  startProductCreation: (productData: ProductEventData, files: File[], signer: NostrSigner) => Promise<void>;
  startProductUpdate: (productId: string, productData: Partial<ProductEventData>, files: File[], signer: NostrSigner) => Promise<void>;
  cancelWorkflow: () => void;
  retryWorkflow: (signer: NostrSigner) => Promise<void>;
  
  // Step Management
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: WorkflowState['currentStep']) => void;
  
  // Utilities
  isWorkflowActive: boolean;
  hasErrors: boolean;
  canAddMoreFiles: boolean;
  getWorkflowSummary: () => {
    totalFiles: number;
    uploadedFiles: number;
    failedFiles: number;
    currentStep: string;
    progress: number;
  };
}

const initialWorkflowState: WorkflowState = {
  currentStep: 'idle',
  progress: 0,
  message: 'Ready to start',
  canProceed: false,
  canCancel: false,
  canRetry: false,
};

/**
 * Hook for managing complete multi-attachment workflows
 */
export const useMultiAttachmentWorkflow = (): UseMultiAttachmentWorkflowReturn => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(initialWorkflowState);
  const [currentProductData, setCurrentProductData] = useState<ProductEventData | null>(null);
  const [currentProductId, setCurrentProductId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(true);

  // Initialize sub-hooks
  const attachmentManager = useAttachmentManager();
  const mediaUpload = useMediaUpload();
  const shopPublishing = useShopPublishing();
  const productEditing = useProductEditing();

  /**
   * Start product creation workflow
   */
  const startProductCreation = useCallback(async (
    productData: ProductEventData,
    files: File[],
    signer: NostrSigner
  ): Promise<void> => {
    logger.info('Starting product creation workflow', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'startProductCreation',
      fileCount: files.length,
      productTitle: productData.title
    });

    setCurrentProductData(productData);
    setCurrentProductId(null);
    setIsCreateMode(true);
    
    setWorkflowState({
      currentStep: 'selecting',
      progress: 10,
      message: 'Adding files to workflow...',
      canProceed: false,
      canCancel: true,
      canRetry: false,
    });

    try {
      // Step 1: Add files to attachment manager
      await attachmentManager.addAttachments(files);
      
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'validating',
        progress: 30,
        message: 'Validating files...',
        canProceed: attachmentManager.state.attachments.length > 0,
      }));

      // Step 2: Upload files
      if (attachmentManager.state.attachments.length > 0) {
        setWorkflowState(prev => ({
          ...prev,
          currentStep: 'uploading',
          progress: 50,
          message: 'Uploading files to Blossom...',
          canProceed: false,
        }));

        const uploadResult = await mediaUpload.uploadFiles(
          attachmentManager.state.attachments.map(a => a.originalFile!).filter(Boolean),
          signer
        );

        if (!uploadResult.success) {
          setWorkflowState(prev => ({
            ...prev,
            currentStep: 'error',
            progress: 0,
            message: 'Upload failed. Please try again.',
            canProceed: false,
            canRetry: true,
          }));
          return;
        }

        // Step 3: Create product
        setWorkflowState(prev => ({
          ...prev,
          currentStep: 'creating',
          progress: 80,
          message: 'Creating product...',
          canProceed: false,
        }));

        const createResult = await shopPublishing.publishProductWithAttachments(
          productData,
          attachmentManager.state.attachments.map(a => a.originalFile!).filter(Boolean)
        );

        if (createResult.success) {
          setWorkflowState(prev => ({
            ...prev,
            currentStep: 'complete',
            progress: 100,
            message: 'Product created successfully!',
            canProceed: false,
            canCancel: false,
            canRetry: false,
          }));
        } else {
          setWorkflowState(prev => ({
            ...prev,
            currentStep: 'error',
            progress: 0,
            message: 'Product creation failed. Please try again.',
            canProceed: false,
            canRetry: true,
          }));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product creation workflow failed', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useMultiAttachmentWorkflow',
        method: 'startProductCreation',
        error: errorMessage
      });

      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'error',
        progress: 0,
        message: `Error: ${errorMessage}`,
        canProceed: false,
        canRetry: true,
      }));
    }
  }, [attachmentManager, mediaUpload, shopPublishing]);

  /**
   * Start product update workflow
   */
  const startProductUpdate = useCallback(async (
    productId: string,
    productData: Partial<ProductEventData>,
    files: File[],
    signer: NostrSigner
  ): Promise<void> => {
    logger.info('Starting product update workflow', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'startProductUpdate',
      productId,
      fileCount: files.length
    });

    setCurrentProductData(productData as ProductEventData);
    setCurrentProductId(productId);
    setIsCreateMode(false);
    
    setWorkflowState({
      currentStep: 'selecting',
      progress: 10,
      message: 'Adding files to workflow...',
      canProceed: false,
      canCancel: true,
      canRetry: false,
    });

    try {
      // Step 1: Add files to attachment manager
      await attachmentManager.addAttachments(files);
      
      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'validating',
        progress: 30,
        message: 'Validating files...',
        canProceed: attachmentManager.state.attachments.length > 0,
      }));

      // Step 2: Upload files
      if (attachmentManager.state.attachments.length > 0) {
        setWorkflowState(prev => ({
          ...prev,
          currentStep: 'uploading',
          progress: 50,
          message: 'Uploading files to Blossom...',
          canProceed: false,
        }));

        const uploadResult = await mediaUpload.uploadFiles(
          attachmentManager.state.attachments.map(a => a.originalFile!).filter(Boolean),
          signer
        );

        if (!uploadResult.success) {
          setWorkflowState(prev => ({
            ...prev,
            currentStep: 'error',
            progress: 0,
            message: 'Upload failed. Please try again.',
            canProceed: false,
            canRetry: true,
          }));
          return;
        }

        // Step 3: Update product
        setWorkflowState(prev => ({
          ...prev,
          currentStep: 'editing',
          progress: 80,
          message: 'Updating product...',
          canProceed: false,
        }));

        const updateResult = await productEditing.updateProductData(
          productId,
          productData,
          attachmentManager.state.attachments.map(a => a.originalFile!).filter(Boolean)
        );

        if (updateResult.success) {
          setWorkflowState(prev => ({
            ...prev,
            currentStep: 'complete',
            progress: 100,
            message: 'Product updated successfully!',
            canProceed: false,
            canCancel: false,
            canRetry: false,
          }));
        } else {
          setWorkflowState(prev => ({
            ...prev,
            currentStep: 'error',
            progress: 0,
            message: 'Product update failed. Please try again.',
            canProceed: false,
            canRetry: true,
          }));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Product update workflow failed', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useMultiAttachmentWorkflow',
        method: 'startProductUpdate',
        error: errorMessage
      });

      setWorkflowState(prev => ({
        ...prev,
        currentStep: 'error',
        progress: 0,
        message: `Error: ${errorMessage}`,
        canProceed: false,
        canRetry: true,
      }));
    }
  }, [attachmentManager, mediaUpload, productEditing]);

  /**
   * Cancel current workflow
   */
  const cancelWorkflow = useCallback(() => {
    logger.info('Cancelling workflow', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'cancelWorkflow',
      currentStep: workflowState.currentStep
    });

    // Reset all states
    attachmentManager.reset();
    mediaUpload.resetUpload();
    setCurrentProductData(null);
    setCurrentProductId(null);
    setIsCreateMode(true);
    setWorkflowState(initialWorkflowState);
  }, [workflowState.currentStep, attachmentManager, mediaUpload]);

  /**
   * Retry current workflow
   */
  const retryWorkflow = useCallback(async (signer: NostrSigner): Promise<void> => {
    logger.info('Retrying workflow', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'retryWorkflow',
      currentStep: workflowState.currentStep
    });

    if (isCreateMode && currentProductData) {
      const files = attachmentManager.state.attachments.map(a => a.originalFile!).filter(Boolean);
      await startProductCreation(currentProductData, files, signer);
    } else if (!isCreateMode && currentProductId && currentProductData) {
      const files = attachmentManager.state.attachments.map(a => a.originalFile!).filter(Boolean);
      await startProductUpdate(currentProductId, currentProductData, files, signer);
    }
  }, [workflowState.currentStep, isCreateMode, currentProductData, currentProductId, attachmentManager, startProductCreation, startProductUpdate]);

  /**
   * Move to next step
   */
  const nextStep = useCallback(() => {
    // Implementation depends on current step and state
    logger.debug('Moving to next step', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'nextStep',
      currentStep: workflowState.currentStep
    });
  }, [workflowState.currentStep]);

  /**
   * Move to previous step
   */
  const previousStep = useCallback(() => {
    // Implementation depends on current step and state
    logger.debug('Moving to previous step', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'previousStep',
      currentStep: workflowState.currentStep
    });
  }, [workflowState.currentStep]);

  /**
   * Go to specific step
   */
  const goToStep = useCallback((step: WorkflowState['currentStep']) => {
    logger.debug('Going to step', {
      hook: 'useMultiAttachmentWorkflow',
      method: 'goToStep',
      targetStep: step,
      currentStep: workflowState.currentStep
    });

    setWorkflowState(prev => ({
      ...prev,
      currentStep: step,
    }));
  }, [workflowState.currentStep]);

  // Computed properties
  const isWorkflowActive = workflowState.currentStep !== 'idle' && workflowState.currentStep !== 'complete';
  const hasErrors = workflowState.currentStep === 'error' || attachmentManager.hasErrors || mediaUpload.uploadState.error !== null;
  const canAddMoreFiles = attachmentManager.canAddMore();

  const getWorkflowSummary = useCallback(() => {
    return {
      totalFiles: attachmentManager.getFileCount(),
      uploadedFiles: mediaUpload.uploadState.uploadedFiles.length,
      failedFiles: mediaUpload.uploadState.failedFiles.length,
      currentStep: workflowState.currentStep,
      progress: workflowState.progress,
    };
  }, [attachmentManager, mediaUpload.uploadState, workflowState]);

  return {
    workflowState,
    attachmentManager,
    mediaUpload,
    shopPublishing,
    productEditing,
    startProductCreation,
    startProductUpdate,
    cancelWorkflow,
    retryWorkflow,
    nextStep,
    previousStep,
    goToStep,
    isWorkflowActive,
    hasErrors,
    canAddMoreFiles,
    getWorkflowSummary,
  };
};

export default useMultiAttachmentWorkflow;
