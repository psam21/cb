# 📋 **Product Detail Page Requirements**

## **Overview**
Create a full-page product detail view that expands when users click on product cards in the `/shop` page, providing comprehensive product information and enhanced user experience.

## **User Journey**
1. User browses products on `/shop` page
2. User clicks on any product card
3. User is taken to `/shop/[id]` page with full product details
4. User can view, interact with, and navigate back to shop

---

## **Functional Requirements**

### **FR-1: Navigation & Routing**
- **Route**: `/shop/[id]` where `[id]` is the product event ID
- **Entry Point**: Click on any product card in `/shop` page
- **Back Navigation**: Clear way to return to `/shop` page
- **URL Structure**: Clean, shareable URLs for individual products

### **FR-2: Product Information Display**
- **Title**: Large, prominent product title
- **Description**: Full product description with proper formatting
- **Price**: Prominent price display with currency
- **Category**: Product category badge
- **Condition**: Product condition indicator
- **Location**: Seller location
- **Contact**: Seller contact information (npub)
- **Tags**: All product tags displayed
- **Published Date**: When the product was created
- **Author**: Product creator information

### **FR-3: Media Gallery**
- **Multiple Attachments**: Display all product attachments
- **Image Gallery**: Thumbnail grid with lightbox/modal view
- **Video Support**: Embedded video players for video attachments
- **Audio Support**: Audio player controls for audio attachments
- **Mixed Media**: Handle combinations of images, videos, and audio
- **Navigation**: Previous/next buttons for multiple media items
- **Fullscreen**: Option to view media in fullscreen mode

### **FR-4: Interactive Features**
- **Contact Seller**: Direct way to contact the seller
- **Share Product**: Share product URL functionality
- **Report Product**: Report inappropriate content option
- **Favorite/Bookmark**: Save product for later (future feature)

### **FR-5: Responsive Design**
- **Mobile First**: Optimized for mobile devices
- **Tablet Support**: Proper layout for tablet screens
- **Desktop Enhancement**: Enhanced features for desktop users
- **Touch Gestures**: Swipe navigation for mobile media gallery

---

## **Technical Requirements**

### **TR-1: Data Fetching**
- **Product Data**: Fetch complete product information by event ID
- **Relay Query**: Query product from Nostr relays
- **Caching**: Implement proper caching for performance
- **Error Handling**: Handle missing or invalid products gracefully

### **TR-2: SEO & Meta Tags**
- **Dynamic Meta Tags**: Product-specific title, description, images
- **Open Graph**: Social media sharing optimization
- **Structured Data**: JSON-LD markup for search engines
- **Canonical URLs**: Proper canonical URL structure

### **TR-3: Performance**
- **Image Optimization**: Next.js Image component for all images
- **Lazy Loading**: Lazy load media content
- **Code Splitting**: Dynamic imports for heavy components
- **Caching Strategy**: Appropriate caching headers

### **TR-4: Accessibility**
- **ARIA Labels**: Proper ARIA labels for all interactive elements
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader**: Screen reader friendly content
- **Focus Management**: Proper focus management for modals/navigation

---

## **UI/UX Requirements**

### **UI-1: Layout Structure**
```
┌─────────────────────────────────────────┐
│ ← Back to Shop    [Share] [Contact]     │
├─────────────────────────────────────────┤
│                                         │
│  [Media Gallery]    [Product Details]   │
│                                         │
│  [Image/Video]      Title: Product Name │
│                     Price: $XX.XX       │
│                     Category: Images    │
│                     Condition: New      │
│                     Location: City      │
│                                         │
│                     Description:        │
│                     Full product desc   │
│                     with formatting     │
│                                         │
│                     Tags: #tag1 #tag2   │
│                                         │
│                     Published: Date     │
│                     Author: npub...     │
└─────────────────────────────────────────┘
```

