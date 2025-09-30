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
| **Cultural Context** | Rich Text | Yes | Significance and cultural meaning (already exists) | Detailed cultural background with formatting |
| **Heritage Type** | Select | Yes | Primary type of cultural contribution | "Oral Tradition", "Craft", "Ceremony", "Music", "Language", "Art", "Knowledge", "Performance" |
| **Language** | Text/Select | No | Language of the tradition | "Navajo (Diné bizaad)", "Te Reo Māori", "English" |
| **Community/Group** | Text | No | Specific community or tribal affiliation | "Hopi Tribe", "Ngāi Tahu", "Andean Communities" |
| **Sacred/Sensitive** | Boolean | No | Indicates if content has restrictions | true/false |
| **Sharing Permissions** | Select | Yes | Who can view/use this content | "Public", "Community Only", "Educational Use", "Restricted" |
| **Elder Approval** | Boolean | No | Requires elder/authority approval to share | true/false |
| **Traditional Knowledge** | Boolean | No | Marks as traditional/indigenous knowledge | true/false |
| **Contributor Role** | Select | No | Relationship to the tradition | "Practitioner", "Elder", "Student", "Historian", "Family Member" |

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
│ Cultural Context *                          │
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

### Section 5: Sharing & Permissions
```
┌─────────────────────────────────────────────┐
│ Sharing Permissions *                       │
│ ○ Public (Open Access)                      │
│ ○ Community Only                            │
│ ○ Educational Use                           │
│ ○ Restricted                                │
│                                             │
│ ☑ This contains traditional knowledge       │
│ ☑ This content is sacred/sensitive          │
│ ☑ Requires elder approval before publishing │
│                                             │
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
  culturalContext: string; // Rich text markdown
  language?: string;
  communityGroup?: string;
  regionOrigin: string;
  
  // Historical Context
  timePeriod: TimePeriod;
  sourceType: SourceType;
  contributorRole?: ContributorRole;
  
  // Media
  media: ContentMediaItem[];
  
  // Permissions & Sensitivity
  sharingPermission: SharingPermission;
  isTraditionalKnowledge: boolean;
  isSacredSensitive: boolean;
  requiresElderApproval: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  
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

type SharingPermission =
  | "Public"
  | "Community Only"
  | "Educational Use"
  | "Restricted"
  | "Elder Approval Required";

type ContributorRole =
  | "Practitioner"
  | "Elder"
  | "Student"
  | "Historian"
  | "Family Member"
  | "Community Member"
  | "Researcher";
```

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
│ Description                                       │
│ ─────────────────────────────────────────────     │
│                                                   │
│ [Markdown rendered description with formatting]  │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Cultural Context Section
```
┌──────────────────────────────────────────────────┐
│ Cultural Context & Significance                   │
│ ─────────────────────────────────────────────     │
│                                                   │
│ [Markdown rendered cultural context]              │
│                                                   │
│ ℹ️ Traditional Knowledge - Respect cultural       │
│    protocols when referencing this content        │
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

### Permissions Notice
```
┌──────────────────────────────────────────────────┐
│ 🛡️ Sharing & Usage Guidelines                     │
│ ─────────────────────────────────────────────     │
│                                                   │
│ • Access Level: Community Only                    │
│ • Contains Traditional Knowledge                  │
│ • Please respect cultural protocols               │
│ • Contact knowledge keeper for permissions        │
│                                                   │
│ Knowledge Keeper: Elder Mary Begay                │
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
│ Access Level:   [My Access ▼]                     │
│                                                   │
│ ☐ Traditional Knowledge Only                      │
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
- [ ] Create NIP-XX event kind for heritage contributions (suggest 30024)
- [ ] Map fields to Nostr event tags
- [ ] Implement publish to relays
- [ ] Add event fetching and parsing
- [ ] Handle permissions and access control

### Phase 6: Access Control
- [ ] Implement community verification
- [ ] Add elder approval workflow
- [ ] Create permission checking middleware
- [ ] Add restricted content blur/warning
- [ ] Implement request access feature

---

## Cultural Sensitivity Considerations

### 1. Sacred/Restricted Content
- Clear visual indicators for sensitive content
- Blur/hide restricted content by default
- Require explicit access requests
- Log all access to restricted content

### 2. Elder Approval Workflow
- Contributions marked for approval go to pending state
- Notify designated elders/authorities
- Allow review, modification requests, or rejection
- Only publish after explicit approval

### 3. Attribution & Respect
- Always display knowledge keeper contact
- Encourage proper attribution
- Include cultural protocol warnings
- Respect intellectual property of communities

### 4. Language Preservation
- Support native language input
- Allow multiple language versions
- Preserve original language alongside translations
- Encourage use of traditional scripts

### 5. Community Verification
- Optional community affiliation verification
- Trusted contributor badges
- Elder/authority endorsements
- Collaborative contribution editing

---

## My Contributions Page

Similar to the "My Shop" page, users need a dedicated space to manage their heritage contributions.

### Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ My Heritage Contributions                                     │
│                                                                │
│ [+ Create New Contribution]                    [🔍 Search...] │
│                                                                │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ 📊 Your Contributions: 12 Total                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                                │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │
│ │[Image]   │ │[Image]   │ │[Image]   │ │[Image]   │         │
│ │          │ │          │ │          │ │          │         │
│ │Weaving   │ │Origin    │ │Dance     │ │Song      │         │
│ │Technique │ │Story     │ │Tradition │ │Lullaby   │         │
│ │          │ │          │ │          │ │          │         │
│ │📍 Navajo │ │📍 Andean │ │📍 Māori  │ │📍 Celtic │         │
│ │🕐 Living │ │🕐 Ancient│ │🕐 Pre-Col│ │🕐 Revival│         │
│ │          │ │          │ │          │ │          │         │
│ │[Edit]    │ │[Edit]    │ │[Edit]    │ │[Edit]    │         │
│ │[Delete]  │ │[Delete]  │ │[Delete]  │ │[Delete]  │         │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### Features

1. **View All Your Contributions**
   - Grid display of contributions created by the logged-in user
   - Filter and search your own contributions
   - Sort by date, heritage type, or region

2. **Quick Actions Per Card**
   - **Edit** - Navigate to edit form
   - **Delete** - Remove contribution with confirmation
   - **View** - Navigate to public detail page
   - **Duplicate** - Create a new contribution based on existing

