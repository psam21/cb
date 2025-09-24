'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserProfile } from '@/services/business/ProfileBusinessService';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { 
    profile, 
    stats, 
    isLoadingProfile, 
    isLoadingStats, 
    profileError, 
    statsError,
    updateProfile
  } = useUserProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

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

    setIsSaving(true);
    setSaveError(null);

    try {
      const success = await updateProfile(editForm);
      if (success) {
        setIsEditing(false);
        setEditForm({});
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string | boolean) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
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
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-primary-800">My Profile</h1>
              <p className="text-primary-600 mt-2">
                Manage your Nostr identity and shop statistics
              </p>
            </div>
            <div className="flex space-x-3">
              {!isEditing ? (
                <button
                  onClick={handleEdit}
                  className="btn-outline-sm"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="btn-outline-sm"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="btn-primary-sm"
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
              <button
                onClick={handleLogout}
                className="btn-outline-sm text-red-600 hover:text-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Info */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="p-6">
                <h2 className="text-xl font-serif font-bold text-primary-800 mb-6">Profile Information</h2>
                
                {saveError && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-red-800">Save Failed</h3>
                        <div className="mt-2 text-sm text-red-700">{saveError}</div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Display Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.display_name || ''}
                        onChange={(e) => handleInputChange('display_name', e.target.value)}
                        className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Enter your display name"
                        maxLength={100}
                      />
                    ) : (
                      <p className="text-primary-800 font-medium">
                        {profile?.display_name || 'Anonymous'}
                      </p>
                    )}
                  </div>

                  {/* About */}
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      About
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editForm.about || ''}
                        onChange={(e) => handleInputChange('about', e.target.value)}
                        className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="Tell us about yourself"
                        rows={4}
                        maxLength={1000}
                      />
                    ) : (
                      <p className="text-primary-600 whitespace-pre-wrap">
                        {profile?.about || 'No description provided'}
                      </p>
                    )}
                  </div>

                  {/* Website */}
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Website
                    </label>
                    {isEditing ? (
                      <input
                        type="url"
                        value={editForm.website || ''}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="https://your-website.com"
                      />
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
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Birthday
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editForm.birthday || ''}
                        onChange={(e) => handleInputChange('birthday', e.target.value)}
                        className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-primary-600">
                        {profile?.birthday || 'No birthday provided'}
                      </p>
                    )}
                  </div>

                  {/* Bot Status */}
                  <div>
                    <label className="block text-sm font-medium text-primary-700 mb-2">
                      Account Type
                    </label>
                    {isEditing ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editForm.bot || false}
                          onChange={(e) => handleInputChange('bot', e.target.checked)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
                        />
                        <span className="ml-2 text-sm text-primary-700">
                          This is a bot account
                        </span>
                      </label>
                    ) : (
                      <p className="text-primary-600">
                        {profile?.bot ? 'Bot Account' : 'Human Account'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-serif font-bold text-primary-800 mb-4">Profile Picture</h3>
                <div className="text-center">
                  {profile?.picture ? (
                    <img
                      src={profile.picture}
                      alt="Profile"
                      className="w-24 h-24 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )}
                  <p className="text-sm text-primary-600">
                    {profile?.picture ? 'Profile picture set' : 'No profile picture'}
                  </p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-serif font-bold text-primary-800 mb-4">Shop Statistics</h3>
                {isLoadingStats ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    <p className="text-sm text-primary-600">Loading stats...</p>
                  </div>
                ) : statsError ? (
                  <div className="text-center">
                    <p className="text-sm text-red-600">{statsError}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600">Products Created</span>
                      <span className="font-bold text-primary-800">{stats?.productsCreated || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary-600">Last Active</span>
                      <span className="font-bold text-primary-800">
                        {stats?.lastActive ? new Date(stats.lastActive).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Public Key Info */}
            <div className="card">
              <div className="p-6">
                <h3 className="text-lg font-serif font-bold text-primary-800 mb-4">Public Key</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-medium text-primary-600 mb-1">npub</label>
                    <p className="text-sm font-mono text-primary-800 break-all">
                      {user.npub || 'Generating...'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-primary-600 mb-1">pubkey</label>
                    <p className="text-sm font-mono text-primary-800 break-all">
                      {user.pubkey.substring(0, 16)}...{user.pubkey.substring(-16)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