### **UI-2: Media Gallery**
- **Grid Layout**: 2x2 or 3x3 thumbnail grid
- **Main View**: Large display area for selected media
- **Thumbnail Navigation**: Click thumbnails to change main view
- **Media Type Icons**: Visual indicators for image/video/audio
- **Loading States**: Skeleton loaders while media loads

### **UI-3: Mobile Layout**
```
┌─────────────────────────┐
│ ← Back    [Share] [⋯]   │
├─────────────────────────┤
│                         │
│    [Main Media View]    │
│                         │
├─────────────────────────┤
│ [Thumb] [Thumb] [Thumb] │
├─────────────────────────┤
│ Title: Product Name     │
│ Price: $XX.XX          │
│ Category: Images       │
│                         │
│ Description:            │
│ Full product desc...    │
│                         │
│ [Contact Seller]        │
│ [Report Product]        │
└─────────────────────────┘
```

### **UI-4: Visual Design**
- **Consistent Styling**: Match existing design system
- **Typography**: Clear hierarchy with proper font sizes
- **Colors**: Use existing color palette
- **Spacing**: Consistent spacing and padding
- **Shadows**: Subtle shadows for depth
- **Borders**: Clean borders and dividers

---

## **Content Requirements**

### **CR-1: Product Information**
- **Complete Data**: Display all available product information
- **Formatted Text**: Proper formatting for descriptions
- **Currency Display**: Consistent currency formatting
- **Date Formatting**: User-friendly date display
- **Contact Formatting**: Properly formatted contact information

### **CR-2: Media Content**
- **High Quality**: Display media in high resolution
- **Multiple Formats**: Support all attachment types
- **Fallback Content**: Placeholder for missing media
- **Loading States**: Show loading indicators
- **Error States**: Handle broken or missing media

### **CR-3: Metadata**
- **Product Tags**: Display all product tags
- **Author Information**: Show product creator details
- **Publication Info**: When and where product was published
- **Relay Information**: Which relays have the product

---

## **Error Handling**

### **EH-1: Product Not Found**
- **404 Page**: Custom 404 page for missing products
- **Error Message**: Clear message explaining product not found
- **Navigation**: Easy way to return to shop
- **Search Suggestion**: Suggest similar products

### **EH-2: Network Errors**
- **Retry Mechanism**: Allow users to retry failed requests
- **Offline Support**: Basic offline functionality
- **Error Messages**: Clear error messages for network issues
- **Fallback Content**: Show cached content when possible

### **EH-3: Media Loading Errors**
- **Broken Images**: Show placeholder for broken images
- **Video Errors**: Show error message for failed videos
- **Audio Errors**: Show error message for failed audio
- **Graceful Degradation**: Continue showing other content

---

## **Future Enhancements**

### **FE-1: Advanced Features**
- **Product Reviews**: User reviews and ratings
- **Related Products**: Show similar products
- **Product History**: Show product revision history
- **Seller Profile**: Link to seller's profile page

### **FE-2: Social Features**
- **Product Sharing**: Social media sharing
- **Product Comments**: User comments on products
- **Product Likes**: Like/favorite products
- **Product Collections**: Save products to collections

### **FE-3: E-commerce Features**
- **Add to Cart**: Shopping cart functionality
- **Checkout Process**: Complete purchase flow
- **Payment Integration**: Payment processing
- **Order Tracking**: Track order status

---

## **Success Criteria**

### **SC-1: User Experience**
- **Fast Loading**: Page loads within 2 seconds
- **Smooth Navigation**: Smooth transitions and interactions
- **Mobile Friendly**: Excellent mobile experience
- **Accessible**: Meets accessibility standards

### **SC-2: Technical Performance**
- **SEO Optimized**: Good search engine visibility
- **Performance Score**: High Lighthouse scores
- **Error Rate**: Low error rate (<1%)
- **Uptime**: High availability (99.9%+)

### **SC-3: Business Impact**
- **User Engagement**: Increased time on site
- **Conversion Rate**: Higher product interaction rates
- **User Satisfaction**: Positive user feedback
- **Shareability**: Easy to share products

---

