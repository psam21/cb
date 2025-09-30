# Heritage Contribution System Design

## Overview
This document outlines the design for a heritage contribution system that mirrors the shop structure but focuses on cultural preservation, storytelling, and heritage sharing. The system will allow community members to contribute cultural artifacts, stories, traditions, and knowledge in a respectful and organized manner.

---

## Field Mapping: Shop → Heritage Contribution

### Core Fields Transformation

| Shop Field | Heritage Field | Type | Description | Example Values |
|------------|----------------|------|-------------|----------------|
| **Title** | **Title** | Text | Name of the contribution | "Navajo Weaving Technique", "Māori Haka Tradition" |
| **Description** | **Description** | Rich Text | Detailed description (already has RichTextEditor) | Full story or explanation with formatting |
| **Price** | **Time Period/Era** | Text/Select | When this tradition/artifact originates | "Pre-Colonial", "1800s", "Ancient", "Contemporary" |
| **Currency** | **Heritage Type** | Select | Primary category of heritage | "Oral Tradition", "Craft", "Ceremony", "Music", "Language", "Art" |
| **Category** | **Category** | Select (Shared) | Universal category from shared config | From `src/config/categories.ts` - same list as shop |
| **Condition** | **Source Type** | Select | How this knowledge was obtained | "Passed Down", "Elder Teaching", "Personal Experience", "Historical Record", "Community Archive" |
| **Location** | **Region/Origin** | Text | Geographic/cultural origin | "Navajo Nation, Arizona", "Māori, Aotearoa" |
| **Contact** | **Knowledge Keeper** | Text | Person/role to contact for more info | "Elder John Doe", "Tribal Cultural Office", "Community Leader" |
| **Images/Media** | **Media Attachments** | Files | Photos, videos, audio recordings | Same as shop (images, video, audio) |
| **Tags** | **Tags** | Array | Searchable keywords | "weaving", "traditional", "textile" |

### Additional Heritage-Specific Fields

| Field Name | Type | Required | Description | Example Values |
|------------|------|----------|-------------|----------------|
| **Heritage Type** | Select | Yes | Primary type of cultural contribution | "Oral Tradition", "Craft", "Ceremony", "Music", "Language", "Art", "Knowledge", "Performance" |
| **Language** | Text/Select | No | Language of the tradition | "Navajo (Diné bizaad)", "Te Reo Māori", "English" |
| **Community/Group** | Text | No | Specific community or tribal affiliation | "Hopi Tribe", "Ngāi Tahu", "Andean Communities" |
| **Contributor Role** | Select | No | Relationship to the tradition | "Practitioner", "Elder", "Student", "Historian", "Family Member" |

**Note:** The following fields are planned for future versions:
- Cultural Context (Rich Text) - Detailed cultural significance
- Sharing Permissions - Access control levels
- Elder Approval - Approval workflow
- Traditional Knowledge flag
- Sacred/Sensitive content markers

---

## Shared Category System

Both shop and heritage contributions use the same category dropdown sourced from `src/config/categories.ts`. This ensures consistency across the platform.

### Category Configuration

Categories are defined with:
- **id**: Unique identifier
- **name**: Display name
- **description**: What the category includes
- **applicableTo**: Array specifying if category applies to 'shop', 'heritage', or both

### Universal Categories (Both Shop & Heritage)
- Art & Crafts
- Textiles & Clothing
- Jewelry & Accessories
- Pottery & Ceramics
- Woodwork & Carving
- Basketry & Weaving
- Music & Instruments
- Books & Literature
- Tools & Implements
- Home & Decor
- Other

### Shop-Only Categories
- Digital Products
- Food & Beverages
- Wellness & Beauty

### Heritage-Only Categories
- Oral Traditions
- Ceremonies & Rituals
- Dance & Performance
- Language & Writing
- Traditional Knowledge
- Architecture & Structures
- Agriculture & Farming
- Traditional Medicine
- Navigation & Wayfinding
- Games & Sports

### Usage in Forms

```typescript
import { getShopCategories, getHeritageCategories } from '@/config/categories';

// In shop forms
const shopCategories = getShopCategories();

// In heritage forms
const heritageCategories = getHeritageCategories();

// Render dropdown
<select>
  <option value="">Select a category</option>
  {categories.map(cat => (
    <option key={cat.id} value={cat.id}>
      {cat.name}
    </option>
  ))}
</select>
```

---

## Heritage Type System

**Heritage Type** is separate from Category and represents the primary cultural classification:

