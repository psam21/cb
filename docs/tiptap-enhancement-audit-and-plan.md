# Tiptap Rich Text Editor - Audit & Implementation Plan

**Date:** October 1, 2025  
**Current Version:** @tiptap v3.6.2

---

## 1. Current State Audit

### ✅ **Already Implemented**

| Feature | Extension | Status |
|---------|-----------|--------|
| **Bold** | StarterKit (BoldMark) | ✅ Working |
| **Italic** | StarterKit (ItalicMark) | ✅ Working |
| **Headings (1-3)** | StarterKit (Heading) | ✅ Working (limited to h1-h3) |
| **Bullet Lists** | StarterKit (BulletList) | ✅ Working |
| **Ordered Lists** | StarterKit (OrderedList) | ✅ Working |
| **Code** | StarterKit (Code) | ✅ Working |
| **Code Block** | StarterKit (CodeBlock) | ✅ Working |
| **Blockquote** | StarterKit (Blockquote) | ✅ Working |
| **Horizontal Rule** | StarterKit (HorizontalRule) | ✅ Working |
| **Hard Break** | StarterKit (HardBreak) | ✅ Working |
| **History (undo/redo)** | StarterKit (History) | ✅ Working |
| **Placeholder** | @tiptap/extension-placeholder | ✅ Working |
| **Character Count** | @tiptap/extension-character-count | ✅ Working |
| **Markdown Export** | tiptap-markdown | ✅ Working |

### ⚠️ **Implemented but Not in Toolbar**

| Feature | Available | Missing UI |
|---------|-----------|------------|
| Code | ✅ StarterKit | ❌ No toolbar button |
| Code Block | ✅ StarterKit | ❌ No toolbar button |
| Blockquote | ✅ StarterKit | ❌ No toolbar button |
| Horizontal Rule | ✅ StarterKit | ❌ No toolbar button |
| Hard Break | ✅ StarterKit | ❌ No keyboard shortcut shown |

### ❌ **Missing Features (from enhancement doc)**

| Category | Feature | Priority |
|----------|---------|----------|
| **Text Formatting** | Underline | High |
| **Text Formatting** | Strikethrough | High |
| **Text Formatting** | Subscript | Low |
| **Text Formatting** | Superscript | Low |
| **Text Formatting** | Text Color | Medium |
| **Text Formatting** | Highlight | Medium |
| **Text Formatting** | Font Family | Low |
| **Text Formatting** | Font Size | Low |
| **Text Formatting** | Text Align | High |
| **Content** | Links | **CRITICAL** |
| **Content** | Tables | High |
| **Content** | Task Lists | Medium |
| **Content** | Emoji Picker | Low |
| **Content** | Video Embeds | Medium |
| **Content** | Drag & Drop | Low |

### 📊 **Architecture Assessment**

**Strengths:**
- ✅ Clean component structure (Editor + Toolbar + CSS)
- ✅ Markdown export for Nostr compatibility
- ✅ Character limit enforcement
- ✅ Proper TypeScript typing
- ✅ Accessible button implementations

**Weaknesses:**
- ❌ No link support (critical for content)
- ❌ Underutilized StarterKit features (blockquote, HR not in toolbar)
- ❌ No text alignment
- ❌ Basic toolbar UX (no grouping, no dropdowns)
- ❌ MarkdownRenderer doesn't support tables/task lists (no remark-gfm)

---

## 2. Prioritized Implementation Plan

### 🚀 **Phase 1: Critical Features** (Week 1)
*Goal: Essential editing capabilities*

#### 1.1 Add Missing StarterKit Features to Toolbar
**Effort:** 1 hour | **Impact:** High | **Risk:** Low

```tsx
// Add to RichTextToolbar.tsx
- Code button (⌘⇧C)
- Blockquote button 
- Horizontal Rule button
- Clear Formatting button
```

**Files to modify:**
- `src/components/ui/RichTextToolbar.tsx` (add buttons)

**No new dependencies needed** ✅

---

#### 1.2 Implement Links (CRITICAL)
**Effort:** 3-4 hours | **Impact:** Critical | **Risk:** Low