## **File Structure & Implementation (SOA Architecture)**

### **New Files to Create**

#### **Pages (Content-Specific)**
- `src/app/shop/[id]/page.tsx` - Shop product detail page
- `src/app/shop/[id]/loading.tsx` - Loading state for shop products
- `src/app/shop/[id]/not-found.tsx` - 404 page for missing shop products
- `src/app/contribute/[id]/page.tsx` - Contribution detail page (reuses components)
- `src/app/courses/[id]/page.tsx` - Course detail page (reuses components)
- `src/app/exhibitions/[id]/page.tsx` - Exhibition detail page (reuses components)

#### **Generic Components (Reusable Across Content Types)**
- `src/components/generic/ContentDetailHeader.tsx` - Generic header with back, share, contact
- `src/components/generic/ContentDetailInfo.tsx` - Generic content information display
- `src/components/generic/ContentMediaGallery.tsx` - Generic media gallery (images, videos, audio)
- `src/components/generic/ContentMediaViewer.tsx` - Generic media display area
- `src/components/generic/ContentMediaModal.tsx` - Generic fullscreen media modal
- `src/components/generic/ContentContactSection.tsx` - Generic contact section
- `src/components/generic/ContentMetaInfo.tsx` - Generic tags, author, published date
- `src/components/generic/ContentNotFound.tsx` - Generic 404 error component
- `src/components/generic/ContentDetailLayout.tsx` - Generic layout wrapper

#### **Content-Specific Components (Minimal)**
- `src/components/shop/ShopProductCard.tsx` - Shop-specific product card wrapper
- `src/components/contribute/ContributionCard.tsx` - Contribution-specific card wrapper
- `src/components/courses/CourseCard.tsx` - Course-specific card wrapper

#### **Generic Hooks (Reusable)**
- `src/hooks/useContentDetail.ts` - Generic content detail data fetching and state
- `src/hooks/useContentMedia.ts` - Generic media gallery state and navigation
- `src/hooks/useContentShare.ts` - Generic content sharing functionality
- `src/hooks/useContentNavigation.ts` - Generic navigation between content types

#### **Generic Services (Reusable)**
- `src/services/business/ContentDetailService.ts` - Generic business logic for content details
- `src/services/nostr/ContentDetailEventService.ts` - Generic Nostr event handling for content details

#### **Content-Specific Services (Minimal)**
- `src/services/business/ShopContentService.ts` - Shop-specific business logic
- `src/services/business/ContributeContentService.ts` - Contribution-specific business logic
- `src/services/business/CourseContentService.ts` - Course-specific business logic

#### **Generic Types (Reusable)**
- `src/types/content-detail.ts` - Generic TypeScript interfaces for content detail pages
- `src/types/content-media.ts` - Generic media-related types
- `src/types/content-navigation.ts` - Generic navigation types

#### **Content-Specific Types (Minimal)**
- `src/types/shop-content.ts` - Shop-specific types
- `src/types/contribute-content.ts` - Contribution-specific types
- `src/types/course-content.ts` - Course-specific types

#### **Generic Utils (Reusable)**
- `src/utils/content-detail.ts` - Generic utility functions for content detail pages
- `src/utils/media-gallery.ts` - Generic media gallery utility functions
- `src/utils/content-navigation.ts` - Generic navigation utilities

#### **Generic Styles (Reusable)**
- `src/styles/content-detail.css` - Generic styles for content detail pages

### **Files to Update**

#### **Existing Pages**
- `src/app/shop/page.tsx` - Add click handlers to product cards
- `src/app/layout.tsx` - Add product detail meta tags support

#### **Existing Components**
- `src/components/shop/ProductCard.tsx` - Add click handler and link wrapper
- `src/components/ui/BaseCard.tsx` - Add clickable variant if needed

#### **Existing Services**
- `src/services/business/ShopBusinessService.ts` - Add `getProductById` method
- `src/services/nostr/NostrEventService.ts` - Add product detail parsing methods

