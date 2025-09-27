'use client';

import React, { useState, useRef } from 'react';
import { useNostrSigner } from '@/hooks/useNostrSigner';
import { BatchAuthPOC } from '@/research/batch-auth-poc';
import { logger } from '@/services/core/LoggingService';

interface TestResult {
  baseline: POCTestResult;
  approaches: POCTestResult[];
  analysis: {
    bestApproach?: string;
    signerPromptReduction?: number;
    recommendation: string;
  };
}

interface POCTestResult {
  approach: string;
  success: boolean;
  signerPrompts: number;
  uploadSuccess: boolean;
  performance: {
    authTime: number;
    uploadTime: number;
    totalTime: number;
  };
  error?: string;
}

export default function TestBatchAuthPage() {
  const { signer, isAvailable } = useNostrSigner();
  const [testFiles, setTestFiles] = useState<File[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setTestFiles(files);
    setResults(null);
    setError(null);
  };

  const runPOCTests = async () => {
    if (!signer || !isAvailable) {
      setError('Nostr signer not available');
      return;
    }

    if (testFiles.length === 0) {
      setError('Please select files to test');
      return;
    }

    setIsRunning(true);
    setError(null);

    try {
      logger.info('Starting Phase 0 POC tests', {
        service: 'TestBatchAuthPage',
        fileCount: testFiles.length,
        fileNames: testFiles.map(f => f.name)
      });

      // Use a test Blossom server URL (you might need to adjust this)
      const testServerUrl = 'https://blossom.nostr.build';

      const testResults = await BatchAuthPOC.BatchAuthPOCRunner.runAllTests(
        testFiles,
        signer,
        testServerUrl
      );

      setResults(testResults);
      
      logger.info('Phase 0 POC tests completed', {
        service: 'TestBatchAuthPage',
        recommendation: testResults.analysis.recommendation
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`POC test failed: ${errorMessage}`);
      logger.error('Phase 0 POC test error', err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsRunning(false);
    }
  };

  const formatTime = (ms: number) => `${ms}ms`;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
        <h1 className="text-2xl font-bold text-yellow-800 mb-2">
          🔬 Phase 0: Batch Authentication POC
        </h1>
        <p className="text-yellow-700">
          This is a research tool to test different batch authentication approaches for multiple file uploads.
          The results will determine if the multiple attachments feature is viable.
        </p>
      </div>

      {/* File Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Select Test Files</h2>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,audio/*,video/*"
          onChange={handleFilesChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        
        {testFiles.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Selected Files ({testFiles.length}):</h3>
            <ul className="space-y-1">
              {testFiles.map((file, index) => (
                <li key={index} className="text-sm text-gray-600">
                  {file.name} ({formatBytes(file.size)})
                </li>
              ))}
            </ul>
            <p className="text-sm text-gray-500 mt-2">
              Total: {formatBytes(testFiles.reduce((sum, f) => sum + f.size, 0))}
            </p>
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-2">Run POC Tests</h2>
            <p className="text-gray-600">
              This will test 4 approaches: baseline single-file + 3 batch authentication methods
            </p>
          </div>
          <button
            onClick={runPOCTests}
            disabled={!isAvailable || testFiles.length === 0 || isRunning}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isRunning ? 'Running Tests...' : 'Start POC Tests'}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {!isAvailable && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700">
              Nostr signer not available. Please install and configure a Nostr browser extension.
            </p>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Analysis Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📊 POC Analysis</h2>
            
            <div className={`p-4 rounded-lg mb-4 ${
              results.analysis.recommendation.startsWith('SUCCESS') ? 'bg-green-50 border border-green-200' :
              results.analysis.recommendation.startsWith('PARTIAL') ? 'bg-yellow-50 border border-yellow-200' :
              'bg-red-50 border border-red-200'
            }`}>
              <h3 className="font-semibold mb-2">Recommendation:</h3>
              <p className={
                results.analysis.recommendation.startsWith('SUCCESS') ? 'text-green-700' :
                results.analysis.recommendation.startsWith('PARTIAL') ? 'text-yellow-700' :
                'text-red-700'
              }>
                {results.analysis.recommendation}
              </p>
            </div>

            {results.analysis.bestApproach && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium">Best Approach</h4>
                  <p className="text-lg">{results.analysis.bestApproach}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium">Signer Prompt Reduction</h4>
                  <p className="text-lg">{results.analysis.signerPromptReduction || 0}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="font-medium">Files Tested</h4>
                  <p className="text-lg">{testFiles.length}</p>
                </div>
              </div>
            )}
          </div>

          {/* Detailed Results */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Detailed Results</h2>
            
            {/* Baseline */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Baseline (Current Single-File)</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Signer Prompts:</span>
                    <span className="ml-2">{results.baseline.signerPrompts}</span>
                  </div>
                  <div>
                    <span className="font-medium">Success:</span>
                    <span className={`ml-2 ${results.baseline.success ? 'text-green-600' : 'text-red-600'}`}>
                      {results.baseline.success ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Auth Time:</span>
                    <span className="ml-2">{formatTime(results.baseline.performance.authTime)}</span>
                  </div>
                  <div>
                    <span className="font-medium">Upload Time:</span>
                    <span className="ml-2">{formatTime(results.baseline.performance.uploadTime)}</span>
                  </div>
                </div>
                {results.baseline.error && (
                  <p className="text-red-600 text-sm mt-2">Error: {results.baseline.error}</p>
                )}
              </div>
            </div>

            {/* Batch Approaches */}
            <h3 className="text-lg font-medium mb-3">Batch Authentication Approaches</h3>
            <div className="space-y-4">
              {results.approaches.map((approach, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium capitalize">
                      {approach.approach.replace(/-/g, ' ')}
                    </h4>
                    <span className={`px-2 py-1 rounded text-sm ${
                      approach.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {approach.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Signer Prompts:</span>
                      <span className="ml-2">{approach.signerPrompts}</span>
                    </div>
                    <div>
                      <span className="font-medium">Upload Success:</span>
                      <span className={`ml-2 ${approach.uploadSuccess ? 'text-green-600' : 'text-red-600'}`}>
                        {approach.uploadSuccess ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Auth Time:</span>
                      <span className="ml-2">{formatTime(approach.performance.authTime)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Upload Time:</span>
                      <span className="ml-2">{formatTime(approach.performance.uploadTime)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Total Time:</span>
                      <span className="ml-2">{formatTime(approach.performance.totalTime)}</span>
                    </div>
                  </div>
                  
                  {approach.error && (
                    <p className="text-red-600 text-sm mt-2">Error: {approach.error}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Raw Data */}
          <details className="bg-white rounded-lg shadow-md">
            <summary className="p-6 cursor-pointer font-semibold">
              🔍 Raw Test Data (Click to expand)
            </summary>
            <div className="px-6 pb-6">
              <pre className="bg-gray-50 p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}
