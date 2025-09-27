# Multiple Media Attachments Support for Shop Products

## Requirements Document (SOA-Aligned Revision)

### Overview
Expand the current single-image product system to support multiple media attachments for product listings using the Blossom protocol, following the established Service-Oriented Architecture (SOA) patterns.

### Current State Analysis
The system currently supports one image per product through:
- Single file input in ProductCreationForm and ProductEditForm
- Image upload to Blossom servers via `GenericBlossomService`
- Single imageUrl field in product data structure
- Image preview functionality

### Critical UX Innovation: Single Signer Prompt for Multiple Files

#### The Problem with Naive Iteration
The current single-file Blossom upload process requires:
1. `BlossomClient.createUploadAuth(signer, file)` - **Triggers signer popup**
2. User clicks "Allow" in browser extension
3. File uploads to Blossom

**❌ Naive multiple-file approach would be:**
```typescript
// BAD: Creates UX nightmare with multiple popups
for (const file of files) {
  const auth = await BlossomClient.createUploadAuth(signer, file); // 🚨 POPUP #1, #2, #3...
  await BlossomClient.uploadBlob(server.url, file, { auth });
}
// Result: User gets 5+ signer popups for 5 files! 😱
```

#### ✅ Our Solution: Batch Authentication
**Key Innovation**: Create multiple auth tokens in a **single signer interaction**:

```typescript
// GOOD: Single signer prompt for all files
export class GenericBlossomService {
  async uploadBatch(files: File[], signer: NostrSigner) {
    // 🎯 SINGLE SIGNER PROMPT for all files
    const batchAuth = await this.createBatchAuth(files, signer);
    
    // 🎯 NO MORE PROMPTS - just HTTP uploads with pre-authorized tokens
    for (const { file, auth } of batchAuth.authTokens) {
      await BlossomClient.uploadBlob(server.url, file, { auth });
    }
  }
}
```

**UX Result**: User sees **one** popup: *"Authorize upload of 5 files: image1.jpg, video1.mp4, audio1.mp3..."*

#### Technical Implementation Options

**Option 1: Blossom Batch Auth Event**
```typescript
// Single auth event covering multiple file hashes
const batchAuthEvent = {
  kind: 24242, // Blossom auth
  tags: [
    ['t', 'batch_upload'],
    ['f', 'hash1'], ['f', 'hash2'], ['f', 'hash3'], // All file hashes
    ['expiration', '1hour_from_now']
  ],
  content: 'Upload 3 files: image1.jpg, video1.mp4, audio1.mp3'
};
```

**Option 2: Time-Window Auth (Fallback)**
```typescript
// Single auth valid for time window
const timeWindowAuth = {
  kind: 24242,
  tags: [['expiration', '10_minutes'], ['purpose', 'batch_upload']],
  content: 'Authorize file uploads for 10 minutes'
};
```

This ensures the multiple attachments feature has **excellent UX** instead of being unusable due to popup spam.

### SOA Architecture Alignment

#### Service Layer Organization
Following the established SOA pattern with clear separation of concerns:

**Core Services** (Infrastructure)
- `LoggingService` - Centralized logging
- `KVService` - Data storage operations

**Generic Services** (Reusable, Protocol/Technology-Specific)
- `GenericMediaService` - Media validation, metadata, hashing operations
- `GenericBlossomService` - Enhanced with batch upload capabilities
- `GenericRelayService` - Nostr relay operations (unchanged)
- `GenericEventService` - Nostr event creation (unchanged)

**Business Services** (Domain-Specific)
- `ShopBusinessService` - Enhanced with shop-specific media business rules
- `ProfileBusinessService` - Could leverage media services for avatars

**Nostr Services** (Protocol Implementation)
- `NostrEventService` - Enhanced with attachment event structures

### Required Changes

#### 1. Data Structure Updates

**Files to Change:**
- `services/nostr/NostrEventService.ts` - ProductEventData interface
- `services/business/ShopBusinessService.ts` - ShopProduct interface