#### **Existing Hooks**
- `src/hooks/useShopProducts.ts` - Add product detail fetching capability

#### **Existing Types**
- `src/types/content.ts` - Add product detail specific types
- `src/types/nostr.ts` - Add product detail event types

#### **Configuration**
- `next.config.js` - Add image optimization for product media
- `tailwind.config.js` - Add product detail specific styles

### **File Dependencies (SOA Architecture)**

```
Generic Reusable Components (Used by all content types)
├── src/components/generic/ContentDetailLayout.tsx
│   ├── src/components/generic/ContentDetailHeader.tsx
│   ├── src/components/generic/ContentDetailInfo.tsx
│   ├── src/components/generic/ContentMediaGallery.tsx
│   ├── src/components/generic/ContentContactSection.tsx
│   └── src/components/generic/ContentMetaInfo.tsx
│
├── src/components/generic/ContentMediaGallery.tsx
│   ├── src/components/generic/ContentMediaViewer.tsx
│   ├── src/components/generic/ContentMediaModal.tsx
│   ├── src/hooks/useContentMedia.ts
│   └── src/utils/media-gallery.ts
│
└── src/hooks/useContentDetail.ts
    ├── src/services/business/ContentDetailService.ts
    ├── src/services/nostr/ContentDetailEventService.ts
    └── src/types/content-detail.ts

Content-Specific Pages (Minimal, reuse generic components)
├── src/app/shop/[id]/page.tsx
│   ├── src/components/generic/ContentDetailLayout.tsx
│   ├── src/hooks/useContentDetail.ts
│   └── src/services/business/ShopContentService.ts
│
├── src/app/contribute/[id]/page.tsx
│   ├── src/components/generic/ContentDetailLayout.tsx
│   ├── src/hooks/useContentDetail.ts
│   └── src/services/business/ContributeContentService.ts
│
└── src/app/courses/[id]/page.tsx
    ├── src/components/generic/ContentDetailLayout.tsx
    ├── src/hooks/useContentDetail.ts
    └── src/services/business/CourseContentService.ts
```

### **Reusability Benefits**

#### **🔄 Generic Components (90% Reusable)**
- **ContentDetailLayout**: Works for shop, contribute, courses, exhibitions
- **ContentMediaGallery**: Handles all media types across all content
- **ContentDetailInfo**: Displays any Kind 23 content information
- **ContentContactSection**: Generic contact functionality
- **ContentMetaInfo**: Tags, author, dates for any content type

#### **🎯 Content-Specific (10% Customization)**
- **Page Components**: Minimal wrappers that configure generic components
- **Business Services**: Content-specific validation and business rules
- **Types**: Content-specific field definitions
- **Cards**: Content-specific card displays for listing pages

#### **📊 SOA Architecture Benefits**
- **Single Source of Truth**: One media gallery component for all content
- **Consistent UX**: Same interaction patterns across all content types
- **Easy Maintenance**: Update generic components, all content types benefit
- **Scalable**: Add new content types (events, downloads) with minimal code
- **Type Safety**: Generic types with content-specific extensions

### **Implementation Phases (SOA Approach)**

#### **Phase 1: Generic Foundation** (Week 1)
- Create generic content detail components
- Implement generic content detail service
- Create generic content detail hooks
- Build generic media gallery system

#### **Phase 2: Shop Implementation** (Week 2)
- Create shop-specific page using generic components
- Implement shop-specific business service
- Add shop-specific types and validation
- Test shop product detail functionality

#### **Phase 3: Additional Content Types** (Week 3)
- Implement contribute detail page (reuse 90% of components)
- Implement course detail page (reuse 90% of components)
- Add content-specific business logic
- Test across all content types

#### **Phase 4: Enhancement & Polish** (Week 4)
- Add advanced features (sharing, contact)
- Performance optimization across all content types
- Accessibility improvements
- Documentation and testing

---

## **SOA Architecture for Kind 23 Content**

