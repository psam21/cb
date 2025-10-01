# Detail Page Inconsistencies: Shop vs Heritage

## Document Purpose

This document identifies inconsistencies between the shop and heritage detail page implementations. Both pages serve similar purposes (displaying content details) but have diverged in their implementation patterns.

---

## Executive Summary

### Pages Analyzed

- **Shop:** `/app/shop/[id]/page.tsx` + `ShopProductDetail.tsx`
- **Heritage:** `/app/heritage/[id]/page.tsx` + `HeritageDetail.tsx`

### Key Findings

1. ✅ **Core Architecture:** Both use the same `contentDetailService` pattern (consistent)
2. ❌ **SEO Features:** Shop has JSON-LD, heritage doesn't
3. ❌ **UI Patterns:** Different metadata organization approaches
4. ❌ **User Actions:** Shop has sidebar CTA button, heritage doesn't
5. ❌ **Tag Filtering:** Heritage filter doesn't match actual tag used
6. ❌ **Type Patterns:** Different TypeScript approaches

---

## Detailed Analysis

### 1. Page-Level Differences

**Files:**

- `src/app/shop/[id]/page.tsx`
- `src/app/heritage/[id]/page.tsx`

#### A. Structural Similarity ✅

Both pages follow the same pattern:

```tsx
export const dynamic = 'force-dynamic';

async function getDetail(id: string) {
  const decodedId = decodeURIComponent(id);
  const result = await contentDetailService.getContentDetail<CustomFields>(contentType, decodedId);
  return result.success ? result.content : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Identical metadata generation logic
}

export default async function Page({ params }: Props) {
  // Identical rendering logic
}
```

**Status:** ✅ **CONSISTENT** - Both follow proper Next.js 15 app router patterns

#### B. JSON-LD Structured Data ❌

**Shop has:**

```tsx
import { ShopProductJsonLd } from '@/components/shop/ShopProductJsonLd';

// In render:
<div className="container-width space-y-10">
  <ShopProductDetail detail={detail} />
  <ShopProductJsonLd detail={detail} />  {/* ← SEO enhancement */}
</div>
```

**Heritage missing:**

```tsx
// In render:
<div className="container-width space-y-10">
  <HeritageDetail detail={detail} />
  {/* ❌ No JSON-LD component */}
</div>
```

**Impact:**

- Shop products have rich snippets in search results
- Heritage contributions lack structured data for SEO
- Google/Bing can't understand heritage content context

**Recommendation:** Create `HeritageJsonLd` component for schema.org markup

---

### 2. Component-Level Differences

**Files:**

- `src/components/shop/ShopProductDetail.tsx`
- `src/components/heritage/HeritageDetail.tsx`

#### A. Tag Filtering Inconsistency ❌

**Shop:**

```tsx
const tags = useMemo(() => {
  return (detail.tags ?? []).filter(tag => 
    tag.toLowerCase() !== 'culture-bridge-shop'
  );
}, [detail.tags]);
```

**Heritage:**

```tsx
const tags = useMemo(() => {
  return (detail.tags ?? []).filter(tag => 
    tag.toLowerCase() !== 'culture-bridge-heritage'
  );
}, [detail.tags]);
```

**Issue:** Heritage filter string is WRONG!

- **Actual tag used:** `culture-bridge-heritage-contribution` (see Phase 1 fixes)
- **Filter looks for:** `culture-bridge-heritage`
- **Result:** Tag incorrectly shows in UI

**Fix Required:** Change to `culture-bridge-heritage-contribution`

---

#### B. Actions Filtering Pattern ❌

**Shop:**

```tsx
const actions = useMemo(() => {
  const filtered = detail.actions.filter(action => 
    action.id !== 'report' && 
    action.id !== 'contact-seller' &&  // ← Extra filter
    action.id !== 'share'
  );
  return filtered;
}, [detail.actions]);
```

**Heritage:**

```tsx
const actions = useMemo(() => {
  const filtered = detail.actions.filter(action => 
    action.id !== 'report' && 
    action.id !== 'share'
    // ❌ Missing contact-seller (not applicable to heritage)
  );
  return filtered;
}, [detail.actions]);
```

**Status:** ⚠️ **INTENTIONAL DIFFERENCE** - Shop has contact-seller action, heritage doesn't

**Recommendation:** Document this difference is intentional

---

#### C. Sidebar Call-to-Action Button ❌

**Shop has prominent action:**

