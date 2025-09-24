# Culture Bridge - Folder Structure & Flow Explanation

## Overview

Culture Bridge is a **Next.js 13+ application** using the **App Router** pattern, built with **TypeScript** and **Tailwind CSS**. The architecture follows **Service-Oriented Architecture (SOA)** principles with clear separation of concerns.

## 📁 Root Structure (`/src`)

```
src/
├── app/           # Next.js App Router pages
├── components/    # React UI components
├── config/        # Configuration files
├── data/          # Static data and content
├── errors/        # Error handling utilities
├── hooks/         # Custom React hooks
├── lib/           # Utility libraries
├── services/      # Business and technical services
├── stores/        # State management (Zustand)
├── styles/        # Global CSS styles
└── types/         # TypeScript type definitions
```

---

## 🏗️ **1. `/app` - Next.js App Router (Pages)**

### **Purpose**: Next.js 13+ App Router for file-based routing

### **Structure**:
```
app/
├── layout.tsx              # Root layout (Header, Footer, fonts)
├── page.tsx                # Home page
├── about/page.tsx          # About page
├── community/              # Community features
│   ├── page.tsx
│   ├── events/[id]/page.tsx
│   └── members/[id]/page.tsx
├── contribute/page.tsx     # Content contribution
├── downloads/              # Download management
│   ├── page.tsx
│   ├── contribute/page.tsx
│   └── [id]/page.tsx
├── elder-voices/page.tsx   # Elder stories
├── exchange/page.tsx       # Cultural exchange
├── exhibitions/            # Cultural exhibitions
│   ├── page.tsx
│   ├── loading.tsx
│   └── [slug]/page.tsx
├── explore/                # Culture exploration
│   ├── page.tsx
│   └── [id]/page.tsx
├── get-involved/page.tsx   # Community involvement
├── language/page.tsx       # Language learning
├── nostr/page.tsx          # Nostr information
├── shop/                   # Nostr-native shop
│   └── page.tsx
└── test-*/                 # Development testing pages
    ├── test-event/page.tsx
    ├── test-relay/page.tsx
    ├── test-shop/page.tsx
    ├── test-signer/page.tsx
    └── test-upload/page.tsx
```

### **Flow**:
1. **`layout.tsx`** - Wraps all pages with Header, Footer, fonts, and metadata
2. **`page.tsx`** - Home page that imports `home-content.tsx`
3. **Dynamic Routes** - `[id]` and `[slug]` for parameterized pages
4. **Loading States** - `loading.tsx` for async page loading
5. **Test Pages** - Development and debugging utilities

---

## 🧩 **2. `/components` - React UI Components**

### **Purpose**: Reusable React components organized by feature

### **Structure**:
```
components/
├── auth/                   # Authentication components
│   └── SignerStatusIndicator.tsx
├── pages/                  # Page-specific content components
│   ├── AboutContent.tsx
│   ├── CommunityContent.tsx
│   ├── ContributeContent.tsx
│   ├── DownloadsContent.tsx
│   ├── ElderVoicesContent.tsx
│   ├── ExchangeContent.tsx
│   ├── ExhibitionDetail.tsx
│   ├── ExhibitionDetailInteractive.tsx
│   ├── ExhibitionsContent.tsx
│   ├── ExploreContent.tsx
│   ├── GetInvolvedContent.tsx
│   ├── LanguageContent.tsx
│   └── NostrContent.tsx
├── primitives/             # Basic UI building blocks
│   ├── Skeleton.tsx
│   ├── StarRating.tsx
│   └── StatBlock.tsx
├── shop/                   # Shop-specific components
│   ├── ProductCard.tsx
│   ├── ProductCreationForm.tsx
│   └── ProductGrid.tsx
├── Footer.tsx              # Site footer
└── Header.tsx              # Site header
```

