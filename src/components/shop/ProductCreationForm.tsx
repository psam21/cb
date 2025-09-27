'use client';

import { useState, useRef } from 'react';
import { logger } from '@/services/core/LoggingService';
import { useShopPublishing } from '@/hooks/useShopPublishing';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { RelayPublishingProgress } from '@/services/generic/GenericRelayService';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, formatCurrencyDisplay } from '@/config/currencies';

interface ProductCreationFormProps {
  onProductCreated?: (productId: string) => void;
  onCancel?: () => void;
}

export const ProductCreationForm = ({ onProductCreated, onCancel }: ProductCreationFormProps) => {
  const { publishProduct, isPublishing, progress, lastResult, canPublish, resetPublishing } = useShopPublishing();
  const [formData, setFormData] = useState<ProductEventData>({
    title: '',
    description: '',
    price: 0,
    currency: DEFAULT_CURRENCY,
    tags: [],
    category: '',
    condition: 'new',
    location: '',
    contact: '',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof ProductEventData, value: string | number) => {
    logger.debug('Form input changed', {
      service: 'ProductCreationForm',
      method: 'handleInputChange',
      field,
      value: typeof value === 'string' ? value.substring(0, 50) : value,
    });

    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      logger.info('Image file selected', {
        service: 'ProductCreationForm',
        method: 'handleImageChange',
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      // Validate file
      if (file.size > 100 * 1024 * 1024) { // 100MB
        setErrors(prev => ({ ...prev, image: 'File size must be less than 100MB' }));
        return;
      }

      setImageFile(file);
      setErrors(prev => ({ ...prev, image: '' }));
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      const newTags = [...formData.tags, tagInput.trim()];
      setFormData(prev => ({ ...prev, tags: newTags }));
      setTagInput('');
      
      logger.debug('Tag added', {
        service: 'ProductCreationForm',
        method: 'handleAddTag',
        tag: tagInput.trim(),
        totalTags: newTags.length,
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = formData.tags.filter(tag => tag !== tagToRemove);
    setFormData(prev => ({ ...prev, tags: newTags }));
    
    logger.debug('Tag removed', {
      service: 'ProductCreationForm',
      method: 'handleRemoveTag',
      tag: tagToRemove,
      totalTags: newTags.length,
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be 0 or greater';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Category is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.contact.trim()) {
      newErrors.contact = 'Contact information is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    logger.info('Product form submitted', {
      service: 'ProductCreationForm',
      method: 'handleSubmit',
      title: formData.title,
      hasImage: !!imageFile,
    });

    if (!validateForm()) {
      logger.warn('Form validation failed', {
        service: 'ProductCreationForm',
        method: 'handleSubmit',
        errors: Object.keys(errors),
      });
      return;
    }

    if (!canPublish) {
      setErrors({ general: 'Nostr signer not available. Please install a Nostr extension.' });
      return;
    }

    const result = await publishProduct(formData, imageFile);
    
    if (result.success && result.product) {
      logger.info('Product created successfully', {
        service: 'ProductCreationForm',
        method: 'handleSubmit',
        productId: result.product.id,
        eventId: result.eventId,
      });
      
      onProductCreated?.(result.product.id);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: 0,
        currency: 'USD',
        tags: [],
        category: '',
        condition: 'new',
        location: '',
        contact: '',
      });
      setImageFile(null);
      setTagInput('');
      setErrors({});
      
      // Clear success message after a delay
      setTimeout(() => {
        resetPublishing();
      }, 3000);
    } else {
      logger.error('Product creation failed', new Error(result.error || 'Unknown error'), {
        service: 'ProductCreationForm',
        method: 'handleSubmit',
        error: result.error,
      });
      setErrors({ general: result.error || 'Failed to create product' });
    }
  };

  const getProgressMessage = (progress: RelayPublishingProgress): string => {
    switch (progress.step) {
      case 'connecting':
        return 'Connecting to relays...';
      case 'publishing':
        return `Publishing to relays: ${progress.message}`;
      case 'waiting':
        return 'Waiting for relay responses...';
      case 'complete':
        return 'Product created successfully!';
      case 'error':
        return `Error: ${progress.message}`;
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-2xl font-serif font-bold text-primary-800 mb-6">Create New Product</h2>
      
      {!canPublish && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">
            Nostr signer not detected. Please install a Nostr browser extension (like Alby or nos2x) to create products.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-primary-800 mb-2">
            Product Title *
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-4 py-3 border rounded-default focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product title"
            maxLength={100}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-primary-800 mb-2">
            Description *
          </label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows={4}
            className={`w-full px-4 py-3 border rounded-default focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Describe your product"
            maxLength={2000}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        {/* Price and Currency */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Price *
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
              min="0"
              step="0.01"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.price ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              Currency
            </label>
            <select
              id="currency"
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {formatCurrencyDisplay(currency)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category and Condition */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <input
              type="text"
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Electronics, Books, Clothing"
            />
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
          </div>
          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-2">
              Condition
            </label>
            <select
              id="condition"
              value={formData.condition}
              onChange={(e) => handleInputChange('condition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="new">New</option>
              <option value="used">Used</option>
              <option value="refurbished">Refurbished</option>
            </select>
          </div>
        </div>

        {/* Location and Contact */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <input
              type="text"
              id="location"
              value={formData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.location ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., New York, NY"
            />
            {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-2">
              Contact *
            </label>
            <input
              type="text"
              id="contact"
              value={formData.contact}
              onChange={(e) => handleInputChange('contact', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.contact ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Email, phone, or Nostr npub"
            />
            {errors.contact && <p className="mt-1 text-sm text-red-600">{errors.contact}</p>}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Add a tag and press Enter"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Add
            </button>
          </div>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Image Upload */}
        <div>
          <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
            Product Image
          </label>
          <input
            ref={fileInputRef}
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {imageFile && (
            <p className="mt-1 text-sm text-gray-600">
              Selected: {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
          {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
        </div>

        {/* Progress Indicator */}
        {isPublishing && progress && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">
                {getProgressMessage(progress)}
              </span>
              <span className="text-sm text-blue-600">{progress.progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.progress}%` }}
              />
            </div>
            {progress.details && (
              <p className="mt-2 text-sm text-blue-700">{progress.details}</p>
            )}
          </div>
        )}

        {/* Success Message */}
        {lastResult?.success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">
              Product created successfully! Published to {lastResult.publishedRelays?.length || 0} relays.
            </p>
            {lastResult.eventId && (
              <p className="mt-1 text-sm text-green-600">
                Event ID: {lastResult.eventId}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {errors.general && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{errors.general}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline-sm"
              disabled={isPublishing}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isPublishing || !canPublish}
            className="btn-primary-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};
