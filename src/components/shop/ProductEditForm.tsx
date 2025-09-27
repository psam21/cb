import React, { useState, useEffect } from 'react';
import { ShopProduct, ShopPublishingProgress } from '@/services/business/ShopBusinessService';
import { ProductEventData } from '@/services/nostr/NostrEventService';
import { logger } from '@/services/core/LoggingService';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, formatCurrencyDisplay } from '@/config/currencies';

interface ProductEditFormProps {
  product: ShopProduct;
  onSave: (productId: string, updatedData: Partial<ProductEventData>, imageFile: File | null) => Promise<{ success: boolean; error?: string }>;
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
  const [formData, setFormData] = useState<Partial<ProductEventData>>({
    title: product.title,
    description: product.description,
    price: product.price,
    currency: product.currency,
    category: product.category,
    condition: product.condition,
    location: product.location,
    contact: product.contact,
    tags: product.tags,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product.imageUrl || null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    logger.info('Product edit form opened', {
      service: 'ProductEditForm',
      method: 'useEffect',
      productId: product.id,
      title: product.title,
    });
  }, [product.id, product.title]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      logger.info('New image selected for product edit', {
        service: 'ProductEditForm',
        method: 'handleImageChange',
        productId: product.id,
        fileName: file.name,
        fileSize: file.size,
      });
      
      setImageFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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
      hasImage: !!imageFile,
    });

    const result = await onSave(product.id, formData, imageFile);
    
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
            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-accent-700 mb-2">
                Product Image
              </label>
              <div className="flex items-center space-x-4">
                <div className="w-24 h-24 bg-primary-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100"
                    disabled={isUpdating}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {imageFile ? `Selected: ${imageFile.name}` : 'Keep existing image or upload a new one'}
                  </p>
                </div>
              </div>
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