```bash
npm install @tiptap/extension-link
```

**Features:**
- Link insertion with URL modal
- Link editing
- Link removal
- Visual indication of links
- Auto-linkify option (optional)

**Files to modify:**
- `src/components/ui/RichTextEditor.tsx` (add Link extension)
- `src/components/ui/RichTextToolbar.tsx` (add link button with modal)
- `src/styles/tiptap.css` (link styles)
- `src/components/ui/MarkdownRenderer.tsx` (already supports links)

---

#### 1.3 Implement Text Alignment
**Effort:** 2 hours | **Impact:** High | **Risk:** Low

```bash
npm install @tiptap/extension-text-align
```

**Features:**
- Left, center, right, justify alignment
- Alignment dropdown in toolbar
- Visual indicators

**Files to modify:**
- `src/components/ui/RichTextEditor.tsx` (add TextAlign extension)
- `src/components/ui/RichTextToolbar.tsx` (add alignment dropdown)
- `src/styles/tiptap.css` (alignment classes)

---

#### 1.4 Implement Underline & Strikethrough
**Effort:** 1 hour | **Impact:** High | **Risk:** Low

```bash
npm install @tiptap/extension-underline @tiptap/extension-strike
```

**Files to modify:**
- `src/components/ui/RichTextEditor.tsx` (add extensions)
- `src/components/ui/RichTextToolbar.tsx` (add buttons)
- `src/styles/tiptap.css` (strikethrough style)
- `src/components/ui/MarkdownRenderer.tsx` (add ~~strikethrough~~ support)

---

**Phase 1 Total Effort:** 7-8 hours  
**Phase 1 Dependencies:**
```bash
npm install @tiptap/extension-link @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-strike
```

---

### 🎨 **Phase 2: Enhanced Formatting** (Week 2)
*Goal: Professional editing experience*

#### 2.1 Implement Text Color & Highlight
**Effort:** 4-5 hours | **Impact:** Medium | **Risk:** Medium

```bash
npm install @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight
```

**Features:**
- Brand color palette dropdown
- Text color picker
- Background highlight
- Limited color options (avoid chaos)

**⚠️ Markdown Limitation:** Colors don't export to markdown - will be lost on Nostr

**Files to modify:**
- `src/components/ui/RichTextEditor.tsx` (add extensions)
- `src/components/ui/RichTextToolbar.tsx` (add color picker component)
- `src/styles/tiptap.css` (color styles)

---

#### 2.2 Implement Tables
**Effort:** 5-6 hours | **Impact:** High | **Risk:** Medium

```bash
npm install @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header
```

**Features:**
- Insert table (with size picker)
- Add/delete rows/columns
- Merge cells
- Header row toggle
- Contextual menu

**Markdown Support:** ✅ Need `remark-gfm` for rendering

**Files to modify:**
- `src/components/ui/RichTextEditor.tsx` (add table extensions)
- `src/components/ui/RichTextToolbar.tsx` (add table controls)
- `src/styles/tiptap.css` (table styles)
- `src/components/ui/MarkdownRenderer.tsx` (add remark-gfm)

---

#### 2.3 Implement Task Lists
**Effort:** 2-3 hours | **Impact:** Medium | **Risk:** Low

```bash
npm install @tiptap/extension-task-list @tiptap/extension-task-item
```

**Features:**
- Checkbox task items
- Toggle completion
- Nested tasks

**Markdown Support:** ✅ GFM format `- [ ] Task`

**Files to modify:**
- `src/components/ui/RichTextEditor.tsx` (add extensions)
- `src/components/ui/RichTextToolbar.tsx` (add task list button)
- `src/styles/tiptap.css` (checkbox styles)
- `src/components/ui/MarkdownRenderer.tsx` (remark-gfm handles this)

---

**Phase 2 Total Effort:** 11-14 hours  
**Phase 2 Dependencies:**
```bash
npm install @tiptap/extension-text-style @tiptap/extension-color @tiptap/extension-highlight @tiptap/extension-table @tiptap/extension-table-row @tiptap/extension-table-cell @tiptap/extension-table-header @tiptap/extension-task-list @tiptap/extension-task-item remark-gfm
```