### **Flow**:
1. **Page Components** - Content for specific pages (imported by app pages)
2. **Feature Components** - Shop, auth, and other feature-specific UI
3. **Primitive Components** - Reusable building blocks (buttons, cards, etc.)
4. **Layout Components** - Header and Footer used across all pages

---

## ⚙️ **3. `/config` - Configuration Files**

### **Purpose**: Application configuration and constants

### **Structure**:
```
config/
└── relays.ts               # Nostr relay configuration
```

### **Flow**:
- **`relays.ts`** - Defines Nostr relay servers, connection settings, and helper functions
- Imported by services that need relay configuration
- Centralized configuration for easy maintenance

---

## 📊 **4. `/data` - Static Data & Content**

### **Purpose**: Static content, mock data, and configuration data

### **Structure**:
```
data/
├── about.ts                # About page content
├── elderStories.ts         # Elder stories data
├── exhibitions.ts          # Exhibition data
├── explore.ts              # Culture exploration data
├── home.ts                 # Home page content
└── resources.ts            # Resource links and data
```

### **Flow**:
- **Content Data** - Static content for pages (imported by page components)
- **Mock Data** - Development and testing data
- **Configuration Data** - Static configuration values

---

## 🚨 **5. `/errors` - Error Handling**

### **Purpose**: Centralized error handling and error types

### **Structure**:
```
errors/
├── AppError.ts             # Custom error class
└── ErrorTypes.ts           # Error codes and types
```

### **Flow**:
1. **`ErrorTypes.ts`** - Defines error codes, categories, and severity levels
2. **`AppError.ts`** - Custom error class extending native Error
3. **Used by Services** - All services use these for consistent error handling
4. **Logging Integration** - Errors are logged with structured metadata

---

## 🎣 **6. `/hooks` - Custom React Hooks**

### **Purpose**: Reusable stateful logic and side effects

### **Structure**:
```
hooks/
├── useNostrSigner.ts       # Nostr authentication hook
├── useShopProducts.ts      # Shop product management hook
└── useShopPublishing.ts    # Product publishing hook
```

### **Flow**:
1. **`useNostrSigner`** - Manages Nostr signer detection and authentication
2. **`useShopProducts`** - Manages product listing, filtering, and querying
3. **`useShopPublishing`** - Handles product creation and publishing workflow
4. **State Management** - Hooks integrate with Zustand stores
5. **Service Integration** - Hooks call business services for operations

---

## 📚 **7. `/lib` - Utility Libraries**

### **Purpose**: Utility functions and helper libraries

### **Structure**:
```
lib/
# Currently empty - utilities would go here
```

### **Flow**:
- **Utility Functions** - Reusable helper functions
- **Third-party Integrations** - Wrapper functions for external libraries
- **Common Logic** - Shared business logic not specific to services

---

## 🔧 **8. `/services` - Service Layer (SOA)**

### **Purpose**: Business and technical services following SOA principles

### **Structure**:
```
services/
├── business/               # Feature-specific business services
│   └── ShopBusinessService.ts
├── core/                   # Core application services
│   └── LoggingService.ts
├── generic/                # Reusable technical services
│   ├── GenericAuthService.ts
│   ├── GenericBlossomService.ts
│   ├── GenericEventService.ts
│   └── GenericRelayService.ts
└── nostr/                  # Nostr-specific services
    └── NostrEventService.ts
```

### **Flow**:

#### **Generic Services** (Technical, Reusable):
- **`GenericAuthService`** - Authentication and signer management
- **`GenericBlossomService`** - File upload to Blossom servers
- **`GenericEventService`** - Nostr event creation and signing
- **`GenericRelayService`** - Relay publishing and querying

#### **Business Services** (Feature-Specific):
- **`ShopBusinessService`** - Orchestrates shop operations using generic services

#### **Core Services**:
- **`LoggingService`** - Centralized logging with structured metadata

