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
| **Category** | **Contribution Type** | Select | Specific type within heritage category | See detailed list below |
| **Condition** | **Source Type** | Select | How this knowledge was obtained | "Passed Down", "Elder Teaching", "Personal Experience", "Historical Record", "Community Archive" |
| **Location** | **Region/Origin** | Text | Geographic/cultural origin | "Navajo Nation, Arizona", "Māori, Aotearoa" |
| **Contact** | **Knowledge Keeper** | Text | Person/role to contact for more info | "Elder John Doe", "Tribal Cultural Office", "Community Leader" |
| **Images/Media** | **Media Attachments** | Files | Photos, videos, audio recordings | Same as shop (images, video, audio) |
| **Tags** | **Tags** | Array | Searchable keywords | "weaving", "traditional", "textile" |

### Additional Heritage-Specific Fields

| Field Name | Type | Required | Description | Example Values |
|------------|------|----------|-------------|----------------|
| **Cultural Context** | Rich Text | Yes | Significance and cultural meaning (already exists) | Detailed cultural background with formatting |
| **Language** | Text/Select | No | Language of the tradition | "Navajo (Diné bizaad)", "Te Reo Māori", "English" |
| **Community/Group** | Text | No | Specific community or tribal affiliation | "Hopi Tribe", "Ngāi Tahu", "Andean Communities" |
| **Sacred/Sensitive** | Boolean | No | Indicates if content has restrictions | true/false |
| **Sharing Permissions** | Select | Yes | Who can view/use this content | "Public", "Community Only", "Educational Use", "Restricted" |
| **Elder Approval** | Boolean | No | Requires elder/authority approval to share | true/false |
| **Traditional Knowledge** | Boolean | No | Marks as traditional/indigenous knowledge | true/false |
| **Contributor Role** | Select | No | Relationship to the tradition | "Practitioner", "Elder", "Student", "Historian", "Family Member" |

---

## Contribution Type Categories

### Heritage Type → Contribution Type Mapping

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
│ Heritage Type *                             │
│ [▼ Select heritage type]                    │
│                                             │
│ Contribution Type *                         │
│ [▼ Select contribution type]                │
│   (dynamically populated based on heritage) │
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
  heritageType: HeritageType;
  contributionType: string; // Dynamic based on heritageType
  
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
│ Heritage Type:     Traditional Craft              │
│ Contribution Type: Weaving                        │
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
      HeritageContributionForm.tsx      # Main contribution form
      HeritageEditForm.tsx               # Edit existing contribution
      HeritageCard.tsx                   # Card component for grid
      HeritageDetailInfo.tsx             # Detail page info section
      HeritagePermissionBadge.tsx        # Permission level indicator
      HeritageCulturalWarning.tsx        # Sensitivity warning component
      
  app/
    heritage/
      page.tsx                           # Browse/explore page
      [id]/
        page.tsx                         # Detail page
      create/
        page.tsx                         # Create new contribution
      edit/
        [id]/
          page.tsx                       # Edit contribution
          
  types/
    heritage.ts                          # TypeScript interfaces
    
  services/
    heritage/
      HeritageBusinessService.ts         # Business logic
      HeritageNostrService.ts            # Nostr integration
      
  data/
    heritageTypes.ts                     # Contribution type mappings
    
  hooks/
    useHeritageContributions.ts          # Data fetching hook
    useHeritageFilters.ts                # Filter logic hook
```

---

## Next Steps

1. **Review & Refine** - Review this document and provide feedback
2. **Finalize Field Names** - Confirm final naming for all fields
3. **Design Approval** - Get community input on structure
4. **Begin Implementation** - Start with data structures and types
5. **Iterative Development** - Build and test incrementally

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

---

*Document Version: 1.0*  
*Created: September 30, 2025*  
*Status: Draft - Awaiting Review*
