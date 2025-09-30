# TipTap Rich Text Editor Integration

## Overview
This document outlines the integration of TipTap WYSIWYG editor into CultureBridge to enhance text editing capabilities across the platform, particularly for product descriptions and cultural content contributions.

## Why TipTap?

### Business Justification
- **User-Friendly**: WYSIWYG interface requires no markdown knowledge
- **Mission-Aligned**: Better accessibility for elders and non-technical contributors
- **Cultural Content**: Rich formatting for structured storytelling (headers, lists, emphasis)
- **Technical Fit**: Exports to markdown for NIP-23 Nostr events
- **Modern & Maintained**: Used by Notion, GitLab, and other major platforms

### Technical Benefits
- ✅ Next.js App Router compatible
- ✅ SSR support out of the box
- ✅ TypeScript support
- ✅ Extensible architecture
- ✅ Mobile-responsive
- ✅ Markdown import/export
- ✅ Customizable toolbar
- ✅ Accessible (ARIA compliant)

### Trade-offs
- **Bundle Size**: ~150-200KB (vs ~50-100KB for markdown-only editor)
- **Setup Complexity**: More initial configuration than simple textarea
- **Learning Curve**: Team needs to understand TipTap APIs

---

## Installation

### Step 1: Install Dependencies
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-markdown @tiptap/extension-placeholder
```

### Step 2: Install UI Extensions (Optional but Recommended)
```bash
# For better formatting options
npm install @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-link

# For character count
npm install @tiptap/extension-character-count
```

### Package Breakdown:
- **@tiptap/react** - React integration layer
- **@tiptap/starter-kit** - Essential extensions (bold, italic, headings, lists, etc.)
- **@tiptap/extension-markdown** - Markdown import/export for Nostr compatibility
- **@tiptap/extension-placeholder** - Placeholder text support
- **@tiptap/extension-character-count** - Character counting for validation

---

## Implementation Plan

### Phase 1: Foundation (Week 1)
**Goal**: Create reusable component and test in one location

#### Tasks:
1. ✅ Install TipTap packages
2. ✅ Create `RichTextEditor` component
3. ✅ Create toolbar component
4. ✅ Add styling to match CultureBridge design
5. ✅ Integrate into `ProductCreationForm.tsx` (description field)
6. ✅ Test markdown export to NIP-23 events
7. ✅ Verify Nostr event creation works
8. ✅ Test mobile responsiveness

#### Success Criteria:
- Editor loads without errors
- Typing and formatting works smoothly
- Markdown exports correctly to Nostr events
- Mobile experience is good
- Character count validation works (2000 char limit)

---

### Phase 2: Shop Forms (Week 2)
**Goal**: Expand to all product-related forms

#### Tasks:
1. ✅ Add to `ProductEditForm.tsx` (description field)
2. ✅ Ensure existing products load correctly
3. ✅ Test edit → save → view workflow
4. ✅ Handle legacy plain text products
5. ✅ Add markdown rendering for product detail pages

#### Files to Update:
- `src/components/shop/ProductCreationForm.tsx`
- `src/components/shop/ProductEditForm.tsx`
- `src/app/shop/[id]/page.tsx` (add markdown rendering)

---

### Phase 3: Content Contributions (Week 3)
**Goal**: Enable rich formatting for cultural content

#### Tasks:
1. ✅ Add to `ContributeContent.tsx` (description field)
2. ✅ Add to `ContributeContent.tsx` (culturalContext field)
3. ✅ Test with longer form content
4. ✅ Add markdown rendering for contribution display
5. ✅ Gather feedback from test users

#### Files to Update:
- `src/components/pages/ContributeContent.tsx`
- Display pages for contributions

---

### Phase 4: Profile & Polish (Week 4)
**Goal**: Complete rollout and refinement

#### Tasks:
1. ✅ Add to profile bio field
2. ✅ Add markdown rendering everywhere content is displayed
3. ✅ Performance optimization (lazy loading)
4. ✅ Accessibility audit
5. ✅ User documentation/tooltips
6. ✅ Final testing across all devices

#### Files to Update:
- `src/app/profile/page.tsx`
- All content display components

---

## Component Architecture

### 1. RichTextEditor Component
**Location**: `src/components/ui/RichTextEditor.tsx`

```typescript
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import Markdown from '@tiptap/extension-markdown';
import { RichTextToolbar } from './RichTextToolbar';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  minHeight?: number;
  error?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write your content here...',
  maxLength,
  minHeight = 200,
  error,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
      Markdown,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      // Export as markdown for Nostr NIP-23 events
      const markdown = editor.storage.markdown.getMarkdown();
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none min-h-[${minHeight}px] px-4 py-3`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  const characterCount = editor.storage.characterCount.characters();
  const isOverLimit = maxLength && characterCount > maxLength;

  return (
    <div className={`border rounded-lg ${error ? 'border-red-500' : 'border-gray-300'} focus-within:ring-2 focus-within:ring-primary-500`}>
      <RichTextToolbar editor={editor} />
      <EditorContent editor={editor} />
      
      {maxLength && (
        <div className={`px-4 py-2 text-sm text-right border-t ${isOverLimit ? 'text-red-600' : 'text-gray-500'}`}>
          {characterCount} / {maxLength}
        </div>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 px-4 py-2">{error}</p>
      )}
    </div>
  );
}
```

