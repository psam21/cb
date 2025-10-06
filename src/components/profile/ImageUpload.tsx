/**
 * Image Upload Component for Profile Pictures and Banners
 * Uses existing useMediaUpload hook for Blossom CDN uploads
 */

import React, { useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { ImageCropper } from './ImageCropper';

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  label: string;
  aspectRatio?: 'square' | 'banner'; // square for profile pic, banner for banner image
  maxSizeMB?: number;
  enableCrop?: boolean; // Enable cropping feature
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImageUrl,
  onImageUploaded,
  label,
  aspectRatio = 'square',
  maxSizeMB = 10,
  enableCrop = true
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  
  const { getSigner } = useNostrSigner();
  const { uploadFiles, uploadState } = useMediaUpload();
  
  const isUploading = uploadState.isUploading;
  const uploadProgress = uploadState.progress?.overallProgress || 0;
  const uploadHookError = uploadState.error;

  const uploadImage = useCallback(async (file: File) => {
    try {
      // Get signer
      const signer = await getSigner();
      if (!signer) {
        setUploadError('No Nostr signer available. Please install a Nostr browser extension.');
        return;
      }

      // Upload to Blossom
      const result = await uploadFiles([file], signer);
      
      if (result.success && result.uploadedFiles.length > 0) {
        const uploadedUrl = result.uploadedFiles[0].url;
        onImageUploaded(uploadedUrl);
        setPreview(null);
      } else if (result.failedFiles.length > 0) {
        setUploadError(result.failedFiles[0].error || 'Failed to upload image');
      } else {
        setUploadError('Failed to upload image');
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }, [getSigner, onImageUploaded, uploadFiles]);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError(`File size must be less than ${maxSizeMB}MB`);
      return;
    }

    setUploadError(null);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageDataUrl = reader.result as string;
      
      if (enableCrop) {
        // Show cropper
        setImageToCrop(imageDataUrl);
        setShowCropper(true);
      } else {
        // Upload directly without cropping
        setPreview(imageDataUrl);
        uploadImage(file);
      }
    };
    reader.readAsDataURL(file);
  }, [maxSizeMB, enableCrop, uploadImage]);

  const handleCropComplete = useCallback(async (croppedBlob: Blob) => {
    setShowCropper(false);
    setImageToCrop(null);

    // Convert blob to File
    const croppedFile = new File([croppedBlob], 'cropped-image.jpg', {
      type: 'image/jpeg',
    });

    // Show preview of cropped image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);

    // Upload the cropped image
    await uploadImage(croppedFile);
  }, [uploadImage]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setImageToCrop(null);
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFileSelect(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileSelect]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);

  const displayError = uploadError || uploadHookError;
  const imageToShow = preview || currentImageUrl;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-accent-700 mb-2">
        {label}
      </label>

      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg transition-colors
          ${isDragOver ? 'border-accent-500 bg-accent-50' : 'border-accent-300 bg-white'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-accent-400'}
          ${aspectRatio === 'banner' ? 'aspect-[3/1]' : 'aspect-square'}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {imageToShow ? (
          <div className="relative w-full h-full">
            <Image
              src={imageToShow}
              alt={label}
              fill
              className="object-cover rounded-lg"
            />
            {!isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-opacity flex items-center justify-center rounded-lg">
                <div className="opacity-0 hover:opacity-100 text-white text-sm font-medium">
                  Click or drag to change
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
            <svg
              className="w-12 h-12 text-accent-400 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-accent-600 text-center">
              {isDragOver ? 'Drop image here' : 'Click or drag image to upload'}
            </p>
            <p className="text-xs text-accent-500 mt-1">
              Max {maxSizeMB}MB
            </p>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
            <div className="bg-white rounded-lg p-4 max-w-xs w-full mx-4">
              <div className="text-center mb-2 text-sm font-medium text-accent-800">
                Uploading...
              </div>
              <div className="w-full bg-accent-200 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <div className="text-center mt-2 text-xs text-accent-600">
                {uploadProgress}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInputChange}
        disabled={isUploading}
      />

      {/* Error Message */}
      {displayError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{displayError}</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-xs text-accent-600">
        {aspectRatio === 'banner' 
          ? 'Recommended: 1500x500px or 3:1 aspect ratio'
          : 'Recommended: Square image (1:1 aspect ratio)'}
      </p>

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          aspect={aspectRatio === 'banner' ? 3 : 1}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  );
};