```tsx
sidebar={
  <div className="space-y-4">
    <ContentMetaInfo
      publishedAt={detail.publishedAt}
      updatedAt={detail.updatedAt}
      author={detail.author}
      relays={detail.relays}
    />
    {contactAction && (
      <button
        type="button"
        onClick={contactAction.onClick}
        className="btn-primary-sm w-full"
        aria-label={contactAction.ariaLabel ?? contactAction.label}
        disabled={contactAction.disabled}
      >
        {contactAction.label}
      </button>
    )}
  </div>
}
```

**Heritage missing:**

```tsx
sidebar={
  <div className="space-y-4">
    <ContentMetaInfo
      publishedAt={detail.publishedAt}
      updatedAt={detail.updatedAt}
      author={detail.author}
      relays={detail.relays}
    />
    {/* ❌ No primary action button */}
  </div>
}
```

**Impact:**

- Shop has clear CTA ("Contact Seller")
- Heritage sidebar is just metadata (passive)
- Missed opportunity for engagement ("Learn More", "Contribute Similar", etc.)

**Recommendation:** Add appropriate CTA for heritage (e.g., "Share", "Report", or "Contribute")

---

#### D. Prominent Information Display ❌

**Shop has prominent price:**

```tsx
<section className="...">
  <div>
    <h2 className="...">Key details</h2>
    {priceLabel ? (
      <p className="mt-3 text-3xl font-semibold text-primary-900">
        {priceLabel}  {/* ← BIG PRICE DISPLAY */}
      </p>
    ) : (
      <p className="mt-3 text-base text-gray-600">
        Price available on request
      </p>
    )}
  </div>
  {/* ... metadata grid below */}
</section>
```

**Heritage has no prominent display:**

```tsx
<section className="...">
  <div>
    <h2 className="...">Heritage Details</h2>
    {/* ❌ Nothing prominent - jumps straight to metadata grid */}
  </div>
  {/* ... metadata grid */}
</section>
```

**Impact:**

- Shop immediately shows what matters (price)
- Heritage has no visual hierarchy - all fields equal weight
- Could highlight heritage type, significance, or time period

**Recommendation:** Add prominent display for key heritage info (e.g., heritage type + time period)

---

#### E. Metadata Organization Patterns ❌

**Shop approach (cleaner):**

```tsx
// 1. Build metadata from specific fields
const metadata: InfoItem[] = useMemo(() => {
  const items: InfoItem[] = [];
  if (detail.customFields.category) {
    const categoryName = getCategoryById(detail.customFields.category)?.name || detail.customFields.category;
    items.push({ label: 'Category', value: categoryName });
  }
  if (detail.customFields.condition) {
    items.push({ label: 'Condition', value: detail.customFields.condition });
  }
  if (detail.location) {
    items.push({ label: 'Location', value: detail.location });
  }
  return items;
}, [detail.customFields.category, detail.customFields.condition, detail.location]);

// 2. Filter supplemental meta (explicit exclusion list)
const supplementalMeta = useMemo(() => {
  const hiddenLabels = new Set(['Price', 'Category', 'Condition', 'Location', 'Relays']);
  return (detail.meta ?? []).filter(meta => !hiddenLabels.has(meta.label));
}, [detail.meta]);
```

**Heritage approach (manual deduplication):**

```tsx
// 1. Build keyMetadata from 6 custom fields
const keyMetadata: InfoItem[] = useMemo(() => {
  const items: InfoItem[] = [];
  if (detail.customFields.heritageType) {
    items.push({ label: 'Heritage Type', value: detail.customFields.heritageType });
  }
  // ... 5 more fields
  return items;
}, [detail.customFields]);

// 2. Build supplementalMeta from 4 more fields + detail.meta
const supplementalMeta = useMemo(() => {
  const items: InfoItem[] = [];
  if (detail.customFields.language) {
    items.push({ label: 'Language', value: detail.customFields.language });
  }
  // ... 3 more fields

  // 3. Manually deduplicate against keyMetadata
  if (detail.meta) {
    detail.meta.forEach(meta => {
      const existingLabels = new Set([...items.map(i => i.label), ...keyMetadata.map(i => i.label)]);
      if (!existingLabels.has(meta.label)) {
        items.push(meta);
      }
    });
  }
  return items;
}, [detail.customFields, detail.meta, keyMetadata]);
```

**Issues:**

- Heritage has 10 custom fields hardcoded (maintenance burden)
- Manual deduplication is error-prone
- Shop's explicit exclusion list is clearer
- Heritage doesn't resolve category IDs to names

**Recommendation:** Standardize on shop's pattern - explicit exclusion list + category resolution

---

#### F. Metadata Badges - Tooltip Support ❌