**Changes:**
```typescript
// services/nostr/NostrEventService.ts (Protocol-agnostic)
export interface ProductEventData {
  // ... existing fields
  attachments?: MediaAttachment[]; // Replace single image
}

export interface MediaAttachment {
  hash: string;                    // Blossom blob hash
  type: 'image' | 'audio' | 'video';
  name: string;
  size: number;
  mimeType: string;
}

// services/business/ShopBusinessService.ts (Business logic)
export interface ShopProduct {
  // ... existing fields
  attachments: ProcessedMediaAttachment[]; // Replace imageUrl/imageHash
}

export interface ProcessedMediaAttachment extends MediaAttachment {
  url: string;        // Constructed using business rules
  isPrimary: boolean; // Business logic designation
  displayOrder: number;
}
```

**Backward Compatibility:**
- Migration utility to convert existing `imageUrl` to single-item `attachments` array
- Support both old and new data structures during transition

#### 2. Generic Service Layer Updates

**New File: `services/generic/GenericMediaService.ts`**
```typescript
export interface MediaValidationResult {
  valid: boolean;
  error?: string;
  metadata?: MediaMetadata;
}

export interface MediaMetadata {
  hash: string;
  type: 'image' | 'audio' | 'video';
  name: string;
  size: number;
  mimeType: string;
  dimensions?: { width: number; height: number };
  duration?: number; // for audio/video
}

export interface BatchValidationResult {
  valid: boolean;
  validFiles: File[];
  invalidFiles: { file: File; error: string }[];
  totalSize: number;
}

export class GenericMediaService {
  // Media validation (reusable across domains)
  validateMediaFile(file: File): Promise<MediaValidationResult>
  batchValidateMedia(files: File[]): Promise<BatchValidationResult>
  
  // Media metadata extraction
  getMediaMetadata(file: File): Promise<MediaMetadata>
  generateMediaHash(file: File): Promise<string>
  
  // Media processing utilities
  createMediaAttachment(file: File): Promise<MediaAttachment>
  sortAttachmentsByType(attachments: MediaAttachment[]): MediaAttachment[]
}
```

**Enhanced File: `services/generic/GenericBlossomService.ts`**
```typescript
export interface BatchUploadResult {
  success: boolean;
  uploadedFiles: BlossomFileMetadata[];
  failedFiles: { file: File; error: string }[];
  partialSuccess: boolean;
}

export interface BatchUploadProgress {
  currentFile: string;
  currentFileIndex: number;
  totalFiles: number;
  overallProgress: number;
  fileProgress: number;
  uploadedFiles: BlossomFileMetadata[];
  failedFiles: { file: File; error: string }[];
}

export interface BatchAuthResult {
  authTokens: { file: File; auth: any }[];
  expiresAt: number;
}

export class GenericBlossomService {
  // ... existing methods
  
  /**
   * 🎯 KEY INNOVATION: Single signer prompt for multiple files
   * Creates batch authentication to avoid UX nightmare of multiple prompts
   */
  private async createBatchAuth(
    files: File[],
    signer: NostrSigner,
    server: BlossomServer
  ): Promise<BatchAuthResult>
  
  /**
   * Upload multiple files with SINGLE signer prompt
   * This is the main difference from naive iteration approach
   */
  uploadBatch(
    files: File[], 
    signer: NostrSigner,
    onProgress?: (progress: BatchUploadProgress) => void
  ): Promise<BatchUploadResult>
  
  /**
   * Fallback: Upload files sequentially but with time-window auth
   * Still only ONE signer prompt, but uploads happen one by one
   */
  uploadSequentialWithTimeAuth(
    files: File[], 
    signer: NostrSigner,
    authWindowMinutes: number,
    onProgress?: (progress: BatchUploadProgress) => void
  ): Promise<BatchUploadResult>
}
```

#### 3. Business Service Layer Updates

