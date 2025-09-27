# Phase 4.5: Selective Attachment Management & Modularity

## Overview

Phase 4.5 transforms the "replace all" attachment management system into a modular, reusable system with selective operations. This phase enables users to add, remove, or reorder individual attachments without replacing all existing ones, while maintaining excellent modularity and reusability across multiple projects and content types.

## 🎯 Goals

- **Selective Operations**: Add/remove/reorder individual attachments
- **Generic Components**: Works for any content type (shop, events, resources, etc.)
- **Modular Architecture**: Reusable across multiple projects
- **Clean APIs**: Easy for other developers to integrate
- **Enhanced UX**: Better user control over attachment management

## 📁 File Structure

```
src/
├── types/
│   └── attachments.ts                    # Generic attachment interfaces
├── services/
│   ├── business/
│   │   └── MediaBusinessService.ts      # Business logic for attachments
│   └── generic/
│       ├── GenericMediaService.ts       # Enhanced with selective operations
│       └── GenericBlossomService.ts     # Enhanced with selective operations
├── hooks/
│   ├── useAttachmentManager.ts          # Generic attachment manager
│   ├── useSelectiveAttachmentManager.ts # Specialized selective operations
│   └── useGenericAttachmentWorkflow.ts  # Workflow for any content type
├── components/
│   └── generic/
│       ├── AttachmentManager.tsx        # Generic UI component
│       └── UserConsentDialog.tsx        # Enhanced for selective operations
└── services/generic/
    └── MultiFileProgressTracker.ts      # Enhanced for selective operations
```

## 🔧 Core Components

### 1. Generic Attachment Interfaces (`src/types/attachments.ts`)

**Purpose**: Defines generic interfaces that work with any content type.

**Key Interfaces**:
- `GenericAttachment`: Base interface for all attachment types
- `AttachmentOperation`: Defines selective operations (add/remove/replace/reorder/update)
- `SelectiveUpdateResult<T>`: Result of selective operations
- `AttachmentSelectionState`: UI state for selection management
- `AttachmentManagerConfig`: Configuration for attachment managers

**Content-Specific Interfaces**:
- `ProductAttachment`: Shop product attachments
- `EventAttachment`: Event attachments
- `ResourceAttachment`: Resource attachments
- `ProfileAttachment`: Profile attachments

**Example Usage**:
```typescript
import { GenericAttachment, AttachmentOperation, createAttachmentOperation } from '../types/attachments';

// Create an operation
const addOperation = createAttachmentOperation('add', undefined, [file1, file2]);
const removeOperation = createAttachmentOperation('remove', 'attachment-id');
const reorderOperation = createAttachmentOperation('reorder', undefined, undefined, 0, 2);
```

### 2. Media Business Service (`src/services/business/MediaBusinessService.ts`)

**Purpose**: Handles business rules and lifecycle management for attachments.

**Key Features**:
- Business rules validation
- Attachment lifecycle management
- Operation processing with business logic
- Configuration management
- Lifecycle event tracking

**Example Usage**:
```typescript
import { mediaBusinessService } from '../services/business/MediaBusinessService';

// Validate operations
const validation = mediaBusinessService.validateAttachmentOperation(operation, existingAttachments);

// Process operations
const result = await mediaBusinessService.processAttachmentOperations(operations, existingAttachments);

// Create operation
const operation = mediaBusinessService.createAttachmentOperation('add', undefined, files);
```

### 3. Enhanced Generic Services

#### GenericMediaService (`src/services/generic/GenericMediaService.ts`)
- Added `validateFilesForSelectiveOperations()`
- Added `createGenericAttachmentFromFile()`
- Added `processAttachmentOperations()`
- Added operation validation and processing

#### GenericBlossomService (`src/services/generic/GenericBlossomService.ts`)
- Added `uploadFilesForSelectiveOperations()`
- Added `deleteFile()` for selective operations
- Added `processSelectiveOperations()`
- Added `batchUploadForSelectiveOperations()`

