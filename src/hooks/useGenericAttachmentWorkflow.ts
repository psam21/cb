/**
 * Generic Multi-Attachment Workflow Hook
 * Provides reusable workflows for any content type with multiple attachments
 */

import { useState, useCallback, useRef } from 'react';
import { logger } from '../services/core/LoggingService';
import { 
  GenericAttachment, 
  SelectiveUpdateResult,
  AttachmentManagerConfig
} from '../types/attachments';
import { useSelectiveAttachmentManager } from './useSelectiveAttachmentManager';
import { mediaBusinessService } from '../services/business/MediaBusinessService';

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  progress: number; // 0-100
  error?: string;
  startTime?: number;
  endTime?: number;
}

export interface WorkflowState {
  currentStep: string | null;
  steps: WorkflowStep[];
  isRunning: boolean;
  isComplete: boolean;
  hasErrors: boolean;
  totalProgress: number;
}

export interface GenericAttachmentWorkflowConfig<T extends GenericAttachment = GenericAttachment> {
  // Workflow configuration
  workflowName: string;
  workflowDescription: string;
  steps: Omit<WorkflowStep, 'status' | 'progress' | 'error' | 'startTime' | 'endTime'>[];
  
  // Attachment configuration
  attachmentConfig: Partial<AttachmentManagerConfig>;
  
  // Content type specific
  contentId?: string;
  contentType: string;
  
  // Callbacks
  onStepComplete?: (step: WorkflowStep) => void;
  onWorkflowComplete?: (result: SelectiveUpdateResult<T[]>) => void;
  onWorkflowError?: (error: string, step: WorkflowStep) => void;
  onProgress?: (progress: number, message: string) => void;
}

export interface UseGenericAttachmentWorkflowReturn<T extends GenericAttachment = GenericAttachment> {
  // Workflow state
  workflowState: WorkflowState;
  
  // Attachment management
  attachmentManager: ReturnType<typeof useSelectiveAttachmentManager<T>>;
  
  // Workflow control
  startWorkflow: (contentId?: string) => Promise<void>;
  pauseWorkflow: () => void;
  resumeWorkflow: () => Promise<void>;
  cancelWorkflow: () => void;
  resetWorkflow: () => void;
  
  // Step control
  nextStep: () => Promise<void>;
  previousStep: () => void;
  goToStep: (stepId: string) => Promise<void>;
  skipStep: (stepId: string) => void;
  
  // Workflow execution
  executeWorkflow: () => Promise<SelectiveUpdateResult<T[]>>;
  
  // Utilities
  getCurrentStep: () => WorkflowStep | null;
  getStepById: (stepId: string) => WorkflowStep | null;
  canProceed: boolean;
  canGoBack: boolean;
  
  // Status
  isRunning: boolean;
  isComplete: boolean;
  hasErrors: boolean;
  totalProgress: number;
}

/**
 * Generic workflow for multi-attachment operations
 * Works with any content type that extends GenericAttachment
 */
