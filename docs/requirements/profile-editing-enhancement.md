# Profile Editing Enhancement Requirements

**Document Version**: 1.0  
**Status**: Draft - Requirements Gathering  
**Created**: October 6, 2025  
**Last Updated**: October 6, 2025

---

## Executive Summary

Enhance the `/profile` page from read-only display to full-featured profile editing with support for all Nostr Kind 0 metadata fields, including profile picture upload, banner upload, lightning addresses, and extended metadata.

**CRITICAL REQUIREMENT**: All implementation must follow Service-Oriented Architecture (SOA) patterns established in the codebase. See Section 12 for detailed SOA requirements.

---

## Current State Assessment

### What Works Now
- Profile page displays basic user information from auth store
- Read-only view of display name, about, website, birthday, bot status
- Profile statistics display (products created, last active)
- RichTextEditor integration for "about" field
- Basic validation for profile fields
- Edit/cancel/save UI flow exists but incomplete

### Current Limitations
- No actual profile publishing to Nostr network
- No profile picture upload capability
- No banner image upload capability
- Missing extended metadata fields (lud06, lud16, nip05)
- UpdateProfile only updates local state, not Nostr relays
- No profile image cropping or editing
- No NIP-05 verification setup
- No lightning address configuration
- Limited to basic fields only

---

## Requirements List

### 1. Core Profile Publishing

#### 1.1 Nostr Event Creation
- Create Kind 0 metadata events when user saves profile
- Sign events using NIP-07 signer
- Publish profile events to configured relays
- Handle event creation failures gracefully
- Show publishing progress to user

#### 1.2 Profile Syncing
- Fetch existing profile from relays on page load

#### 1.3 Profile History
- Display when profile was last updated
- Show which relays successfully published profile
- Allow viewing profile publication history
- Track failed relay publications

### 2. Profile Picture Management

#### 2.1 Picture Upload
- Upload profile pictures to Blossom CDN
- Support common image formats (JPG, PNG, WebP, GIF)
- Display upload progress indicator
- Show preview before saving
- Validate image file size (max 5MB recommended)
- Validate image dimensions

#### 2.2 Picture Editing
- Crop uploaded images to square aspect ratio
- Resize images to optimize file size
- Allow zoom and pan during cropping
- Preview cropped result before upload
- Support drag-and-drop image upload
- Support paste from clipboard

#### 2.3 Picture URL Support
- Allow entering external image URL instead of upload
- Validate URL accessibility
- Show preview of external URL images
- Support both upload and URL methods

### 3. Banner Image Management

#### 3.1 Banner Upload
- Upload banner images to Blossom CDN
- Support wide aspect ratios (recommended 3:1 or 16:9)
- Display upload progress indicator
- Show preview before saving
- Validate banner file size (max 10MB recommended)

#### 3.2 Banner Editing
- Crop uploaded banners to recommended aspect ratio
- Resize banners to optimize file size
- Preview banner positioning
- Support drag-and-drop upload
- Support paste from clipboard

#### 3.3 Banner Removal
- Allow removing banner image
- Revert to default gradient or blank state
- Confirm before removing

### 4. Extended Metadata Fields

#### 4.1 Lightning Address Support
- Add lud16 field (Lightning Address - modern format)
- Add lud06 field (LNURL - legacy format)
- Validate lightning address format
- Explain difference between lud16 and lud06
- Show example formats to user
- Test lightning address accessibility (optional)

#### 4.2 NIP-05 Verification
- Add nip05 field for DNS-based verification
- Explain what NIP-05 verification is
- Provide setup instructions or wizard
- Link to external NIP-05 setup guides
- Show verification status badge if verified
- Re-verify periodically

#### 4.3 Additional Profile Fields
- Name field (short display name)
- Display_name field (full display name)
- About/Bio field (longer description, markdown supported)
- Website URL field
- Banner field (banner image URL)
- Picture field (profile picture URL)
- Bot field (boolean, mark bot accounts)
- Birthday field (YYYY-MM-DD format)

### 5. User Experience Enhancements

#### 5.1 Edit Mode Improvements
- Inline editing for all fields
- Warn before leaving with unsaved changes
- Show which fields have been modified
- Restore previous values on cancel
- Keyboard shortcuts for save/cancel

#### 5.2 Validation & Feedback
- Real-time validation as user types
- Character count for text fields
- URL validation with visual feedback
- Image dimension validation
- File size validation before upload
- Clear error messages with actionable fixes