```javascript
const contributionTypes = {
  "Oral Tradition": [
    "Origin Story",
    "Legend/Myth",
    "Historical Account",
    "Personal Narrative",
    "Prophecy",
    "Proverb/Saying",
    "Song Lyrics"
  ],
  
  "Craft": [
    "Weaving",
    "Pottery",
    "Carving",
    "Beadwork",
    "Basketry",
    "Metalwork",
    "Textile Art",
    "Traditional Tool Making"
  ],
  
  "Ceremony": [
    "Ritual",
    "Celebration",
    "Coming of Age",
    "Seasonal Festival",
    "Healing Ceremony",
    "Marriage Tradition",
    "Funeral Rite"
  ],
  
  "Music": [
    "Traditional Song",
    "Instrument",
    "Dance Music",
    "Ceremonial Music",
    "Work Song",
    "Lullaby"
  ],
  
  "Language": [
    "Vocabulary",
    "Grammar Structure",
    "Idiom/Expression",
    "Writing System",
    "Sign Language",
    "Oral Teaching"
  ],
  
  "Art": [
    "Painting",
    "Sculpture",
    "Body Art/Tattoo",
    "Mural",
    "Rock Art",
    "Sand Art"
  ],
  
  "Knowledge": [
    "Medicinal Plant",
    "Agricultural Practice",
    "Navigation Method",
    "Weather Prediction",
    "Astronomy",
    "Traditional Medicine",
    "Food Preparation"
  ],
  
  "Performance": [
    "Dance",
    "Theater/Drama",
    "Storytelling Performance",
    "Martial Art"
  ]
};
```

---

## Source Type Options

Indicates how the knowledge/tradition was obtained:

- **Passed Down Through Family** - Inherited family tradition
- **Elder Teaching** - Directly taught by community elder
- **Personal Experience** - First-hand participation/practice
- **Community Practice** - Actively practiced in community
- **Historical Record** - Documented in archives/books
- **Archaeological Finding** - Discovered through research
- **Oral History Project** - Collected through formal documentation
- **Revival/Restoration** - Reconstructed from historical sources

---

## Sharing Permissions Levels

Based on cultural sensitivity and community preferences:

### 1. **Public** (Open Access)
- Visible to everyone globally
- Can be used for educational purposes
- May be shared/referenced with attribution
- Example: General cultural history, public ceremonies

### 2. **Community Only** (Restricted Access)
- Visible only to registered community members
- Requires cultural affiliation verification
- Not for external sharing
- Example: Community-specific traditions, internal practices

### 3. **Educational Use** (Controlled Access)
- Available for verified educators and students
- Requires request and approval
- Must cite source and context
- Example: Teaching materials, academic research

### 4. **Restricted** (Highly Protected)
- Only visible to approved knowledge keepers
- May require elder council approval
- Not for publication or external use
- Example: Sacred knowledge, ceremonial secrets

### 5. **Elder Approval Required**
- Pending review by designated elders/authorities
- Not publicly visible until approved
- May be modified or rejected
- Example: Sensitive traditions needing verification

---

## Time Period/Era Options

Contextualizes when the tradition originated:

- **Ancient** (Pre-1000 CE)
- **Pre-Colonial** (1000-1492)
- **Colonial Period** (1492-1800s)
- **19th Century** (1800-1899)
- **Early 20th Century** (1900-1949)
- **Mid 20th Century** (1950-1999)
- **Contemporary** (2000-present)
- **Living Tradition** (Ongoing, timeless)
- **Recently Revived** (Restored after period of loss)
- **Unknown/Ancestral** (Time period uncertain)

---

## Form Layout Design

### Section 1: Basic Information
```
┌─────────────────────────────────────────────┐
│ Title *                                     │
│ [_____________________________________]     │
│                                             │
│ Category *                                  │
│ [▼ Select category from shared list]       │
│   (Art & Crafts, Textiles, Oral Traditions,│
│    Dance & Performance, etc.)               │
│                                             │
│ Heritage Type *                             │
│ [▼ Select heritage type]                    │
│   (Oral Tradition, Craft, Ceremony, etc.)   │
└─────────────────────────────────────────────┘
```

### Section 2: Cultural Details
```
┌─────────────────────────────────────────────┐
│ Description *                               │
│ [Rich Text Editor - 5000 chars]            │
│                                             │
│ Language                                    │
│ [_____________________________________]     │
│                                             │
│ Community/Group                             │
│ [_____________________________________]     │
│                                             │
│ Region/Origin *                             │
│ [_____________________________________]     │
└─────────────────────────────────────────────┘
```

