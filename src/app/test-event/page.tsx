'use client';

import { useState } from 'react';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { createNIP23Event, signEvent } from '@/services/generic/GenericEventService';
import { NIP23Content } from '@/types/nostr';

export default function TestEventPage() {
  const { isAvailable, getSigner } = useNostrSigner();
  const [eventResult, setEventResult] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const testEventCreation = async () => {
    if (!isAvailable) {
      setEventResult('❌ No Nostr signer available');
      return;
    }

    setIsCreating(true);
    setEventResult('⏳ Creating and signing event...');

    try {
      const signer = await getSigner();
      const pubkey = await signer.getPublicKey();
      
      // Create test content
      const content: NIP23Content = {
        title: 'Test Product',
        content: 'This is a test product for the Culture Bridge shop.',
        summary: 'Test product for shop functionality',
        published_at: Math.floor(Date.now() / 1000),
        tags: ['test', 'culture-bridge-shop'],
        language: 'en',
        region: 'global',
        permissions: 'public',
      };

      // Create the event
      const eventResult = createNIP23Event(content, pubkey, {
        tags: [
          ['price', '100'],
          ['currency', 'USD'],
          ['category', 'test'],
          ['condition', 'new'],
          ['contact', 'test@example.com'],
          ['t', 'culture-bridge-shop'],
        ],
      });

      if (!eventResult.success || !eventResult.event) {
        setEventResult(`❌ Event creation failed: ${eventResult.error}`);
        return;
      }

      // Sign the event
      const signingResult = await signEvent(eventResult.event, signer);
      
      if (!signingResult.success || !signingResult.signedEvent) {
        setEventResult(`❌ Event signing failed: ${signingResult.error}`);
        return;
      }
      
      const signedEvent = signingResult.signedEvent;
      setEventResult(`✅ Event created and signed successfully!\nEvent ID: ${signedEvent.id}\nKind: ${signedEvent.kind}\nCreated: ${new Date(signedEvent.created_at * 1000).toISOString()}\nPubkey: ${signedEvent.pubkey.substring(0, 16)}...`);
      
    } catch (error) {
      setEventResult(`❌ Event creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Nostr Event Creation Test</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Signer Status</h2>
          <p><strong>Available:</strong> {isAvailable ? '✅ Yes' : '❌ No'}</p>
          {!isAvailable && (
            <p className="text-red-600 text-sm mt-2">
              Please install a Nostr browser extension (Alby, nos2x, etc.) and refresh the page.
            </p>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Event Creation Test</h2>
          <div className="space-y-4">
            <p>This will create a test Kind 23 event (long-form content) with shop-specific tags.</p>
            
            <button
              onClick={testEventCreation}
              disabled={!isAvailable || isCreating}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {isCreating ? 'Creating Event...' : 'Test Event Creation'}
            </button>

            {eventResult && (
              <div className="p-3 bg-gray-100 rounded">
                <pre className="whitespace-pre-wrap text-sm">{eventResult}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Install a Nostr browser extension (Alby, nos2x, etc.)</li>
            <li>Make sure the extension is unlocked</li>
            <li>Refresh this page</li>
            <li>Click &quot;Test Event Creation&quot; to create and sign a test event</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