---

### 🔬 **Phase 3: Advanced Features** (Week 3+)
*Goal: Power user features*

#### 3.1 Video Embeds
**Effort:** 3-4 hours | **Impact:** Medium | **Risk:** Medium

```bash
npm install @tiptap/extension-youtube
```

**⚠️ Markdown Limitation:** Video embeds don't export to markdown

---

#### 3.2 Subscript & Superscript
**Effort:** 1 hour | **Impact:** Low | **Risk:** Low

```bash
npm install @tiptap/extension-subscript @tiptap/extension-superscript
```

---

#### 3.3 Font Family & Size
**Effort:** 4-5 hours | **Impact:** Low | **Risk:** High

**⚠️ Warning:** 
- Font size is NOT a built-in extension - requires custom implementation
- Markdown doesn't support font changes
- May create inconsistent visual experience

**Recommendation:** Skip unless critical for specific use case

---

#### 3.4 Emoji Picker
**Effort:** 3-4 hours | **Impact:** Low | **Risk:** Medium

**Options:**
- Simple emoji grid
- Use `emoji-mart` library
- Unicode emoji support

**Markdown Support:** ✅ Emojis are Unicode

---

#### 3.5 Drag & Drop Reordering
**Effort:** 6-8 hours | **Impact:** Low | **Risk:** High

```bash
npm install @tiptap/extension-drag-handle prosemirror-dropcursor
```

**Complexity:** High - requires understanding ProseMirror internals

---

**Phase 3 Total Effort:** 17-22 hours

---

## 3. Recommended Implementation Order

### ✅ **Start Here** (Immediate Impact)

1. **Add existing features to toolbar** (1 hour)
   - Code, Blockquote, HR, Clear Formatting

2. **Implement Links** (4 hours) ⭐ **CRITICAL**
   - Essential for any content platform

3. **Add Text Alignment** (2 hours)
   - Expected by users, easy to implement

4. **Add Underline & Strikethrough** (1 hour)
   - Common formatting options

5. **Improve MarkdownRenderer** (1 hour)
   - Add `remark-gfm` for tables/task lists

---

### 📋 **Quick Win Checklist** (First 9 hours)

```bash
# Install dependencies
npm install @tiptap/extension-link @tiptap/extension-text-align @tiptap/extension-underline @tiptap/extension-strike remark-gfm

# Update files (in order)
1. RichTextToolbar.tsx - Add StarterKit buttons
2. RichTextEditor.tsx - Add Link, TextAlign, Underline, Strike
3. RichTextToolbar.tsx - Add Link modal component
4. RichTextToolbar.tsx - Add alignment dropdown
5. tiptap.css - Add link and alignment styles
6. MarkdownRenderer.tsx - Add remark-gfm plugin
7. Test all features in editor and markdown view
```

---

## 4. Technical Considerations

### 🔄 **Markdown Compatibility Matrix**