#### 5.3 Preview Mode
- Live preview of profile while editing
- Preview how profile looks on different clients
- Preview modal before publishing
- Show before/after comparison
- Preview on mobile and desktop layouts

#### 5.4 Progress Indicators
- Show upload progress for images
- Show relay publishing progress
- Show overall save operation status
- Estimate time remaining for uploads
- Show success/failure per relay

### 6. Profile Discovery & Import

#### 6.1 Profile Import
- Import profile from other Nostr clients
- Search for existing profile by npub
- Merge imported data with current profile
- Select which fields to import
- Backup current profile before importing

#### 6.2 Profile Export
- Export profile as JSON
- Copy profile metadata to clipboard
- Generate shareable profile link
- Export QR code with npub
- Download profile backup

### 7. Security & Privacy

#### 7.1 Data Protection
- Never expose private keys
- All signing via NIP-07 browser extension
- Validate all user inputs
- Sanitize markdown content
- Prevent XSS in profile fields
- Rate limit profile updates

### 8. Mobile Responsiveness

#### 8.1 Mobile Editing
- Touch-friendly edit controls
- Mobile-optimized image cropping
- Vertical layout for small screens
- Swipe gestures for navigation
- Mobile keyboard optimization

#### 8.2 Mobile Upload
- Support mobile camera capture
- Support photo library selection
- Optimize image compression on mobile
- Handle slow mobile connections
- Progressive upload with resume support

### 9. Accessibility

#### 9.1 Screen Reader Support
- ARIA labels for all form fields
- Announce validation errors
- Describe image upload areas
- Keyboard navigation support
- Focus management during editing

#### 9.2 Visual Accessibility
- High contrast mode support
- Color-blind friendly UI
- Scalable text sizes
- Clear focus indicators
- Alternative text for profile images

### 10. Performance Optimization

#### 10.1 Image Optimization
- Compress images before upload
- Generate multiple sizes (thumbnail, medium, full)
- Lazy load profile images
- Cache uploaded images locally
- Progressive image loading

#### 10.2 Network Optimization
- Debounce auto-save operations
- Batch relay publishes
- Retry failed uploads
- Optimize relay queries
- Cache profile data with TTL

### 11. Error Handling

#### 11.1 Upload Errors
- Handle network failures gracefully
- Retry failed uploads automatically
- Show clear error messages
- Offer manual retry option
- Save draft on failure

#### 11.2 Publishing Errors
- Track which relays failed
- Show partial success status
- Allow republishing to failed relays only
- Explain relay-specific errors
- Fallback to subset of relays if needed

#### 11.3 Validation Errors
- Prevent submission with invalid data
- Highlight invalid fields
- Explain validation requirements
- Suggest fixes for common errors
- Allow saving draft even if invalid

### 12. Service-Oriented Architecture (SOA)

#### 12.1 Business Service Layer
- ProfileBusinessService handles all profile logic
- Separation of concerns between UI and business logic
- Reusable profile validation methods
- Centralized profile formatting and parsing
- No direct relay calls from UI components

#### 12.2 Generic Service Layer
- GenericBlossomService for image uploads
- GenericEventService for Kind 0 event creation
- GenericRelayService for event publishing
- Consistent error handling across services
- Service dependencies properly managed

#### 12.3 Service Integration
- Hook layer (useUserProfile, useMediaUpload) coordinates services
- UI components consume hooks, not services directly
- Clear data flow: UI → Hook → Business Service → Generic Service
- State management via hooks and stores
- Service methods return typed results

### 13. Testing Requirements

#### 13.1 Functional Testing
- Test all field types and validation
- Test image upload and cropping
- Test relay publishing
- Test error scenarios
- Test mobile responsiveness

#### 13.2 Integration Testing
- Test with different NIP-07 signers (Alby, nos2x, Amber)
- Test with different relays
- Test with slow networks
- Test with large images
- Test offline scenarios

#### 13.3 User Acceptance Testing
- Test with real users
- Gather feedback on UX
- Test accessibility with screen readers
- Test on different devices
- Test cross-browser compatibility

---

## Out of Scope (Future Enhancements)

- Profile themes and customization
- Multiple profiles per account
- Profile badges and achievements
- Social proof and endorsements
- Profile analytics dashboard
- AI-assisted profile writing
- Video profile pictures
- Animated profile banners
- Profile templates
- Profile versioning and rollback