---

### 2. RichTextToolbar Component
**Location**: `src/components/ui/RichTextToolbar.tsx`

```typescript
'use client';

import { Editor } from '@tiptap/react';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextToolbarProps {
  editor: Editor;
}

export function RichTextToolbar({ editor }: RichTextToolbarProps) {
  const ToolbarButton = ({ 
    onClick, 
    isActive, 
    icon: Icon, 
    label 
  }: { 
    onClick: () => void; 
    isActive?: boolean; 
    icon: any; 
    label: string 
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-primary-100 text-primary-800' : 'text-gray-600'
      }`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className="flex items-center gap-1 p-2 border-b border-gray-200 flex-wrap">
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        icon={Bold}
        label="Bold"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        icon={Italic}
        label="Italic"
      />
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        icon={Heading1}
        label="Heading 1"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        icon={Heading2}
        label="Heading 2"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        icon={Heading3}
        label="Heading 3"
      />
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        icon={List}
        label="Bullet List"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        icon={ListOrdered}
        label="Numbered List"
      />
      
      <div className="w-px h-6 bg-gray-300 mx-1" />
      
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        icon={Undo}
        label="Undo"
      />
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        icon={Redo}
        label="Redo"
      />
    </div>
  );
}
```

---

### 3. Markdown Renderer Component
**Location**: `src/components/ui/MarkdownRenderer.tsx`

```typescript
'use client';

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-primary max-w-none ${className}`}>
      <ReactMarkdown
        components={{
          // Customize rendering if needed
          h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-2xl font-bold mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-xl font-bold mb-2">{children}</h3>,
          p: ({ children }) => <p className="mb-4">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
          li: ({ children }) => <li className="mb-1">{children}</li>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
```

---

## Integration Examples

### Example 1: Product Creation Form

**Before** (Plain textarea):
```tsx
<textarea
  id="description"
  value={formData.description}
  onChange={(e) => handleInputChange('description', e.target.value)}
  rows={4}
  className="w-full px-4 py-3 border rounded-default"
  placeholder="Describe your product"
  maxLength={2000}
/>
```

**After** (Rich text editor):
```tsx
import RichTextEditor from '@/components/ui/RichTextEditor';

<RichTextEditor
  value={formData.description}
  onChange={(value) => handleInputChange('description', value)}
  placeholder="Describe your product using rich formatting..."
  maxLength={2000}
  minHeight={200}
  error={errors.description}
/>
```

---

### Example 2: Contribute Content Form

**Before**:
```tsx
<textarea
  id="culturalContext"
  rows={4}
  className="w-full rounded-md"
  value={formData.culturalContext}
  onChange={(e) => setFormData({ ...formData, culturalContext: e.target.value })}
  required
/>
```

**After**:
```tsx
<RichTextEditor
  value={formData.culturalContext}
  onChange={(value) => setFormData({ ...formData, culturalContext: value })}
  placeholder="Share the cultural context and significance..."
  maxLength={5000}
  minHeight={300}
/>
```

---

### Example 3: Displaying Markdown Content

**Product Detail Page**:
```tsx
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

export default function ProductDetailPage({ product }) {
  return (
    <div>
      <h1>{product.title}</h1>
      
      {/* Render markdown description */}
      <MarkdownRenderer 
        content={product.description} 
        className="mt-4"
      />
    </div>
  );
}
```

---