### Section 3: Historical Context
```
┌─────────────────────────────────────────────┐
│ Time Period/Era *                           │
│ [▼ Select time period]                      │
│                                             │
│ Source Type *                               │
│ [▼ How was this knowledge obtained?]        │
│                                             │
│ Contributor Role                            │
│ [▼ Your relationship to this tradition]     │
└─────────────────────────────────────────────┘
```

### Section 4: Media & Attachments
```
┌─────────────────────────────────────────────┐
│ Photos, Videos & Audio                      │
│ [Upload up to 5 files]                      │
│                                             │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│ │[Image 1] │ │[Image 2] │ │  [+Add]  │    │
│ └──────────┘ └──────────┘ └──────────┘    │
└─────────────────────────────────────────────┘
```

### Section 5: Contact & Attribution
```
┌─────────────────────────────────────────────┐
│ Knowledge Keeper Contact                    │
│ [_____________________________________]     │
│ (Person to contact for more information)    │
└─────────────────────────────────────────────┘
```

### Section 6: Tags & Keywords
```
┌─────────────────────────────────────────────┐
│ Tags (for searchability)                    │
│ [_______________] [Add Tag]                 │
│                                             │
│ [weaving] [traditional] [textile] [X]       │
└─────────────────────────────────────────────┘
```

---

## Data Structure (TypeScript)

```typescript
interface HeritageContribution {
  // Core Identity
  id: string;
  eventId?: string; // Nostr event ID
  pubkey: string; // Contributor's public key
  
  // Basic Information
  title: string;
  description: string; // Rich text markdown
  category: string; // From shared categories config (category.id)
  heritageType: HeritageType;
  
  // Cultural Details
  language?: string;
  communityGroup?: string;
  regionOrigin: string;
  
  // Historical Context
  timePeriod: TimePeriod;
  sourceType: SourceType;
  contributorRole?: ContributorRole;
  
  // Media
  media: ContentMediaItem[];
  
  // Contact & Attribution
  knowledgeKeeper?: string;
  
  // Metadata
  tags: string[];
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  publishedRelays?: string[];
  
  // Stats
  viewCount?: number;
  saveCount?: number;
  shareCount?: number;
}

// Enums
type HeritageType = 
  | "Oral Tradition"
  | "Craft"
  | "Ceremony"
  | "Music"
  | "Language"
  | "Art"
  | "Knowledge"
  | "Performance";

type TimePeriod = 
  | "Ancient"
  | "Pre-Colonial"
  | "Colonial Period"
  | "19th Century"
  | "Early 20th Century"
  | "Mid 20th Century"
  | "Contemporary"
  | "Living Tradition"
  | "Recently Revived"
  | "Unknown/Ancestral";

type SourceType =
  | "Passed Down Through Family"
  | "Elder Teaching"
  | "Personal Experience"
  | "Community Practice"
  | "Historical Record"
  | "Archaeological Finding"
  | "Oral History Project"
  | "Revival/Restoration";

type ContributorRole =
  | "Practitioner"
  | "Elder"
  | "Student"
  | "Historian"
  | "Family Member"
  | "Community Member"
  | "Researcher";
```

**Note:** The following types/fields are planned for future versions:
- `SharingPermission` type and `sharingPermission` field
- `isTraditionalKnowledge` boolean flag
- `isSacredSensitive` boolean flag
- `requiresElderApproval` boolean flag
- `approvalStatus` field
- `culturalContext` rich text field

---

## Display Layout (Detail Page)

### Header Section
```
┌──────────────────────────────────────────────────┐
│ [< Back to Heritage]              [Share] [Save] │
│                                                   │
│ TRADITIONAL CRAFT • WEAVING                       │
│                                                   │
│ Navajo Two-Grey Hills Weaving Technique           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                   │
│ 📍 Navajo Nation, New Mexico                      │
│ 🕐 Living Tradition                               │
│ 👤 Elder Mary Begay (Knowledge Keeper)            │
│ 🔒 Community Only Access                          │
└──────────────────────────────────────────────────┘
```

### Media Gallery
```
┌──────────────────────────────────────────────────┐
│                                                   │
│     [  Main Image/Video Display Area  ]          │
│                                                   │
│  [thumb1] [thumb2] [thumb3] [thumb4]             │
└──────────────────────────────────────────────────┘
```