| Feature | Markdown Support | Notes |
|---------|-----------------|-------|
| Bold/Italic | ✅ Full | `**bold**` `*italic*` |
| Headings | ✅ Full | `# H1` `## H2` |
| Lists | ✅ Full | `- item` `1. item` |
| Links | ✅ Full | `[text](url)` |
| Images | ✅ Full | `![alt](url)` |
| Code/Code Block | ✅ Full | `` `code` `` or ` ```lang` |
| Blockquote | ✅ Full | `> quote` |
| HR | ✅ Full | `---` or `***` |
| Strikethrough | ✅ With GFM | `~~text~~` |
| Tables | ✅ With GFM | Pipe tables |
| Task Lists | ✅ With GFM | `- [ ] task` |
| Underline | ❌ No standard | May lose on export |
| Text Color | ❌ None | Will lose on export |
| Highlight | ❌ None | Will lose on export |
| Font Size/Family | ❌ None | Will lose on export |
| Text Align | ❌ None | Will lose on export |
| Video Embeds | ⚠️ Partial | Can use plain URLs |
| Subscript/Superscript | ⚠️ Partial | Some parsers support |

### 🎯 **Nostr NIP-23 Compatibility**

**Safe Features (Nostr-friendly):**
- ✅ All basic markdown (bold, italic, headings, lists, links)
- ✅ Code blocks
- ✅ Blockquotes
- ✅ Images
- ✅ Strikethrough (with GFM)
- ✅ Tables (with GFM)
- ✅ Task lists (with GFM)

**Lossy Features (HTML-only):**
- ❌ Text colors/highlights
- ❌ Font changes
- ❌ Text alignment
- ❌ Underline (might work with HTML in some clients)

**Recommendation:** Add visual warning when using non-markdown features

---

## 5. UX Enhancements

### 🎨 **Toolbar Improvements Needed**

```
Current: [B] [I] | [H1] [H2] [H3] | [•] [1.] | [↶] [↷]
```

**Proposed Grouping:**
```
[↶] [↷] | [B] [I] [U] [S] | [▼ Heading] | [≡ Align ▼] | [🔗] [💬] [—] | [•] [1.] [☐] | [⋮ More ▼]
```

**Dropdowns to Add:**
- Heading selector (instead of 3 buttons)
- Alignment dropdown
- "More" menu for advanced features

---

## 6. Implementation Files

### 📁 **Files That Will Change**

| File | Changes | Complexity |
|------|---------|-----------|
| `RichTextEditor.tsx` | Add ~10-15 extensions | Medium |
| `RichTextToolbar.tsx` | Add ~15-20 buttons + modals | High |
| `tiptap.css` | Add styles for new elements | Low |
| `MarkdownRenderer.tsx` | Add remark-gfm plugin | Low |
| `package.json` | Add dependencies | Low |

### 🧪 **Testing Requirements**

**For Each Feature:**
- [ ] Works in editor
- [ ] Exports to markdown correctly (if supported)
- [ ] Renders from markdown correctly
- [ ] Keyboard shortcuts work
- [ ] Toolbar button states update
- [ ] Mobile responsive
- [ ] Accessible (ARIA labels, keyboard nav)

---

## 7. Risk Assessment

### ⚠️ **High Risk Items**

1. **Color/Highlight** - Markdown export will lose data
2. **Font Family/Size** - Not built-in, requires custom code
3. **Drag & Drop** - Complex ProseMirror integration
4. **Video Embeds** - Markdown compatibility issues

### ✅ **Low Risk Items**

1. **Links** - Well-documented, markdown-friendly
2. **Text Alignment** - Simple extension
3. **Underline/Strike** - Straightforward
4. **Tables/Task Lists** - GFM support exists

---

## 8. Success Metrics

**After Phase 1:**
- [ ] Users can create links
- [ ] All StarterKit features accessible
- [ ] Text alignment works
- [ ] Underline/strikethrough available
- [ ] Markdown export/import works correctly

**After Phase 2:**
- [ ] Tables can be created and edited
- [ ] Task lists functional
- [ ] Color options available (with warnings)
- [ ] remark-gfm rendering works

**After Phase 3:**
- [ ] Video embeds work
- [ ] Advanced typography available
- [ ] Emoji picker functional

---

## 9. Next Steps

### Immediate Actions:

1. **Review this plan** - Approve phases and priorities
2. **Start Phase 1** - Begin with toolbar improvements
3. **Create issue tracking** - GitHub issues for each feature
4. **Set up testing** - Manual test checklist per feature

### Questions to Answer:

1. **Should we warn users about lossy features?** (colors, fonts, alignment)
2. **Do we need video embeds?** (Not markdown-friendly)
3. **Is drag & drop important?** (High complexity, low priority)
4. **Should we limit color palette?** (Avoid chaotic formatting)
5. **Mobile toolbar UX?** (How to handle 20+ buttons on small screens)

---

## 10. Estimated Timeline

- **Phase 1:** 1 week (7-8 hours)
- **Phase 2:** 1.5 weeks (11-14 hours)
- **Phase 3:** 2-3 weeks (17-22 hours)

**Total:** 4-5 weeks for full implementation

**Recommended:** Start with Phase 1, validate with users, then decide on Phase 2/3 based on feedback.