**Shop includes tooltip:**

```tsx
{supplementalMeta.map(meta => (
  <span
    key={`${meta.label}-${meta.value}`}
    className="..."
    title={meta.tooltip}  {/* ← Tooltip on hover */}
  >
    {meta.label}: {meta.value}
  </span>
))}
```

**Heritage missing tooltip:**

```tsx
{supplementalMeta.map(meta => (
  <span
    key={`${meta.label}-${meta.value}`}
    className="..."
    // ❌ No title attribute
  >
    {meta.label}: {meta.value}
  </span>
))}
```

**Impact:** Heritage badges can't show additional context on hover

**Recommendation:** Add `title={meta.tooltip}` to heritage badges

---

#### G. TypeScript Type Patterns ❌

**Shop uses specific type:**

```tsx
import type { ShopContentDetail } from '@/types/shop-content';

interface ShopProductDetailProps {
  detail: ShopContentDetail;  // ← Specific type
  backHref?: string;
}
```

**Heritage uses generic pattern:**

```tsx
import type { ContentDetail } from '@/types/content-detail';
import type { HeritageCustomFields } from '@/types/heritage-content';

interface HeritageDetailProps {
  detail: ContentDetail<HeritageCustomFields>;  // ← Generic pattern
  backHref?: string;
}
```

**Analysis:**

- Shop has `ShopContentDetail` type alias
- Heritage uses `ContentDetail<HeritageCustomFields>` directly
- Both are valid, but inconsistent

**Question:** Should both use specific type aliases or both use generic pattern?

**Recommendation:** Standardize on one approach (suggest generic pattern for flexibility)

---

## Summary Table

| Feature | Shop | Heritage | Status |
|---------|------|----------|--------|
| **Page Structure** | ✅ Next.js 15 pattern | ✅ Next.js 15 pattern | ✅ Consistent |
| **contentDetailService** | ✅ Uses service | ✅ Uses service | ✅ Consistent |
| **Metadata generation** | ✅ Complete | ✅ Complete | ✅ Consistent |
| **JSON-LD SEO** | ✅ ShopProductJsonLd | ❌ Missing | ❌ **Fix required** |
| **Tag filtering** | ✅ Correct | ❌ Wrong filter string | ❌ **Fix required** |
| **Actions filtering** | ✅ Includes contact-seller | ⚠️ No contact action | ⚠️ Intentional |
| **Sidebar CTA** | ✅ Contact Seller button | ❌ No action button | ⚠️ Consider adding |
| **Prominent info** | ✅ Big price display | ❌ No prominent info | ⚠️ Consider adding |
| **Metadata organization** | ✅ Explicit exclusion list | ❌ Manual deduplication | ⚠️ Consider aligning |
| **Badge tooltips** | ✅ title attribute | ❌ No tooltip | ❌ **Fix required** |
| **Category resolution** | ✅ getCategoryById() | ❌ Uses ID directly | ⚠️ Consider adding |
| **Type pattern** | Specific alias | Generic pattern | ⚠️ Decide standard |
| **Like/Bookmark** | ✅ Implemented | ✅ Implemented | ✅ Consistent |
| **Share button** | ✅ Implemented | ✅ Implemented | ✅ Consistent |

---

## Recommendations

### Priority 1: Critical Fixes ❌

1. **Fix heritage tag filter** - Change to `culture-bridge-heritage-contribution`
2. **Add heritage JSON-LD** - Create `HeritageJsonLd` component for SEO
3. **Add tooltip support** - Include `title={meta.tooltip}` on heritage badges

### Priority 2: UX Enhancements ⚠️

4. **Add sidebar CTA** - Consider "Share" or "Contribute Similar" button for heritage
5. **Add prominent display** - Highlight key heritage info (type + time period)
6. **Standardize metadata** - Use explicit exclusion pattern like shop

### Priority 3: Code Quality ⚠️

7. **Category resolution** - Add `getCategoryById()` for heritage if categories use IDs
8. **Type pattern** - Decide on specific aliases vs generic pattern (document decision)
9. **Document intentional differences** - Add comments explaining shop-specific features

---

## Files Affected

### Required Changes

1. `src/components/heritage/HeritageDetail.tsx`
   - Fix tag filter string (line ~124)
   - Add tooltip to badges (line ~195)
   - Consider sidebar CTA
   - Consider prominent info display
   - Consider metadata pattern alignment

2. `src/app/heritage/[id]/page.tsx`
   - Add `<HeritageJsonLd detail={detail} />` component

