'use client';

import { useState } from 'react';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { blossomService } from '@/services/generic/GenericBlossomService';

export default function TestUploadPage() {
  const { isAvailable, getSigner } = useNostrSigner();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult('');
    }
  };

  const testUpload = async () => {
    if (!selectedFile) {
      setUploadResult('❌ Please select a file first');
      return;
    }

    if (!isAvailable) {
      setUploadResult('❌ No Nostr signer available');
      return;
    }

    setIsUploading(true);
    setUploadResult('⏳ Uploading...');

    try {
      const signer = await getSigner();
      const result = await blossomService.uploadFile(selectedFile, signer);
      
      if (result.success && result.metadata) {
        setUploadResult(`✅ Upload successful!\nFile ID: ${result.metadata.fileId}\nURL: ${result.metadata.url}\nSize: ${result.metadata.fileSize} bytes`);
      } else {
        setUploadResult(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadResult(`❌ Upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Blossom Upload Test</h1>
      
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
          <h2 className="text-xl font-semibold mb-2">File Upload Test</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select an image file (max 100MB):
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                disabled={!isAvailable}
              />
            </div>

            {selectedFile && (
              <div className="p-3 bg-gray-50 rounded">
                <p><strong>Selected file:</strong> {selectedFile.name}</p>
                <p><strong>Size:</strong> {selectedFile.size} bytes</p>
                <p><strong>Type:</strong> {selectedFile.type}</p>
              </div>
            )}

            <button
              onClick={testUpload}
              disabled={!isAvailable || !selectedFile || isUploading}
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
            >
              {isUploading ? 'Uploading...' : 'Test Upload'}
            </button>

            {uploadResult && (
              <div className="p-3 bg-gray-100 rounded">
                <pre className="whitespace-pre-wrap">{uploadResult}</pre>
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
            <li>Select an image file</li>
            <li>Click &quot;Test Upload&quot; to upload to Blossom</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
