'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { ProductCreationForm } from '@/components/shop/ProductCreationForm';
import { logger } from '@/services/core/LoggingService';

export default function CreateProductPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isClient, setIsClient] = useState(false);

  // Client-side hydration check
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if not authenticated (only on client)
  if (isClient && (!isAuthenticated || !user)) {
    logger.warn('User not authenticated, redirecting to signin', {
      service: 'CreateProductPage',
      method: 'render',
      isAuthenticated,
      hasUser: !!user,
    });
    router.push('/signin');
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Redirecting to Sign In...</h1>
          <p className="text-gray-600">Please sign in to create products.</p>
        </div>
      </div>
    );
  }

  // Show loading during SSR
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-800 mb-4">Loading...</h1>
          <p className="text-gray-600">Please wait while we load the creation form.</p>
        </div>
      </div>
    );
  }

  const handleProductCreated = (productId: string) => {
    logger.info('Product created successfully, redirecting to my-shop', {
      service: 'CreateProductPage',
      method: 'handleProductCreated',
      productId,
    });
    
    // Redirect to my-shop page after successful creation
    router.push('/my-shop');
  };

  const handleCancel = () => {
    logger.info('Product creation cancelled, redirecting to my-shop', {
      service: 'CreateProductPage',
      method: 'handleCancel',
    });
    
    // Go back to my-shop page
    router.push('/my-shop');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-accent-50 py-8">
      <div className="container-width">
        <ProductCreationForm
          onProductCreated={handleProductCreated}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