### Description Section
```
┌──────────────────────────────────────────────────┐
│ About this Contribution                           │
│ ─────────────────────────────────────────────     │
│                                                   │
│ [Markdown rendered description with formatting]  │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Details Grid
```
┌──────────────────────────────────────────────────┐
│ Heritage Details                                  │
│ ─────────────────────────────────────────────     │
│                                                   │
│ Category:          Textiles & Clothing            │
│ Heritage Type:     Traditional Craft              │
│ Source:            Elder Teaching                 │
│ Language:          Navajo (Diné bizaad)          │
│ Community:         Diné (Navajo)                 │
│ Time Period:       Living Tradition              │
│ Contributor:       Practitioner                   │
│                                                   │
│ Tags: [weaving] [navajo] [textile] [traditional] │
└──────────────────────────────────────────────────┘
```

### Knowledge Keeper Contact
```
┌──────────────────────────────────────────────────┐
│ � Knowledge Keeper                               │
│ ─────────────────────────────────────────────     │
│                                                   │
│ Elder Mary Begay                                  │
│ [Contact Knowledge Keeper]                        │
└──────────────────────────────────────────────────┘
```

---

## Browse/Explore Page Layout

### Filters Section
```
┌──────────────────────────────────────────────────┐
│ Explore Cultural Heritage                         │
│                                                   │
│ [Search contributions...]           [Search]     │
│                                                   │
│ Heritage Type:  [All Types ▼]                     │
│ Time Period:    [All Periods ▼]                   │
│ Region:         [All Regions ▼]                   │
│                                                   │
│ ☐ With Media Only                                 │
└──────────────────────────────────────────────────┘
```

### Grid Cards
```
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│[Image]   │ │[Image]   │ │[Image]   │ │[Image]   │
│          │ │          │ │          │ │          │
│Weaving   │ │Dance     │ │Story     │ │Song      │
│Technique │ │Tradition │ │Origin    │ │Lullaby   │
│          │ │          │ │          │ │          │
│📍 Navajo │ │📍 Māori  │ │📍 Andean │ │📍 Celtic │
│🕐 Living │ │🕐 Ancient│ │🕐 Pre-Col│ │🕐 Revival│
│🔒 Comm.  │ │🌍 Public │ │🎓 Edu    │ │🌍 Public │
└──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Implementation Plan

### Phase 1: Data Structure & Types
- [ ] Create TypeScript interfaces for `HeritageContribution`
- [ ] Define all enum types and constants
- [ ] Create contribution type mapping object
- [ ] Set up validation schemas

### Phase 2: Form Component
- [ ] Create `HeritageContributionForm.tsx` based on `ProductCreationForm.tsx`
- [ ] Implement dynamic contribution type dropdown
- [ ] Add permission checkboxes and radio buttons
- [ ] Integrate existing RichTextEditor for description and cultural context
- [ ] Add media upload (same as shop)
- [ ] Implement form validation

### Phase 3: Display Components
- [ ] Create `HeritageDetailPage.tsx` based on product detail
- [ ] Create `HeritageCard.tsx` component for grid display
- [ ] Add permission badges and indicators
- [ ] Implement cultural sensitivity warnings
- [ ] Add MarkdownRenderer for text fields

### Phase 4: Browse & Filter
- [ ] Create `HeritageExplore.tsx` page
- [ ] Implement filter by heritage type, time period, region
- [ ] Add access level filtering
- [ ] Create search functionality
- [ ] Add sort options (newest, oldest, most viewed)

### Phase 5: Nostr Integration
- [ ] Use existing Kind 30023 (same as shop) with content-type tag differentiation
- [ ] Map heritage fields to Nostr event tags
- [ ] Implement publish to relays (reuse shop services)
- [ ] Add event fetching and parsing (reuse shop patterns)

**Note:** Phase 6 (Access Control, Elder Approval, Permissions) is planned for future versions.

---

## My Contributions Page

Users can manage both shop products and heritage contributions in a unified "My Contributions" page (similar to the existing "My Shop" page).

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ My Contributions                                              │
│                                                                │
│ [Shop Products] [Heritage] [All]        [+ Create] [🔍...]    │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📊 Your Contributions: 12 Heritage, 8 Shop (20 Total)    │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │[Image]   │ │[Image]   │ │[Image]   │ │[Image]   │         │
│ │🏺        │ │🛍️        │ │🎵        │ │🛍️        │         │
│ │Weaving   │ │Pottery   │ │Dance     │ │Textiles  │         │
│ │Technique │ │For Sale  │ │Tradition │ │For Sale  │         │
│ │Heritage  │ │Shop      │ │Heritage  │ │Shop      │         │
│ │📍 Navajo │ │� $150   │ │📍 Māori  │ │� $75    │         │
│ │🕐 Living │ │          │ │🕐 Pre-Col│ │          │         │
│ │[Edit]    │ │[Edit]    │ │[Edit]    │ │[Edit]    │         │
│ │[Delete]  │ │[Delete]  │ │[Delete]  │ │[Delete]  │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### Features

