import React from 'react';
import { ShopPublishingProgress } from '@/services/business/ShopBusinessService';
import { logger } from '@/services/core/LoggingService';

interface EditProgressIndicatorProps {
  progress: ShopPublishingProgress;
  isVisible: boolean;
  onClose: () => void;
}

export const EditProgressIndicator: React.FC<EditProgressIndicatorProps> = ({
  progress,
  isVisible,
  onClose
}) => {
  const handleClose = () => {
    logger.info('Closing progress indicator', {
      service: 'EditProgressIndicator',
      method: 'handleClose',
      step: progress.step,
      progress: progress.progress,
    });
    onClose();
  };

  if (!isVisible) {
    return null;
  }

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
        return 'Uploading Image';
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

  const isComplete = progress.step === 'complete';
  const isError = progress.progress === 0 && progress.step !== 'uploading';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {isComplete ? 'Operation Complete' : 'Processing...'}
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
          {progress.details && (
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
};