**Enhanced File: `services/business/ShopBusinessService.ts`**
```typescript
export class ShopBusinessService {
  // ... existing methods
  
  // Enhanced product creation with multiple attachments
  async createProductWithAttachments(
    productData: ProductEventData,
    attachmentFiles: File[],
    signer: NostrSigner,
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<CreateProductResult>
  
  // Enhanced product updating with attachment management
  async updateProductAttachments(
    productId: string,
    updatedData: Partial<ProductEventData>,
    attachmentFiles: File[],
    existingAttachments: ProcessedMediaAttachment[],
    signer: NostrSigner,
    userPubkey: string,
    onProgress?: (progress: ShopPublishingProgress) => void
  ): Promise<UpdateProductResult>
  
  // Business logic for shop-specific media rules
  private processAttachmentsForShop(
    attachments: MediaAttachment[], 
    userPubkey: string
  ): ProcessedMediaAttachment[]
  
  private selectPrimaryAttachment(
    attachments: ProcessedMediaAttachment[]
  ): ProcessedMediaAttachment
  
  private constructShopMediaUrls(
    attachments: MediaAttachment[], 
    userPubkey: string
  ): ProcessedMediaAttachment[]
  
  // Backward compatibility
  private migrateImageToAttachments(
    imageUrl?: string, 
    imageHash?: string
  ): ProcessedMediaAttachment[]
}
```

#### 4. Configuration Management

**New File: `src/config/media.ts`** (Following blossom.ts pattern)
```typescript
export interface MediaConfig {
  maxAttachments: number;
  maxFileSize: number;
  maxTotalSize: number;
  supportedTypes: string[];
  supportedMimeTypes: string[];
  imageFormats: string[];
  audioFormats: string[];
  videoFormats: string[];
}

export const MEDIA_CONFIG: MediaConfig = {
  maxAttachments: 10,
  maxFileSize: 100 * 1024 * 1024, // 100MB per file
  maxTotalSize: 500 * 1024 * 1024, // 500MB total
  supportedTypes: ['image/*', 'audio/*', 'video/*'],
  supportedMimeTypes: [
    // Images
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    // Audio
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // Video
    'video/mp4', 'video/webm', 'video/ogg'
  ],
  imageFormats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  audioFormats: ['mp3', 'wav', 'ogg'],
  videoFormats: ['mp4', 'webm', 'ogv']
};

export const getMediaTypeFromMime = (mimeType: string): 'image' | 'audio' | 'video' | null => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return null;
};
```

#### 5. Hook Architecture Updates

**Enhanced Hook: `hooks/useShopPublishing.ts`**
```typescript
export interface ShopPublishingProgress {
  step: 'validating' | 'uploading_media' | 'creating_event' | 'publishing' | 'complete';
  progress: number;
  message: string;
  details?: string;
  
  // Enhanced for multiple attachments
  mediaProgress?: {
    currentFile: string;
    currentFileIndex: number;
    totalFiles: number;
    fileProgress: number;
    uploadedFiles: number;
    failedFiles: number;
  };
}

export const useShopPublishing = () => {
  // ... existing implementation
  
  const publishProductWithAttachments = useCallback(async (
    productData: ProductEventData,
    attachmentFiles: File[]
  ): Promise<CreateProductResult> => {
    // Implementation using ShopBusinessService.createProductWithAttachments
  }, []);
  
  return {
    // ... existing returns
    publishProductWithAttachments,
  };
};
```

**New Hook: `hooks/useMediaUpload.ts`**
```typescript
export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<BatchUploadProgress | null>(null);
  const [uploadResult, setUploadResult] = useState<BatchUploadResult | null>(null);
  
  const uploadFiles = useCallback(async (
    files: File[],
    signer: NostrSigner
  ): Promise<BatchUploadResult> => {
    // Implementation using GenericBlossomService.uploadBatch
  }, []);
  
  return {
    isUploading,
    uploadProgress,
    uploadResult,
    uploadFiles,
  };
};
```

