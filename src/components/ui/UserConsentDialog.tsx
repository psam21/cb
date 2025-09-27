/**
 * User Consent Dialog for Enhanced Sequential Upload
 * Transforms multiple signer prompts from "surprise annoyance" to "expected workflow"
 */

import { useState } from 'react';
import { formatFileSize } from '../../config/media';
import type { BatchUploadConsent } from '../../services/generic/GenericBlossomService';

export interface UserConsentDialogProps {
  isOpen: boolean;
  consent: BatchUploadConsent;
  onAccept: () => void;
  onCancel: () => void;
  onClose: () => void;
}

/**
 * Dialog that sets clear expectations before multiple file upload
 * Key to transforming UX from "surprise popups" to "informed consent"
 */
export const UserConsentDialog: React.FC<UserConsentDialogProps> = ({
  isOpen,
  consent,
  onAccept,
  onCancel,
  onClose
}) => {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!isOpen) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      onAccept();
    } finally {
      setIsAccepting(false);
    }
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getFileTypeBreakdown = () => {
    const breakdown: { [key: string]: number } = {};
    consent.files.forEach(file => {
      const type = file.type.split('/')[0] || 'other';
      breakdown[type] = (breakdown[type] || 0) + 1;
    });
    return breakdown;
  };

  const fileTypeBreakdown = getFileTypeBreakdown();
  const typeLabels: { [key: string]: string } = {
    image: 'Images',
    video: 'Videos', 
    audio: 'Audio files',
    other: 'Other files'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload {consent.fileCount} Files
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isAccepting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Information */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="font-medium text-blue-900">What to Expect</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">Files:</span>
                <div className="text-blue-800">{consent.fileCount} files</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Size:</span>
                <div className="text-blue-800">{formatFileSize(consent.totalSize)}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Time:</span>
                <div className="text-blue-800">~{formatTime(consent.estimatedTime)}</div>
              </div>
              <div>
                <span className="text-blue-700 font-medium">Approvals:</span>
                <div className="text-blue-800">{consent.requiredApprovals} prompts</div>
              </div>
            </div>
          </div>

          {/* File Type Breakdown */}
          {Object.keys(fileTypeBreakdown).length > 1 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">File Types</h4>
              <div className="space-y-1">
                {Object.entries(fileTypeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-gray-600">{typeLabels[type] || type}</span>
                    <span className="text-gray-900 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Signer Approval Process */}
          <div className="bg-amber-50 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="font-medium text-amber-900 mb-1">Signer Approvals Required</h4>
                <p className="text-sm text-amber-800">
                  Your browser extension will prompt you <strong>{consent.requiredApprovals} times</strong> to approve each file upload. 
                  This is normal and expected for secure file handling.
                </p>
              </div>
            </div>
          </div>

          {/* File List Preview */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Files to Upload</h4>
            <div className="max-h-32 overflow-y-auto border rounded-lg">
              {consent.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                    <span className="text-sm text-gray-900 truncate">{file.name}</span>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatFileSize(file.size)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Process Flow */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Upload Process</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Each file will be processed individually</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>You&apos;ll see progress updates for each file</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>Failed uploads won&apos;t stop the remaining files</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                <span>You can cancel at any time during upload</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 rounded-b-lg">
          <button
            onClick={onCancel}
            disabled={isAccepting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isAccepting && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>Start Upload</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConsentDialog;
