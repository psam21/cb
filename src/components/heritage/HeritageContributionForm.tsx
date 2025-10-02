'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { getHeritageCategories } from '@/config/categories';
import { 
  HERITAGE_TYPES, 
  TIME_PERIODS, 
  SOURCE_TYPES, 
  CONTRIBUTOR_ROLES
} from '@/config/heritage';
import { 
  REGIONS,
  getCountriesByRegion
} from '@/config/countries';
import { AttachmentManager } from '@/components/generic/AttachmentManager';
import { UserConsentDialog } from '@/components/generic/UserConsentDialog';
import { GenericAttachment } from '@/types/attachments';
import { X, Loader2 } from 'lucide-react';
import { useHeritagePublishing } from '@/hooks/useHeritagePublishing';
import { useHeritageEditing } from '@/hooks/useHeritageEditing';
import type { HeritageContributionData } from '@/types/heritage';

// Dynamic import for RichTextEditor (client-side only)
const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg border border-gray-300" />
  }
);

interface HeritageFormData {
  title: string;
  description: string;
  category: string;
  heritageType: string;
  language: string;
  communityGroup: string;
  region: string;
  country: string;
  timePeriod: string;
  sourceType: string;
  contributorRole: string;
  knowledgeKeeper: string;
  tags: string[];
}

interface HeritageContributionFormProps {
  onContributionCreated?: (contributionId: string) => void;
  onCancel?: () => void;
  defaultValues?: Partial<HeritageFormData & { 
    attachments: GenericAttachment[];
    dTag?: string; // For updating existing contributions
    contributionId?: string; // For editing with selective operations
  }>;
  isEditMode?: boolean;
}