### 4. Generic Attachment Manager Hook (`src/hooks/useAttachmentManager.ts`)

**Purpose**: Generic hook for comprehensive attachment management across any content type.

**Key Features**:
- Generic type support (`<T extends GenericAttachment>`)
- Core operations (add/remove/replace/reorder)
- Selection management
- Batch operations
- Validation
- Operation management
- State management

**Example Usage**:
```typescript
import { useAttachmentManager } from '../hooks/useAttachmentManager';

const MyComponent = () => {
  const attachmentManager = useAttachmentManager<ProductAttachment>({
    maxAttachments: 5,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowReorder: true,
    allowReplace: true
  });

  const handleAddFiles = async (files: File[]) => {
    await attachmentManager.addAttachments(files);
  };

  const handleRemoveAttachment = (id: string) => {
    attachmentManager.removeAttachment(id);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    attachmentManager.reorderAttachments(fromIndex, toIndex);
  };

  return (
    <div>
      {/* Your UI components */}
    </div>
  );
};
```

### 5. Selective Attachment Manager Hook (`src/hooks/useSelectiveAttachmentManager.ts`)

**Purpose**: Specialized hook for complex selective operations with batching and enhanced selection.

**Key Features**:
- Batch operations
- Enhanced selection (range selection)
- Batch selection operations
- Operation validation
- Workflow optimization

**Example Usage**:
```typescript
import { useSelectiveAttachmentManager } from '../hooks/useSelectiveAttachmentManager';

const MyComponent = () => {
  const selectiveManager = useSelectiveAttachmentManager<ProductAttachment>({
    maxAttachments: 10,
    allowBatchMode: true
  });

  // Enable batch mode
  selectiveManager.setBatchMode(true);

  // Add operations to batch
  const addOperation = createAttachmentOperation('add', undefined, files);
  selectiveManager.addToBatch(addOperation);

  // Execute batch
  const result = await selectiveManager.executeBatch();

  // Range selection
  selectiveManager.selectRange(0, 4); // Select first 5 items
};
```

### 6. Generic Attachment Workflow Hook (`src/hooks/useGenericAttachmentWorkflow.ts`)

**Purpose**: Provides reusable workflows for any content type with multiple attachments.

**Key Features**:
- Workflow state management
- Step-based execution
- Progress tracking
- Error handling
- Content type agnostic

**Example Usage**:
```typescript
import { useGenericAttachmentWorkflow } from '../hooks/useGenericAttachmentWorkflow';

const MyWorkflow = () => {
  const workflow = useGenericAttachmentWorkflow<ProductAttachment>({
    workflowName: 'Product Media Upload',
    workflowDescription: 'Upload and manage product media',
    steps: [
      { id: 'validate', name: 'Validate Files', description: 'Check file validity' },
      { id: 'upload', name: 'Upload Files', description: 'Upload to Blossom' },
      { id: 'process', name: 'Process Attachments', description: 'Create attachment records' }
    ],
    attachmentConfig: {
      maxAttachments: 5,
      maxFileSize: 100 * 1024 * 1024
    }
  });

  const startWorkflow = async () => {
    await workflow.startWorkflow();
  };

  return (
    <div>
      <button onClick={startWorkflow}>Start Workflow</button>
      {/* Workflow UI */}
    </div>
  );
};
```

### 7. Generic Attachment Manager Component (`src/components/generic/AttachmentManager.tsx`)

**Purpose**: Generic UI component with drag-and-drop, selection, and management for any content type.

**Key Features**:
- Drag-and-drop support
- Selection management
- Reordering
- File replacement
- Progress tracking
- Error handling
- Customizable rendering