---

## Success Criteria

### Must Have (MVP)
1. User can edit and publish all basic fields to Nostr relays
2. User can upload and crop profile picture
3. User can upload and crop banner image
4. All changes publish as Kind 0 events successfully
5. Profile updates reflected across all Culture Bridge pages
6. Mobile-friendly editing experience
7. Clear error handling and validation

### Should Have (V1.1)
1. Lightning address (lud16) support
2. NIP-05 verification setup
3. Profile import/export
4. Live preview mode
5. Auto-save drafts
6. Advanced metadata fields

### Could Have (V2.0)
1. Profile templates
2. Multi-relay publishing strategy
3. Profile analytics
4. Cross-client preview
5. Profile QR codes

---

## Dependencies

### Technical Dependencies
- NIP-07 signer (Alby, nos2x, Amber)
- Blossom CDN for image hosting
- Nostr relays for event publishing
- Image cropping library
- Markdown editor (already integrated)

### Service Dependencies
- GenericBlossomService (image uploads)
- GenericEventService (Kind 0 event creation)
- GenericRelayService (event publishing)
- ProfileBusinessService (validation, parsing)
- NostrSigner (event signing)

### External Dependencies
- User has NIP-07 extension installed
- User has configured Nostr relays
- Blossom servers are accessible
- Relays accept Kind 0 events

---

## Risk Assessment

### Technical Risks
- Large image uploads may timeout on slow connections
- Some relays may reject profile updates
- NIP-07 signer may not support all features
- Image processing may be slow on mobile
- Relay publishing may partially fail

### User Experience Risks
- Complex UI may confuse users
- Too many fields may overwhelm users
- Image cropping may be frustrating
- Profile updates may take too long
- Error messages may be unclear

### Security Risks
- Profile images may contain malicious content
- XSS in markdown content
- Large file uploads may DoS Blossom servers
- Spam profile updates
- Privacy leaks through metadata

### Mitigation Strategies
- Progressive enhancement approach
- Clear onboarding and help text
- Reasonable file size limits
- Rate limiting on updates
- Content sanitization
- Graceful degradation

---

## Next Steps

1. **Review Requirements**: Stakeholder review and feedback
2. **Prioritization**: Categorize into MVP, V1.1, V2.0
3. **Technical Design**: Detailed component and service design
4. **UI/UX Design**: Wireframes and mockups
5. **Implementation Planning**: Break into development tasks
6. **Testing Strategy**: Define test cases and scenarios

---

## Appendix

### Nostr Kind 0 Metadata Specification

Based on NIP-01, Kind 0 events should include (all fields optional):

**Standard Fields:**
- `name`: Short display name
- `display_name`: Full display name (preferred)
- `about`: Biography/description (markdown supported)
- `picture`: Profile picture URL
- `banner`: Banner image URL
- `website`: Personal or business website URL
- `nip05`: DNS-based verification identifier (alice@example.com)
- `lud06`: LNURL for lightning tips (legacy)
- `lud16`: Lightning address (modern, preferred)
- `bot`: Boolean flag for bot accounts
- `birthday`: Date of birth (YYYY-MM-DD format)

**Extended Fields (client-specific):**
- `location`: Geographic location
- `gender`: Gender identity
- `pronouns`: Preferred pronouns
- `occupation`: Job title or profession
- `interests`: Comma-separated interests
- `languages`: Spoken languages
- Custom fields allowed (but may not display in all clients)

### Reference Implementations

**Profile Editing in Other Clients:**
- Damus (iOS): Simple inline editing with image picker
- Amethyst (Android): Comprehensive editing with crop tool
- Snort (web): Modal-based editing with preview
- Iris (web): Inline editing with auto-save
- Coracle (web): Advanced editing with custom fields

### Related Documentation

- [NIP-01: Basic Protocol Flow](https://github.com/nostr-protocol/nips/blob/master/01.md)
- [NIP-05: DNS-based Verification](https://github.com/nostr-protocol/nips/blob/master/05.md)
- [NIP-07: Browser Extension Signer](https://github.com/nostr-protocol/nips/blob/master/07.md)
- [Blossom Protocol Specification](https://github.com/hzrd149/blossom)
- [Culture Bridge Implementation Protocol](./implementation-protocol.md)

---

**Document Control:**
- **Author**: AI Assistant + User Collaboration
- **Reviewers**: TBD
- **Approval**: TBD
- **Version History**: See git commit history
