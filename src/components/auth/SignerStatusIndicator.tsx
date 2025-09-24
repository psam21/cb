'use client';

import { useNostrSigner } from '@/hooks/useNostrSigner';
import { logger } from '@/services/core/LoggingService';

export const SignerStatusIndicator = () => {
  const { isAvailable, isLoading, error } = useNostrSigner();

  logger.debug('Rendering SignerStatusIndicator', {
    service: 'SignerStatusIndicator',
    method: 'render',
    isAvailable,
    isLoading,
    hasError: !!error,
  });

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
        <span>Detecting signer...</span>
      </div>
    );
  }

  if (isAvailable) {
    return (
      <div className="flex items-center space-x-2 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span>Connected: Nostr Signer</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-sm text-red-600">
      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
      <span>No signer detected</span>
    </div>
  );
};
