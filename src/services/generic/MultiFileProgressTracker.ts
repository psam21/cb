/**
 * Multi-File Progress Tracker for Enhanced Sequential Upload
 * Provides real-time status updates and progress analytics
 */

import { logger } from '../core/LoggingService';
import type { SequentialUploadProgress, BlossomFileMetadata } from './GenericBlossomService';

export interface FileProgressState {
  id: string;
  name: string;
  size: number;
  status: 'waiting' | 'authenticating' | 'uploading' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  error?: string;
  startTime?: number;
  completedTime?: number;
  metadata?: BlossomFileMetadata;
}

export interface ProgressAnalytics {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  pendingFiles: number;
  overallProgress: number; // 0-100
  currentThroughput: number; // files per second
  averageTimePerFile: number; // seconds
  estimatedTimeRemaining: number; // seconds
  totalSize: number;
  uploadedSize: number;
  startTime: number;
  elapsedTime: number;
}

export interface ProgressCallback {
  (progress: SequentialUploadProgress, analytics: ProgressAnalytics): void;
}

/**
 * Multi-File Progress Tracker for real-time status updates
 * Transforms raw upload events into rich progress analytics
 */
export class MultiFileProgressTracker {
  private files: Map<string, FileProgressState> = new Map();
  private startTime: number = 0;
  private callbacks: Set<ProgressCallback> = new Set();
  private currentFileIndex: number = 0;

  constructor(files: File[]) {
    this.startTime = Date.now();
    this.initializeFiles(files);
    
    logger.debug('MultiFileProgressTracker initialized', {
      service: 'MultiFileProgressTracker',
      method: 'constructor',
      fileCount: files.length,
      totalSize: files.reduce((sum, f) => sum + f.size, 0)
    });
  }

  /**
   * Initialize file tracking states
   */
  private initializeFiles(files: File[]): void {
    files.forEach((file, index) => {
      const id = `file-${index}-${file.name}`;
      this.files.set(id, {
        id,
        name: file.name,
        size: file.size,
        status: 'waiting',
        progress: 0
      });
    });
  }

  /**
   * Subscribe to progress updates
   */
  public onProgress(callback: ProgressCallback): void {
    this.callbacks.add(callback);
  }

  /**
   * Unsubscribe from progress updates
   */
  public offProgress(callback: ProgressCallback): void {
    this.callbacks.delete(callback);
  }

