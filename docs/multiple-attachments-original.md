# Multiple Media Attachments Support for Shop Products

## Requirements Document

### Overview
Expand the current single-image product system to support multiple media attachments for product listings using the Blossom protocol.

### Current State Analysis
The system currently supports one image per product through:
- Single file input in ProductCreationForm and ProductEditForm
- Image upload to Blossom servers
- Single imageUrl field in product data structure
- Image preview functionality

### Required Changes

#### 1. Data Structure Updates

**Files to Change:**
- `services/nostr/NostrEventService.ts` - ProductEventData interface
- `services/business/ShopBusinessService.ts` - ShopProduct interface
- Database schema/migrations if using persistent storage

**Changes:**
- Replace single `imageUrl` field with `attachments` array
- Each attachment should include: id, url, type, name, size, uploadDate, sha256Hash
- Support Blossom-compatible media types: images, audio, video
- Maintain backward compatibility with existing single-image products

#### 2. Form Components Updates

**ProductCreationForm.tsx Changes:**
- Replace single file input with multiple file input (accept="image/*,audio/*,video/*")
- Add drag-and-drop zone for multiple files
- Show preview grid for all selected attachments
- Add individual file validation (type checking for media files only)
- Update file removal functionality for specific attachments
- Add progress tracking per file during upload to Blossom servers
- Update form submission to handle multiple files sequentially

**ProductEditForm.tsx Changes:**
- Display existing attachments in grid layout with media previews
- Allow removal of individual existing attachments
- Support adding new attachments to existing product
- Show preview for both existing and new attachments
- Handle mixed state (some uploaded to Blossom, some pending)
- Add reordering functionality for attachment display order

#### 3. Display Components Updates

**Files to Change:**
- `components/ui/BaseCard.tsx` - Product card display
- Product detail views (if they exist)

**Changes:**
- Update product cards to show multiple images in carousel or grid
- Add attachment count indicator (e.g., "+3 more")
- Support different media type icons (image, audio, video)
- Implement media gallery for product detail view
- Add video/audio player support for non-image media
- Designate primary attachment for card thumbnails

#### 4. Service Layer Updates

**Files to Change:**
- `hooks/useShopPublishing.ts` - Publishing logic
- Blossom upload services
- Nostr event creation logic

**Changes:**
- Batch upload functionality for multiple files to Blossom
- Progress tracking across multiple Blossom uploads
- Error handling for partial upload failures
- Update Nostr event structure to include multiple Blossom blob references
- Add rollback mechanism for failed uploads (delete successful blobs if overall operation fails)
- Generate and store SHA-256 hashes for each blob

#### 5. Progress Tracking Updates

**EditProgressIndicator.tsx Changes:**
- Update progress calculation for multiple file operations
- Show individual file upload status to Blossom servers
- Handle partial success scenarios
- Display which files succeeded/failed during Blossom uploads

#### 6. Validation Updates

**New Validation Rules:**
- Maximum number of attachments (configurable, e.g., 10 files)
- File type restrictions (images, audio, video only - matching Blossom support)
- Duplicate file prevention (using content hash)
- Media file format validation

#### 7. User Experience Enhancements

**New Features Needed:**
- Attachment reordering (drag and drop within form)
- Primary attachment selection for thumbnails
- Media type filtering in product search/browse
- Bulk attachment operations (select multiple, delete selected)
- Media preview modal/lightbox with video/audio playback
- Loading states for individual file uploads

### Implementation Phases

#### Phase 1: Core Infrastructure
1. Update data structures and interfaces for multiple Blossom blob references
2. Modify Blossom upload services for batch operations
3. Update Nostr event creation to handle attachment arrays

#### Phase 2: Form Updates
1. Update ProductCreationForm for multiple file handling
2. Update ProductEditForm for existing + new file management
3. Add media-specific validation logic

#### Phase 3: Display Updates
1. Update product cards with media carousels
2. Add media gallery views with video/audio support
3. Update progress indicators for batch operations

#### Phase 4: Enhancement Features
1. Add drag-and-drop reordering within forms
2. Implement media type filtering in search
3. Add bulk operations and advanced media preview

### Technical Considerations

#### Blossom Integration
- Sequential upload to avoid overwhelming servers
- Proper SHA-256 hash generation and verification
- Blob cleanup for failed operations
- Multiple server support for redundancy

#### Media Handling
- Client-side media preview generation
- Progressive loading for large media files
- Lazy loading for attachment grids
- Responsive media display across devices

#### Performance Impact
- Bandwidth considerations for multiple media files
- Mobile-optimized upload experience
- Background upload with user feedback
- Cached media previews

#### Error Handling
- Partial upload failure recovery
- Network interruption handling during Blossom uploads
- Media file corruption detection
- User-friendly error messages with retry options

### Migration Strategy

#### Backward Compatibility
- Existing single-image products automatically work
- Convert single imageUrl to attachments array with one item
- Maintain old API endpoints during transition period

#### Data Migration
- Script to convert existing products to new attachment structure
- Verification process for migrated data
- Rollback plan if issues arise

### Testing Requirements

#### Unit Tests
- Media file validation logic
- Upload progress tracking
- Form state management with multiple attachments
- Data structure conversions

#### Integration Tests
- Multi-file upload workflows to Blossom
- Edit form with mixed attachment states
- Nostr publishing with multiple media attachments
- Error scenarios and recovery

#### User Acceptance Tests
- Complete product creation flow with various media types
- Editing products with multiple attachments
- Media management operations
- Performance under various network conditions

### Files Requiring Changes

#### Core Files (Major Updates)
- `ProductCreationForm.tsx` - Multi-file handling, drag-drop, media validation
- `ProductEditForm.tsx` - Attachment management, reordering, mixed states
- `services/nostr/NostrEventService.ts` - Data structure changes for attachment arrays
- `services/business/ShopBusinessService.ts` - Interface updates for multiple media

#### Supporting Files (Moderate Updates)
- `components/ui/BaseCard.tsx` - Media carousel/grid display
- `hooks/useShopPublishing.ts` - Batch Blossom upload logic
- `EditProgressIndicator.tsx` - Multi-file progress tracking
- Blossom upload service components

#### New Files Needed
- `AttachmentManager.tsx` - Dedicated component for managing multiple media files
- `MediaGallery.tsx` - Display component with video/audio playback support
- `FileUploadQueue.tsx` - Queue management for sequential Blossom uploads
- `MediaValidator.ts` - Validation utilities for media file operations
- `BlossomBatchUploader.ts` - Service for handling multiple blob uploads

### Success Criteria
- Users can upload multiple media files (images, audio, video) per product
- Edit functionality maintains existing attachments while adding new ones
- Progress tracking accurately reflects multi-file Blossom upload status
- Media gallery provides smooth viewing experience for all supported formats
- Performance remains acceptable with multiple media attachments
- Backward compatibility maintained for existing single-image products
- All uploads properly integrate with Blossom protocol and generate correct blob references