**Example Usage**:
```typescript
import { AttachmentManager } from '../components/generic/AttachmentManager';

const MyAttachmentManager = () => {
  return (
    <AttachmentManager<ProductAttachment>
      config={{
        maxAttachments: 5,
        allowDragDrop: true,
        allowSelection: true,
        allowReorder: true
      }}
      onAttachmentsChange={(attachments) => {
        console.log('Attachments changed:', attachments);
      }}
      onSelectionChange={(selectedIds) => {
        console.log('Selection changed:', selectedIds);
      }}
      renderAttachment={(attachment, index) => (
        <div key={attachment.id}>
          <img src={attachment.url} alt={attachment.name} />
          <span>{attachment.name}</span>
        </div>
      )}
    />
  );
};
```

### 8. Enhanced Shop Business Service

**New Methods**:
- `updateProductWithSelectiveOperations()`: Update products with selective operations
- `createProductAttachmentOperation()`: Create operations for shop products
- `validateProductAttachmentOperations()`: Validate operations for shop products

**Example Usage**:
```typescript
import { 
  updateProductWithSelectiveOperations,
  createProductAttachmentOperation 
} from '../services/business/ShopBusinessService';

// Create operations
const operations = [
  createProductAttachmentOperation('add', undefined, [newFile1, newFile2]),
  createProductAttachmentOperation('remove', 'old-attachment-id'),
  createProductAttachmentOperation('reorder', undefined, undefined, 0, 2)
];

// Update product with selective operations
const result = await updateProductWithSelectiveOperations(
  productId,
  updatedData,
  operations,
  signer,
  userPubkey,
  onProgress
);
```

## 🚀 Usage Examples

### Basic Attachment Management

```typescript
import { useAttachmentManager } from '../hooks/useAttachmentManager';
import { ProductAttachment } from '../types/attachments';

const ProductMediaManager = () => {
  const manager = useAttachmentManager<ProductAttachment>({
    maxAttachments: 5,
    maxFileSize: 100 * 1024 * 1024,
    allowReorder: true,
    allowReplace: true
  });

  const handleFileUpload = async (files: File[]) => {
    await manager.addAttachments(files);
  };

  const handleRemove = (id: string) => {
    manager.removeAttachment(id);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    manager.reorderAttachments(fromIndex, toIndex);
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={(e) => handleFileUpload(Array.from(e.target.files || []))} 
      />
      
      {manager.state.attachments.map((attachment, index) => (
        <div key={attachment.id}>
          <img src={attachment.url} alt={attachment.name} />
          <span>{attachment.name}</span>
          <button onClick={() => handleRemove(attachment.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
};
```

### Advanced Selective Operations

```typescript
import { useSelectiveAttachmentManager } from '../hooks/useSelectiveAttachmentManager';
import { createAttachmentOperation } from '../types/attachments';

const AdvancedMediaManager = () => {
  const manager = useSelectiveAttachmentManager<ProductAttachment>({
    maxAttachments: 10,
    allowBatchMode: true
  });

  const handleBatchOperations = async () => {
    // Enable batch mode
    manager.setBatchMode(true);

    // Add multiple operations
    const operations = [
      createAttachmentOperation('add', undefined, [file1, file2]),
      createAttachmentOperation('remove', 'old-id'),
      createAttachmentOperation('reorder', undefined, undefined, 0, 3)
    ];

    operations.forEach(op => manager.addToBatch(op));

    // Execute all operations at once
    const result = await manager.executeBatch();
    
    if (result.success) {
      console.log('Batch operations completed:', result);
    }
  };

  return (
    <div>
      <button onClick={handleBatchOperations}>
        Execute Batch Operations
      </button>
      
      <div>
        Pending Operations: {manager.getPendingOperations().length}
      </div>
    </div>
  );
};
```

### Content Type Specific Usage

