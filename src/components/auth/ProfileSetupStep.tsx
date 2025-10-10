/**
 * ProfileSetupStep Component
 * 
 * Step 1 of sign-up: Collect profile information
 * - Display name (required, max 100 chars)
 * - Bio (optional, max 1000 chars)
 * - Avatar (optional, simple file input - cropping happens in Step 2)
 * 
 * @module components/auth/ProfileSetupStep
 */

'use client';

import React, { useState } from 'react';

interface ProfileSetupStepProps {
  displayName: string;
  bio: string;
  avatarFile: File | null;
  onDisplayNameChange: (name: string) => void;
  onBioChange: (bio: string) => void;
  onAvatarChange: (file: File | null) => void;
  onNext: () => void;
}

export default function ProfileSetupStep({
  displayName,
  bio,
  // avatarFile is used by parent but not displayed in this component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  avatarFile,
  onDisplayNameChange,
  onBioChange,
  onAvatarChange,
  onNext,
}: ProfileSetupStepProps) {
  const [displayNameError, setDisplayNameError] = useState<string>('');
  const [bioError, setBioError] = useState<string>('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  // Validate display name
  const validateDisplayName = (name: string): boolean => {
    if (!name.trim()) {
      setDisplayNameError('Display name is required');
      return false;
    }
    if (name.length > 100) {
      setDisplayNameError('Display name must be 100 characters or less');
      return false;
    }
    setDisplayNameError('');
    return true;
  };

  // Validate bio
  const validateBio = (bioText: string): boolean => {
    if (bioText.length > 1000) {
      setBioError('Bio must be 1000 characters or less');
      return false;
    }
    setBioError('');
    return true;
  };

  // Handle display name change
  const handleDisplayNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onDisplayNameChange(value);
    validateDisplayName(value);
  };

  // Handle bio change
  const handleBioChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    onBioChange(value);
    validateBio(value);
  };

  // Handle avatar file selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }
    
    onAvatarChange(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
  };

  // Handle remove avatar
  const handleRemoveAvatar = () => {
    onAvatarChange(null);
    setAvatarPreview('');
    
    // Clean up preview URL
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
  };

  // Handle next button
  const handleNext = () => {
    const isNameValid = validateDisplayName(displayName);
    const isBioValid = validateBio(bio);
    
    if (isNameValid && isBioValid) {
      onNext();
    }
  };

  return (
    <div className="space-y-8">
      {/* Form Section */}
      <div className="space-y-6">
        {/* Display Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-2">
            This is how others will see you on the platform. Choose a name that represents you.
          </p>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={handleDisplayNameChange}
            maxLength={100}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              displayNameError
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            placeholder="Your name"
          />
          {displayNameError && (
            <p className="mt-1 text-sm text-red-600">{displayNameError}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {displayName.length}/100 characters
          </p>
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio (Optional)
          </label>
          <p className="text-sm text-gray-500 mb-2">
            Tell others about yourself, your interests, or your cultural background.
          </p>
          <textarea
            id="bio"
            value={bio}
            onChange={handleBioChange}
            maxLength={1000}
            rows={4}
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              bioError
                ? 'border-red-500'
                : 'border-gray-300'
            }`}
            placeholder="Tell us about yourself..."
          />
        {bioError && (
          <p className="mt-1 text-sm text-red-600">{bioError}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {bio.length}/1000 characters
        </p>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Profile Picture (Optional)
        </label>
        <p className="text-sm text-gray-500 mb-2">
          Upload a square image for best results. You can crop it after generating your keys.
        </p>
        
        {avatarPreview ? (
          <div className="flex items-center space-x-4">
            <img
              src={avatarPreview}
              alt="Avatar preview"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            <button
              type="button"
              onClick={handleRemoveAvatar}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-md hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <label
              htmlFor="avatar-upload"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Choose Image
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, GIF up to 10MB
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={handleNext}
          disabled={!displayName.trim() || !!displayNameError || !!bioError}
          className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