export const HeritageContributionForm = ({ 
  onContributionCreated, 
  onCancel,
  defaultValues,
  isEditMode = false,
}: HeritageContributionFormProps) => {
  // Initialize hooks - use editing hook for edit mode, publishing hook for create mode
  const publishingHook = useHeritagePublishing();
  const editingHook = useHeritageEditing();
  
  // Choose the appropriate hook based on mode
  const {
    isPublishing,
    uploadProgress,
    currentStep,
    error: publishError,
    result,
    publishHeritage,
    consentDialog,
  } = isEditMode && defaultValues?.contributionId ? {
    isPublishing: editingHook.isUpdating,
    uploadProgress: editingHook.updateProgress,
    currentStep: editingHook.updateProgress?.step || 'idle',
    error: editingHook.updateError,
    result: null, // Editing doesn't use result the same way
    publishHeritage: async (data: HeritageContributionData, dTag?: string) => {
      // For editing, extract new files and track selective operations
      const newFiles = data.attachments.filter(a => a.originalFile).map(a => a.originalFile!);
      const existingAttachments = defaultValues?.attachments || [];
      const currentAttachmentIds = data.attachments.map(a => a.id);
      
      // Track removed and kept attachments
      const removedAttachments = existingAttachments
        .filter(a => !currentAttachmentIds.includes(a.id))
        .map(a => a.id);
      const keptAttachments = existingAttachments
        .filter(a => currentAttachmentIds.includes(a.id))
        .map(a => a.id);
      
      const result = await editingHook.updateContributionData(
        defaultValues.contributionId!,
        {
          title: data.title,
          description: data.description,
          category: data.category,
          heritageType: data.heritageType,
          language: data.language,
          community: data.community,
          region: data.region,
          country: data.country,
          timePeriod: data.timePeriod,
          sourceType: data.sourceType,
          contributorRole: data.contributorRole,
          knowledgeKeeperContact: data.knowledgeKeeperContact,
          tags: data.tags,
        },
        newFiles,
        { removedAttachments, keptAttachments }
      );
      
      return result;
    },
    consentDialog: publishingHook.consentDialog, // Use publishing hook's consent dialog
  } : publishingHook;

  const [formData, setFormData] = useState<HeritageFormData>({
    title: defaultValues?.title || '',
    description: defaultValues?.description || '',
    category: defaultValues?.category || '',
    heritageType: defaultValues?.heritageType || '',
    language: defaultValues?.language || '',
    communityGroup: defaultValues?.communityGroup || '',
    region: defaultValues?.region || '',
    country: defaultValues?.country || '',
    timePeriod: defaultValues?.timePeriod || '',
    sourceType: defaultValues?.sourceType || '',
    contributorRole: defaultValues?.contributorRole || '',
    knowledgeKeeper: defaultValues?.knowledgeKeeper || '',
    tags: defaultValues?.tags || [],
  });
  const [attachments, setAttachments] = useState<GenericAttachment[]>(defaultValues?.attachments || []);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof HeritageFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAttachmentsChange = (newAttachments: GenericAttachment[]) => {
    setAttachments(newAttachments);
    
    // Clear any attachment-related errors
    if (errors.attachments) {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const handleAttachmentError = (error: string) => {
    setErrors(prev => ({ ...prev, attachments: error }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: newTags }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Map form data to HeritageContributionData
    const heritageData: HeritageContributionData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      heritageType: formData.heritageType,
      language: formData.language,
      community: formData.communityGroup,
      region: formData.region,
      country: formData.country,
      timePeriod: formData.timePeriod,
      sourceType: formData.sourceType,
      contributorRole: formData.contributorRole,
      knowledgeKeeperContact: formData.knowledgeKeeper,
      tags: formData.tags,
      attachments: attachments,
    };
    
    // Publish to Nostr (pass dTag if editing)
    const publishResult = await publishHeritage(
      heritageData, 
      defaultValues?.dTag // Pass existing dTag for updates
    );
    
    // Handle success
    if (publishResult.success && publishResult.eventId) {
      // Reset form on success
      setFormData({
        title: '',
        description: '',
        category: '',
        heritageType: '',
        language: '',
        communityGroup: '',
        region: '',
        country: '',
        timePeriod: '',
        sourceType: '',
        contributorRole: '',
        knowledgeKeeper: '',
        tags: [],
      });
      setAttachments([]);
      setTagInput('');
      setErrors({});
      
      // Call the callback if provided
      if (onContributionCreated) {
        onContributionCreated(publishResult.eventId);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-serif font-bold text-primary-800 mb-2">
          {isEditMode ? 'Edit Heritage Contribution' : 'Contribute Heritage'}
        </h2>
        <p className="text-gray-600">
          {isEditMode 
            ? 'Update your cultural knowledge, traditions, and stories.'
            : 'Share cultural knowledge, traditions, and stories to preserve them for future generations.'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <fieldset disabled={isPublishing} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-primary-800">Basic Information</h3>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Navajo Weaving Technique, Māori Haka Tradition"
              maxLength={100}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>

          {/* Category and Heritage Type */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.category ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a category</option>
                {getHeritageCategories().map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
            </div>

            <div>
              <label htmlFor="heritageType" className="block text-sm font-medium text-gray-700 mb-2">
                Heritage Type <span className="text-red-500">*</span>
              </label>
              <select
                id="heritageType"
                value={formData.heritageType}
                onChange={(e) => handleInputChange('heritageType', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.heritageType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select heritage type</option>
                {HERITAGE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.heritageType && <p className="mt-1 text-sm text-red-600">{errors.heritageType}</p>}
            </div>
          </div>
        </div>

        {/* Section 2: Cultural Details */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-primary-800">Cultural Details</h3>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Provide a detailed description of this cultural contribution using rich formatting
            </p>
            <RichTextEditor
              value={formData.description}
              onChange={(value) => handleInputChange('description', value)}
              placeholder="Describe the tradition, practice, or knowledge. Include its significance, how it's practiced, and any important details..."
              maxLength={5000}
              minHeight={200}
              error={errors.description}
            />
          </div>

          {/* Language and Community */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <input
                type="text"
                id="language"
                value={formData.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Navajo (Diné bizaad), Te Reo Māori"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="communityGroup" className="block text-sm font-medium text-gray-700 mb-2">
                Community/Group
              </label>
              <input
                type="text"
                id="communityGroup"
                value={formData.communityGroup}
                onChange={(e) => handleInputChange('communityGroup', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., Hopi Tribe, Ngāi Tahu, Andean Communities"
                maxLength={100}
              />
            </div>
          </div>

          {/* Region and Country */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-2">
                Region <span className="text-red-500">*</span>
              </label>
              <select
                id="region"
                value={formData.region}
                onChange={(e) => {
                  handleInputChange('region', e.target.value);
                  // Reset country when region changes
                  handleInputChange('country', '');
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.region ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Region</option>
                {REGIONS.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name}
                  </option>
                ))}
              </select>
              {errors.region && <p className="mt-1 text-sm text-red-600">{errors.region}</p>}
            </div>

            <div>
              <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                disabled={!formData.region}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.country ? 'border-red-500' : 'border-gray-300'
                } ${!formData.region ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              >
                <option value="">Select Country</option>
                {formData.region && getCountriesByRegion(formData.region).map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>
          </div>
        </div>

        {/* Section 3: Historical Context */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-primary-800">Historical Context</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Time Period */}
            <div>
              <label htmlFor="timePeriod" className="block text-sm font-medium text-gray-700 mb-2">
                Time Period/Era <span className="text-red-500">*</span>
              </label>
              <select
                id="timePeriod"
                value={formData.timePeriod}
                onChange={(e) => handleInputChange('timePeriod', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.timePeriod ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select time period</option>
                {TIME_PERIODS.map((period) => (
                  <option key={period.id} value={period.id}>
                    {period.name}
                  </option>
                ))}
              </select>
              {errors.timePeriod && <p className="mt-1 text-sm text-red-600">{errors.timePeriod}</p>}
            </div>

            {/* Source Type */}
            <div>
              <label htmlFor="sourceType" className="block text-sm font-medium text-gray-700 mb-2">
                Source Type <span className="text-red-500">*</span>
              </label>
              <select
                id="sourceType"
                value={formData.sourceType}
                onChange={(e) => handleInputChange('sourceType', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.sourceType ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">How was this knowledge obtained?</option>
                {SOURCE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {errors.sourceType && <p className="mt-1 text-sm text-red-600">{errors.sourceType}</p>}
            </div>
          </div>
        </div>

        {/* Section 4: Media & Attachments */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-primary-800">Media & Attachments</h3>
            <p className="text-sm text-gray-600 mt-1">
              Upload photos, videos, or audio recordings to document this cultural heritage
            </p>
          </div>

          <AttachmentManager
            initialAttachments={attachments}
            onAttachmentsChange={handleAttachmentsChange}
            onError={handleAttachmentError}
            config={{
              maxAttachments: 5,
              supportedTypes: ['image/*', 'video/*', 'audio/*'],
            }}
          />
          {errors.attachments && <p className="mt-2 text-sm text-red-600">{errors.attachments}</p>}
        </div>

        {/* Section 5: Contact & Attribution */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-primary-800">Contact & Attribution</h3>
          </div>

          {/* Contributor Role */}
          <div>
            <label htmlFor="contributorRole" className="block text-sm font-medium text-gray-700 mb-2">
              Your Role
            </label>
            <select
              id="contributorRole"
              value={formData.contributorRole}
              onChange={(e) => handleInputChange('contributorRole', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Select your role</option>
              {CONTRIBUTOR_ROLES.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="knowledgeKeeper" className="block text-sm font-medium text-gray-700 mb-2">
              Knowledge Keeper Contact
            </label>
            <p className="text-sm text-gray-500 mb-2">
              Person or organization to contact for more information about this contribution
            </p>
            <input
              type="text"
              id="knowledgeKeeper"
              value={formData.knowledgeKeeper}
              onChange={(e) => handleInputChange('knowledgeKeeper', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="e.g., Elder John Doe, Tribal Cultural Office"
              maxLength={150}
            />
          </div>
        </div>

        {/* Section 6: Tags & Keywords */}
        <div className="space-y-6">
          <div className="border-b border-gray-200 pb-2">
            <h3 className="text-xl font-serif font-bold text-primary-800">Tags & Keywords</h3>
            <p className="text-sm text-gray-600 mt-1">
              Add keywords to help others discover this contribution
            </p>
          </div>

          <div>
            <label htmlFor="tagInput" className="block text-sm font-medium text-gray-700 mb-2">
              Add Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="tagInput"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g., weaving, traditional, textile"
                maxLength={30}
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-6 py-3 bg-primary-700 hover:bg-primary-800 text-white rounded-lg transition-colors duration-200"
              >
                Add Tag
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-2 hover:text-primary-900"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        </fieldset>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isPublishing}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPublishing}
            className="px-8 py-3 bg-accent-500 hover:bg-accent-600 text-white rounded-lg transition-colors duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPublishing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isPublishing 
              ? (isEditMode ? 'Updating...' : 'Publishing...') 
              : (isEditMode ? 'Update Contribution' : 'Submit Contribution')
            }
          </button>
        </div>

        {/* Publishing Progress */}
        {isPublishing && currentStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>{isEditMode ? 'Updating' : 'Publishing'}:</strong> {currentStep}
              {typeof uploadProgress === 'number' && uploadProgress > 0 && uploadProgress < 100 && (
                <span className="ml-2">({uploadProgress}%)</span>
              )}
              {typeof uploadProgress === 'object' && uploadProgress?.progress !== undefined && (
                <span className="ml-2">({uploadProgress.progress}%)</span>
              )}
            </p>
          </div>
        )}

        {/* Success Message */}
        {result?.success && result.eventId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <strong>Success!</strong> Your heritage contribution has been {isEditMode ? 'updated' : 'published'} successfully.
            </p>
          </div>
        )}

        {/* Error Message */}
        {publishError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {publishError}
            </p>
          </div>
        )}
      </form>

      {/* Consent Dialog */}
      <UserConsentDialog
        isOpen={consentDialog.isOpen}
        onClose={consentDialog.closeDialog}
        onConfirm={(accepted) => {
          if (accepted) {
            consentDialog.acceptConsent();
          } else {
            consentDialog.cancelConsent();
          }
        }}
        files={consentDialog.consent?.files?.map(f => new File([], f.name, { type: f.type })) || []}
        estimatedTime={consentDialog.consent?.estimatedTime || 0}
        totalSize={consentDialog.consent?.totalSize || 0}
      />
    </div>
  );
};