**New Hook: `hooks/useAttachmentManager.ts`**
```typescript
export const useAttachmentManager = () => {
  const [attachments, setAttachments] = useState<ProcessedMediaAttachment[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const addFiles = useCallback((files: File[]) => {
    // Implementation using GenericMediaService.batchValidateMedia
  }, []);
  
  const removeAttachment = useCallback((index: number) => {
    // Implementation
  }, []);
  
  const reorderAttachments = useCallback((fromIndex: number, toIndex: number) => {
    // Implementation
  }, []);
  
  const setPrimaryAttachment = useCallback((index: number) => {
    // Implementation
  }, []);
  
  return {
    attachments,
    pendingFiles,
    validationErrors,
    addFiles,
    removeAttachment,
    reorderAttachments,
    setPrimaryAttachment,
  };
};
```

#### 6. Form Component Updates

**Enhanced File: `components/shop/ProductCreationForm.tsx`**
```typescript
export const ProductCreationForm = ({ onProductCreated, onCancel }: ProductCreationFormProps) => {
  const { publishProductWithAttachments, isPublishing, progress } = useShopPublishing();
  const { 
    attachments, 
    pendingFiles, 
    validationErrors,
    addFiles, 
    removeAttachment, 
    reorderAttachments,
    setPrimaryAttachment 
  } = useAttachmentManager();
  
  // ... existing form state
  
  const handleFilesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addFiles(files);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const result = await publishProductWithAttachments(formData, pendingFiles);
    // Handle result
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* ... existing form fields */}
      
      {/* Multiple File Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Media ({attachments.length + pendingFiles.length}/{MEDIA_CONFIG.maxAttachments})
        </label>
        
        <input
          type="file"
          multiple
          accept={MEDIA_CONFIG.supportedTypes.join(',')}
          onChange={handleFilesChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        
        {/* Attachment Manager Component */}
        <AttachmentManager
          attachments={attachments}
          pendingFiles={pendingFiles}
          validationErrors={validationErrors}
          onRemove={removeAttachment}
          onReorder={reorderAttachments}
          onSetPrimary={setPrimaryAttachment}
        />
      </div>
      
      {/* Enhanced Progress Indicator */}
      {isPublishing && progress && (
        <MultiMediaProgressIndicator progress={progress} />
      )}
    </form>
  );
};
```

#### 7. New Component Files Needed

**New File: `components/shop/AttachmentManager.tsx`**
```typescript
interface AttachmentManagerProps {
  attachments: ProcessedMediaAttachment[];
  pendingFiles: File[];
  validationErrors: string[];
  onRemove: (index: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onSetPrimary: (index: number) => void;
  readonly?: boolean;
}

export const AttachmentManager: React.FC<AttachmentManagerProps> = ({
  attachments,
  pendingFiles,
  validationErrors,
  onRemove,
  onReorder,
  onSetPrimary,
  readonly = false
}) => {
  // Implementation with drag-and-drop reordering
  // Media previews with type-specific icons
  // Primary attachment selection
  // File validation error display
};
```

**New File: `components/shop/MediaGallery.tsx`**
```typescript
interface MediaGalleryProps {
  attachments: ProcessedMediaAttachment[];
  primaryAttachment?: ProcessedMediaAttachment;
  showControls?: boolean;
  onAttachmentClick?: (attachment: ProcessedMediaAttachment, index: number) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  attachments,
  primaryAttachment,
  showControls = true,
  onAttachmentClick
}) => {
  // Implementation with:
  // - Responsive grid/carousel layout
  // - Video/audio player support
  // - Lightbox/modal for full-size viewing
  // - Media type indicators
};
```

**New File: `components/shop/MultiMediaProgressIndicator.tsx`**
```typescript
interface MultiMediaProgressIndicatorProps {
  progress: ShopPublishingProgress;
}

export const MultiMediaProgressIndicator: React.FC<MultiMediaProgressIndicatorProps> = ({
  progress
}) => {
  // Implementation showing:
  // - Overall progress
  // - Current file being processed
  // - Individual file upload status
  // - Success/failure indicators per file
};
```