3. `src/components/heritage/HeritageJsonLd.tsx` (NEW)
   - Create JSON-LD structured data component
   - Reference: `src/components/shop/ShopProductJsonLd.tsx`

### Documentation Updates

4. `docs/heritage-contribution-system.md`
   - Document intentional differences from shop
   - Explain heritage-specific UI decisions

5. `docs/critical-guidelines.md`
   - Add pattern: "Detail pages should include JSON-LD for SEO"
   - Add pattern: "Detail pages should filter system tags consistently"

---

## Testing Checklist

After fixes are applied:

- [ ] Heritage tag filter removes `culture-bridge-heritage-contribution` correctly
- [ ] Heritage JSON-LD appears in page source
- [ ] Heritage badges show tooltips on hover (if meta has tooltip field)
- [ ] Shop detail page still works (no regressions)
- [ ] Both pages pass accessibility checks
- [ ] Google Rich Results Test shows heritage structured data

---

## Open Questions

1. **Sidebar CTA:** What action should heritage detail pages promote?
   - ✅ **DECISION: Option A** - "Share this contribution"

2. **Prominent Display:** What heritage info is most important to highlight?
   - ✅ **DECISION: Options A + B combo** - Heritage Type + Time Period AND Category + Region

3. **Type Pattern:** Generic or specific type aliases?
   - ✅ **DECISION: Option B** - All use specific aliases (`ShopContentDetail`, `HeritageContentDetail`)

4. **Category Resolution:** Does heritage use category IDs that need resolution?
   - ✅ **DECISION: No** - Categories are already human-readable

---

## Implementation Plan

### Phase 1: Critical Fixes (Priority 1)

**1. Fix Heritage Tag Filter** ❌
- **File:** `src/components/heritage/HeritageDetail.tsx`
- **Change:** Line ~124
  ```tsx
  // Before:
  tag.toLowerCase() !== 'culture-bridge-heritage'
  
  // After:
  tag.toLowerCase() !== 'culture-bridge-heritage-contribution'
  ```
- **Impact:** System tag properly filtered from UI

**2. Create Heritage JSON-LD Component** ❌
- **File:** `src/components/heritage/HeritageJsonLd.tsx` (NEW)
- **Reference:** `src/components/shop/ShopProductJsonLd.tsx`
- **Schema type:** `Article` or `CreativeWork`
- **Fields to include:**
  - `@type`: "Article" or "CreativeWork"
  - `headline`: title
  - `description`: description/summary
  - `image`: media URLs
  - `author`: author info
  - `datePublished`: publishedAt
  - `dateModified`: updatedAt
  - Custom properties for heritage fields
- **Impact:** Heritage contributions appear in rich snippets

**3. Add Heritage JSON-LD to Page** ❌
- **File:** `src/app/heritage/[id]/page.tsx`
- **Change:** Add after HeritageDetail component
  ```tsx
  import { HeritageJsonLd } from '@/components/heritage/HeritageJsonLd';
  
  // In render:
  <div className="container-width space-y-10">
    <HeritageDetail detail={detail} />
    <HeritageJsonLd detail={detail} />
  </div>
  ```

**4. Add Tooltip Support to Heritage Badges** ❌
- **File:** `src/components/heritage/HeritageDetail.tsx`
- **Change:** Line ~195
  ```tsx
  <span
    key={`${meta.label}-${meta.value}`}
    className="..."
    title={meta.tooltip}  // ← Add this
  >
    {meta.label}: {meta.value}
  </span>
  ```

### Phase 2: UX Enhancements (Priority 2)

**5. Add Contact Author Button to Sidebar** ⚠️
- **File:** `src/components/heritage/HeritageDetail.tsx`
- **Pattern:** Similar to shop's "Contact Seller"
- **Change:** Add to sidebar section
  ```tsx
  const contactAction = useMemo(() => {
    return detail.actions.find(action => action.id === 'contact-author');
  }, [detail.actions]);
  
  // In sidebar:
  {contactAction && (
    <button
      type="button"
      onClick={contactAction.onClick}
      className="btn-primary-sm w-full"
      aria-label={contactAction.ariaLabel ?? contactAction.label}
      disabled={contactAction.disabled}
    >
      {contactAction.label}
    </button>
  )}
  ```
- **Note:** Requires ContentDetailService to provide 'contact-author' action

