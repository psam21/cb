/**
 * Multi-Media Progress Indicator Component
 * Displays progress for both single operations and multi-file selective operations
 */

import React from 'react';
import { ShopPublishingProgress } from '@/services/business/ShopBusinessService';
import { MultiFileProgressTracker, ProgressAnalytics, FileProgressState } from '@/services/generic/MultiFileProgressTracker';
import { logger } from '@/services/core/LoggingService';

interface MultiMediaProgressIndicatorProps {
  // Single operation progress (existing)
  progress?: ShopPublishingProgress | null;
  
  // Multi-file progress (new)
  multiFileTracker?: MultiFileProgressTracker | null;
  multiFileAnalytics?: ProgressAnalytics | null;
  
  // Common props
  isVisible: boolean;
  onClose: () => void;
  title?: string;
  showDetails?: boolean;
}

export const MultiMediaProgressIndicator: React.FC<MultiMediaProgressIndicatorProps> = ({
  progress,
  multiFileTracker,
  multiFileAnalytics,
  isVisible,
  onClose,
  title = 'Processing Media',
  showDetails = true
}) => {
  const handleClose = () => {
    logger.info('Closing multi-media progress indicator', {
      service: 'MultiMediaProgressIndicator',
      method: 'handleClose',
      hasProgress: !!progress,
      hasMultiFileTracker: !!multiFileTracker,
    });
    onClose();
  };

  if (!isVisible) {
    return null;
  }

  // Determine if we're showing single operation or multi-file progress
  const isMultiFile = multiFileTracker && multiFileAnalytics;
  const isSingleOperation = progress && !isMultiFile;

  const getStepIcon = (step: string) => {
    switch (step) {
      case 'uploading':
        return (
          <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        );
      case 'creating_event':
        return (
          <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'publishing':
        return (
          <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        );
      case 'complete':
        return (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getStepTitle = (step: string) => {
    switch (step) {
      case 'uploading':
        return 'Uploading Media';
      case 'creating_event':
        return 'Creating Event';
      case 'publishing':
        return 'Publishing to Relays';
      case 'complete':
        return 'Complete';
      default:
        return 'Processing';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Single operation rendering
  if (isSingleOperation) {
    const isComplete = progress.step === 'complete';
    const isError = progress.progress === 0 && progress.step !== 'uploading';

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-md w-full mx-4">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isComplete ? 'Operation Complete' : title}
              </h3>
              {isComplete && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div className={`flex-shrink-0 ${isComplete ? 'text-green-600' : 'text-accent-600'}`}>
                {getStepIcon(progress.step)}
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">
                  {getStepTitle(progress.step)}
                </h4>
                <p className="text-sm text-gray-600">
                  {progress.message}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progress</span>
                <span className="text-sm text-gray-600">
                  {progress.progress}%
                </span>
              </div>
              <div className={`w-full rounded-full h-2 ${
                isComplete ? 'bg-green-200' : isError ? 'bg-red-200' : 'bg-accent-200'
              }`}>
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isComplete ? 'bg-green-600' : isError ? 'bg-red-600' : 'bg-accent-600'
                  }`}
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>

            {/* Details */}
            {progress.details && showDetails && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  {progress.details}
                </p>
              </div>
            )}

            {/* Status Message */}
            {isComplete && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">
                    Operation completed successfully!
                  </p>
                </div>
              </div>
            )}

            {isError && (
              <div className="p-4 bg-red-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-red-700">
                    Operation failed. Please try again.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            {isComplete && (
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Multi-file operation rendering
  if (isMultiFile) {
    const isComplete = multiFileAnalytics.completedFiles === multiFileAnalytics.totalFiles;
    const hasErrors = multiFileAnalytics.failedFiles > 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isComplete ? 'Upload Complete' : title}
              </h3>
              {isComplete && (
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Overall Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                <span className="text-sm text-gray-600">
                  {multiFileAnalytics.completedFiles} / {multiFileAnalytics.totalFiles} files
                </span>
              </div>
              <div className={`w-full rounded-full h-3 ${
                isComplete ? 'bg-green-200' : hasErrors ? 'bg-yellow-200' : 'bg-accent-200'
              }`}>
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    isComplete ? 'bg-green-600' : hasErrors ? 'bg-yellow-600' : 'bg-accent-600'
                  }`}
                  style={{ width: `${multiFileAnalytics.overallProgress}%` }}
                />
              </div>
            </div>

            {/* Analytics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Total Size</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatFileSize(multiFileAnalytics.totalSize)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Uploaded</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatFileSize(multiFileAnalytics.uploadedSize)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Elapsed Time</div>
                <div className="text-lg font-semibold text-gray-900">
                  {formatTime(multiFileAnalytics.elapsedTime)}
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700">Est. Remaining</div>
                <div className="text-lg font-semibold text-gray-900">
                  {multiFileAnalytics.estimatedTimeRemaining > 0 ? formatTime(multiFileAnalytics.estimatedTimeRemaining) : 'Complete'}
                </div>
              </div>
            </div>

            {/* File Status List */}
            {showDetails && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">File Status</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {multiFileTracker!.getFileStates().map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          file.status === 'completed' ? 'bg-green-500' :
                          file.status === 'failed' ? 'bg-red-500' :
                          file.status === 'uploading' ? 'bg-blue-500' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-sm text-gray-700 truncate max-w-48">
                          {file.name}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {file.status === 'completed' ? '✓' :
                         file.status === 'failed' ? '✗' :
                         file.status === 'uploading' ? `${file.progress}%` :
                         '⏳'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Messages */}
            {isComplete && !hasErrors && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-700">
                    All files uploaded successfully!
                  </p>
                </div>
              </div>
            )}

            {isComplete && hasErrors && (
              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-sm text-yellow-700">
                    Upload completed with {multiFileAnalytics.failedFiles} failed files.
                  </p>
                </div>
              </div>
            )}

            {/* Close Button */}
            {isComplete && (
              <div className="flex justify-end">
                <button
                  onClick={handleClose}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback - should not happen
  return null;
};
