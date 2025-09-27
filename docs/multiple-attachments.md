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

### Phase 0 POC Results: Enhanced Sequential Upload Strategy

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
// Result: User gets 5+ signer popups for 5 files with no warning! 😱
```

#### 🔬 POC Findings: Batch Authentication Not Supported
**Phase 0 Testing Results (September 27, 2025)**:
- **✅ Signer Prompt Reduction**: Successfully achieved 1 signer prompt for multiple files
- **❌ Blossom Server Compatibility**: All batch auth approaches returned HTTP 401 Unauthorized
- **✅ Extension Compatibility**: nos2x extension handled batch signing correctly
- **Conclusion**: Blossom protocol has **no native batch authentication support**

#### ✅ Our Solution: Enhanced Sequential Upload with Superior UX
**Key Innovation**: Transform multiple prompts from **surprise annoyance** to **expected workflow**:

```typescript
// SOLUTION: Enhanced Sequential with User Consent
export class EnhancedSequentialUpload {
  async uploadMultipleFiles(files: File[], signer: NostrSigner) {
    // 🎯 INFORMED CONSENT: User knows exactly what to expect
    const consent = await showBatchUploadDialog({
      fileCount: files.length,
      message: `Upload ${files.length} files (requires ${files.length} approvals)`,
      estimatedTime: '30-45 seconds'
    });
    
    if (!consent) return { cancelled: true };
    
    // 🎯 PROGRESSIVE FEEDBACK: Clear status for each step
    const progress = new MultiFileProgressTracker(files.length);
    
    // 🎯 EXPECTED PROMPTS: User anticipates each approval
    for (let i = 0; i < files.length; i++) {
      progress.update(i, 'authenticating', `Approve ${i+1}/${files.length}`);
      const auth = await BlossomClient.createUploadAuth(signer, files[i], {
        message: `Upload ${i + 1}/${files.length}: ${files[i].name}`
      });
      
      progress.update(i, 'uploading', `Uploading ${files[i].name}...`);
      await BlossomClient.uploadBlob(server.url, files[i], { auth });
      progress.update(i, 'completed');
    }
  }
}
```

**UX Result**: User sees upfront dialog: *"Upload 3 files (requires 3 approvals) - Estimated time: 30 seconds"* then expects each prompt.

#### Enhanced UX Design Principles

**Before Upload - Informed Consent:**
```
┌─────────────────────────────────────────┐
│  📁 Upload 3 Files                      │
│                                         │
│  • image1.jpg (2.1 MB)                  │
│  • image2.jpg (1.8 MB)                  │  
│  • video1.mp4 (15.2 MB)                 │
│                                         │
│  ⚠️  This will require 3 separate       │
│      approvals from your Nostr signer   │
│                                         │
│  ⏱️  Estimated time: 30-45 seconds       │
│                                         │
│  [ Cancel ]  [ Upload All Files ]       │
└─────────────────────────────────────────┘
```

**During Upload - Progressive Feedback:**
```
┌─────────────────────────────────────────┐
│  📤 Uploading Files (2/3)               │
│                                         │
│  ✅ image1.jpg - Completed              │
│  🔄 image2.jpg - Uploading... 67%       │
│  ⏳ video1.mp4 - Waiting for approval   │
│                                         │
│  Overall Progress: ████████░░ 67%       │
│                                         │
│  Next: Please approve video1.mp4        │
│        in your Nostr signer             │
└─────────────────────────────────────────┘
```

This approach transforms **popup spam** into **expected workflow** through superior UX design.

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
export interface SequentialUploadResult {
  success: boolean;
  uploadedFiles: BlossomFileMetadata[];
  failedFiles: { file: File; error: string }[];
  partialSuccess: boolean;
  userCancelled: boolean;
}

export interface SequentialUploadProgress {
  currentFileIndex: number;
  totalFiles: number;
  currentFile: {
    name: string;
    status: 'waiting' | 'authenticating' | 'uploading' | 'completed' | 'failed';
    progress: number; // 0-100
  };
  completedFiles: string[];
  failedFiles: { name: string; error: string }[];
  overallProgress: number; // 0-100
  nextAction: string; // e.g., "Please approve image2.jpg in your signer"
}

export interface BatchUploadConsent {
  fileCount: number;
  totalSize: number;
  estimatedTime: number;
  requiredApprovals: number;
  userAccepted: boolean;
  timestamp: number;
}

export class GenericBlossomService {
  // ... existing methods
  
  /**
   * 🎯 KEY INNOVATION: Enhanced Sequential Upload with Superior UX
   * Transforms multiple prompts from surprise annoyance to expected workflow
   */
  async uploadSequentialWithConsent(
    files: File[], 
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult>
  
  /**
   * Get informed user consent before starting multi-file upload
   */
  private async getUserBatchConsent(
    files: File[]
  ): Promise<BatchUploadConsent>
  
  /**
   * Upload files one by one with clear progress feedback
   * Each signer prompt is expected and contextualized
   */
  private async uploadFilesSequentially(
    files: File[],
    signer: NostrSigner,
    onProgress?: (progress: SequentialUploadProgress) => void
  ): Promise<SequentialUploadResult>
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

#### Phase 0: Batch Authentication Research & Proof of Concept (2-3 days) ✅ COMPLETED
**CRITICAL FIRST STEP** - Completed September 27, 2025:

1. **Blossom Protocol Research** ✅:
   - Tested `blossom-client-sdk` capabilities with multiple files
   - Discovered Blossom servers reject custom batch auth formats
   - Confirmed standard per-file auth works reliably

2. **Browser Extension Testing** ✅:
   - Tested with nos2x extension successfully
   - Confirmed extensions can handle rapid sequential signing
   - Measured UX impact of multiple prompts

3. **Proof of Concept Implementation** ✅:
   - Built and tested 3 batch auth approaches (Protocol-Level, Time-Window, Pre-Computed)
   - All approaches achieved 1 signer prompt for batch auth creation
   - All approaches failed at Blossom server level (HTTP 401 Unauthorized)

4. **Decision Made** ✅:
   - **PROCEED**: Enhanced Sequential Upload with Superior UX Design
   - Transform multiple prompts from **surprise annoyance** to **expected workflow**
   - Focus on user consent and progress feedback rather than protocol-level batching

#### Phase 1: SOA Architecture Setup (1-2 days)
1. Create `GenericMediaService` with validation and metadata extraction
2. Set up `src/config/media.ts` configuration  
3. Define error codes and interfaces
4. Create comprehensive unit tests for generic services

#### Phase 2: Enhanced Sequential Upload Services (3-4 days)
1. Implement `GenericBlossomService.uploadSequentialWithConsent()` 
2. Build `MultiFileProgressTracker` for real-time status updates
3. Create `UserConsentDialog` for upfront approval and expectation setting
4. Add error handling and retry logic for individual file failures
5. Integration tests for sequential upload workflows

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

### Success Criteria (Updated Based on Phase 0 Results)

#### ✅ **Primary Success Metrics**
- **Clear user expectations**: Users understand approval requirements upfront via consent dialog
- **Reliable uploads**: 95%+ success rate for individual file uploads using standard Blossom auth
- **Progress visibility**: Real-time status updates during sequential upload process
- **Error recovery**: Graceful handling of individual file failures with retry options
- **Cross-extension support**: Works reliably with major Nostr browser extensions

#### ✅ **Technical Architecture**
- **Follows established SOA patterns**: Proper service layer separation and reusability
- **Enhanced UX design**: Transforms multiple prompts into expected workflow
- **Backward compatibility**: Existing single-image products continue to work
- **Performance optimization**: Reasonable upload times for typical file sizes
- **Clean error handling**: User-friendly messages and recovery options

#### ✅ **User Experience Goals**
- **No surprise popups**: All signer prompts expected by user after consent dialog
- **Informed consent**: Users know exactly what to expect before starting
- **Progressive feedback**: Clear indication of current file and overall progress
- **Error clarity**: Specific error messages with actionable retry options
- **Manageable scope**: 3-5 files maximum to keep approval process reasonable

#### ✅ **Business Value**
- **Core functionality**: Multiple images/media per product as originally envisioned
- **User adoption**: Superior to single-file limitation, acceptable prompt experience
- **Development efficiency**: Builds on proven Blossom infrastructure
- **Future-ready**: Can adopt true batch auth if Blossom protocol adds support

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

## Phase 0 Decision Summary

**APPROVED: Enhanced Sequential Upload Implementation** ✅

Based on comprehensive POC testing completed September 27, 2025, we have determined that multiple attachments is **viable and valuable** using an enhanced sequential upload approach with superior UX design.

### Key Findings from POC
- **✅ Signer Prompt Reduction**: Successfully achieved 1 signer prompt for multiple files
- **❌ Blossom Batch Auth**: Protocol has no native batch authentication support  
- **✅ Extension Compatibility**: nos2x and other extensions handle sequential signing well
- **✅ UX Innovation**: Transform multiple prompts from **surprise annoyance** to **expected workflow**

### Implementation Decision
**Proceed with Enhanced Sequential Upload** featuring:
- **Informed user consent** before starting multi-file uploads
- **Progressive feedback** with real-time status updates  
- **Expected prompts** that users anticipate and understand
- **Error recovery** with individual file retry capabilities
- **Manageable scope** of 3-5 files maximum

### Timeline: 10-14 days (reduced from original 15-20 days)
- Phase 1: SOA Architecture Setup (1-2 days)
- Phase 2: Enhanced Sequential Upload Services (3-4 days)  
- Phase 3: Business Logic Integration (2-3 days)
- Phase 4: Hook Architecture (2-3 days)
- Phase 5: Form Components (3-4 days)
- Phase 6: Display Components (2-3 days)
- Phase 7: Integration & Testing (2-3 days)

This approach ensures the multiple attachments feature integrates seamlessly with the existing SOA architecture while delivering excellent user experience through thoughtful UX design rather than protocol-level optimization.