3. **Contribution Statistics**
   - Total contributions count
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
/my-heritage              # Main "My Contributions" page
/my-heritage/create       # Create new contribution (or /heritage/create)
/my-heritage/edit/[id]    # Edit existing contribution
```

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
  culturalContext: existingContribution.culturalContext,
  language: existingContribution.language,
  communityGroup: existingContribution.communityGroup,
  regionOrigin: existingContribution.regionOrigin,
  timePeriod: existingContribution.timePeriod,
  sourceType: existingContribution.sourceType,
  contributorRole: existingContribution.contributorRole,
  media: existingContribution.media,
  sharingPermission: existingContribution.sharingPermission,
  isTraditionalKnowledge: existingContribution.isTraditionalKnowledge,
  isSacredSensitive: existingContribution.isSacredSensitive,
  requiresElderApproval: existingContribution.requiresElderApproval,
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

Heritage contributions use Nostr's replaceable events (kind 30024) with `d` tag for revisions:

```javascript
// Original contribution
{
  "kind": 30024,
  "tags": [
    ["d", "contribution-unique-id-123"],  // Same d tag for all revisions
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
  "kind": 30024,
  "tags": [
    ["d", "contribution-unique-id-123"],  // Same d tag
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
  onClick={() => router.push(`/my-heritage/edit/${contribution.id}`)}
  className="btn-outline-sm"
>
  Edit
</button>
```

#### From Detail Page (if user is owner)
```tsx
{isOwner && (
  <button 
    onClick={() => router.push(`/my-heritage/edit/${contribution.id}`)}
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
  router.push('/my-heritage');
  
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
      HeritageContributionForm.tsx      # Create form (already planned)
      HeritageEditForm.tsx               # Edit form with pre-population
      HeritageCard.tsx                   # Card for public browse (already planned)
      MyHeritageCard.tsx                 # Card for "My Contributions" with edit/delete
      HeritageDeleteModal.tsx            # Confirmation modal for deletion
      
  app/
    my-heritage/
      page.tsx                           # My Contributions list page
      edit/
        [id]/
          page.tsx                       # Edit contribution page
          
  hooks/
    useMyHeritageContributions.ts        # Fetch user's own contributions
    useHeritageEdit.ts                   # Edit logic and state management
    useHeritageDeletion.ts               # Delete logic with confirmation
```

### MyHeritageCard Component

```tsx
interface MyHeritageCardProps {
  contribution: HeritageContribution;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (id: string) => void;
}

export function MyHeritageCard({ 
  contribution, 
  onEdit, 
  onDelete, 
  onView 
}: MyHeritageCardProps) {
  return (
    <div className="heritage-card">
      {/* Image */}
      <div className="card-image">
        {contribution.media[0] && (
          <img src={contribution.media[0].url} alt={contribution.title} />
        )}
      </div>
      
      {/* Content */}
      <div className="card-content">
        <h3>{contribution.title}</h3>
        <p className="heritage-type">{contribution.heritageType}</p>
        <p className="region">📍 {contribution.regionOrigin}</p>
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
- [ ] Create `/my-heritage` page
- [ ] Create `MyHeritageCard.tsx` component with edit/delete actions
- [ ] Implement `useMyHeritageContributions` hook
- [ ] Add filtering and search for user's contributions
- [ ] Create empty state component
- [ ] Add contribution statistics display

### Phase 4: Edit Workflow
- [ ] Create edit route `/my-heritage/edit/[id]`
- [ ] Implement contribution fetch and pre-population
- [ ] Add permission checks (only owner can edit)
- [ ] Handle media updates (add/remove/reorder)
- [ ] Implement Nostr replaceable event publishing
- [ ] Add success/error handling

### Phase 5: Delete Workflow
- [ ] Create `HeritageDeleteModal.tsx` component
- [ ] Implement delete confirmation flow
- [ ] Create Nostr kind 5 deletion event
- [ ] Handle relay publishing of deletion
- [ ] Update local state/cache
- [ ] Add success messaging

### Phase 6: Display Components
- [ ] Create `HeritageDetailPage.tsx` based on product detail
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
- [ ] Create NIP-XX event kind for heritage contributions (suggest 30024)
- [ ] Map fields to Nostr event tags
- [ ] Implement publish to relays
- [ ] Add event fetching and parsing
- [ ] Handle permissions and access control
- [ ] Implement replaceable events for edits
- [ ] Implement deletion events (kind 5)

### Phase 9: Access Control
- [ ] Implement community verification
- [ ] Add elder approval workflow (if needed)
- [ ] Create permission checking middleware
- [ ] Add restricted content blur/warning
- [ ] Implement request access feature

---

## Nostr Event Structure (Proposed)

```javascript
{
  "kind": 30024, // Heritage Contribution (proposed)
  "tags": [
    ["d", "unique-identifier"],
    ["title", "Navajo Two-Grey Hills Weaving Technique"],
    ["heritage-type", "Craft"],
    ["contribution-type", "Weaving"],
    ["time-period", "Living Tradition"],
    ["source-type", "Elder Teaching"],
    ["region", "Navajo Nation, New Mexico"],
    ["language", "Navajo (Diné bizaad)"],
    ["community", "Diné (Navajo)"],
    ["permission", "Community Only"],
    ["traditional-knowledge", "true"],
    ["sacred-sensitive", "false"],
    ["elder-approval", "false"],
    ["knowledge-keeper", "Elder Mary Begay"],
    ["t", "weaving"],
    ["t", "navajo"],
    ["t", "textile"],
    ["image", "https://..."],
    ["video", "https://..."]
  ],
  "content": JSON.stringify({
    description: "Markdown description...",
    culturalContext: "Markdown cultural context..."
  }),
  "created_at": 1234567890,
  "pubkey": "...",
  "sig": "..."
}
```

---

## File Structure

```
src/
  components/
    heritage/
      HeritageContributionForm.tsx      # Main contribution form (create)
      HeritageEditForm.tsx               # Edit existing contribution with pre-population
      HeritageCard.tsx                   # Card component for public browse
      MyHeritageCard.tsx                 # Card for My Contributions with edit/delete
      HeritageDetailInfo.tsx             # Detail page info section
      HeritagePermissionBadge.tsx        # Permission level indicator
      HeritageCulturalWarning.tsx        # Sensitivity warning component
      HeritageDeleteModal.tsx            # Confirmation modal for deletion
      
  app/
    heritage/
      page.tsx                           # Browse/explore page
      [id]/
        page.tsx                         # Detail page
      create/
        page.tsx                         # Create new contribution
    my-heritage/
      page.tsx                           # My Contributions list page
      edit/
        [id]/
          page.tsx                       # Edit contribution page
          
  types/
    heritage.ts                          # TypeScript interfaces
    
  services/
    heritage/
      HeritageBusinessService.ts         # Business logic
      HeritageNostrService.ts            # Nostr integration
      
  data/
    heritageTypes.ts                     # Contribution type mappings
    
  hooks/
    useHeritageContributions.ts          # Data fetching hook (public)
    useMyHeritageContributions.ts        # Fetch user's own contributions
    useHeritageFilters.ts                # Filter logic hook
    useHeritageEdit.ts                   # Edit logic and state management
    useHeritageDeletion.ts               # Delete logic with confirmation
```

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
2. **Permissions**: Is the permission system comprehensive enough?
3. **Time Periods**: Should we add more specific time period options?
4. **Contribution Types**: Are the contribution categories complete?
5. **Source Types**: Do we need additional source type options?
6. **Required Fields**: Which fields should be mandatory vs optional?
7. **Media Types**: Any specific media requirements (e.g., 3D models)?
8. **Access Control**: How should community verification work?
9. **Elder Approval**: What's the workflow for elder review?
10. **Search/Discovery**: What filters and sorting options are most important?
11. **Edit Workflow**: Should edits to approved content require re-approval?
12. **Delete Permissions**: Should there be restrictions on deleting contributions (e.g., if referenced by others)?
13. **My Contributions**: What statistics/metrics should be shown on the management page?
14. **Revision History**: Should we maintain a local history of edits (beyond Nostr's replacement)?

---

*Document Version: 2.0*  
*Created: September 30, 2025*  
*Updated: September 30, 2025*  
*Status: Draft - Awaiting Review*  
*Changes: Added My Contributions page, Edit Workflow, Delete Workflow, and Revision System*