```typescript
// For Events
const EventMediaManager = () => {
  const manager = useAttachmentManager<EventAttachment>({
    maxAttachments: 8,
    supportedTypes: ['image/*', 'video/*', 'audio/*', 'document/*']
  });

  // Event-specific logic
  const handleEventMediaUpload = async (files: File[]) => {
    // Convert to EventAttachment format
    const eventAttachments = files.map(file => ({
      ...file,
      eventId: currentEventId,
      category: 'photo' as const
    }));

    await manager.addAttachments(eventAttachments);
  };

  return (
    <AttachmentManager<EventAttachment>
      config={{ maxAttachments: 8 }}
      renderAttachment={(attachment) => (
        <div className="event-media-item">
          <img src={attachment.url} alt={attachment.name} />
          <span>{attachment.category}</span>
        </div>
      )}
    />
  );
};

// For Resources
const ResourceMediaManager = () => {
  const manager = useAttachmentManager<ResourceAttachment>({
    maxAttachments: 3,
    supportedTypes: ['document/*', 'image/*']
  });

  // Resource-specific logic
  const handleResourceUpload = async (files: File[]) => {
    const resourceAttachments = files.map(file => ({
      ...file,
      resourceId: currentResourceId,
      isDownloadable: true,
      category: 'guide' as const
    }));

    await manager.addAttachments(resourceAttachments);
  };

  return (
    <AttachmentManager<ResourceAttachment>
      config={{ maxAttachments: 3 }}
      renderAttachment={(attachment) => (
        <div className="resource-item">
          <span>{attachment.name}</span>
          <span>{attachment.category}</span>
          {attachment.isDownloadable && <span>Downloadable</span>}
        </div>
      )}
    />
  );
};
```

## 🔄 Migration Guide

### From Phase 4 to Phase 4.5

1. **Update Imports**:
   ```typescript
   // Old
   import { useAttachmentManager } from '../hooks/useAttachmentManager';
   
   // New
   import { useAttachmentManager } from '../hooks/useAttachmentManager';
   import { ProductAttachment } from '../types/attachments';
   ```

2. **Update Hook Usage**:
   ```typescript
   // Old
   const manager = useAttachmentManager();
   
   // New
   const manager = useAttachmentManager<ProductAttachment>({
     maxAttachments: 5,
     allowReorder: true,
     allowReplace: true
   });
   ```

3. **Update Operations**:
   ```typescript
   // Old - Replace all
   await manager.updateProductWithAttachments(productId, data, files, signer, userPubkey);
   
   // New - Selective operations
   const operations = [
     createAttachmentOperation('add', undefined, newFiles),
     createAttachmentOperation('remove', oldAttachmentId),
     createAttachmentOperation('reorder', undefined, undefined, 0, 2)
   ];
   
   await manager.updateProductWithSelectiveOperations(productId, data, operations, signer, userPubkey);
   ```

## 🧪 Testing

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAttachmentManager } from '../hooks/useAttachmentManager';