1. **Unified View of All Contributions**
   - Shows both heritage contributions and shop products
   - Filter by type: Heritage only, Shop only, or All
   - Grid display with type badges
   - Differentiated by content-type in Nostr events

2. **Quick Actions Per Card**
   - **Edit** - Navigate to edit form
   - **Delete** - Remove contribution with confirmation
   - **View** - Navigate to public detail page
   - **Duplicate** - Create a new contribution based on existing

3. **Contribution Statistics**
   - Total contributions count (by type and combined)
   - Views/engagement metrics
   - Pending approvals (if elder approval required)

4. **Empty State**
   ```
   ┌────────────────────────────────────────┐
   │                                        │
   │         🏛️ No Contributions Yet        │
   │                                        │
   │   Start preserving and sharing your    │
   │   cultural heritage with the community │
   │                                        │
   │      [Create Your First Contribution]  │
   │                                        │
   └────────────────────────────────────────┘
   ```

### Route Structure
```
/contribute               # Main contribution page with heritage form integrated
/my-contributions         # View all user's contributions (shop + heritage)
/my-contributions/edit/[id]  # Edit existing contribution (shop or heritage)
```

**Note:** Heritage contributions are created via the main `/contribute` page. There is no separate `/heritage` or `/heritage/create` route - the heritage form is integrated directly into the contribute page flow.

---

## Edit Workflow

### Edit Form Design

The edit form mirrors the create form but with pre-populated values and additional considerations:

#### Pre-population Logic
```typescript
// Load existing contribution
const existingContribution = await fetchContribution(contributionId);

// Pre-fill form fields
const initialValues = {
  title: existingContribution.title,
  description: existingContribution.description,
  category: existingContribution.category,
  heritageType: existingContribution.heritageType,
  language: existingContribution.language,
  communityGroup: existingContribution.communityGroup,
  regionOrigin: existingContribution.regionOrigin,
  timePeriod: existingContribution.timePeriod,
  sourceType: existingContribution.sourceType,
  contributorRole: existingContribution.contributorRole,
  media: existingContribution.media,
  knowledgeKeeper: existingContribution.knowledgeKeeper,
  tags: existingContribution.tags,
};
```

#### Edit Form Header
```
┌──────────────────────────────────────────────────┐
│ [← Cancel]              Edit Contribution         │
│                                                   │
│ Editing: "Navajo Two-Grey Hills Weaving"         │
│ Last updated: September 25, 2025                 │
└──────────────────────────────────────────────────┘
```

#### Edit Form Features

1. **All Fields Editable** (Same as create form)
   - Pre-filled with existing values
   - Validation on submit
   - Character limits enforced

2. **Media Management**
   - Show existing media with thumbnails
   - Option to remove existing media
   - Upload new media (up to 5 total)
   - Reorder media items
   - Mark primary image

3. **Approval Re-triggering**
   - If contribution required elder approval initially
   - Significant edits may re-trigger approval workflow
   - Show warning: "Changes to sacred/sensitive content may require re-approval"

4. **Action Buttons**
   ```
   ┌──────────────────────────────────────────┐
   │                                          │
   │  [Cancel]  [Save as New]  [Update]      │
   │                                          │
   └──────────────────────────────────────────┘
   ```
   - **Cancel** - Discard changes, return to previous page
   - **Save as New** - Create duplicate with modifications
   - **Update** - Save changes to existing contribution

### Revision System (Nostr Implementation)

Heritage contributions use Nostr's replaceable events (kind 30023) with `d` tag for revisions:

```javascript
// Original contribution
{
  "kind": 30023,
  "tags": [
    ["d", "contribution-unique-id-123"],  // Same d tag for all revisions
    ["content-type", "heritage"],  // Differentiates from shop products
    ["title", "Navajo Weaving Technique"],
    // ... other tags
  ],
  "content": "...",
  "created_at": 1693000000,
  "pubkey": "...",
  "sig": "..."
}

// Updated contribution (replaces original)
{
  "kind": 30023,
  "tags": [
    ["d", "contribution-unique-id-123"],  // Same d tag
    ["content-type", "heritage"],
    ["title", "Navajo Two-Grey Hills Weaving Technique"],  // Updated title
    // ... other tags (updated)
  ],
  "content": "...",  // Updated content
  "created_at": 1695000000,  // Newer timestamp
  "pubkey": "...",
  "sig": "..."
}
```

**Revision Logic:**
- Nostr automatically keeps only the latest event with the same `d` tag
- Older versions are replaced by newer ones
- History is not preserved on-chain (could be preserved locally if needed)
- Latest event = current state of contribution

