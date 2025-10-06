'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { UserProfile } from '@/services/business/ProfileBusinessService';
import { ImageUpload } from '@/components/profile/ImageUpload';
import { validateProfileFields } from '@/utils/profileValidation';

// Dynamic import for RichTextEditor (client-only for Vercel compatibility)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => (
      <div className="animate-pulse h-48 bg-gray-100 rounded-lg border border-accent-300" />
    )
  }
);

// Dynamic import for MarkdownRenderer
const MarkdownRenderer = dynamic(
  () => import('@/components/ui/MarkdownRenderer').then(mod => ({ default: mod.MarkdownRenderer })),
  { ssr: false }
);

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { getSigner } = useNostrSigner();
  const { 
    profile, 
    stats, 
    isLoadingProfile, 
    isLoadingStats, 
    profileError, 
    statsError,
    publishProfile,
    isPublishing,
    publishError,
    publishedRelays,
    failedRelays
  } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated || !user) {
    router.push('/signin');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Redirecting to Sign In...</h1>
          <p className="text-gray-600">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setEditForm(profile || {});
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setEditForm({});
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editForm) return;

    // Validate all fields
    const errors = validateProfileFields(editForm);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSaveError('Please fix the errors before publishing');
      return;
    }

    setFieldErrors({});
    setSaveError(null);
    setPublishSuccess(false);

    try {
      // Get signer from browser extension
      const signer = await getSigner();
      if (!signer) {
        setSaveError('No Nostr signer available. Please install a Nostr browser extension.');
        return;
      }

      // Publish profile to Nostr
      const success = await publishProfile(editForm, signer);
      
      if (success) {
        setIsEditing(false);
        setEditForm({});
        setPublishSuccess(true);
        
        // Clear success message after 5 seconds
        setTimeout(() => setPublishSuccess(false), 5000);
      } else {
        setSaveError(publishError || 'Failed to publish profile');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to publish profile');
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfilePictureUploaded = async (url: string) => {
    // Immediately publish the profile with new picture
    setSaveError(null);
    setPublishSuccess(false);

    try {
      const signer = await getSigner();
      if (!signer) {
        setSaveError('No Nostr signer available.');
        return;
      }

      const success = await publishProfile({ picture: url }, signer);
      
      if (success) {
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 5000);
      } else {
        setSaveError(publishError || 'Failed to publish profile picture');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to publish profile picture');
    }
  };

  const handleBannerUploaded = async (url: string) => {
    // Immediately publish the profile with new banner
    setSaveError(null);
    setPublishSuccess(false);

    try {
      const signer = await getSigner();
      if (!signer) {
        setSaveError('No Nostr signer available.');
        return;
      }

      const success = await publishProfile({ banner: url }, signer);
      
      if (success) {
        setPublishSuccess(true);
        setTimeout(() => setPublishSuccess(false), 5000);
      } else {
        setSaveError(publishError || 'Failed to publish banner');
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to publish banner');
    }
  };


  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-primary-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-md mx-auto p-8 card text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-serif font-bold text-primary-800 mb-2">Profile Error</h1>
          <p className="text-primary-600 mb-6">{profileError}</p>
          <button
            onClick={() => router.push('/')}
            className="btn-primary-sm"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="container-width section-padding">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-800">Nostr Profile</h1>
              <p className="text-accent-600 mt-2 font-medium">
                Manage your Nostr identity
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="btn-outline-sm"
                  disabled={isPublishing}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="btn-outline-sm"
                    disabled={isPublishing}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary-sm"
                    disabled={isPublishing}
                  >
                    {isPublishing ? 'Publishing...' : 'Publish to Nostr'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6">
                
                {/* Success Message */}
                {publishSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-green-800">Profile Published Successfully!</h3>
                        <div className="mt-2 text-sm text-green-700">
                          <p>Published to {publishedRelays.length} relay{publishedRelays.length !== 1 ? 's' : ''}.</p>
                          {failedRelays.length > 0 && (
                            <p className="mt-1 text-yellow-700">
                              Failed to publish to {failedRelays.length} relay{failedRelays.length !== 1 ? 's' : ''}.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {saveError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Publishing Failed</h3>
                        <div className="mt-2 text-sm text-red-700">{saveError}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editForm.display_name || ''}
                          onChange={(e) => handleInputChange('display_name', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            fieldErrors.display_name ? 'border-red-500' : 'border-accent-300'
                          }`}
                          placeholder="Enter your display name"
                          maxLength={100}
                        />
                        {fieldErrors.display_name && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.display_name}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-primary-800 font-medium">
                        {profile?.display_name || 'Anonymous'}
                      </p>
                    )}
                  </div>

                  {/* About */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      About
                    </label>
                    {isEditing ? (
                      <RichTextEditor
                        value={editForm.about || ''}
                        onChange={(value) => handleInputChange('about', value)}
                        placeholder="Tell us about yourself using rich formatting..."
                        maxLength={1000}
                        minHeight={150}
                      />
                    ) : (
                      <div className="text-primary-600">
                        {profile?.about ? (
                          <MarkdownRenderer content={profile.about} />
                        ) : (
                          <p className="text-gray-500 italic">No description provided</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      Website
                    </label>
                    {isEditing ? (
                      <>
                        <input
                          type="url"
                          value={editForm.website || ''}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            fieldErrors.website ? 'border-red-500' : 'border-accent-300'
                          }`}
                          placeholder="https://your-website.com"
                        />
                        {fieldErrors.website && (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.website}</p>
                        )}
                      </>
                    ) : (
                      <p className="text-primary-600">
                        {profile?.website ? (
                          <a 
                            href={profile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-accent-600 hover:text-accent-700 underline"
                          >
                            {profile.website}
                          </a>
                        ) : (
                          'No website provided'
                        )}
                      </p>
                    )}
                  </div>

                  {/* Birthday */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      Birthday
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.birthday || ''}
                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                        className="w-full px-4 py-3 border border-accent-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-primary-600">
                        {profile?.birthday || 'No birthday provided'}
                      </p>
                    )}
                  </div>

                  {/* Bot Status */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      Account Type
                    </label>
                    {isEditing ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.bot || false}
                          onChange={(e) => handleInputChange('bot', e.target.checked)}
                          className="h-4 w-4 text-accent-600 focus:ring-accent-500 border-accent-300 rounded"
                        />
                        <span className="ml-2 text-sm text-accent-700">
                          This is a bot account
                        </span>
                      </label>
                    ) : (
                      <p className="text-primary-600">
                        {profile?.bot ? 'Bot Account' : 'Human Account'}
                      </p>
                    )}
                  </div>

                  {/* Lightning Address (lud16) */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      Lightning Address (lud16)
                    </label>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editForm.lud16 || ''}
                          onChange={(e) => handleInputChange('lud16', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            fieldErrors.lud16 ? 'border-red-500' : 'border-accent-300'
                          }`}
                          placeholder="user@domain.com"
                        />
                        {fieldErrors.lud16 ? (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.lud16}</p>
                        ) : (
                          <p className="mt-1 text-xs text-accent-600">
                            Modern Lightning Address format. Example: satoshi@getalby.com
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-primary-600">
                        {profile?.lud16 || 'No lightning address provided'}
                      </p>
                    )}
                  </div>

                  {/* LNURL (lud06) */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      LNURL (lud06)
                    </label>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editForm.lud06 || ''}
                          onChange={(e) => handleInputChange('lud06', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            fieldErrors.lud06 ? 'border-red-500' : 'border-accent-300'
                          }`}
                          placeholder="lnurl1..."
                        />
                        {fieldErrors.lud06 ? (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.lud06}</p>
                        ) : (
                          <p className="mt-1 text-xs text-accent-600">
                            Legacy LNURL format. Starts with &ldquo;lnurl1&rdquo;. Most users should use Lightning Address instead.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-primary-600 break-all">
                        {profile?.lud06 || 'No LNURL provided'}
                      </p>
                    )}
                  </div>

                  {/* NIP-05 Verification */}
                  <div>
                    <label className="block text-sm font-medium text-accent-700 mb-2">
                      NIP-05 Identifier
                    </label>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editForm.nip05 || ''}
                          onChange={(e) => handleInputChange('nip05', e.target.value)}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                            fieldErrors.nip05 ? 'border-red-500' : 'border-accent-300'
                          }`}
                          placeholder="user@domain.com"
                        />
                        {fieldErrors.nip05 ? (
                          <p className="mt-1 text-sm text-red-600">{fieldErrors.nip05}</p>
                        ) : (
                          <p className="mt-1 text-xs text-accent-600">
                            DNS-based identity verification. Example: alice@example.com.{' '}
                            <a 
                              href="https://github.com/nostr-protocol/nips/blob/master/05.md" 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-accent-700 hover:text-accent-800 underline"
                            >
                              Learn more about NIP-05
                            </a>
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <p className="text-primary-600">
                          {profile?.nip05 || 'Not verified'}
                        </p>
                        {profile?.nip05 && (
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Banner Image */}
            <div className="card">
              <div className="p-6">
                <ImageUpload
                  currentImageUrl={profile?.banner}
                  onImageUploaded={handleBannerUploaded}
                  label="Banner Image"
                  aspectRatio="banner"
                  maxSizeMB={10}
                />
              </div>
            </div>

            {/* Profile Picture */}
            <div className="card">
              <div className="p-6">
                <ImageUpload
                  currentImageUrl={profile?.picture}
                  onImageUploaded={handleProfilePictureUploaded}
                  label="Profile Picture"
                  aspectRatio="square"
                  maxSizeMB={5}
                />
              </div>
            </div>

            {/* Statistics */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-serif font-bold text-accent-800 mb-4">Shop Statistics</h3>
                {isLoadingStats ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent-600 mx-auto mb-2"></div>
                    <p className="text-sm text-accent-600">Loading stats...</p>
                  </div>
                ) : statsError ? (
                  <div className="text-center">
                    <p className="text-sm text-red-600">{statsError}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-accent-600 font-medium">Products Created</span>
                      <span className="font-bold text-accent-800 bg-accent-100 px-2 py-1 rounded">{stats?.productsCreated || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-accent-600 font-medium">Last Active</span>
                      <span className="font-bold text-accent-800 bg-accent-100 px-2 py-1 rounded">
                        {stats?.lastActive ? new Date(stats.lastActive).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