describe('useAttachmentManager', () => {
  it('should add attachments', async () => {
    const { result } = renderHook(() => useAttachmentManager<ProductAttachment>());
    
    const files = [new File(['content'], 'test.jpg', { type: 'image/jpeg' })];
    
    await act(async () => {
      await result.current.addAttachments(files);
    });
    
    expect(result.current.state.attachments).toHaveLength(1);
    expect(result.current.state.attachments[0].name).toBe('test.jpg');
  });

  it('should remove attachments', async () => {
    const { result } = renderHook(() => useAttachmentManager<ProductAttachment>());
    
    // Add attachment first
    const files = [new File(['content'], 'test.jpg', { type: 'image/jpeg' })];
    await act(async () => {
      await result.current.addAttachments(files);
    });
    
    const attachmentId = result.current.state.attachments[0].id;
    
    // Remove attachment
    act(() => {
      result.current.removeAttachment(attachmentId);
    });
    
    expect(result.current.state.attachments).toHaveLength(0);
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { AttachmentManager } from '../components/generic/AttachmentManager';

describe('AttachmentManager', () => {
  it('should handle file upload', async () => {
    const onAttachmentsChange = jest.fn();
    
    render(
      <AttachmentManager<ProductAttachment>
        onAttachmentsChange={onAttachmentsChange}
        allowDragDrop={true}
      />
    );
    
    const fileInput = screen.getByRole('button', { name: /browse/i });
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(onAttachmentsChange).toHaveBeenCalled();
  });
});
```

## 📊 Performance Considerations

### Memory Management
- Attachments are stored in memory with lazy loading
- Large files are processed asynchronously
- Automatic cleanup of unused attachments

### Network Optimization
- Batch operations reduce network calls
- Progressive upload with retry logic
- Compression for large files

### UI Performance
- Virtual scrolling for large attachment lists
- Debounced operations
- Optimistic updates

## 🔒 Security Considerations

### File Validation
- MIME type validation
- File size limits
- Virus scanning (if implemented)

### Access Control
- User authentication required
- Permission-based operations
- Audit logging

### Data Privacy
- Secure file storage
- Encryption in transit
- User data protection

## 🚀 Future Enhancements

### Phase 5 Integration
- Real UI consent dialog
- Advanced drag-and-drop
- Batch operations UI
- Progress indicators

### Additional Features
- Image optimization
- Video transcoding
- Audio processing
- Document conversion

### Performance Improvements
- Web Workers for processing
- Service Worker caching
- CDN integration
- Lazy loading

## 📝 API Reference

### Types

```typescript
interface GenericAttachment {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document';
  name: string;
  size: number;
  mimeType: string;
  url?: string;
  hash?: string;
  metadata?: AttachmentMetadata;
  originalFile?: File;
  createdAt?: number;
  updatedAt?: number;
}

interface AttachmentOperation {
  id: string;
  type: AttachmentOperationType;
  attachmentId?: string;
  files?: File[];
  fromIndex?: number;
  toIndex?: number;
  metadata?: Partial<AttachmentMetadata>;
  timestamp: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

interface SelectiveUpdateResult<T> {
  success: boolean;
  content: T;
  attachments: GenericAttachment[];
  operations: AttachmentOperation[];
  addedAttachments: GenericAttachment[];
  removedAttachments: GenericAttachment[];
  reorderedAttachments: GenericAttachment[];
  error?: string;
  warnings?: string[];
}
```

### Hooks

```typescript
// Generic attachment manager
const useAttachmentManager = <T extends GenericAttachment = GenericAttachment>(
  initialConfig?: Partial<AttachmentManagerConfig>
): UseAttachmentManagerReturn<T>

// Selective attachment manager
const useSelectiveAttachmentManager = <T extends GenericAttachment = GenericAttachment>(
  initialConfig?: Partial<AttachmentManagerConfig>
): UseSelectiveAttachmentManagerReturn<T>

// Generic workflow
const useGenericAttachmentWorkflow = <T extends GenericAttachment = GenericAttachment>(
  config: GenericAttachmentWorkflowConfig<T>
): UseGenericAttachmentWorkflowReturn<T>
```

### Components

```typescript
// Generic attachment manager component
const AttachmentManager = <T extends GenericAttachment = GenericAttachment>({
  config,
  initialAttachments,
  onAttachmentsChange,
  onSelectionChange,
  onError,
  className,
  showPreview,
  showMetadata,
  showOperations,
  allowDragDrop,
  allowSelection,
  allowReorder,
  renderAttachment,
  renderEmpty,
  renderError
}: AttachmentManagerProps<T>)

// User consent dialog
const UserConsentDialog = ({
  isOpen,
  onClose,
  onConfirm,
  files,
  operations,
  title,
  description,
  showDetails,
  autoAccept,
  estimatedTime,
  totalSize
}: UserConsentDialogProps)
```

## 🎉 Conclusion

Phase 4.5 successfully transforms the attachment management system into a modular, reusable, and powerful solution that supports selective operations across any content type. The implementation provides:

- **Excellent Modularity**: Components can be reused across different projects
- **Selective Operations**: Users can manage individual attachments
- **Type Safety**: Full TypeScript support with generic types
- **Performance**: Optimized for large-scale operations
- **Extensibility**: Easy to add new content types and operations
- **Developer Experience**: Clean APIs and comprehensive documentation

This foundation enables the application to handle complex attachment workflows while maintaining code reusability and maintainability across multiple projects and content types.
