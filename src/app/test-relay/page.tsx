'use client';

import { useState } from 'react';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { createNIP23Event, signEvent } from '@/services/generic/GenericEventService';
import { publishEvent } from '@/services/generic/GenericRelayService';
import { NIP23Content } from '@/types/nostr';

export default function TestRelayPage() {
  const { isAvailable, getSigner } = useNostrSigner();
  const [relayResult, setRelayResult] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState(false);

  const testRelayPublishing = async () => {
    if (!isAvailable) {
      setRelayResult('❌ No Nostr signer available');
      return;
    }

    setIsPublishing(true);
    setRelayResult('⏳ Creating event and publishing to relays...');

    try {
      const signer = await getSigner();
      const pubkey = await signer.getPublicKey();
      
      // Create test content
      const content: NIP23Content = {
        title: 'Test Relay Publishing',
        content: 'This is a test event to verify relay publishing functionality.',
        summary: 'Test relay publishing for shop functionality',
        published_at: Math.floor(Date.now() / 1000),
        tags: ['test', 'relay-publishing', 'culture-bridge-shop'],
        language: 'en',
        region: 'global',
        permissions: 'public',
      };

      // Create the event
      const eventResult = createNIP23Event(content, pubkey, {
        tags: [
          ['price', '50'],
          ['currency', 'USD'],
          ['category', 'test'],
          ['condition', 'new'],
          ['contact', 'test@example.com'],
          ['t', 'culture-bridge-shop'],
        ],
      });

      if (!eventResult.success || !eventResult.event) {
        setRelayResult(`❌ Event creation failed: ${eventResult.error}`);
        return;
      }

      // Sign the event
      const signingResult = await signEvent(eventResult.event, signer);
      
      if (!signingResult.success || !signingResult.signedEvent) {
        setRelayResult(`❌ Event signing failed: ${signingResult.error}`);
        return;
      }

      // Publish to relays
      const publishResult = await publishEvent(signingResult.signedEvent, signer, (progress) => {
        setRelayResult(`⏳ Publishing... ${progress.message} (${progress.progress}%)`);
      });

      if (publishResult.success) {
        setRelayResult(`✅ Event published successfully!\nEvent ID: ${publishResult.eventId}\nPublished to ${publishResult.publishedRelays.length} relays: ${publishResult.publishedRelays.join(', ')}\nFailed relays: ${publishResult.failedRelays.length > 0 ? publishResult.failedRelays.join(', ') : 'None'}\nSuccess rate: ${publishResult.successRate.toFixed(1)}%`);
      } else {
        setRelayResult(`❌ Publishing failed: ${publishResult.error}\nPublished to: ${publishResult.publishedRelays.join(', ')}\nFailed: ${publishResult.failedRelays.join(', ')}`);
      }
      
    } catch (error) {
      setRelayResult(`❌ Publishing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Relay Publishing Test</h1>
      
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
          <h2 className="text-xl font-semibold mb-2">Relay Publishing Test</h2>
          <div className="space-y-4">
            <p>This will create a test event and publish it to multiple Nostr relays.</p>
            
            <button
              onClick={testRelayPublishing}
              disabled={!isAvailable || isPublishing}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {isPublishing ? 'Publishing...' : 'Test Relay Publishing'}
            </button>

            {relayResult && (
              <div className="p-3 bg-gray-100 rounded">
                <pre className="whitespace-pre-wrap text-sm">{relayResult}</pre>
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
            <li>Click &quot;Test Relay Publishing&quot; to publish a test event to relays</li>
            <li>Check the event on njump.me or other Nostr clients</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
