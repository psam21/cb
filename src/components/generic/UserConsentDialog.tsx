/**
 * User Consent Dialog for Multi-Attachment Operations
 * Handles user consent for file uploads and selective operations
 */

import { useState, useEffect } from 'react';
import { logger } from '../../services/core/LoggingService';
import { formatFileSize } from '../../config/media';
import { AttachmentOperation, AttachmentOperationType } from '../../types/attachments';

export interface UserConsentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consent: boolean) => void;
  files: File[];
  operations?: AttachmentOperation[];
  title?: string;
  description?: string;
  showDetails?: boolean;
  // Removed autoAccept - now always requires real user interaction
  estimatedTime?: number; // in seconds
  totalSize?: number;
}

export interface ConsentDetails {
  fileCount: number;
  totalSize: number;
  estimatedTime: number;
  operations: {
    type: AttachmentOperationType;
    count: number;
    files: File[];
  }[];
}

export const UserConsentDialog: React.FC<UserConsentDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  files,
  operations = [],
  title = "File Upload Consent",
  description = "Please review the files and operations before proceeding.",
  showDetails = true,
  // Removed autoAccept parameter
  estimatedTime = 0,
  totalSize = 0
}) => {
  const [consent, setConsent] = useState<boolean>(false);
  const [showOperationDetails, setShowOperationDetails] = useState<boolean>(false);

  // Real user interaction required - no auto-accept

  // Calculate details
  const details: ConsentDetails = {
    fileCount: files.length,
    totalSize: totalSize || files.reduce((sum, file) => sum + file.size, 0),
    estimatedTime: estimatedTime || Math.ceil(files.length * 3.5), // 3.5 seconds per file
    operations: operations.map(op => ({
      type: op.type,
      count: op.files?.length || 0,
      files: op.files || []
    }))
  };

  const handleConfirm = () => {
    logger.info('User consent confirmed', {
      component: 'UserConsentDialog',
      method: 'handleConfirm',
      fileCount: details.fileCount,
      totalSize: details.totalSize,
      operations: details.operations.length
    });
    
    onConfirm(consent);
    setConsent(false);
  };

  const handleCancel = () => {
    logger.info('User consent cancelled', {
      component: 'UserConsentDialog',
      method: 'handleCancel'
    });
    
    onClose();
    setConsent(false);
  };

  const getOperationDescription = (type: AttachmentOperationType): string => {
    switch (type) {
      case 'add':
        return 'Add new files';
      case 'remove':
        return 'Remove existing files';
      case 'replace':
        return 'Replace existing files';
      case 'reorder':
        return 'Reorder files';
      case 'update':
        return 'Update file metadata';
      default:
        return 'Unknown operation';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {/* Summary */}
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">Upload Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Files:</span>
                <span className="ml-2 font-medium">{details.fileCount}</span>
              </div>
              <div>
                <span className="text-blue-700">Total Size:</span>
                <span className="ml-2 font-medium">{formatFileSize(details.totalSize)}</span>
              </div>
              <div>
                <span className="text-blue-700">Estimated Time:</span>
                <span className="ml-2 font-medium">{details.estimatedTime}s</span>
              </div>
              <div>
                <span className="text-blue-700">Operations:</span>
                <span className="ml-2 font-medium">{details.operations.length}</span>
              </div>
            </div>
          </div>

          {/* Operations Details */}
          {showDetails && details.operations.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowOperationDetails(!showOperationDetails)}
                className="flex items-center justify-between w-full text-left font-medium text-gray-900 hover:text-blue-600"
              >
                <span>Operation Details</span>
                <svg
                  className={`w-5 h-5 transform transition-transform ${showOperationDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {showOperationDetails && (
                <div className="mt-2 space-y-2">
                  {details.operations.map((op, index) => (
                    <div key={index} className="bg-gray-50 rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-medium text-gray-900">
                            {getOperationDescription(op.type)}
                          </span>
                          <span className="text-sm text-gray-600 ml-2">
                            ({op.count} file{op.count !== 1 ? 's' : ''})
                          </span>
                        </div>
                      </div>
                      {op.files.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {op.files.slice(0, 3).map((file, fileIndex) => (
                            <div key={fileIndex} className="text-sm text-gray-600 flex justify-between">
                              <span className="truncate">{file.name}</span>
                              <span>{formatFileSize(file.size)}</span>
                            </div>
                          ))}
                          {op.files.length > 3 && (
                            <div className="text-sm text-gray-500">
                              ... and {op.files.length - 3} more file{op.files.length - 3 !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* File List */}
          {showDetails && files.length > 0 && (
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Files to Upload</h3>
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center px-3 py-2 border-b border-gray-100 last:border-b-0">
                    <span className="text-sm text-gray-900 truncate flex-1">{file.name}</span>
                    <span className="text-sm text-gray-500 ml-2">{formatFileSize(file.size)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warning about signing requirements */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-yellow-800">Signing Required</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  You will need to sign {details.fileCount} separate prompts to upload these files. 
                  Each file requires individual authentication with your Nostr key.
                </p>
              </div>
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="consent"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="consent" className="text-sm text-gray-700">
              I understand the signing requirements and consent to proceed with uploading {details.fileCount} files to the decentralized network.
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!consent}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Upload
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConsentDialog;