## Styling Integration

### TailwindCSS Prose Configuration
Add to `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#1a202c',
            a: {
              color: '#2563eb',
              '&:hover': {
                color: '#1d4ed8',
              },
            },
            h1: {
              color: '#1a202c',
              fontWeight: '700',
            },
            h2: {
              color: '#1a202c',
              fontWeight: '700',
            },
            h3: {
              color: '#1a202c',
              fontWeight: '600',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

### Custom Editor Styles
Create `src/styles/tiptap.css`:

```css
/* TipTap Editor Custom Styles */
.ProseMirror {
  outline: none;
}

.ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: #9ca3af;
  pointer-events: none;
  height: 0;
}

.ProseMirror h1 {
  font-size: 1.875rem;
  font-weight: 700;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.ProseMirror h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.ProseMirror h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 0.5rem;
  margin-bottom: 0.5rem;
}

.ProseMirror ul,
.ProseMirror ol {
  padding-left: 1.5rem;
  margin: 0.5rem 0;
}

.ProseMirror li {
  margin: 0.25rem 0;
}

.ProseMirror strong {
  font-weight: 600;
}

.ProseMirror em {
  font-style: italic;
}
```

Import in `src/app/layout.tsx`:
```tsx
import '@/styles/tiptap.css';
```

---

## Nostr Integration

### Markdown Storage in NIP-23 Events

The TipTap editor exports markdown which is stored in the `content` field of NIP-23 events:

```typescript
// NostrEventService.ts - Already handles markdown content
const nip23Content: NIP23Content = {
  title: productData.title,
  content: productData.description, // This is now rich markdown!
  summary: productData.description.substring(0, 200) + '...',
  // ... other fields
};
```

### Backward Compatibility

Handle legacy plain text content gracefully:

```typescript
// When loading existing products
const loadProductDescription = (rawContent: string) => {
  // If content has markdown syntax, treat as markdown
  if (rawContent.includes('#') || rawContent.includes('**') || rawContent.includes('- ')) {
    return rawContent; // Already markdown
  }
  
  // Otherwise, treat as plain text (legacy content)
  return rawContent;
};
```

---

## Testing Checklist

### Phase 1: Component Testing
- [ ] Editor loads without errors
- [ ] Toolbar buttons work (bold, italic, headings, lists)
- [ ] Character count displays correctly
- [ ] Max length validation works
- [ ] Placeholder shows when empty
- [ ] Undo/redo functionality works
- [ ] Mobile toolbar is responsive
- [ ] Focus states work properly

### Phase 2: Integration Testing
- [ ] Form submission includes markdown content
- [ ] Markdown exports correctly to NIP-23 events
- [ ] Events publish successfully to Nostr relays
- [ ] Markdown renders correctly in product detail pages
- [ ] Legacy plain text products display correctly
- [ ] Edit → Save → View workflow works

### Phase 3: User Experience Testing
- [ ] Desktop Chrome/Firefox/Safari
- [ ] Mobile iOS Safari
- [ ] Mobile Android Chrome
- [ ] Tablet experience
- [ ] Keyboard navigation works
- [ ] Screen reader compatibility
- [ ] Performance is acceptable (no lag)

### Phase 4: Edge Cases
- [ ] Very long content (5000+ characters)
- [ ] Special characters and emojis
- [ ] Copy/paste from other sources
- [ ] Empty content handling
- [ ] Content with only whitespace
- [ ] Maximum nesting of lists/headings

---

## Performance Optimization

### 1. Code Splitting
Load TipTap only when needed:

```tsx
// Dynamic import for forms
import dynamic from 'next/dynamic';

const RichTextEditor = dynamic(
  () => import('@/components/ui/RichTextEditor'),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-48 bg-gray-100 rounded-lg" />
  }
);
```

### 2. Debounce Updates
For auto-save functionality:

```typescript
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSave = useMemo(
  () => debounce((markdown: string) => {
    // Auto-save logic
    saveToDraft(markdown);
  }, 1000),
  []
);
```

### 3. Bundle Analysis
Monitor bundle size impact:

```bash
ANALYZE=true npm run build
```

Expected impact: ~150KB added to form pages (acceptable trade-off for UX improvement)

---

## Accessibility

### ARIA Labels
```tsx
<div role="textbox" aria-label="Rich text editor for product description">
  <EditorContent editor={editor} />