### Permission Checks

Before allowing edit:
```typescript
const canEdit = (contribution: HeritageContribution, currentUserPubkey: string): boolean => {
  // Only the original creator can edit
  if (contribution.pubkey !== currentUserPubkey) {
    return false;
  }
  
  // Check if contribution is locked (e.g., under review)
  if (contribution.approvalStatus === 'pending') {
    return false; // Or show "Pending approval - cannot edit"
  }
  
  return true;
};
```

### Edit Navigation

#### From Contribution Card (My Contributions page)
```tsx
<button 
  onClick={() => router.push(`/my-contributions/edit/${contribution.id}`)}
  className="btn-outline-sm"
>
  Edit
</button>
```

#### From Detail Page (if user is owner)
```tsx
{isOwner && (
  <button 
    onClick={() => router.push(`/my-contributions/edit/${contribution.id}`)}
    className="btn-primary-sm"
  >
    Edit Contribution
  </button>
)}
```

---

## Delete Workflow

### Delete Confirmation Modal

```
┌─────────────────────────────────────────────┐
│  ⚠️  Delete Heritage Contribution?          │
│                                             │
│  Are you sure you want to delete:          │
│                                             │
│  "Navajo Two-Grey Hills Weaving Technique" │
│                                             │
│  This action cannot be undone.             │
│                                             │
│  This cultural knowledge will be removed   │
│  from all relays and will no longer be     │
│  accessible to the community.              │
│                                             │
│          [Cancel]    [Delete]              │
└─────────────────────────────────────────────┘
```

### Delete Implementation (Nostr)

Nostr deletion uses kind 5 (deletion event):

```javascript
// Deletion event
{
  "kind": 5,
  "tags": [
    ["e", "contribution-event-id"],  // Event ID to delete
    ["k", "30024"]                   // Kind of event being deleted
  ],
  "content": "Contribution removed by author",
  "created_at": 1695100000,
  "pubkey": "...",
  "sig": "..."
}
```

### Delete Logic
```typescript
const deleteContribution = async (contributionId: string): Promise<void> => {
  // 1. Confirm user is owner
  if (contribution.pubkey !== currentUserPubkey) {
    throw new Error('Only the creator can delete this contribution');
  }
  
  // 2. Show confirmation dialog
  const confirmed = await confirmDelete();
  if (!confirmed) return;
  
  // 3. Create deletion event (kind 5)
  const deletionEvent = await createDeletionEvent(contributionId);
  
  // 4. Publish to relays
  await publishToRelays(deletionEvent);
  
  // 5. Update local state/cache
  removeFromLocalCache(contributionId);
  
  // 6. Navigate back to My Contributions
  router.push('/my-contributions');
  
  // 7. Show success message
  toast.success('Contribution deleted successfully');
};
```

---

## Component Structure Updates

### New Components Needed

```
src/
  components/
    heritage/
      HeritageContributionForm.tsx      # Create form (integrated in /contribute)
      HeritageEditForm.tsx               # Edit form with pre-population
      HeritageCard.tsx                   # Card for public browse
      HeritageDeleteModal.tsx            # Confirmation modal for deletion
      
  app/
    contribute/
      page.tsx                           # Main contribute page (has heritage form)
    my-contributions/
      page.tsx                           # Unified list (shop + heritage)
      edit/
        [id]/
          page.tsx                       # Edit contribution page (detects type)
          
  hooks/
    useMyContributions.ts                # Fetch user's contributions (both types)
    useHeritageEdit.ts                   # Edit logic for heritage
    useHeritageDeletion.ts               # Delete logic with confirmation
```

**Note:** Components are shared/unified where possible. The `content-type` tag in Nostr events determines whether to show shop or heritage specific fields.

### Contribution Card Component (Unified)

