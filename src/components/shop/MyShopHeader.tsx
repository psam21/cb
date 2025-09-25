import React from 'react';
import { logger } from '@/services/core/LoggingService';

interface MyShopHeaderProps {
  onCreateNew: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  showDeleted: boolean;
  onToggleDeleted: () => void;
}

export const MyShopHeader: React.FC<MyShopHeaderProps> = ({ 
  onCreateNew, 
  onRefresh, 
  isLoading,
  showDeleted,
  onToggleDeleted
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

  const handleToggleDeleted = () => {
    logger.info('Toggle deleted items clicked', {
      service: 'MyShopHeader',
      method: 'handleToggleDeleted',
      showDeleted: !showDeleted,
    });
    onToggleDeleted();
  };

  return (
    <div className="bg-white shadow-sm border-b">
      <div className="container-width py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-gray-600 text-lg">
              Create Product
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex gap-3">
            <button 
              onClick={handleToggleDeleted} 
              className={`btn-outline ${showDeleted ? 'bg-accent-100 text-accent-700 border-accent-300' : ''}`}
            >
              {showDeleted ? 'Hide Deleted' : 'Show Deleted'}
            </button>
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