  /**
   * Update file status and trigger progress callbacks
   */
  public updateFileStatus(
    fileIndex: number,
    status: FileProgressState['status'],
    progress: number = 0,
    error?: string,
    metadata?: BlossomFileMetadata
  ): void {
    const fileArray = Array.from(this.files.values());
    const file = fileArray[fileIndex];
    
    if (!file) {
      logger.warn('File not found for progress update', {
        service: 'MultiFileProgressTracker',
        method: 'updateFileStatus',
        fileIndex,
        totalFiles: this.files.size
      });
      return;
    }

    // Update file state
    const previousStatus = file.status;
    file.status = status;
    file.progress = progress;
    file.error = error;
    file.metadata = metadata;

    // Track timing
    if (status === 'authenticating' && previousStatus === 'waiting') {
      file.startTime = Date.now();
    } else if ((status === 'completed' || status === 'failed') && !file.completedTime) {
      file.completedTime = Date.now();
    }

    this.currentFileIndex = fileIndex;

    // Generate progress update
    const progressUpdate = this.generateProgressUpdate();
    const analytics = this.generateAnalytics();

    // Notify all callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(progressUpdate, analytics);
      } catch (error) {
        logger.error('Progress callback error', error instanceof Error ? error : new Error('Unknown callback error'), {
          service: 'MultiFileProgressTracker',
          method: 'updateFileStatus',
          fileIndex,
          status
        });
      }
    });

    logger.debug('File progress updated', {
      service: 'MultiFileProgressTracker',
      method: 'updateFileStatus',
      fileIndex,
      fileName: file.name,
      status,
      progress,
      overallProgress: analytics.overallProgress
    });
  }

  /**
   * Generate SequentialUploadProgress compatible update
   */
  private generateProgressUpdate(): SequentialUploadProgress {
    const fileArray = Array.from(this.files.values());
    const currentFile = fileArray[this.currentFileIndex];
    const completedFiles = fileArray
      .filter(f => f.status === 'completed' && f.metadata)
      .map(f => f.metadata!);
    const failedFiles = fileArray
      .filter(f => f.status === 'failed')
      .map(f => ({ name: f.name, error: f.error || 'Unknown error' }));

    const nextFileIndex = this.currentFileIndex + 1;
    const nextFile = nextFileIndex < fileArray.length ? fileArray[nextFileIndex] : null;
    
    let nextAction = 'Processing...';
    if (currentFile) {
      switch (currentFile.status) {
        case 'authenticating':
          nextAction = `Please approve "${currentFile.name}" in your signer`;
          break;
        case 'uploading':
          nextAction = `Uploading "${currentFile.name}"...`;
          break;
        case 'completed':
          nextAction = nextFile ? `Next: "${nextFile.name}"` : 'Upload complete!';
          break;
        case 'failed':
          nextAction = nextFile ? `Next: "${nextFile.name}"` : 'Upload complete with errors';
          break;
      }
    }

    const analytics = this.generateAnalytics();

    return {
      currentFileIndex: this.currentFileIndex,
      totalFiles: fileArray.length,
      currentFile: {
        name: currentFile?.name || '',
        size: currentFile?.size || 0,
        status: currentFile?.status === 'cancelled' ? 'failed' : (currentFile?.status || 'waiting'),
        progress: currentFile?.progress || 0,
        error: currentFile?.error
      },
      completedFiles,
      failedFiles,
      overallProgress: analytics.overallProgress,
      nextAction,
      estimatedTimeRemaining: analytics.estimatedTimeRemaining
    };
  }

  /**
   * Generate comprehensive progress analytics
   */
  private generateAnalytics(): ProgressAnalytics {
    const fileArray = Array.from(this.files.values());
    const now = Date.now();
    const elapsedTime = (now - this.startTime) / 1000; // seconds

    const completedFiles = fileArray.filter(f => f.status === 'completed').length;
    const failedFiles = fileArray.filter(f => f.status === 'failed').length;
    const pendingFiles = fileArray.filter(f => f.status === 'waiting').length;
    const totalFiles = fileArray.length;

    const totalSize = fileArray.reduce((sum, f) => sum + f.size, 0);
    const uploadedSize = fileArray
      .filter(f => f.status === 'completed')
      .reduce((sum, f) => sum + f.size, 0);

    const overallProgress = totalFiles > 0 
      ? Math.round(((completedFiles + failedFiles) / totalFiles) * 100)
      : 0;

    const currentThroughput = elapsedTime > 0 
      ? (completedFiles + failedFiles) / elapsedTime 
      : 0;

    const averageTimePerFile = completedFiles > 0 
      ? elapsedTime / (completedFiles + failedFiles)
      : 3.5; // Default estimate

    const remainingFiles = totalFiles - completedFiles - failedFiles;
    const estimatedTimeRemaining = remainingFiles > 0 
      ? Math.ceil(remainingFiles * averageTimePerFile)
      : 0;

    return {
      totalFiles,
      completedFiles,
      failedFiles,
      pendingFiles,
      overallProgress,
      currentThroughput,
      averageTimePerFile,
      estimatedTimeRemaining,
      totalSize,
      uploadedSize,
      startTime: this.startTime,
      elapsedTime
    };
  }

  /**
   * Get current progress snapshot
   */
  public getCurrentProgress(): { progress: SequentialUploadProgress; analytics: ProgressAnalytics } {
    return {
      progress: this.generateProgressUpdate(),
      analytics: this.generateAnalytics()
    };
  }

  /**
   * Get file states for debugging/monitoring
   */
  public getFileStates(): FileProgressState[] {
    return Array.from(this.files.values());
  }

  /**
   * Check if all files are complete (success or failure)
   */
  public isComplete(): boolean {
    const fileArray = Array.from(this.files.values());
    return fileArray.every(f => f.status === 'completed' || f.status === 'failed' || f.status === 'cancelled');
  }

  /**
   * Get completion summary
   */
  public getCompletionSummary(): {
    success: boolean;
    partialSuccess: boolean;
    completedCount: number;
    failedCount: number;
    totalCount: number;
    completedFiles: BlossomFileMetadata[];
    failedFiles: { name: string; error: string }[];
  } {
    const fileArray = Array.from(this.files.values());
    const completedFiles = fileArray.filter(f => f.status === 'completed');
    const failedFiles = fileArray.filter(f => f.status === 'failed');

    const completedCount = completedFiles.length;
    const failedCount = failedFiles.length;
    const totalCount = fileArray.length;

    const success = completedCount > 0 && failedCount === 0;
    const partialSuccess = completedCount > 0 && failedCount > 0;

    return {
      success,
      partialSuccess,
      completedCount,
      failedCount,
      totalCount,
      completedFiles: completedFiles
        .filter(f => f.metadata)
        .map(f => f.metadata!),
      failedFiles: failedFiles.map(f => ({
        name: f.name,
        error: f.error || 'Unknown error'
      }))
    };
  }

  /**
   * Reset tracker for reuse
   */
  public reset(files: File[]): void {
    this.files.clear();
    this.callbacks.clear();
    this.currentFileIndex = 0;
    this.startTime = Date.now();
    this.initializeFiles(files);

    logger.debug('MultiFileProgressTracker reset', {
      service: 'MultiFileProgressTracker',
      method: 'reset',
      fileCount: files.length
    });
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    this.files.clear();
    this.callbacks.clear();
    
    logger.debug('MultiFileProgressTracker destroyed', {
      service: 'MultiFileProgressTracker',
      method: 'destroy'
    });
  }
}

export default MultiFileProgressTracker;