#### 8. Display Component Updates

**Enhanced File: `components/ui/BaseCard.tsx`**
```typescript
export interface BaseCardData {
  // ... existing fields
  attachments?: ProcessedMediaAttachment[]; // Replace imageUrl
  primaryAttachment?: ProcessedMediaAttachment;
}

export const BaseCard = ({ data, variant, children, ... }: BaseCardProps) => {
  const primaryMedia = data.primaryAttachment || data.attachments?.[0];
  const hasMultipleAttachments = (data.attachments?.length || 0) > 1;
  
  return (
    <div className="card overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Media Display */}
      <div className="relative aspect-[4/3] bg-primary-50">
        {primaryMedia ? (
          <>
            {primaryMedia.type === 'image' ? (
              <Image
                src={primaryMedia.url}
                alt={data.title}
                width={400}
                height={300}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <MediaPreview attachment={primaryMedia} />
            )}
            
            {/* Multiple Attachments Indicator */}
            {hasMultipleAttachments && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-xs">
                +{(data.attachments?.length || 1) - 1} more
              </div>
            )}
            
            {/* Media Type Indicator */}
            <div className="absolute top-2 left-2">
              <MediaTypeIcon type={primaryMedia.type} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full bg-primary-100">
            {/* No media placeholder */}
          </div>
        )}
      </div>
      
      {/* ... rest of card content */}
    </div>
  );
};
```

### Error Handling Updates

**Enhanced File: `errors/ErrorTypes.ts`**
```typescript
export enum ErrorCode {
  // ... existing codes
  
  // Media-specific error codes
  UNSUPPORTED_FILE_TYPE = 'UNSUPPORTED_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  TOO_MANY_ATTACHMENTS = 'TOO_MANY_ATTACHMENTS',
  TOTAL_SIZE_EXCEEDED = 'TOTAL_SIZE_EXCEEDED',
  BATCH_UPLOAD_FAILED = 'BATCH_UPLOAD_FAILED',
  MEDIA_VALIDATION_FAILED = 'MEDIA_VALIDATION_FAILED',
  ATTACHMENT_PROCESSING_FAILED = 'ATTACHMENT_PROCESSING_FAILED',
}
```

### Store Architecture Updates

**Enhanced File: `stores/useShopStore.ts`**
```typescript
interface ShopStoreState {
  // ... existing fields
  
  // Multi-media support
  uploadingAttachments: boolean;
  attachmentUploadProgress: BatchUploadProgress | null;
  attachmentUploadErrors: MediaError[];
}

interface ShopStoreActions {
  // ... existing actions
  
  // Multi-media actions
  setUploadingAttachments: (uploading: boolean) => void;
  setAttachmentUploadProgress: (progress: BatchUploadProgress | null) => void;
  setAttachmentUploadErrors: (errors: MediaError[]) => void;
}
```

### Critical Technical Considerations for Batch Authentication

#### Research Required Before Implementation
The success of the multiple attachments feature depends on solving the batch authentication challenge:

1. **Blossom Protocol Investigation**: 
   - Does the Blossom protocol support batch authentication natively?
   - Can a single auth event cover multiple file uploads?
   - What are the expiration and security implications?

2. **SDK Compatibility Analysis**:
   - Can `blossom-client-sdk` handle batch auth tokens?
   - Does it need enhancement or wrapper functions?
   - Are there alternative SDKs with better batch support?

3. **Browser Extension Testing**:
   - How do different Nostr extensions (Alby, nos2x, etc.) handle batch signing?
   - Do any support "approve all" or time-window modes?
   - What's the maximum reasonable batch size?

#### Implementation Strategy Priority

**🎯 Priority 1: Batch Auth (Essential for UX)**
```typescript
// Target implementation - single signer prompt
const batchResult = await blossomService.uploadBatch(files, signer);
// User sees: "Authorize upload of 5 files: img1.jpg, vid1.mp4..."
// Result: ONE popup, then seamless uploads
```

