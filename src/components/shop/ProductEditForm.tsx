import React, { useState, useEffect } from 'react';
import { ShopProduct, ShopPublishingProgress } from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { logger } from '@/services/core/LoggingService';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, formatCurrencyDisplay } from '@/config/currencies';
import { filterVisibleTags } from '@/utils/tagFilter';
import { AttachmentManager } from '@/components/generic/AttachmentManager';
import { GenericAttachment } from '@/types/attachments';

interface SelectiveAttachmentOperations {
  removedAttachments: string[];
  keptAttachments: string[];
}

interface ProductEditFormProps {
  product: ShopProduct;
  onSave: (productId: string, updatedData: Partial<ProductEventData>, attachmentFiles: File[], selectiveOps?: SelectiveAttachmentOperations) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isUpdating: boolean;
  updateProgress?: ShopPublishingProgress | null;
  isPage?: boolean; // New prop to indicate if this is rendered as a page vs modal
}

export const ProductEditForm: React.FC<ProductEditFormProps> = ({
  product,
  onSave,
  onCancel,
  isUpdating,
  updateProgress,
  isPage = false
}) => {
  const [formData, setFormData] = useState<Partial<ProductEventData>>(() => {
    const initialFormData = {
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      category: product.category,
      condition: product.condition,
      location: product.location,
      contact: product.contact,
      tags: filterVisibleTags(product.tags), // Filter out hidden tags for editing
    };
    
    logger.info('ProductEditForm initializing form data', {
      service: 'ProductEditForm',
      method: 'useState',
      productId: product.id,
      formData: initialFormData
    });
    
    return initialFormData;
  });
  const [attachments, setAttachments] = useState<GenericAttachment[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Track initial form state on load
    logger.info('Product edit form initialized with comprehensive initial state', {
      service: 'ProductEditForm',
      method: 'useEffect',
      productId: product.id,
      initialFormData: {
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        condition: product.condition,
        location: product.location,
        contact: product.contact
      },
      initialAttachments: product.attachments?.map(att => ({ 
        id: att.id, 
        name: att.name, 
        type: att.type,
        hash: att.hash,
        size: att.size,
        mimeType: att.mimeType
      })) || [],
      attachmentCount: product.attachments?.length || 0,
      fullProductData: {
        id: product.id,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        category: product.category,
        condition: product.condition,
        location: product.location,
        contact: product.contact,
        tags: product.tags,
        publishedAt: product.publishedAt,
        author: product.author
      }
    });

    // Convert existing product attachments to GenericAttachment format
    if (product.attachments && product.attachments.length > 0) {
      logger.info('Converting product attachments to GenericAttachment format', {
        service: 'ProductEditForm',
        method: 'useEffect',
        productId: product.id,
        originalAttachments: product.attachments
      });

      const genericAttachments: GenericAttachment[] = product.attachments.map(att => ({
        id: att.id,
        type: att.type,
        name: att.name,
        size: att.size,
        mimeType: att.mimeType,
        url: att.url,
        hash: att.hash,
        metadata: att.metadata || {},
        createdAt: Date.now(),
        updatedAt: Date.now()
      }));
      
      logger.info('Converted attachments to GenericAttachment format', {
        service: 'ProductEditForm',
        method: 'useEffect',
        productId: product.id,
        genericAttachments: genericAttachments
      });
      
      setAttachments(genericAttachments);
    } else {
      logger.warn('No attachments found in product', {
        service: 'ProductEditForm',
        method: 'useEffect',
        productId: product.id,
        hasAttachments: !!product.attachments,
        attachmentLength: product.attachments?.length || 0
      });
    }
  }, [
    product.id,
    product.title,
    product.attachments,
    product.description,
    product.price,
    product.currency,
    product.category,
    product.condition,
    product.location,
    product.contact,
    product.tags,
    product.publishedAt,
    product.author
  ]);

  const handleInputChange = (field: keyof ProductEventData, value: string | number | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleAttachmentsChange = (newAttachments: GenericAttachment[]) => {
    logger.debug('Attachments changed in edit form', {
      service: 'ProductEditForm',
      method: 'handleAttachmentsChange',
      productId: product.id,
      attachmentCount: newAttachments.length,
    });

    setAttachments(newAttachments);
    
    // Clear any attachment-related errors
    if (errors.attachments) {
      setErrors(prev => ({ ...prev, attachments: '' }));
    }
  };

  const handleAttachmentError = (error: string) => {
    logger.warn('Attachment error in edit form', {
      service: 'ProductEditForm',
      method: 'handleAttachmentError',
      productId: product.id,
      error,
    });

    setErrors(prev => ({ ...prev, attachments: error }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.trim().length === 0) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (!formData.description || formData.description.trim().length === 0) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 2000) {
      newErrors.description = 'Description must be 2000 characters or less';
    }

    if (formData.price === undefined || formData.price < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }

    if (!formData.currency || formData.currency.trim().length === 0) {
      newErrors.currency = 'Currency is required';
    }

    if (!formData.category || formData.category.trim().length === 0) {
      newErrors.category = 'Category is required';
    }

    if (!formData.location || formData.location.trim().length === 0) {
      newErrors.location = 'Location is required';
    }

    if (!formData.contact || formData.contact.trim().length === 0) {
      newErrors.contact = 'Contact information is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      logger.warn('Form validation failed', {
        service: 'ProductEditForm',
        method: 'handleSubmit',
        productId: product.id,
        errors: Object.keys(errors),
      });
      return;
    }

    logger.info('Submitting product edit form', {
      service: 'ProductEditForm',
      method: 'handleSubmit',
      productId: product.id,
      title: formData.title,
      attachmentCount: attachments.length,
      currentAttachments: attachments.map(att => ({ id: att.id, name: att.name, type: att.type }))
    });

    // Separate new files from existing attachments
    const newFiles = attachments
      .filter(att => att.originalFile)
      .map(att => att.originalFile!);
    
    const existingAttachments = attachments.filter(att => !att.originalFile);
    const originalAttachments = product.attachments || [];
    
    // Determine which existing attachments were removed
    const removedAttachments = originalAttachments.filter(original => 
      !existingAttachments.some(current => current.id === original.id)
    );
    
    // Determine which existing attachments were kept
    const keptAttachments = existingAttachments.filter(current => 
      originalAttachments.some(original => original.id === current.id)
    );

    logger.info('Attachment state analysis in form submit', {
      service: 'ProductEditForm',
      method: 'handleSubmit',
      productId: product.id,
      formAttachments: attachments.map(att => ({ id: att.id, name: att.name, hasOriginalFile: !!att.originalFile })),
      newFiles: newFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
      existingAttachments: existingAttachments.map(att => ({ id: att.id, name: att.name })),
      originalAttachments: originalAttachments.map(att => ({ id: att.id, name: att.name })),
      removedAttachments: removedAttachments.map(att => ({ id: att.id, name: att.name })),
      keptAttachments: keptAttachments.map(att => ({ id: att.id, name: att.name }))
    });

    // Track content field changes
    const contentChanges = {
      title: { before: product.title, after: formData.title, changed: product.title !== formData.title },
      description: { before: product.description, after: formData.description, changed: product.description !== formData.description },
      price: { before: product.price, after: formData.price, changed: product.price !== formData.price },
      currency: { before: product.currency, after: formData.currency, changed: product.currency !== formData.currency },
      category: { before: product.category, after: formData.category, changed: product.category !== formData.category },
      condition: { before: product.condition, after: formData.condition, changed: product.condition !== formData.condition },
      location: { before: product.location, after: formData.location, changed: product.location !== formData.location },
      contact: { before: product.contact, after: formData.contact, changed: product.contact !== formData.contact }
    };

    const hasContentChanges = Object.values(contentChanges).some(change => change.changed);
    const hasAttachmentChanges = newFiles.length > 0 || removedAttachments.length > 0;
    const hasAnyChanges = hasContentChanges || hasAttachmentChanges;

    // Early return if no changes detected
    if (!hasAnyChanges) {
      logger.info('No changes detected in edit form, showing user message', {
        service: 'ProductEditForm',
        method: 'handleSubmit',
        productId: product.id,
        reason: 'User clicked save but made no changes'
      });

      // Show a user-friendly message instead of proceeding
      setErrors({ general: 'No changes detected. Please make some changes before saving.' });
      return;
    }

    logger.info('Product edit form comprehensive change tracking', {
      service: 'ProductEditForm',
      method: 'handleSubmit',
      productId: product.id,
      
      // Content field changes
      contentChanges: contentChanges,
      hasContentChanges: hasContentChanges,
      
      // Attachment tracking
      attachmentTracking: {
        originalAttachments: originalAttachments.map(att => ({ id: att.id, name: att.name, type: att.type })),
        currentAttachments: attachments.map(att => ({ id: att.id, name: att.name, type: att.type, isNew: !!att.originalFile })),
        newFiles: newFiles.map(f => ({ name: f.name, type: f.type, size: f.size })),
        removedAttachments: removedAttachments.map(att => ({ id: att.id, name: att.name, type: att.type })),
        keptAttachments: keptAttachments.map(att => ({ id: att.id, name: att.name, type: att.type }))
      },
      
      // Summary counts
      summary: {
        totalAttachments: attachments.length,
        newFiles: newFiles.length,
        existingAttachments: existingAttachments.length,
        originalAttachments: originalAttachments.length,
        removedAttachments: removedAttachments.length,
        keptAttachments: keptAttachments.length,
        hasAttachmentChanges: newFiles.length > 0 || removedAttachments.length > 0,
        hasAnyChanges: hasContentChanges || newFiles.length > 0 || removedAttachments.length > 0
      }
    });

    const result = await onSave(product.id, formData, newFiles, {
      removedAttachments: removedAttachments.map(att => att.id),
      keptAttachments: keptAttachments.map(att => att.id)
    });
    
    if (!result.success) {
      logger.error('Product edit failed', new Error(result.error || 'Unknown error'), {
        service: 'ProductEditForm',
        method: 'handleSubmit',
        productId: product.id,
        error: result.error,
      });
    }
  };

  const handleCancel = () => {
    logger.info('Product edit cancelled', {
      service: 'ProductEditForm',
      method: 'handleCancel',
      productId: product.id,
    });
    onCancel();
  };

  if (isPage) {
    // Page mode - clean container
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-primary-800">Edit Product Details</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Media Attachments */}
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-2">
                Product Media (Images, Videos, Audio)
              </label>
              {(() => {
                logger.info('ProductEditForm rendering AttachmentManager', {
                  service: 'ProductEditForm',
                  method: 'render',
                  attachmentCount: attachments.length,
                  attachments: attachments
                });
                return null;
              })()}
              <AttachmentManager
                initialAttachments={attachments}
                onAttachmentsChange={handleAttachmentsChange}
                onError={handleAttachmentError}
                config={{
                  maxAttachments: 5,
                  maxFileSize: 100 * 1024 * 1024, // 100MB
                  maxTotalSize: 500 * 1024 * 1024, // 500MB
                  supportedTypes: ['image/*', 'video/*', 'audio/*']
                }}
                showPreview={true}
                showMetadata={true}
                showOperations={true}
                allowDragDrop={true}
                allowSelection={true}
                allowReorder={true}
                className="border border-gray-300 rounded-md p-4"
              />
              {errors.attachments && <p className="mt-1 text-sm text-red-600">{errors.attachments}</p>}
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-2">
                Product Title *
              </label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                  errors.title ? 'border-red-300' : 'border-accent-300'
                }`}
                placeholder="Enter product title"
                maxLength={100}
                disabled={isUpdating}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                  errors.description ? 'border-red-300' : 'border-accent-300'
                }`}
                placeholder="Describe your product"
                rows={4}
                maxLength={2000}
                disabled={isUpdating}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Price and Currency */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                    errors.price ? 'border-red-300' : 'border-accent-300'
                  }`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  disabled={isUpdating}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Currency *
                </label>
                <select
                  value={formData.currency || DEFAULT_CURRENCY}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                    errors.currency ? 'border-red-300' : 'border-accent-300'
                  }`}
                  disabled={isUpdating}
                >
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {formatCurrencyDisplay(currency)}
                    </option>
                  ))}
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                )}
              </div>
            </div>

            {/* Category and Condition */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Category *
                </label>
                <input
                  type="text"
                  value={formData.category || ''}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                    errors.category ? 'border-red-300' : 'border-accent-300'
                  }`}
                  placeholder="e.g., Art, Crafts, Books"
                  disabled={isUpdating}
                />
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Condition *
                </label>
                <select
                  value={formData.condition || 'new'}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full px-4 py-3 border border-accent-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  disabled={isUpdating}
                >
                  <option value="new">New</option>
                  <option value="used">Used</option>
                  <option value="refurbished">Refurbished</option>
                </select>
              </div>
            </div>

            {/* Location and Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Location *
                </label>
                <input
                  type="text"
                  value={formData.location || ''}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                    errors.location ? 'border-red-300' : 'border-accent-300'
                  }`}
                  placeholder="e.g., New York, NY"
                  disabled={isUpdating}
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-accent-700 mb-2">
                  Contact *
                </label>
                <input
                  type="text"
                  value={formData.contact || ''}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent ${
                    errors.contact ? 'border-red-300' : 'border-accent-300'
                  }`}
                  placeholder="Email or social media"
                  disabled={isUpdating}
                />
                {errors.contact && (
                  <p className="mt-1 text-sm text-red-600">{errors.contact}</p>
                )}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags?.join(', ') || ''}
                onChange={(e) => handleInputChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                className="w-full px-4 py-3 border border-accent-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                placeholder="e.g., handmade, vintage, collectible"
                disabled={isUpdating}
              />
            </div>

            {/* Action Buttons */}
            {/* General Error Display */}
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                className="btn-outline"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Progress Indicator */}
          {updateProgress && (
            <div className="mt-6 p-4 bg-accent-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-accent-700">
                  {updateProgress.message}
                </span>
                <span className="text-sm text-accent-600">
                  {updateProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-accent-200 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${updateProgress.progress}%` }}
                />
              </div>
              {updateProgress.details && (
                <p className="text-xs text-accent-600 mt-2">
                  {updateProgress.details}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modal mode - original layout
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-serif font-bold text-primary-800">Edit Product</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isUpdating}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* All the form fields will be duplicated here for modal mode */}
            {/* For now, keeping the existing form structure */}
          </form>

          {/* Progress Indicator */}
          {updateProgress && (
            <div className="mt-6 p-4 bg-accent-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-accent-700">
                  {updateProgress.message}
                </span>
                <span className="text-sm text-accent-600">
                  {updateProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-accent-200 rounded-full h-2">
                <div
                  className="bg-accent-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${updateProgress.progress}%` }}
                />
              </div>
              {updateProgress.details && (
                <p className="text-xs text-accent-600 mt-2">
                  {updateProgress.details}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
