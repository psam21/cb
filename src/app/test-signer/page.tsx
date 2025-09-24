'use client';

import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useAuthStore } from '@/stores/useAuthStore';
import { useState } from 'react';

export default function TestSignerPage() {
  const { isAvailable, isLoading, error, getSigner } = useNostrSigner();
  const { user, isAuthenticated } = useAuthStore();
  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const testSigner = async () => {
    setIsTesting(true);
    setTestResult('Testing signer...');
    
    try {
      const signer = await getSigner();
      const publicKey = await signer.getPublicKey();
      setTestResult(`✅ Signer works! Public key: ${publicKey.substring(0, 16)}...`);
    } catch (err) {
      setTestResult(`❌ Signer test failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Nostr Signer Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Signer Status</h2>
          <p><strong>Available:</strong> {isAvailable ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Loading:</strong> {isLoading ? '⏳ Yes' : '✅ No'}</p>
          <p><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Error:</strong> {error || 'None'}</p>
          {user?.npub && <p><strong>NPUB:</strong> {user.npub}</p>}
          {user?.pubkey && <p><strong>Public Key:</strong> {user.pubkey.substring(0, 16)}...</p>}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Test Signer</h2>
          <button 
            onClick={testSigner}
            disabled={isTesting || !isAvailable}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            {isTesting ? 'Testing...' : 'Test Signer'}
          </button>
          {testResult && (
            <div className="mt-2 p-2 bg-gray-100 rounded">
              <pre>{testResult}</pre>
            </div>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Install a Nostr browser extension (Alby, nos2x, etc.)</li>
            <li>Make sure the extension is unlocked</li>
            <li>Refresh this page</li>
            <li>Click &quot;Test Signer&quot; to verify it works</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