**🔄 Priority 2: Fallback Options (If batch fails)**
```typescript
// Grouped uploads with clear user warning
const warning = "This will require 5 separate approvals. Continue?";
if (userConfirms(warning)) {
  await blossomService.uploadSequential(files, signer);
}
```

**⚠️ Priority 3: UX Mitigation (Last resort)**
- Limit attachments to 2-3 files maximum
- Provide clear warnings about multiple prompts
- Implement "pause and resume" for interrupted uploads

#### Technical Implementation Approaches

**Approach A: Protocol-Level Batch (Preferred)**
```typescript
// Single Nostr event authorizing multiple file hashes
const batchAuth = {
  kind: 24242, // Blossom auth kind
  tags: [
    ['t', 'batch_upload'],
    ...fileHashes.map(hash => ['f', hash]),
    ['expiration', String(now + 3600)]
  ],
  content: `Batch upload: ${fileNames.join(', ')}`
};
```

**Approach B: Time-Window Auth (Alternative)**
```typescript
// Single auth valid for short time window
const windowAuth = {
  kind: 24242,
  tags: [
    ['expiration', String(now + 600)], // 10 minute window
    ['purpose', 'batch_upload']
  ],
  content: 'Authorize multiple file uploads'
};
```

**Approach C: Pre-Computed Batch (Fallback)**
```typescript
// Calculate all hashes first, then single auth for known files
const hashes = await Promise.all(files.map(getFileHash));
const precomputedAuth = await createHashBasedAuth(hashes, signer);
```

#### Decision Tree for Implementation

```
Can Blossom protocol handle batch auth natively?
├── YES → Implement Approach A (Protocol-Level Batch)
└── NO → Can we use time-window auth?
    ├── YES → Implement Approach B (Time-Window)  
    └── NO → Can we pre-compute hashes?
        ├── YES → Implement Approach C (Pre-Computed)
        └── NO → Fall back to user warning + sequential uploads
```

#### Success Criteria for Batch Auth
- ✅ **Single signer prompt** for up to 10 files
- ✅ **Clear user messaging** about what they're authorizing  
- ✅ **Secure expiration** (max 1 hour auth window)
- ✅ **Graceful fallback** if batch auth fails
- ✅ **Progress tracking** during batch upload
- ✅ **Error recovery** for partial batch failures

**⚠️ Critical Decision Point**: If batch authentication cannot be implemented reliably, we should **reconsider the scope** of multiple attachments (e.g., limit to 2-3 files max) rather than create a poor UX with excessive popups.

### Implementation Phases

#### Phase 0: Batch Authentication Research & Proof of Concept (2-3 days) 🔬
**CRITICAL FIRST STEP** - Must complete before proceeding with full implementation:

1. **Blossom Protocol Research**:
   - Study Blossom specification for batch auth support
   - Test `blossom-client-sdk` capabilities with multiple files
   - Document current limitations and possibilities

2. **Browser Extension Testing**:
   - Test batch signing with major Nostr extensions (Alby, nos2x, etc.)
   - Measure user experience with different batch sizes (1, 3, 5, 10 files)
   - Document extension-specific behaviors and limitations

3. **Proof of Concept Implementation**:
   - Build minimal batch auth prototype
   - Test all three approaches (Protocol-Level, Time-Window, Pre-Computed)
   - Measure performance and UX impact

4. **Go/No-Go Decision**:
   - **GO**: Batch auth works reliably → Proceed with full implementation
   - **NO-GO**: Batch auth not feasible → Reduce scope to 2-3 files max or abandon feature

#### Phase 1: SOA Architecture Setup (1-2 days)
1. Create `GenericMediaService` with validation and metadata extraction
2. Set up `src/config/media.ts` configuration  
3. Define error codes and interfaces
4. Create comprehensive unit tests for generic services

#### Phase 2: Core Generic Services (3-4 days)
1. Enhance `GenericBlossomService` with batch upload capabilities
2. Implement batch upload progress tracking
3. Add error handling and retry logic for batch operations
4. Integration tests for batch Blossom operations

