'use client';

import { useState, useEffect } from 'react';

interface NpubInputProps {
  value: string;
  onSubmit: (npub: string) => void;
  loading: boolean;
  isAuthenticated: boolean;
  userNpub?: string;
}

export function NpubInput({ value, onSubmit, loading, isAuthenticated, userNpub }: NpubInputProps) {
  const [inputValue, setInputValue] = useState(value);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validateNpub = (npub: string): string | null => {
    if (!npub.trim()) {
      return 'Please enter an npub';
    }
    
    if (!npub.startsWith('npub1')) {
      return 'npub must start with "npub1"';
    }
    
    if (npub.length !== 63) {
      return 'npub must be exactly 63 characters long';
    }
    
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedValue = inputValue.trim();
    const validationError = validateNpub(trimmedValue);
    
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setError(null);
    onSubmit(trimmedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    if (error) {
      setError(null); // Clear error when user starts typing
    }
  };

  const handleUseMyNpub = () => {
    if (userNpub) {
      setInputValue(userNpub);
      setError(null);
      onSubmit(userNpub);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-medium text-gray-900">Enter Nostr Public Key</h2>
          <p className="text-sm text-gray-600 mt-1">
            Enter an npub to view event publishing analytics
          </p>
        </div>
        
        {isAuthenticated && userNpub && userNpub !== inputValue && (
          <button
            onClick={handleUseMyNpub}
            disabled={loading}
            className="btn-outline-sm flex items-center space-x-2 disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Use My npub</span>
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              placeholder="npub1..."
              disabled={loading}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                error ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
              }`}
            />
            
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
          </div>
          
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isAuthenticated && userNpub ? (
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Signed in
              </span>
            ) : (
              <span>Not signed in - enter any valid npub</span>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Loading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>View Events</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