#### **Service Communication**:
1. **Business Services** call **Generic Services** for technical operations
2. **Generic Services** are reusable across different features
3. **Services** communicate through well-defined interfaces
4. **Error Handling** is consistent across all services

---

## 🗃️ **9. `/stores` - State Management (Zustand)**

### **Purpose**: Global state management using Zustand

### **Structure**:
```
stores/
├── ProductStore.ts         # In-memory product storage
├── useAuthStore.ts         # Authentication state
└── useShopStore.ts         # Shop feature state
```

### **Flow**:
1. **`useAuthStore`** - Manages user authentication, signer status, and user data
2. **`useShopStore`** - Manages shop-specific state (products, publishing, etc.)
3. **`ProductStore`** - Simple in-memory store for products (temporary solution)
4. **Hooks Integration** - Custom hooks use stores for state management
5. **Service Integration** - Services update stores after operations

---

## 🎨 **10. `/styles` - Global Styles**

### **Purpose**: Global CSS styles and Tailwind configuration

### **Structure**:
```
styles/
└── globals.css             # Global styles and Tailwind imports
```

### **Flow**:
- **Global Styles** - Applied to all pages via `layout.tsx`
- **Tailwind CSS** - Utility-first CSS framework
- **Custom Styles** - Additional styles not covered by Tailwind
- **Theme Configuration** - Custom color palette and design tokens

---

## 📝 **11. `/types` - TypeScript Definitions**

### **Purpose**: TypeScript type definitions and interfaces

### **Structure**:
```
types/
├── content.ts              # Content-related types
└── nostr.ts                # Nostr protocol types
```

### **Flow**:
- **`nostr.ts`** - Nostr protocol types (events, signers, relays)
- **`content.ts`** - Content and page-related types
- **Type Safety** - Ensures type safety across the application
- **Service Contracts** - Defines interfaces for service communication

---

## 🔄 **Application Flow**

### **1. Page Request Flow**:
```
User Request → app/page.tsx → components/pages/ → data/ → services/ → stores/
```

### **2. Service Layer Flow**:
```
Business Service → Generic Services → External APIs (Nostr, Blossom)
```

### **3. State Management Flow**:
```
User Action → Hook → Service → Store Update → UI Re-render
```

### **4. Error Handling Flow**:
```
Service Error → AppError → LoggingService → User Feedback
```

---

## 🛍️ **Shop Feature - Detailed File Flow**

### **Shop Page Request Flow** (Exact File Names):

```
1. User visits /shop
   ↓
2. src/app/shop/page.tsx
   ↓
3. src/hooks/useShopProducts.ts
   ↓
4. src/stores/useShopStore.ts
   ↓
5. src/services/business/ShopBusinessService.ts
   ↓
6. src/services/generic/GenericRelayService.ts
   ↓
7. External Nostr Relays
```

### **Shop Component Hierarchy** (Exact File Names):

```
src/app/shop/page.tsx
├── imports src/hooks/useShopProducts.ts
├── imports src/components/shop/ProductCreationForm.tsx
├── imports src/components/shop/ProductGrid.tsx
└── imports src/services/business/ShopBusinessService.ts (types)

src/components/shop/ProductGrid.tsx
├── imports src/components/shop/ProductCard.tsx
└── imports src/services/business/ShopBusinessService.ts (types)

src/components/shop/ProductCard.tsx
└── imports src/services/business/ShopBusinessService.ts (types)

src/components/shop/ProductCreationForm.tsx
├── imports src/hooks/useShopPublishing.ts
└── imports src/services/business/ShopBusinessService.ts (types)
```

### **Shop Hook Dependencies** (Exact File Names):

```
src/hooks/useShopProducts.ts
├── imports src/stores/useShopStore.ts
└── imports src/services/business/ShopBusinessService.ts

src/hooks/useShopPublishing.ts
├── imports src/stores/useShopStore.ts
├── imports src/hooks/useNostrSigner.ts
└── imports src/services/business/ShopBusinessService.ts

src/hooks/useNostrSigner.ts
├── imports src/stores/useAuthStore.ts
└── imports src/services/generic/GenericAuthService.ts
```