#### Phase 3: Business Logic Integration (2-3 days)
1. Enhance `ShopBusinessService` with attachment business rules
2. Implement attachment URL construction logic
3. Add backward compatibility for existing single-image products
4. Business logic unit tests

#### Phase 4: Hook Architecture (2-3 days)
1. Create `useMediaUpload` and `useAttachmentManager` hooks
2. Enhance existing `useShopPublishing` and `useProductEditing` hooks
3. Implement state management for multi-attachment workflows
4. Hook integration tests

#### Phase 5: Form Components (3-4 days)
1. Create `AttachmentManager` component with drag-and-drop
2. Update `ProductCreationForm` and `ProductEditForm`
3. Implement `MultiMediaProgressIndicator`
4. Component unit tests and user interaction tests

#### Phase 6: Display Components (2-3 days)
1. Create `MediaGallery` component with video/audio support
2. Update `BaseCard` with multi-attachment display
3. Implement media type indicators and controls
4. Responsive design and accessibility tests

#### Phase 7: Integration & Testing (2-3 days)
1. End-to-end testing of complete workflows
2. Performance testing with multiple large files
3. Error scenario testing and recovery
4. User acceptance testing

### Success Criteria
- ✅ Follows established SOA architecture patterns
- ✅ Maintains clear separation of concerns between service layers
- ✅ Users can upload multiple media files per product
- ✅ Progress tracking works for batch operations
- ✅ Backward compatibility with existing single-image products
- ✅ Clean error handling with user-friendly messages
- ✅ Performance remains acceptable with multiple attachments
- ✅ All uploads integrate properly with Blossom protocol
- ✅ Media gallery provides smooth viewing experience for all formats

### Files Requiring Changes (SOA-Organized)

#### Core Services (Minor Updates)
- `services/core/LoggingService.ts` - Add media-specific log contexts

#### Generic Services (Major Updates)
- **NEW**: `services/generic/GenericMediaService.ts` - Media validation, metadata, hashing
- **ENHANCED**: `services/generic/GenericBlossomService.ts` - Add batch upload capabilities

#### Business Services (Major Updates)
- **ENHANCED**: `services/business/ShopBusinessService.ts` - Add attachment business logic

#### Nostr Services (Moderate Updates)
- **ENHANCED**: `services/nostr/NostrEventService.ts` - Update data structures for attachments

#### Configuration (New Files)
- **NEW**: `src/config/media.ts` - Media configuration following blossom.ts pattern

#### Hooks (Major Updates)
- **NEW**: `hooks/useMediaUpload.ts` - Batch upload management
- **NEW**: `hooks/useAttachmentManager.ts` - Attachment state management
- **ENHANCED**: `hooks/useShopPublishing.ts` - Multi-attachment publishing
- **ENHANCED**: `hooks/useProductEditing.ts` - Multi-attachment editing

#### Components (Major Updates)
- **NEW**: `components/shop/AttachmentManager.tsx` - Multi-file management UI
- **NEW**: `components/shop/MediaGallery.tsx` - Media display with video/audio support
- **NEW**: `components/shop/MultiMediaProgressIndicator.tsx` - Batch upload progress
- **ENHANCED**: `components/shop/ProductCreationForm.tsx` - Multi-file upload
- **ENHANCED**: `components/shop/ProductEditForm.tsx` - Attachment editing
- **ENHANCED**: `components/ui/BaseCard.tsx` - Multi-attachment display

#### Stores (Moderate Updates)
- **ENHANCED**: `stores/useShopStore.ts` - Add attachment upload state
- **ENHANCED**: `stores/useMyShopStore.ts` - Add attachment editing state

#### Error Handling (Minor Updates)
- **ENHANCED**: `errors/ErrorTypes.ts` - Add media-specific error codes

This revised approach ensures the multiple attachments feature integrates seamlessly with the existing SOA architecture while maintaining clean separation of concerns and reusability across the application.