```tsx
interface ContributionCardProps {
  contribution: ShopProduct | HeritageContribution;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function ContributionCard({ 
  contribution, 
  onEdit, 
  onDelete, 
  onView 
}: ContributionCardProps) {
  const isHeritage = contribution.contentType === 'heritage';
  const isShop = contribution.contentType === 'shop';
  
  return (
    <div className="contribution-card">
      {/* Type Badge */}
      <div className="card-badge">
        {isHeritage ? '🏺 Heritage' : '🛍️ Shop'}
      </div>
      
      {/* Image */}
      <div className="card-image">
        {contribution.media[0] && (
          <img src={contribution.media[0].url} alt={contribution.title} />
        )}
      </div>
      
      {/* Content */}
      <div className="card-content">
        <h3>{contribution.title}</h3>
        {isHeritage && <p className="heritage-type">{contribution.heritageType}</p>}
        {isShop && <p className="price">{contribution.price}</p>}
        <p className="region">📍 {contribution.region}</p>
        <p className="time-period">🕐 {contribution.timePeriod}</p>
        
        {/* Permission indicator */}
        <HeritagePermissionBadge permission={contribution.sharingPermission} />
      </div>
      
      {/* Actions */}
      <div className="card-actions">
        <button onClick={() => onView(contribution.id)} className="btn-ghost-sm">
          View
        </button>
        <button onClick={() => onEdit(contribution.id)} className="btn-outline-sm">
          Edit
        </button>
        <button onClick={() => onDelete(contribution.id)} className="btn-outline-sm text-red-600">
          Delete
        </button>
      </div>
      
      {/* Approval status (if applicable) */}
      {contribution.requiresElderApproval && (
        <div className="approval-badge">
          {contribution.approvalStatus === 'pending' && '⏳ Pending Approval'}
          {contribution.approvalStatus === 'approved' && '✅ Approved'}
          {contribution.approvalStatus === 'rejected' && '❌ Needs Revision'}
        </div>
      )}
    </div>
  );
}
```

---

## Implementation Plan Updates

### Phase 1: Data Structure & Types ✓
- [x] Create TypeScript interfaces for `HeritageContribution`
- [x] Define all enum types and constants
- [x] Create contribution type mapping object
- [x] Set up validation schemas

### Phase 2: Form Components
- [ ] Create `HeritageContributionForm.tsx` (creation)
- [ ] Create `HeritageEditForm.tsx` (editing with pre-population)
- [ ] Implement dynamic contribution type dropdown
- [ ] Add permission checkboxes and radio buttons
- [ ] Integrate RichTextEditor for description and cultural context
- [ ] Add media upload with management (add/remove/reorder)
- [ ] Implement form validation

### Phase 3: My Contributions Page
- [ ] Update existing `/my-shop` to `/my-contributions` (unified view)
- [ ] Add content-type filtering (Shop, Heritage, All tabs)
- [ ] Update contribution cards to show type badges
- [ ] Implement `useMyContributions` hook (fetches both types via content-type tag)
- [ ] Add filtering and search for user's contributions
- [ ] Create empty state component
- [ ] Add contribution statistics display (separate counts per type)

### Phase 4: Edit Workflow
- [ ] Create edit route `/my-contributions/edit/[id]` (detects content-type)
- [ ] Implement contribution fetch and pre-population
- [ ] Add permission checks (only owner can edit)
- [ ] Handle media updates (add/remove/reorder)
- [ ] Implement Nostr replaceable event publishing (Kind 30023)
- [ ] Add success/error handling

### Phase 5: Delete Workflow
- [ ] Create unified delete modal (works for both shop and heritage)
- [ ] Implement delete confirmation flow
- [ ] Create Nostr kind 5 deletion event
- [ ] Handle relay publishing of deletion
- [ ] Update local state/cache
- [ ] Add success messaging

### Phase 6: Display Components
- [ ] Create `HeritageDetailPage.tsx` (similar to shop product detail)
- [ ] Create `HeritageCard.tsx` component for public grid display
- [ ] Add permission badges and indicators
- [ ] Implement cultural sensitivity warnings
- [ ] Add MarkdownRenderer for text fields
- [ ] Add "Edit" button on detail page (if owner)

### Phase 7: Browse & Filter
- [ ] Create `HeritageExplore.tsx` page
- [ ] Implement filter by heritage type, time period, region
- [ ] Add access level filtering
- [ ] Create search functionality
- [ ] Add sort options (newest, oldest, most viewed)

### Phase 8: Nostr Integration
- [ ] Use existing Kind 30023 (same as shop) with content-type tag differentiation
- [ ] Map heritage fields to Nostr event tags
- [ ] Implement publish to relays (reuse shop services)
- [ ] Add event fetching and parsing (reuse shop patterns)
- [ ] Implement replaceable events for edits (automatic with 30023)
- [ ] Implement deletion events (kind 5)

**Note:** Phase 9 (Access Control, Elder Approval, Permissions) is planned for future versions.

---

## Nostr Event Structure (Proposed)