### **Shop Service Dependencies** (Exact File Names):

```
src/services/business/ShopBusinessService.ts
├── imports src/services/generic/GenericBlossomService.ts
├── imports src/services/generic/GenericEventService.ts
├── imports src/services/generic/GenericRelayService.ts
├── imports src/services/nostr/NostrEventService.ts
├── imports src/stores/ProductStore.ts
└── imports src/services/core/LoggingService.ts

src/services/generic/GenericRelayService.ts
├── imports src/config/relays.ts
├── imports src/types/nostr.ts
└── imports src/services/core/LoggingService.ts

src/services/generic/GenericBlossomService.ts
├── imports src/types/nostr.ts
└── imports src/services/core/LoggingService.ts

src/services/generic/GenericEventService.ts
├── imports src/types/nostr.ts
└── imports src/services/core/LoggingService.ts

src/services/generic/GenericAuthService.ts
├── imports src/types/nostr.ts
└── imports src/services/core/LoggingService.ts
```

### **Shop Store Dependencies** (Exact File Names):

```
src/stores/useShopStore.ts
├── imports src/services/business/ShopBusinessService.ts (types)
└── imports src/services/generic/GenericRelayService.ts (types)

src/stores/useAuthStore.ts
└── imports src/types/nostr.ts

src/stores/ProductStore.ts
└── imports src/services/business/ShopBusinessService.ts (types)
```

### **Complete Shop Data Flow** (Step by Step):

```
1. User visits /shop
   ↓
2. src/app/shop/page.tsx loads
   ↓
3. src/hooks/useShopProducts.ts called
   ↓
4. src/stores/useShopStore.ts provides state
   ↓
5. src/services/business/ShopBusinessService.queryProductsFromRelays() called
   ↓
6. src/services/generic/GenericRelayService.queryEvents() called
   ↓
7. src/config/relays.ts provides relay configuration
   ↓
8. External Nostr relays queried for Kind 23 events
   ↓
9. Events parsed back through service chain
   ↓
10. src/stores/useShopStore.ts updated with products
    ↓
11. src/components/shop/ProductGrid.tsx re-renders
    ↓
12. src/components/shop/ProductCard.tsx renders each product
```

---

## 🏛️ **Architecture Principles**

### **1. Service-Oriented Architecture (SOA)**:
- **Generic Services** - Reusable technical services
- **Business Services** - Feature-specific orchestration
- **Clear Separation** - Each service has a single responsibility

### **2. Next.js App Router**:
- **File-based Routing** - Pages defined by file structure
- **Server Components** - Default for better performance
- **Client Components** - When interactivity is needed

### **3. Component Architecture**:
- **Page Components** - Content for specific pages
- **Feature Components** - Reusable feature-specific UI
- **Primitive Components** - Basic building blocks

### **4. State Management**:
- **Zustand Stores** - Global state management
- **Custom Hooks** - Encapsulate stateful logic
- **Service Integration** - Services update stores

### **5. Type Safety**:
- **TypeScript** - Full type safety
- **Interface Definitions** - Clear service contracts
- **Type Guards** - Runtime type checking

---

## 🎯 **Key Benefits**

### **1. Maintainability**:
- Clear separation of concerns
- Reusable services and components
- Centralized configuration and error handling

### **2. Scalability**:
- Service layer can be extended
- Components can be reused
- State management is organized

### **3. Testability**:
- Services can be tested independently
- Components are isolated
- Hooks encapsulate logic

### **4. Developer Experience**:
- Type safety prevents errors
- Clear file organization
- Consistent patterns throughout

This architecture provides a solid foundation for the Culture Bridge application, enabling both current functionality and future growth while maintaining clean, maintainable code.
