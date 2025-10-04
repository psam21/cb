import React from 'react';
import Image from 'next/image';
import { ShopProduct, ShopPublishingProgress } from '@/services/business/ShopBusinessService';
import { logger } from '@/services/core/LoggingService';

interface ProductDeleteDialogProps {
  product: ShopProduct | null;
  isOpen: boolean;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  isDeleting: boolean;
  deleteProgress?: ShopPublishingProgress | null;
}

export const ProductDeleteDialog: React.FC<ProductDeleteDialogProps> = ({
  product,
  isOpen,
  onConfirm,
  onCancel,
  isDeleting,
  deleteProgress
}) => {
  const handleConfirm = async () => {
    if (!product) return;

    logger.info('Confirming product deletion', {
      service: 'ProductDeleteDialog',
      method: 'handleConfirm',
      productId: product.id,
      title: product.title,
    });

    const result = await onConfirm();
    
    if (!result.success) {
      logger.error('Product deletion failed', new Error(result.error || 'Unknown error'), {
        service: 'ProductDeleteDialog',
        method: 'handleConfirm',
        productId: product.id,
        error: result.error,
      });
    }
  };

  const handleCancel = () => {
    logger.info('Product deletion cancelled', {
      service: 'ProductDeleteDialog',
      method: 'handleCancel',
      productId: product?.id,
    });
    onCancel();
  };

  if (!isOpen || !product) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Product</h3>
              <p className="text-sm text-gray-500">This action cannot be undone</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <strong>&ldquo;{product.title}&rdquo;</strong>? 
              This will remove the product from all Nostr relays and cannot be undone.
            </p>
            
            {/* Product Preview */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <Image
                      src={product.imageUrl}
                      alt={product.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-6 h-6 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {product.title}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {(() => {
                      const upperCurrency = product.currency?.toUpperCase();
                      if (product.currency === 'BTC') {
                        return `${product.price.toFixed(8)} BTC`;
                      } else if (upperCurrency === 'SATS' || upperCurrency === 'SAT' || upperCurrency === 'SATOSHIS') {
                        return `${product.price.toFixed(0)} sats`;
                      } else {
                        try {
                          return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: product.currency,
                          }).format(product.price);
                        } catch {
                          return `${product.currency} ${product.price}`;
                        }
                      }
                    })()} • {product.category}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          {deleteProgress && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-700">
                  {deleteProgress.message}
                </span>
                <span className="text-sm text-red-600">
                  {deleteProgress.progress}%
                </span>
              </div>
              <div className="w-full bg-red-200 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${deleteProgress.progress}%` }}
                />
              </div>
              {deleteProgress.details && (
                <p className="text-xs text-red-600 mt-2">
                  {deleteProgress.details}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              disabled={isDeleting}
              className="btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="btn-danger"
            >
              {isDeleting ? 'Deleting...' : 'Delete Product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
