/**
 * Media configuration for multiple attachments feature
 * Centralized settings for file types, limits, and validation rules
 */

export interface MediaConfig {
  maxAttachments: number;
  maxFileSize: number; // bytes
  maxTotalSize: number; // bytes
  supportedTypes: string[];
  supportedMimeTypes: string[];
  imageFormats: string[];
  videoFormats: string[];
  audioFormats: string[];
}

export const MEDIA_CONFIG: MediaConfig = {
  maxAttachments: 5,
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  maxTotalSize: 500 * 1024 * 1024, // 500MB total
  supportedTypes: ['image/*', 'video/*', 'audio/*'],
  supportedMimeTypes: [
    // Images
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/avif',
    'image/svg+xml',
    
    // Videos
    'video/mp4',
    'video/webm',
    'video/quicktime', // MOV
    'video/x-matroska', // MKV
    'application/vnd.apple.mpegurl', // HLS (.m3u8)
    'application/dash+xml', // DASH
    
    // Audio
    'audio/mpeg', // MP3
    'audio/wav',
    'audio/aac',
    'audio/mp4', // M4A
    'audio/ogg',
    'audio/flac'
  ],
  imageFormats: [
    'jpg', 'jpeg', 'png', 'gif', 'webp', 
    'heic', 'heif', 'avif', 'svg'
  ],
  videoFormats: [
    'mp4', 'webm', 'mov', 'mkv', 'm3u8'
  ],
  audioFormats: [
    'mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac'
  ]
};

/**
 * Get media type from MIME type
 */
export const getMediaTypeFromMime = (mimeType: string): 'image' | 'video' | 'audio' | null => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/vnd.apple.mpegurl') return 'video'; // HLS
  if (mimeType === 'application/dash+xml') return 'video'; // DASH
  return null;
};

/**
 * Get media type from file extension
 */
export const getMediaTypeFromExtension = (filename: string): 'image' | 'video' | 'audio' | null => {
  const extension = filename.toLowerCase().split('.').pop();
  if (!extension) return null;
  
  if (MEDIA_CONFIG.imageFormats.includes(extension)) return 'image';
  if (MEDIA_CONFIG.videoFormats.includes(extension)) return 'video';
  if (MEDIA_CONFIG.audioFormats.includes(extension)) return 'audio';
  return null;
};

/**
 * Check if file type is supported
 */
export const isSupportedFileType = (file: File): boolean => {
  // Check MIME type first (more reliable)
  if (MEDIA_CONFIG.supportedMimeTypes.includes(file.type)) {
    return true;
  }
  
  // Fallback to extension check (for cases where MIME type is missing/incorrect)
  const mediaType = getMediaTypeFromExtension(file.name);
  return mediaType !== null;
};

/**
 * Get file format description for user display
 */
export const getFileFormatDescription = (mediaType: 'image' | 'video' | 'audio'): string => {
  switch (mediaType) {
    case 'image':
      return 'Images (JPG, PNG, GIF, WebP, HEIC, AVIF, SVG)';
    case 'video':
      return 'Videos (MP4, WebM, MOV, MKV, HLS)';
    case 'audio':
      return 'Audio (MP3, WAV, AAC, M4A, OGG, FLAC)';
    default:
      return 'Media files';
  }
};

/**
 * Get all supported formats as user-friendly string
 */
export const getAllSupportedFormats = (): string => {
  return [
    getFileFormatDescription('image'),
    getFileFormatDescription('video'), 
    getFileFormatDescription('audio')
  ].join(', ');
};

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate file against media configuration
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
  mediaType?: 'image' | 'video' | 'audio';
  size: number;
}

export const validateMediaFile = (file: File): FileValidationResult => {
  // Check file size
  if (file.size > MEDIA_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${formatFileSize(MEDIA_CONFIG.maxFileSize)}`,
      size: file.size
    };
  }
  
  // Check if file type is supported
  if (!isSupportedFileType(file)) {
    return {
      valid: false,
      error: `Unsupported file type. Supported formats: ${getAllSupportedFormats()}`,
      size: file.size
    };
  }
  
  // Determine media type
  const mediaType = getMediaTypeFromMime(file.type) || getMediaTypeFromExtension(file.name);
  
  return {
    valid: true,
    mediaType: mediaType || undefined,
    size: file.size
  };
};

/**
 * Validate multiple files for batch upload
 */
export interface BatchValidationResult {
  valid: boolean;
  validFiles: File[];
  invalidFiles: { file: File; error: string }[];
  totalSize: number;
  errors: string[];
}

export const validateBatchFiles = (files: File[]): BatchValidationResult => {
  const validFiles: File[] = [];
  const invalidFiles: { file: File; error: string }[] = [];
  const errors: string[] = [];
  let totalSize = 0;
  
  // Check file count limit
  if (files.length > MEDIA_CONFIG.maxAttachments) {
    errors.push(`Too many files. Maximum ${MEDIA_CONFIG.maxAttachments} files allowed`);
  }
  
  // Validate each file
  for (const file of files) {
    const validation = validateMediaFile(file);
    if (validation.valid) {
      validFiles.push(file);
      totalSize += file.size;
    } else {
      invalidFiles.push({ file, error: validation.error || 'Invalid file' });
    }
  }
  
  // Check total size limit
  if (totalSize > MEDIA_CONFIG.maxTotalSize) {
    errors.push(`Total size too large. Maximum ${formatFileSize(MEDIA_CONFIG.maxTotalSize)} allowed`);
  }
  
  const hasErrors = errors.length > 0 || invalidFiles.length > 0;
  
  return {
    valid: !hasErrors,
    validFiles,
    invalidFiles,
    totalSize,
    errors
  };
};