</div>
```

### Keyboard Shortcuts
Built-in TipTap shortcuts:
- `Ctrl/Cmd + B` - Bold
- `Ctrl/Cmd + I` - Italic
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + Alt + 1-3` - Headings

### Screen Reader Support
Ensure toolbar buttons have proper labels:

```tsx
<button aria-label="Make text bold">
  <Bold className="w-4 h-4" />
</button>
```

---

## User Documentation

### In-App Tooltips
Add help text for users:

```tsx
<div className="mb-2 flex items-center justify-between">
  <label>Product Description</label>
  <span className="text-sm text-gray-500">
    Use the toolbar to format your text
  </span>
</div>
```

### Formatting Guide
Create a help modal with examples:
- **Bold text**: `**text**` or use toolbar
- *Italic text*: `*text*` or use toolbar  
- Headings: Use toolbar buttons or `# Heading`
- Lists: Use toolbar buttons or `- item` / `1. item`

---

## Migration Strategy

### Step-by-Step Migration

1. **Install packages** (Phase 1)
2. **Create components** (Phase 1)
3. **Add to ONE form first** - ProductCreationForm (Phase 1)
4. **Test thoroughly** (Phase 1)
5. **Gather user feedback** (Phase 1)
6. **Roll out to other forms** (Phase 2-3)
7. **Add rendering everywhere** (Phase 2-4)

### Rollback Plan
If issues arise:
- Keep textarea components as fallback
- Use feature flag to toggle editor
- Can revert to plain text easily (markdown is still valid text)

---

## Troubleshooting

### Common Issues

**Issue**: Editor doesn't load
```tsx
// Solution: Ensure dynamic import for client-side only
const RichTextEditor = dynamic(() => import('@/components/ui/RichTextEditor'), {
  ssr: false
});
```

**Issue**: Markdown export is empty
```tsx
// Solution: Check editor instance exists
if (!editor) return null;
const markdown = editor.storage.markdown.getMarkdown();
```

**Issue**: Styling conflicts with Tailwind
```tsx
// Solution: Use prose classes and custom CSS
className="prose prose-sm max-w-none"
```

**Issue**: Performance lag on mobile
```tsx
// Solution: Reduce toolbar options for mobile
const isMobile = window.innerWidth < 768;
{!isMobile && <AdvancedToolbarButtons />}
```

---

## Maintenance

### Dependencies to Monitor
- `@tiptap/react` - Core functionality
- `@tiptap/starter-kit` - Basic extensions
- `@tiptap/extension-markdown` - Critical for Nostr compatibility

### Update Strategy
```bash
# Check for updates monthly
npm outdated | grep tiptap

# Update with caution (test thoroughly)
npm update @tiptap/react @tiptap/starter-kit
```

### Breaking Changes
Monitor: https://tiptap.dev/docs/changelog

---

## Resources

### Official Documentation
- TipTap Docs: https://tiptap.dev/docs
- Examples: https://tiptap.dev/examples
- Extensions: https://tiptap.dev/docs/editor/extensions

### Community
- GitHub: https://github.com/ueberdosis/tiptap
- Discord: https://discord.gg/tiptap
- Stack Overflow: Tag `tiptap`

### Related Docs
- [Nostr NIP-23 Specification](https://github.com/nostr-protocol/nips/blob/master/23.md)
- [Markdown Guide](https://www.markdownguide.org/)
- [Tailwind Typography](https://tailwindcss.com/docs/typography-plugin)

---

## Success Metrics

### Phase 1 (Week 1)
- ✅ Zero console errors
- ✅ Smooth typing experience (<100ms lag)
- ✅ Successful Nostr event creation
- ✅ Mobile responsive

### Phase 2-3 (Weeks 2-3)
- ✅ All forms migrated
- ✅ Positive user feedback (>80% satisfaction)
- ✅ No increase in support tickets

### Phase 4 (Week 4)
- ✅ Markdown rendering everywhere
- ✅ Performance within budget (<200KB bundle increase)
- ✅ Accessibility score >95%
- ✅ Documentation complete

---

## Next Steps

1. Review this documentation with the team
2. Get approval for Phase 1 implementation
3. Install dependencies and create components
4. Start with ProductCreationForm integration
5. Test and iterate based on feedback

---

*Last Updated: September 30, 2025*
*Document Version: 1.0*
*Status: Ready for Implementation*
