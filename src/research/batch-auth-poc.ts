/**
 * Phase 0: Batch Authentication Research & Proof of Concept
 * 
 * This file contains experiments to understand and test different approaches
 * for batch authentication with Blossom uploads to avoid multiple signer prompts.
 */

import { BlossomClient } from 'blossom-client-sdk';
import { NostrSigner, NostrEvent } from '../types/nostr';
import { logger } from '../services/core/LoggingService';

// Types for our research

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

/**
 * Current single-file approach for comparison
 * This is what we're trying to improve upon
 */
export class CurrentSingleFileUpload {
  static async uploadFile(file: File, signer: NostrSigner, serverUrl: string): Promise<POCTestResult> {
    const startTime = Date.now();
    let signerPrompts = 0;
    let authTime = 0;
    let uploadTime = 0;
    
    try {
      logger.info('POC: Testing current single-file upload', {
        service: 'CurrentSingleFileUpload',
        fileName: file.name,
        fileSize: file.size
      });

      // Create signer wrapper to count prompts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sdkSigner = async (draft: any) => {
        signerPrompts++; // Count each signer interaction
        logger.info('POC: Signer prompt triggered', { promptNumber: signerPrompts });
        
        const eventDraft: Omit<NostrEvent, 'id' | 'sig'> = {
          kind: draft.kind,
          pubkey: draft.pubkey,
          created_at: draft.created_at,
          tags: draft.tags || [],
          content: draft.content || '',
        };
        return await signer.signEvent(eventDraft);
      };

      // Measure auth time
      const authStart = Date.now();
      const auth = await BlossomClient.createUploadAuth(sdkSigner, file, { 
        message: `Upload ${file.name}` 
      });
      authTime = Date.now() - authStart;

      // Measure upload time
      const uploadStart = Date.now();
      const result = await BlossomClient.uploadBlob(serverUrl, file, { auth });
      uploadTime = Date.now() - uploadStart;

      const totalTime = Date.now() - startTime;

      return {
        approach: 'current-single-file',
        success: true,
        signerPrompts,
        uploadSuccess: !!result,
        performance: { authTime, uploadTime, totalTime },
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      return {
        approach: 'current-single-file',
        success: false,
        signerPrompts,
        uploadSuccess: false,
        performance: { authTime, uploadTime, totalTime },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Approach 1: Protocol-Level Batch Authentication
 * Try to create a single auth event that covers multiple files
 */
export class ProtocolLevelBatchAuth {
  static async batchUpload(files: File[], signer: NostrSigner, serverUrl: string): Promise<POCTestResult> {
    const startTime = Date.now();
    let signerPrompts = 0;
    let authTime = 0;
    let uploadTime = 0;

    try {
      logger.info('POC: Testing protocol-level batch auth', {
        service: 'ProtocolLevelBatchAuth',
        fileCount: files.length,
        fileNames: files.map(f => f.name)
      });

      // Create batch auth event covering all files
      const authStart = Date.now();
      
      // Calculate file hashes first
      const fileHashes = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        return Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
      }));

      // Create a single batch auth event
      const batchAuthEvent: Omit<NostrEvent, 'id' | 'sig'> = {
        kind: 24242, // Blossom auth kind
        pubkey: await signer.getPublicKey(),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['t', 'batch_upload'],
          ['expiration', String(Math.floor(Date.now() / 1000) + 3600)], // 1 hour
          ...fileHashes.map(hash => ['f', hash]), // All file hashes
        ],
        content: `Batch upload: ${files.map(f => f.name).join(', ')}`
      };

      signerPrompts++; // This should be our only signer prompt
      const signedBatchAuth = await signer.signEvent(batchAuthEvent);
      authTime = Date.now() - authStart;

      logger.info('POC: Batch auth event created', {
        signerPrompts,
        authTime,
        eventId: signedBatchAuth.id
      });

      // Now try to upload each file using the batch auth
      // Note: This might not work with current Blossom SDK - this is the experiment
      const uploadStart = Date.now();
      const uploadResults = [];

      for (const file of files) {
        try {
          // Attempt to use batch auth for individual uploads
          // This is experimental - the SDK might not support this
          const result = await BlossomClient.uploadBlob(serverUrl, file, { 
            auth: signedBatchAuth // Using batch auth instead of per-file auth
          });
          uploadResults.push({ file: file.name, success: true, result });
        } catch (error) {
          uploadResults.push({ 
            file: file.name, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;
      const uploadSuccess = uploadResults.every(r => r.success);

      return {
        approach: 'protocol-level-batch',
        success: uploadSuccess,
        signerPrompts,
        uploadSuccess,
        performance: { authTime, uploadTime, totalTime },
        error: uploadSuccess ? undefined : 'Some uploads failed with batch auth'
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      return {
        approach: 'protocol-level-batch',
        success: false,
        signerPrompts,
        uploadSuccess: false,
        performance: { authTime, uploadTime, totalTime },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Approach 2: Time-Window Authentication
 * Create a single auth that's valid for a time window
 */
export class TimeWindowAuth {
  static async batchUpload(files: File[], signer: NostrSigner, serverUrl: string): Promise<POCTestResult> {
    const startTime = Date.now();
    let signerPrompts = 0;
    let authTime = 0;
    let uploadTime = 0;

    try {
      logger.info('POC: Testing time-window auth', {
        service: 'TimeWindowAuth',
        fileCount: files.length,
        windowMinutes: 10
      });

      // Create time-window auth
      const authStart = Date.now();
      const windowAuth: Omit<NostrEvent, 'id' | 'sig'> = {
        kind: 24242,
        pubkey: await signer.getPublicKey(),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['expiration', String(Math.floor(Date.now() / 1000) + 600)], // 10 minute window
          ['purpose', 'batch_upload'],
          ['file_count', String(files.length)]
        ],
        content: `Authorize file uploads for 10 minutes (${files.length} files)`
      };

      signerPrompts++;
      const signedWindowAuth = await signer.signEvent(windowAuth);
      authTime = Date.now() - authStart;

      // Try to use this window auth for all uploads
      const uploadStart = Date.now();
      const uploadResults = [];

      for (const file of files) {
        try {
          // This is also experimental - trying to reuse the window auth
          const result = await BlossomClient.uploadBlob(serverUrl, file, { 
            auth: signedWindowAuth 
          });
          uploadResults.push({ file: file.name, success: true, result });
        } catch (error) {
          uploadResults.push({ 
            file: file.name, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;
      const uploadSuccess = uploadResults.every(r => r.success);

      return {
        approach: 'time-window-auth',
        success: uploadSuccess,
        signerPrompts,
        uploadSuccess,
        performance: { authTime, uploadTime, totalTime },
        error: uploadSuccess ? undefined : 'Some uploads failed with time-window auth'
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      return {
        approach: 'time-window-auth',
        success: false,
        signerPrompts,
        uploadSuccess: false,
        performance: { authTime, uploadTime, totalTime },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Approach 3: Pre-Computed Hash Authentication
 * Calculate all hashes first, then create auths for known files
 */
export class PreComputedHashAuth {
  static async batchUpload(files: File[], signer: NostrSigner, serverUrl: string): Promise<POCTestResult> {
    const startTime = Date.now();
    let signerPrompts = 0;
    let authTime = 0;
    let uploadTime = 0;

    try {
      logger.info('POC: Testing pre-computed hash auth', {
        service: 'PreComputedHashAuth',
        fileCount: files.length
      });

      const authStart = Date.now();

      // Pre-compute all file hashes
      const fileData = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        return { file, hash };
      }));

      // Create auth for all pre-computed hashes in one event
      const hashAuthEvent: Omit<NostrEvent, 'id' | 'sig'> = {
        kind: 24242,
        pubkey: await signer.getPublicKey(),
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['t', 'precomputed_batch'],
          ['expiration', String(Math.floor(Date.now() / 1000) + 1800)], // 30 minutes
          ...fileData.map(({ hash }) => ['f', hash])
        ],
        content: `Pre-computed batch upload: ${fileData.map(({ file }) => file.name).join(', ')}`
      };

      signerPrompts++;
      const signedHashAuth = await signer.signEvent(hashAuthEvent);
      authTime = Date.now() - authStart;

      // Upload files using the pre-computed auth
      const uploadStart = Date.now();
      const uploadResults = [];

      for (const { file } of fileData) {
        try {
          const result = await BlossomClient.uploadBlob(serverUrl, file, { 
            auth: signedHashAuth 
          });
          uploadResults.push({ file: file.name, success: true, result });
        } catch (error) {
          uploadResults.push({ 
            file: file.name, 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      uploadTime = Date.now() - uploadStart;
      const totalTime = Date.now() - startTime;
      const uploadSuccess = uploadResults.every(r => r.success);

      return {
        approach: 'pre-computed-hash',
        success: uploadSuccess,
        signerPrompts,
        uploadSuccess,
        performance: { authTime, uploadTime, totalTime },
        error: uploadSuccess ? undefined : 'Some uploads failed with pre-computed auth'
      };

    } catch (error) {
      const totalTime = Date.now() - startTime;
      return {
        approach: 'pre-computed-hash',
        success: false,
        signerPrompts,
        uploadSuccess: false,
        performance: { authTime, uploadTime, totalTime },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * POC Test Runner
 * Runs all approaches and compares results
 */
export class BatchAuthPOCRunner {
  static async runAllTests(files: File[], signer: NostrSigner, serverUrl: string): Promise<{
    baseline: POCTestResult;
    approaches: POCTestResult[];
    analysis: {
      bestApproach?: string;
      signerPromptReduction?: number;
      recommendation: string;
    };
  }> {
    logger.info('POC: Starting batch authentication research', {
      service: 'BatchAuthPOCRunner',
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });

    // Test baseline (current approach)
    const baseline = await CurrentSingleFileUpload.uploadFile(files[0], signer, serverUrl);
    
    // Estimate baseline for multiple files (would be fileCount * signerPrompts)
    const estimatedBaselinePrompts = files.length * baseline.signerPrompts;

    // Test all batch approaches
    const approaches = [
      await ProtocolLevelBatchAuth.batchUpload(files, signer, serverUrl),
      await TimeWindowAuth.batchUpload(files, signer, serverUrl),
      await PreComputedHashAuth.batchUpload(files, signer, serverUrl)
    ];

    // Analyze results
    const successfulApproaches = approaches.filter(a => a.success);
    const bestApproach = successfulApproaches.reduce((best, current) => {
      if (!best) return current;
      if (current.signerPrompts < best.signerPrompts) return current;
      if (current.signerPrompts === best.signerPrompts && 
          current.performance.totalTime < best.performance.totalTime) return current;
      return best;
    }, null as POCTestResult | null);

    const signerPromptReduction = bestApproach 
      ? estimatedBaselinePrompts - bestApproach.signerPrompts
      : 0;

    let recommendation: string;
    if (!bestApproach) {
      recommendation = 'ABANDON: No batch authentication approach worked. Limit to single file or warn users about multiple prompts.';
    } else if (bestApproach.signerPrompts === 1) {
      recommendation = `SUCCESS: ${bestApproach.approach} achieves single signer prompt for ${files.length} files. Proceed with full implementation.`;
    } else if (bestApproach.signerPrompts < estimatedBaselinePrompts) {
      recommendation = `PARTIAL SUCCESS: ${bestApproach.approach} reduces prompts from ${estimatedBaselinePrompts} to ${bestApproach.signerPrompts}. Consider limited implementation.`;
    } else {
      recommendation = 'FAILED: No improvement over baseline. Consider alternative approaches or abandon feature.';
    }

    const results = {
      baseline,
      approaches,
      analysis: {
        bestApproach: bestApproach?.approach,
        signerPromptReduction,
        recommendation
      }
    };

    logger.info('POC: Batch authentication research completed', {
      service: 'BatchAuthPOCRunner',
      results
    });

    return results;
  }
}

/**
 * Export for testing in development
 */
export const BatchAuthPOC = {
  CurrentSingleFileUpload,
  ProtocolLevelBatchAuth,
  TimeWindowAuth,
  PreComputedHashAuth,
  BatchAuthPOCRunner
};