### **Content Type Analysis**
All content types in the platform use **Nostr Kind 23** (Long-form Content) with similar structure:

#### **Common Kind 23 Structure**
```typescript
interface Kind23Content {
  id: string;           // Event ID
  title: string;        // Content title
  content: string;      // Markdown content
  summary?: string;     // Content summary
  published_at: number; // Publication timestamp
  tags: string[][];     // Content tags
  author: string;       // Author pubkey
  attachments: MediaAttachment[]; // Media files
}
```

#### **Content-Specific Variations**
- **Shop Products**: Price, currency, condition, location, contact
- **Contributions**: Category, type, status, guidelines
- **Courses**: Duration, level, prerequisites, instructor
- **Exhibitions**: Start/end dates, location, curator, theme

### **Generic Content Detail Interface**
```typescript
interface ContentDetailConfig {
  contentType: 'shop' | 'contribute' | 'courses' | 'exhibitions';
  title: string;
  description: string;
  author: string;
  publishedAt: number;
  tags: string[];
  attachments: MediaAttachment[];
  customFields: Record<string, any>; // Content-specific fields
  actions: ContentAction[]; // Available actions (contact, share, etc.)
}
```

### **Reusable Component Architecture**

#### **Generic Components (90% Reusable)**
- **ContentDetailLayout**: Main layout wrapper
- **ContentDetailHeader**: Navigation, sharing, actions
- **ContentDetailInfo**: Title, description, custom fields
- **ContentMediaGallery**: Universal media display
- **ContentContactSection**: Contact functionality
- **ContentMetaInfo**: Tags, author, dates

#### **Content-Specific Adapters (10% Customization)**
- **ShopContentAdapter**: Maps shop fields to generic interface
- **ContributeContentAdapter**: Maps contribution fields
- **CourseContentAdapter**: Maps course fields
- **ExhibitionContentAdapter**: Maps exhibition fields

### **Service Layer Architecture**

#### **Generic Services**
- **ContentDetailService**: Universal content fetching and processing
- **ContentMediaService**: Universal media handling
- **ContentShareService**: Universal sharing functionality
- **ContentNavigationService**: Universal navigation

#### **Content-Specific Services**
- **ShopContentService**: Shop-specific business logic
- **ContributeContentService**: Contribution-specific logic
- **CourseContentService**: Course-specific logic
- **ExhibitionContentService**: Exhibition-specific logic

### **Type System Architecture**

#### **Generic Types**
```typescript
interface BaseContentDetail {
  id: string;
  title: string;
  description: string;
  author: string;
  publishedAt: number;
  tags: string[];
  attachments: MediaAttachment[];
}

interface ContentDetailConfig<T = any> {
  contentType: ContentType;
  baseContent: BaseContentDetail;
  customFields: T;
  actions: ContentAction[];
}
```

#### **Content-Specific Extensions**
```typescript
interface ShopContentDetail extends BaseContentDetail {
  price: number;
  currency: string;
  condition: string;
  location: string;
  contact: string;
}

interface CourseContentDetail extends BaseContentDetail {
  duration: string;
  level: string;
  prerequisites: string[];
  instructor: string;
}
```

---

## **Implementation Notes**

### **IN-1: Development Approach**
- **Generic First**: Build reusable components first
- **Content Adapters**: Create content-specific adapters
- **Incremental**: Add content types one by one
- **Responsive**: Mobile-first development approach

### **IN-2: Dependencies**
- **Next.js**: Use Next.js routing and optimization
- **Nostr Integration**: Existing Nostr service integration
- **Design System**: Use existing component library
- **Media Handling**: Leverage existing media services

### **IN-3: SOA Considerations**
- **Abstraction**: Generic interfaces for all content types
- **Configuration**: Content-specific configuration objects
- **Extensibility**: Easy to add new content types
- **Maintainability**: Single source of truth for common functionality

---

This requirements document provides a comprehensive foundation for implementing the product detail page functionality. The implementation can be broken down into phases, starting with core functionality and gradually adding advanced features.
