'use client';

import { useState, useMemo, ReactNode } from 'react';
import { logger } from '@/services/core/LoggingService';

export interface BaseGridData {
  id: string;
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  publishedAt: number;
  [key: string]: unknown; // Allow additional fields
}

export interface SearchField {
  key: string;
  label: string;
  weight?: number; // For search relevance
}

export interface FilterField {
  key: string;
  label: string;
  type: 'select' | 'multiselect' | 'range' | 'boolean';
  options?: Array<{ value: string; label: string }>;
}

export interface SortOption {
  key: string;
  label: string;
  direction: 'asc' | 'desc';
}

export interface BaseGridProps {
  data: BaseGridData[];
  renderItem: (item: BaseGridData, index: number) => ReactNode;
  searchFields?: SearchField[];
  filterFields?: FilterField[];
  sortOptions?: SortOption[];
  defaultSort?: string;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  className?: string;
  gridClassName?: string;
  searchPlaceholder?: string;
  showResultsCount?: boolean;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  onSort?: (sortKey: string) => void;
}

export const BaseGrid = ({
  data,
  renderItem,
  searchFields = [
    { key: 'title', label: 'Title', weight: 3 },
    { key: 'description', label: 'Description', weight: 2 },
    { key: 'tags', label: 'Tags', weight: 1 },
  ],
  filterFields = [
    { key: 'category', label: 'Category', type: 'select' },
  ],
  sortOptions = [
    { key: 'publishedAt', label: 'Newest First', direction: 'desc' },
    { key: 'publishedAt', label: 'Oldest First', direction: 'asc' },
  ],
  defaultSort = 'publishedAt',
  emptyState,
  className = '',
  gridClassName = 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8',
  searchPlaceholder = 'Search...',
  showResultsCount = true,
  onSearch,
  onFilter,
  onSort,
}: BaseGridProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [sortBy, setSortBy] = useState(defaultSort);

  // Get unique values for filter options
  const filterOptions = useMemo(() => {
    const options: Record<string, Array<{ value: string; label: string }>> = {};
    
    filterFields.forEach(field => {
      if (field.type === 'select' || field.type === 'multiselect') {
        const uniqueValues = Array.from(new Set(
          data.map(item => item[field.key]).filter(Boolean)
        ));
        options[field.key] = uniqueValues.map(value => ({
          value: value as string,
          label: value as string,
        }));
      }
    });
    
    return options;
  }, [data, filterFields]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return searchFields.some(field => {
          const value = item[field.key];
          if (Array.isArray(value)) {
            return value.some(v => v.toLowerCase().includes(query));
          }
          if (typeof value === 'string') {
            return value.toLowerCase().includes(query);
          }
          return false;
        });
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Apply sorting
    const sortOption = sortOptions.find(opt => opt.key === sortBy);
    if (sortOption) {
      filtered.sort((a, b) => {
        const aValue = a[sortOption.key];
        const bValue = b[sortOption.key];
        
        // Handle different types for comparison
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          if (aValue < bValue) return sortOption.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOption.direction === 'asc' ? 1 : -1;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (aValue < bValue) return sortOption.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortOption.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchQuery, filters, sortBy, searchFields, sortOptions]);

  const handleSearchChange = (query: string) => {
    logger.debug('Search query changed', {
      service: 'BaseGrid',
      method: 'handleSearchChange',
      query: query.substring(0, 50),
    });
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleFilterChange = (key: string, value: unknown) => {
    logger.debug('Filter changed', {
      service: 'BaseGrid',
      method: 'handleFilterChange',
      key,
      value,
    });
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleSortChange = (sortKey: string) => {
    logger.debug('Sort changed', {
      service: 'BaseGrid',
      method: 'handleSortChange',
      sortKey,
    });
    setSortBy(sortKey);
    onSort?.(sortKey);
  };

  const clearFilters = () => {
    logger.debug('Filters cleared', {
      service: 'BaseGrid',
      method: 'clearFilters',
    });
    setSearchQuery('');
    setFilters({});
    setSortBy(defaultSort);
  };

  const hasActiveFilters = searchQuery || Object.values(filters).some(v => v && v !== '') || sortBy !== defaultSort;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filters */}
          {filterFields.map(field => (
            <div key={field.key} className="lg:w-48">
              <select
                value={(filters[field.key] as string) || ''}
                onChange={(e) => handleFilterChange(field.key, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All {field.label}s</option>
                {filterOptions[field.key]?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Sort */}
          <div className="lg:w-48">
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="btn-outline-sm"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {showResultsCount && (
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            {filteredData.length} item{filteredData.length !== 1 ? 's' : ''} found
            {searchQuery && ` for "${searchQuery}"`}
            {Object.entries(filters).map(([key, value]) => 
              value && value !== '' ? ` in "${key}: ${value}"` : ''
            ).join('')}
          </p>
          
          {filteredData.length > 0 && (
            <div className="text-sm text-gray-500">
              Showing {filteredData.length} of {data.length} items
            </div>
          )}
        </div>
      )}

      {/* Grid */}
      {filteredData.length > 0 ? (
        <div className={gridClassName}>
          {filteredData.map((item, index) => renderItem(item, index))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {emptyState?.title || 'No items found'}
          </h3>
          <p className="text-gray-500 mb-4">
            {emptyState?.description || (hasActiveFilters
              ? 'Try adjusting your search or filters'
              : 'No items have been created yet'
            )}
          </p>
          {emptyState?.action && (
            <button
              onClick={emptyState.action.onClick}
              className="btn-primary-sm"
            >
              {emptyState.action.label}
            </button>
          )}
          {hasActiveFilters && !emptyState?.action && (
            <button
              onClick={clearFilters}
              className="btn-primary-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};