**6. Add Prominent Heritage Info Display** ⚠️
- **File:** `src/components/heritage/HeritageDetail.tsx`
- **Display:** Heritage Type + Time Period (primary) AND Category + Region (secondary)
- **Change:** In Key Details section, after heading
  ```tsx
  <div>
    <h2 className="...">Heritage Details</h2>
    
    {/* Prominent primary info */}
    <div className="mt-3">
      {detail.customFields.heritageType && (
        <p className="text-2xl font-semibold text-primary-900">
          {detail.customFields.heritageType}
          {detail.customFields.timePeriod && (
            <span className="text-lg text-gray-600"> • {detail.customFields.timePeriod}</span>
          )}
        </p>
      )}
      
      {/* Secondary info */}
      {(detail.customFields.category || detail.customFields.regionOrigin) && (
        <p className="mt-2 text-base text-gray-700">
          {[detail.customFields.category, detail.customFields.regionOrigin]
            .filter(Boolean)
            .join(' • ')}
        </p>
      )}
    </div>
  </div>
  ```
- **Impact:** Clear visual hierarchy showing most important info first

**7. Standardize Metadata Organization** ⚠️
- **File:** `src/components/heritage/HeritageDetail.tsx`
- **Pattern:** Use explicit exclusion list like shop
- **Change:** Replace manual deduplication
  ```tsx
  // Build key metadata from custom fields (exclude what's shown prominently)
  const keyMetadata: InfoItem[] = useMemo(() => {
    const items: InfoItem[] = [];
    
    // Don't show heritage type, time period, category, region (shown prominently)
    if (detail.customFields.country) {
      items.push({ label: 'Country', value: detail.customFields.country });
    }
    if (detail.customFields.sourceType) {
      items.push({ label: 'Source Type', value: detail.customFields.sourceType });
    }
    if (detail.customFields.language) {
      items.push({ label: 'Language', value: detail.customFields.language });
    }
    if (detail.customFields.communityGroup) {
      items.push({ label: 'Community', value: detail.customFields.communityGroup });
    }
    
    return items;
  }, [detail.customFields]);
  
  // Filter supplemental meta with explicit exclusion
  const supplementalMeta = useMemo(() => {
    const hiddenLabels = new Set([
      'Heritage Type', 'Time Period', 'Category', 'Region of Origin',  // Shown prominently
      'Country', 'Source Type', 'Language', 'Community',  // In key metadata
      'Relays'  // Shown in sidebar
    ]);
    return (detail.meta ?? []).filter(meta => !hiddenLabels.has(meta.label));
  }, [detail.meta]);
  ```
- **Impact:** Clear separation, no duplication, maintainable exclusion list

### Phase 3: Type System (Priority 3)

**8. Create HeritageContentDetail Type Alias** ⚠️
- **File:** `src/types/heritage-content.ts`
- **Add:**
  ```tsx
  import type { ContentDetail } from './content-detail';
  
  export type HeritageContentDetail = ContentDetail<HeritageCustomFields>;
  ```

**9. Update HeritageDetail Component to Use Alias** ⚠️
- **File:** `src/components/heritage/HeritageDetail.tsx`
- **Change:**
  ```tsx
  // Before:
  import type { ContentDetail } from '@/types/content-detail';
  import type { HeritageCustomFields } from '@/types/heritage-content';
  
  interface HeritageDetailProps {
    detail: ContentDetail<HeritageCustomFields>;
    backHref?: string;
  }
  
  // After:
  import type { HeritageContentDetail } from '@/types/heritage-content';
  
  interface HeritageDetailProps {
    detail: HeritageContentDetail;
    backHref?: string;
  }
  ```

### Implementation Order

1. ✅ **Fix tag filter** (1 line change)
2. ✅ **Add tooltip support** (1 line change)
3. ✅ **Create HeritageJsonLd component** (new file)
4. ✅ **Add JSON-LD to page** (2 lines)
5. ✅ **Add prominent info display** (ensure no duplication)
6. ✅ **Standardize metadata organization** (explicit exclusion)
7. ✅ **Add contact author button** (requires action from service)
8. ✅ **Create type alias** (type system cleanup)

### Testing Checklist

After implementation:

- [ ] Heritage tag filter removes `culture-bridge-heritage-contribution` correctly
- [ ] Heritage JSON-LD appears in page source (view source, search for `@type`)
- [ ] Heritage badges show tooltips on hover (if meta has tooltip field)
- [ ] Shop detail page still works (no regressions)
- [ ] Heritage prominent info shows: Type + Period, Category + Region
- [ ] No duplicate information between prominent display and metadata grid
- [ ] Contact author button appears if action exists
- [ ] Both pages pass accessibility checks
- [ ] Google Rich Results Test shows heritage structured data

---

*Implementation plan approved: October 1, 2025*  
*Status: Ready to implement*  
*Estimated time: 2-3 hours*
