import React from 'react';
import { logger } from '@/services/core/LoggingService';

interface MyShopHeaderProps {
  productCount: number;
  onCreateNew: () => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const MyShopHeader: React.FC<MyShopHeaderProps> = ({ 
  productCount, 
  onCreateNew, 
  onRefresh, 
  isLoading 
}) => {
  const handleCreateNew = () => {
    logger.info('Create new product clicked', {
      service: 'MyShopHeader',
      method: 'handleCreateNew',
    });
    onCreateNew();
  };

  const handleRefresh = () => {
    logger.info('Refresh products clicked', {
      service: 'MyShopHeader',
      method: 'handleRefresh',
    });
    onRefresh();
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container-width py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-serif font-bold text-primary-800">My Shop Listings</h1>
            <p className="text-accent-600 mt-2 text-lg font-medium">
              Manage your {productCount} product{productCount !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex gap-3">
            <button 
              onClick={handleRefresh} 
              disabled={isLoading} 
              className="btn-outline"
            >
              {isLoading ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={handleCreateNew} 
              className="btn-primary"
            >
              Create New Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