export const useGenericAttachmentWorkflow = <T extends GenericAttachment = GenericAttachment>(
  config: GenericAttachmentWorkflowConfig<T>
): UseGenericAttachmentWorkflowReturn<T> => {
  const [workflowState, setWorkflowState] = useState<WorkflowState>(() => ({
    currentStep: null,
    steps: config.steps.map(step => ({
      ...step,
      status: 'pending' as const,
      progress: 0
    })),
    isRunning: false,
    isComplete: false,
    hasErrors: false,
    totalProgress: 0
  }));

  // Initialize attachment manager
  const attachmentManager = useSelectiveAttachmentManager<T>(config.attachmentConfig);

  const nextStepRef = useRef<(() => Promise<void>) | null>(null);
  const executeStepRef = useRef<((step: WorkflowStep) => Promise<void>) | null>(null);
  const executeWorkflowRef = useRef<(() => Promise<SelectiveUpdateResult<T[]>>) | null>(null);

  // ============================================================================
  // WORKFLOW CONTROL
  // ============================================================================

  /**
   * Start the workflow
   */
  const startWorkflow = useCallback(async (contentId?: string): Promise<void> => {
    logger.info('Starting generic attachment workflow', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'startWorkflow',
      workflowName: config.workflowName,
      contentId
    });

    setWorkflowState(prev => ({
      ...prev,
      currentStep: prev.steps[0]?.id || null,
      isRunning: true,
      isComplete: false,
      hasErrors: false,
      totalProgress: 0
    }));

    // Reset attachment manager
    attachmentManager.reset();

    // Start first step
    if (workflowState.steps.length > 0) {
      await nextStepRef.current?.();
    }
  }, [config.workflowName, attachmentManager, workflowState.steps.length]);

  /**
   * Pause the workflow
   */
  const pauseWorkflow = useCallback((): void => {
    logger.debug('Pausing workflow', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'pauseWorkflow',
      currentStep: workflowState.currentStep
    });

    setWorkflowState(prev => ({
      ...prev,
      isRunning: false
    }));
  }, [workflowState.currentStep]);

  /**
   * Resume the workflow
   */
  const resumeWorkflow = useCallback(async (): Promise<void> => {
    logger.debug('Resuming workflow', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'resumeWorkflow',
      currentStep: workflowState.currentStep
    });

    setWorkflowState(prev => ({
      ...prev,
      isRunning: true
    }));

    // Continue with current step
    if (workflowState.currentStep) {
      await nextStepRef.current?.();
    }
  }, [workflowState.currentStep]);

  /**
   * Cancel the workflow
   */
  const cancelWorkflow = useCallback((): void => {
    logger.info('Cancelling workflow', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'cancelWorkflow',
      currentStep: workflowState.currentStep
    });

    setWorkflowState(prev => ({
      ...prev,
      isRunning: false,
      isComplete: false,
      hasErrors: true
    }));

    // Reset attachment manager
    attachmentManager.reset();
  }, [workflowState.currentStep, attachmentManager]);

  /**
   * Reset the workflow
   */
  const resetWorkflow = useCallback((): void => {
    logger.debug('Resetting workflow', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'resetWorkflow'
    });

    setWorkflowState({
      currentStep: null,
      steps: config.steps.map(step => ({
        ...step,
        status: 'pending' as const,
        progress: 0
      })),
      isRunning: false,
      isComplete: false,
      hasErrors: false,
      totalProgress: 0
    });

    // Reset attachment manager
    attachmentManager.reset();
  }, [config.steps, attachmentManager]);

  // ============================================================================
  // STEP CONTROL
  // ============================================================================

  /**
   * Move to next step
   */
  const nextStep = useCallback(async (): Promise<void> => {
    const currentStepIndex = workflowState.steps.findIndex(step => step.id === workflowState.currentStep);
    const nextStepIndex = currentStepIndex + 1;

    if (nextStepIndex >= workflowState.steps.length) {
      // Workflow complete
      setWorkflowState(prev => ({
        ...prev,
        isRunning: false,
        isComplete: true,
        totalProgress: 100
      }));

      // Execute final workflow
      const workflowRunner = executeWorkflowRef.current;
      if (workflowRunner) {
        const result = await workflowRunner();
        config.onWorkflowComplete?.(result);
      } else {
        logger.warn('Workflow runner not available when attempting to finalize workflow', {
          hook: 'useGenericAttachmentWorkflow',
          method: 'nextStep'
        });
      }

      return;
    }

    const stepToRun = workflowState.steps[nextStepIndex];
    
    logger.debug('Moving to next step', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'nextStep',
      currentStep: workflowState.currentStep,
      nextStep: stepToRun.id
    });

    setWorkflowState(prev => ({
      ...prev,
      currentStep: stepToRun.id,
      steps: prev.steps.map(step => 
        step.id === stepToRun.id 
          ? { ...step, status: 'in_progress' as const, startTime: Date.now() }
          : step
      )
    }));

    // Execute step logic
    const stepRunner = executeStepRef.current;
    if (!stepRunner) {
      logger.warn('Step runner not available when attempting to execute step', {
        hook: 'useGenericAttachmentWorkflow',
        method: 'nextStep',
        requestedStep: stepToRun.id
      });
      return;
    }

    await stepRunner(stepToRun);
  }, [workflowState.currentStep, workflowState.steps, config]);

  nextStepRef.current = nextStep;

  /**
   * Move to previous step
   */
  const previousStep = useCallback((): void => {
    const currentStepIndex = workflowState.steps.findIndex(step => step.id === workflowState.currentStep);
    const previousStepIndex = currentStepIndex - 1;

    if (previousStepIndex < 0) return;

    const previousStep = workflowState.steps[previousStepIndex];
    
    logger.debug('Moving to previous step', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'previousStep',
      currentStep: workflowState.currentStep,
      previousStep: previousStep.id
    });

    setWorkflowState(prev => ({
      ...prev,
      currentStep: previousStep.id,
      steps: prev.steps.map(step => 
        step.id === previousStep.id 
          ? { ...step, status: 'in_progress' as const }
          : step
      )
    }));
  }, [workflowState.currentStep, workflowState.steps]);

  /**
   * Go to specific step
   */
  const goToStep = useCallback(async (stepId: string): Promise<void> => {
    const step = workflowState.steps.find(s => s.id === stepId);
    if (!step) return;

    logger.debug('Going to specific step', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'goToStep',
      stepId
    });

    setWorkflowState(prev => ({
      ...prev,
      currentStep: stepId,
      steps: prev.steps.map(s => 
        s.id === stepId 
          ? { ...s, status: 'in_progress' as const, startTime: Date.now() }
          : s
      )
    }));

    // Execute step logic
    const stepRunner = executeStepRef.current;
    if (!stepRunner) {
      logger.warn('Step runner not available when attempting to go to step', {
        hook: 'useGenericAttachmentWorkflow',
        method: 'goToStep',
        stepId
      });
      return;
    }

    await stepRunner(step);
  }, [workflowState.steps]);

  /**
   * Skip a step
   */
  const skipStep = useCallback((stepId: string): void => {
    logger.debug('Skipping step', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'skipStep',
      stepId
    });

    setWorkflowState(prev => ({
      ...prev,
      steps: prev.steps.map(step => 
        step.id === stepId 
          ? { ...step, status: 'skipped' as const, progress: 100, endTime: Date.now() }
          : step
      )
    }));
  }, []);

  // ============================================================================
  // STEP EXECUTION
  // ============================================================================

  /**
   * Execute a workflow step
   */
  const executeStep = useCallback(async (step: WorkflowStep): Promise<void> => {
    try {
      logger.debug('Executing workflow step', {
        hook: 'useGenericAttachmentWorkflow',
        method: 'executeStep',
        stepId: step.id,
        stepName: step.name
      });

      // Update progress
      setWorkflowState(prev => ({
        ...prev,
        steps: prev.steps.map(s => 
          s.id === step.id 
            ? { ...s, progress: 50 }
            : s
        )
      }));

      // Step-specific logic would go here
      // For now, we'll just simulate completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mark step as completed
      setWorkflowState(prev => ({
        ...prev,
        steps: prev.steps.map(s => 
          s.id === step.id 
            ? { ...s, status: 'completed' as const, progress: 100, endTime: Date.now() }
            : s
        )
      }));

      config.onStepComplete?.(step);
      
      // Move to next step
      const advance = nextStepRef.current;
      if (advance) {
        await advance();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown step error';
      
      logger.error('Workflow step failed', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useGenericAttachmentWorkflow',
        method: 'executeStep',
        stepId: step.id,
        error: errorMessage
      });

      // Mark step as failed
      setWorkflowState(prev => ({
        ...prev,
        steps: prev.steps.map(s => 
          s.id === step.id 
            ? { ...s, status: 'failed' as const, error: errorMessage, endTime: Date.now() }
            : s
        ),
        hasErrors: true,
        isRunning: false
      }));

      config.onWorkflowError?.(errorMessage, step);
    }
  }, [config]);

  executeStepRef.current = executeStep;

  // ============================================================================
  // WORKFLOW EXECUTION
  // ============================================================================

  /**
   * Execute the complete workflow
   */
  const executeWorkflow = useCallback(async (): Promise<SelectiveUpdateResult<T[]>> => {
    logger.info('Executing complete workflow', {
      hook: 'useGenericAttachmentWorkflow',
      method: 'executeWorkflow',
      workflowName: config.workflowName,
      attachmentCount: attachmentManager.state.attachments.length
    });

    try {
      // Get all operations from attachment manager
      const operations = attachmentManager.getOperations();
      
      if (operations.length === 0) {
        return {
          success: true,
          content: attachmentManager.state.attachments as T[],
          attachments: attachmentManager.state.attachments,
          operations: [],
          addedAttachments: [],
          removedAttachments: [],
          reorderedAttachments: []
        };
      }

      // Process operations
      const result = await mediaBusinessService.processAttachmentOperations(
        operations,
        attachmentManager.state.attachments
      );

      if (result.success) {
        // Update attachment manager state
        attachmentManager.state.attachments = result.attachments as T[];
      }

      return {
        success: result.success,
        content: result.attachments as T[],
        attachments: result.attachments,
        operations,
        addedAttachments: result.addedAttachments,
        removedAttachments: result.removedAttachments,
        reorderedAttachments: result.reorderedAttachments,
        error: result.error,
        warnings: result.warnings
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown workflow execution error';
      
      logger.error('Workflow execution failed', error instanceof Error ? error : new Error(errorMessage), {
        hook: 'useGenericAttachmentWorkflow',
        method: 'executeWorkflow',
        error: errorMessage
      });

      return {
        success: false,
        content: attachmentManager.state.attachments as T[],
        attachments: attachmentManager.state.attachments,
        operations: attachmentManager.getOperations(),
        addedAttachments: [],
        removedAttachments: [],
        reorderedAttachments: [],
        error: errorMessage
      };
    }
  }, [config.workflowName, attachmentManager]);

  executeWorkflowRef.current = executeWorkflow;

  // ============================================================================
  // UTILITIES
  // ============================================================================

  /**
   * Get current step
   */
  const getCurrentStep = useCallback((): WorkflowStep | null => {
    return workflowState.steps.find(step => step.id === workflowState.currentStep) || null;
  }, [workflowState.currentStep, workflowState.steps]);

  /**
   * Get step by ID
   */
  const getStepById = useCallback((stepId: string): WorkflowStep | null => {
    return workflowState.steps.find(step => step.id === stepId) || null;
  }, [workflowState.steps]);

  // Computed properties
  const canProceed = workflowState.isRunning && !workflowState.hasErrors;
  const canGoBack = workflowState.currentStep !== null && workflowState.steps.findIndex(step => step.id === workflowState.currentStep) > 0;
  const isRunning = workflowState.isRunning;
  const isComplete = workflowState.isComplete;
  const hasErrors = workflowState.hasErrors;
  const totalProgress = workflowState.totalProgress;

  return {
    // Workflow state
    workflowState,
    
    // Attachment management
    attachmentManager,
    
    // Workflow control
    startWorkflow,
    pauseWorkflow,
    resumeWorkflow,
    cancelWorkflow,
    resetWorkflow,
    
    // Step control
    nextStep,
    previousStep,
    goToStep,
    skipStep,
    
    // Workflow execution
    executeWorkflow,
    
    // Utilities
    getCurrentStep,
    getStepById,
    canProceed,
    canGoBack,
    
    // Status
    isRunning,
    isComplete,
    hasErrors,
    totalProgress,
  };
};

export default useGenericAttachmentWorkflow;
