'use client';

import { useState } from 'react';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { useShopPublishing } from '@/hooks/useShopPublishing';
import { useShopProducts } from '@/hooks/useShopProducts';
import { ProductEventData } from '@/services/nostr/NostrEventService';

export default function TestShopPage() {
  const { isAvailable } = useNostrSigner();
  const { publishProduct, isPublishing, progress, lastResult } = useShopPublishing();
  const { products, isLoading, error, refreshProducts } = useShopProducts();
  const [testResult, setTestResult] = useState<string>('');

  const testCompleteWorkflow = async () => {
    if (!isAvailable) {
      setTestResult('❌ No Nostr signer available');
      return;
    }

    setTestResult('⏳ Testing complete shop workflow...');

    try {
      // Create test product data
      const productData: ProductEventData = {
        title: 'Test Cultural Artifact',
        description: 'This is a test product to verify the complete shop workflow including image upload, event creation, and relay publishing.',
        price: 75,
        currency: 'USD',
        tags: ['test', 'cultural-artifact', 'handmade'],
        category: 'Art & Crafts',
        condition: 'new',
        location: 'Global',
        contact: 'test@culturebridge.org',
      };

      // Create a test image file (small data URL)
      const testImageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzAwN2JmZiIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPlRlc3Q8L3RleHQ+PC9zdmc+';
      const response = await fetch(testImageData);
      const blob = await response.blob();
      const testImageFile = new File([blob], 'test-image.svg', { type: 'image/svg+xml' });

      // Publish the product
      const result = await publishProduct(productData, testImageFile);

      if (result.success) {
        setTestResult(`✅ Complete workflow successful!\nProduct ID: ${result.product?.id}\nEvent ID: ${result.eventId}\nPublished to ${result.publishedRelays?.length || 0} relays: ${result.publishedRelays?.join(', ') || 'None'}\nFailed relays: ${(result.failedRelays?.length || 0) > 0 ? result.failedRelays?.join(', ') : 'None'}`);
        
        // Refresh products to show the new one
        setTimeout(() => {
          refreshProducts();
        }, 1000);
      } else {
        setTestResult(`❌ Workflow failed: ${result.error}`);
      }
      
    } catch (error) {
      setTestResult(`❌ Workflow error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Complete Shop Workflow Test</h1>
      
      <div className="space-y-6">
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
          <h2 className="text-xl font-semibold mb-2">Complete Workflow Test</h2>
          <div className="space-y-4">
            <p>This will test the complete shop workflow: image upload → event creation → relay publishing → product display.</p>
            
            <button
              onClick={testCompleteWorkflow}
              disabled={!isAvailable || isPublishing}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {isPublishing ? 'Testing Workflow...' : 'Test Complete Workflow'}
            </button>

            {progress && (
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm"><strong>Progress:</strong> {progress.message} ({progress.progress}%)</p>
                {progress.details && (
                  <p className="text-xs text-gray-600 mt-1">{progress.details}</p>
                )}
              </div>
            )}

            {testResult && (
              <div className="p-3 bg-gray-100 rounded">
                <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Products in Store</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p><strong>Total Products:</strong> {products.length}</p>
              <button
                onClick={refreshProducts}
                disabled={isLoading}
                className="px-3 py-1 bg-gray-600 text-white rounded text-sm disabled:bg-gray-400"
              >
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {error && (
              <p className="text-red-600 text-sm">Error loading products: {error}</p>
            )}

            {products.length === 0 && !isLoading && (
              <p className="text-gray-500 text-sm">No products found. Try running the workflow test above.</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="p-4 border rounded bg-white">
                  <h3 className="font-semibold text-lg mb-2">{product.title}</h3>
                  <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                  <p className="text-blue-600 font-bold mb-2">${product.price} {product.currency}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {product.tags.slice(0, 3).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">
                    {product.category} • {product.condition} • {product.location}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Event ID: {product.eventId.substring(0, 16)}...
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border rounded">
          <h2 className="text-xl font-semibold mb-2">Instructions</h2>
          <ol className="list-decimal list-inside space-y-1">
            <li>Install a Nostr browser extension (Alby, nos2x, etc.)</li>
            <li>Make sure the extension is unlocked</li>
            <li>Refresh this page</li>
            <li>Click &quot;Test Complete Workflow&quot; to test the entire shop process</li>
            <li>Check that the product appears in the store below</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