```javascript
{
  "kind": 30023, // Parameterized replaceable long-form content (same as shop)
  "tags": [
    ["d", "unique-identifier"],
    ["content-type", "heritage"], // Differentiates from shop products
    ["title", "Navajo Two-Grey Hills Weaving Technique"],
    ["category", "textiles"],  // Category ID from shared categories
    ["heritage-type", "Craft"],
    ["contribution-type", "Weaving"],
    ["time-period", "Living Tradition"],
    ["source-type", "Elder Teaching"],
    ["region", "africa"], // Region ID from regions config
    ["country", "kenya"], // Country ID from countries config
    ["language", "Navajo (Diné bizaad)"],
    ["community", "Diné (Navajo)"],
    ["contributor-role", "Practitioner"],
    ["knowledge-keeper", "Elder Mary Begay"],
    ["t", "weaving"],
    ["t", "navajo"],
    ["t", "textile"],
    ["image", "https://..."],
    ["video", "https://..."]
  ],
  "content": JSON.stringify({
    description: "Markdown description..."
  }),
  "created_at": 1234567890,
  "pubkey": "...",
  "sig": "..."
}
```

**Note:** The following tags are planned for future versions:
- `permission` - Access control level
- `traditional-knowledge` - Traditional knowledge flag
- `sacred-sensitive` - Sensitive content flag
- `elder-approval` - Approval requirement flag

---

## File Structure

```
src/
  components/
    heritage/
      HeritageContributionForm.tsx      # Main contribution form (in /contribute)
      HeritageEditForm.tsx               # Edit existing contribution with pre-population
      HeritageCard.tsx                   # Card component for public browse
      HeritageDetailInfo.tsx             # Detail page info section
      HeritagePermissionBadge.tsx        # Permission level indicator
      HeritageCulturalWarning.tsx        # Sensitivity warning component
      HeritageDeleteModal.tsx            # Confirmation modal for deletion
      
  app/
    contribute/
      page.tsx                           # Main contribute page (has heritage form)
    heritage/
      page.tsx                           # Browse/explore heritage contributions
      [id]/
        page.tsx                         # Heritage detail page
    my-contributions/
      page.tsx                           # Unified list page (shop + heritage)
      edit/
        [id]/
          page.tsx                       # Edit page (detects content-type)
          
  types/
    heritage.ts                          # TypeScript interfaces for heritage
    
  services/
    business/
      HeritageBusinessService.ts         # Heritage business logic (based on ShopBusinessService)
      
  config/
    heritage.ts                          # Heritage types, periods, sources, roles
    countries.ts                         # Regions and countries (195 countries)
    
  hooks/
    useHeritageContributions.ts          # Fetch public heritage contributions
    useMyContributions.ts                # Fetch user's contributions (shop + heritage)
    useHeritageFilters.ts                # Filter logic hook
    useHeritageEdit.ts                   # Edit logic and state management
    useHeritageDeletion.ts               # Delete logic with confirmation
    useHeritagePublishing.ts             # Publishing workflow (based on useShopPublishing)
```

**Notes:** 
- No separate `/heritage/create` route - creation happens via `/contribute`
- `/my-contributions` replaces `/my-shop` and shows both shop and heritage
- Edit route detects content-type tag to show appropriate form fields

---

## Next Steps

1. **Review & Refine** - Review updated document with edit/delete workflows
2. **Finalize Field Names** - Confirm final naming for all fields
3. **Design Approval** - Get community input on structure
4. **Begin Implementation** - Start with data structures and types
5. **Build My Contributions** - Implement user's contribution management page
6. **Build Edit Workflow** - Implement edit form and revision system
7. **Build Delete Workflow** - Implement deletion with confirmations
8. **Iterative Development** - Build and test incrementally

---

## Questions for Review

1. **Field Names**: Are the field names culturally appropriate and clear?
2. **Time Periods**: Should we add more specific time period options?
3. **Contribution Types**: Are the contribution categories complete?
4. **Source Types**: Do we need additional source type options?
5. **Required Fields**: Which fields should be mandatory vs optional?
6. **Media Types**: Any specific media requirements (e.g., 3D models)?
7. **Search/Discovery**: What filters and sorting options are most important?
8. **Edit Workflow**: Should there be any restrictions on editing?
9. **Delete Permissions**: Should there be restrictions on deleting contributions?
10. **My Contributions**: What statistics/metrics should be shown on the management page?
11. **Revision History**: Should we maintain a local history of edits (beyond Nostr's replacement)?
12. **Future Features**: Are there other priority features to add after v1?

---

*Document Version: 3.0 (Simplified for V1)*  
*Created: September 30, 2025*  
*Updated: September 30, 2025*  
*Status: Ready for V1 Implementation*  
*Changes:*
- *v2.0: Added My Contributions page, Edit Workflow, Delete Workflow, and Revision System*
- *v3.0: Simplified for V1 - Removed Cultural Context, Elder Approval, Sharing Permissions, Traditional Knowledge fields (deferred to future versions)*
