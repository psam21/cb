import { 
  updateHeritageWithAttachments, 
  UpdateHeritageResult, 
  HeritagePublishingProgress 
} from '@/services/business/HeritageContentService';
import type { HeritageContributionData } from '@/types/heritage';
import { useContentEditing, type SimpleUpdateFunction } from './useContentEditing';

/**
 * Hook for editing heritage contributions
 * 
 * Uses generic useContentEditing hook to handle common editing patterns:
 * - Signer validation
 * - State management (isUpdating, updateError, updateProgress)
 * - Progress tracking
 * - Error handling
 * - Logging
 */
export function useHeritageEditing() {
  // Wrap the service function to match SimpleUpdateFunction signature
  const updateFn: SimpleUpdateFunction<HeritageContributionData, UpdateHeritageResult, HeritagePublishingProgress> = async (
    contentId,
    updatedData,
    attachmentFiles,
    signer,
    onProgress,
    selectiveOps
  ) => {
    return await updateHeritageWithAttachments(
      contentId,
      updatedData,
      attachmentFiles,
      signer,
      onProgress,
      selectiveOps
    );
  };

  const {
    isUpdating,
    updateError,
    updateProgress,
    updateContent,
    clearUpdateError,
  } = useContentEditing<HeritageContributionData, UpdateHeritageResult, HeritagePublishingProgress>(
    'useHeritageEditing',
    updateFn,
    false // Heritage update doesn't require pubkey parameter
  );

  return {
    isUpdating,
    updateError,
    updateProgress,
    updateContributionData: updateContent,
    clearUpdateError,
  };
}
