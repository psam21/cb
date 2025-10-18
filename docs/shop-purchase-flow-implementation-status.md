# Shop Purchase Flow - Implementation Status Review

**Review Date:** October 18, 2025  
**Commit:** `dde39ab45cb783d3e711366d2362b9fae6d1682d`  
**Reviewer:** GitHub Copilot  

---

## Executive Summary

**Overall Progress: ~10% Complete (1 of 10 features fully implemented)**

✅ **COMPLETE:** Feature #1 (Add to Cart)  
🚧 **IN PROGRESS:** None  
❌ **NOT STARTED:** Features #2-10  

The foundation for the purchase flow has been laid with a fully functional cart system, but the core purchase transaction workflow (features #3-10) has not yet been implemented.

---

## Feature-by-Feature Analysis

### ✅ Feature #1: Add to Cart - **COMPLETE (100%)**

**Status:** Fully implemented and integrated

**Implemented Components:**
- ✅ `/src/stores/useCartStore.ts` - Zustand store with persistence
  - All required methods: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`, `getTotal()`, `getItemCount()`
  - Computed values: `itemCount`, `totalSats`
  - Persistence middleware configured
  - Currency conversion logic (SATS, BTC, USD, EUR, GBP)
  
- ✅ `/src/types/cart.ts` - Complete type definitions
  - `CartItem` interface
  - `Cart` interface
  - `AddToCartParams` interface

- ✅ `/src/components/shop/AddToCartButton.tsx` - UI component
  - Add to cart button
  - Quantity controls (increment/decrement)
  - Amazon-style UX (shows quantity controls when item in cart)
  - Max quantity validation
  - Event propagation handling

- ✅ Integration in existing components:
  - `Header.tsx` - Shows cart icon with item count badge
  - `ShopProductDetail.tsx` - Renders AddToCartButton
  - `/app/shop/[id]/page.tsx` - Product detail page integration

**What's Working:**
- Users can add products to cart from product detail pages
- Cart persists across sessions (localStorage)
- Cart icon in header shows live item count
- Quantity controls work with validation
- Multi-currency prices converted to sats

**Notes:**
- No cart page exists yet, so users can't view/review their full cart
- Header cart icon links to `/cart` but that page doesn't exist

---

### ❌ Feature #2: Shopping Cart Page - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/app/cart/page.tsx` - Cart page does not exist
- ❌ `/src/components/shop/CartPage.tsx` - Container component
- ❌ `/src/components/shop/CartItem.tsx` - Individual cart item display
- ❌ `/src/components/shop/CartSummary.tsx` - Cart total + checkout button

**What's Missing:**
- No page to view cart contents
- No ability to review items before checkout
- No cart summary/total display
- No checkout button to proceed to purchase intent

**Blockers:**
- Feature #3 (Purchase Intent) depends on this for the checkout flow

**Required Files:**
```
src/
  app/
    cart/
      page.tsx                    ← NEW
  components/
    shop/
      CartPage.tsx                ← NEW
      CartItem.tsx                ← NEW
      CartSummary.tsx             ← NEW
```

---

### ❌ Feature #3: Purchase Intent (Private) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/hooks/usePurchaseIntent.ts` - Hook not found
- ❌ `/src/services/business/PurchaseBusinessService.ts` - Service not found
- ❌ `/src/types/purchase.ts` - Types not found
- ❌ `/src/components/shop/PurchaseIntentButton.tsx` - Button not found

**What's Missing:**
- No way to express purchase intent to seller
- No encrypted messaging for purchase requests
- No grouping of cart items by seller
- No waiting state for seller confirmation

**Available Infrastructure:**
✅ **Can Reuse:** `/src/services/business/MessagingBusinessService.ts`
  - Has NIP-17 gift-wrapped message support
  - `sendMessage()` method exists
  - Encryption/decryption working
  - Could be used for sending purchase intent messages

**Architectural Note:**
The doc specifies reusing `GenericMessageService` for NIP-17, but the codebase uses `MessagingBusinessService` which wraps NIP-17 functionality. This is acceptable as it follows the SOA pattern (Business → Event → Generic).

**Required Files:**
```
src/
  types/
    purchase.ts                   ← NEW (PurchaseIntent, PurchaseResponse)
  services/
    business/
      PurchaseBusinessService.ts  ← NEW
  hooks/
    usePurchaseIntent.ts          ← NEW
  components/
    shop/
      PurchaseIntentButton.tsx    ← NEW
```

**Update Required:**
- `cart/page.tsx` - Add checkout button (depends on Feature #2)
- `CartSummary.tsx` - Render PurchaseIntentButton

---

### ❌ Feature #4: Payment Link Ready (Public Sale Event) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/services/business/SaleBusinessService.ts` - Service not found
- ❌ `/src/services/nostr/SaleEventService.ts` - Event service not found
- ❌ `/src/types/sale.ts` - Types not found
- ❌ `/src/components/shop/StockConfirmationButton.tsx` - Component not found
- ❌ `/src/components/shop/PaymentLinkGenerator.tsx` - Component not found
- ❌ `/src/hooks/usePaymentLink.ts` - Hook not found
- ❌ `/src/app/my-shop/orders/[saleId]/page.tsx` - Seller order detail page not found

**What's Missing:**
- No public sale event creation (Kind 30023)
- No LNURL-pay invoice generation
- No Lightning Address fetching
- No seller order management UI
- No way for seller to confirm stock and generate payment link

**Available Infrastructure:**
✅ **Can Reuse:** `/src/services/generic/GenericEventService.ts`
  - Has `createNIP23Event()` method for Kind 30023 events
  - Supports dTag for NIP-33 replaceable events
  - Can handle custom tags and content structure

✅ **Can Reuse:** `/src/services/business/MessagingBusinessService.ts`
  - Can send payment link via NIP-17 to buyer

**Architectural Opportunity:**
Create `SaleEventService` that wraps `GenericEventService.createNIP23Event()` with sale-specific logic, following the pattern used in shop product creation.

**Required Files:**
```
src/
  types/
    sale.ts                                  ← NEW (Sale, SaleStatus, SaleEvent)
  services/
    business/
      SaleBusinessService.ts                 ← NEW
    nostr/
      SaleEventService.ts                    ← NEW
  hooks/
    usePaymentLink.ts                        ← NEW
  components/
    shop/
      StockConfirmationButton.tsx            ← NEW
      PaymentLinkGenerator.tsx               ← NEW
      SellerOrderCard.tsx                    ← NEW
  app/
    my-shop/
      orders/
        page.tsx                             ← NEW (order list)
        [saleId]/
          page.tsx                           ← NEW (order detail)
```

---

### ❌ Feature #5: Payment by Buyer (Private) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/app/payment/[saleId]/page.tsx` - Payment page not found
- ❌ `/src/components/shop/LightningInvoice.tsx` - Component not found
- ❌ `/src/components/shop/PaymentStatus.tsx` - Component not found
- ❌ `/src/components/shop/QRCodeDisplay.tsx` - Component not found
- ❌ `/src/components/shop/MarkPaidButton.tsx` - Component not found
- ❌ `/src/components/shop/ShippingAddressForm.tsx` - Component not found
- ❌ `/src/hooks/usePayment.ts` - Hook not found
- ❌ `/src/services/business/PaymentBusinessService.ts` - Service not found
- ❌ `/src/types/payment.ts` - Payment types not found
- ❌ `/src/types/shipping.ts` - Shipping types not found

**What's Missing:**
- No payment page for buyers
- No Lightning invoice QR code display
- No "Mark as Paid" functionality
- No shipping address collection
- No payment confirmation messaging

**Available Infrastructure:**
✅ **Can Reuse:** `/src/services/business/MessagingBusinessService.ts`
  - Can send payment confirmation + address via NIP-17

**Required Files:**
```
src/
  types/
    payment.ts                               ← NEW (PaymentConfirmation)
    shipping.ts                              ← NEW (ShippingAddress)
  services/
    business/
      PaymentBusinessService.ts              ← NEW
  hooks/
    usePayment.ts                            ← NEW
  components/
    shop/
      LightningInvoice.tsx                   ← NEW
      PaymentStatus.tsx                      ← NEW
      QRCodeDisplay.tsx                      ← NEW
      MarkPaidButton.tsx                     ← NEW
      ShippingAddressForm.tsx                ← NEW
  app/
    payment/
      [saleId]/
        page.tsx                             ← NEW
```

---

### ❌ Feature #6: Payment Received Confirmation (Public Sale Event) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/components/shop/PaymentConfirmationButton.tsx` - Component not found
- ❌ `/src/hooks/useSaleConfirmation.ts` - Hook not found

**What's Missing:**
- No seller UI to confirm payment received
- No public sale event update (status change to "payment-received")
- No confirmation message to buyer

**Available Infrastructure:**
✅ **Can Reuse:** `SaleEventService` (when created in Feature #4)
  - Will use `GenericEventService.createNIP23Event()` for NIP-33 replacement
  
✅ **Can Reuse:** `/src/services/business/MessagingBusinessService.ts`
  - Can send confirmation to buyer via NIP-17

**Required Files:**
```
src/
  hooks/
    useSaleConfirmation.ts                   ← NEW
  components/
    shop/
      PaymentConfirmationButton.tsx          ← NEW
```

**Update Required:**
- `SaleBusinessService.ts` - Add `confirmPayment()`, `updateSaleStatus()` methods (depends on Feature #4)
- `SaleEventService.ts` - Add `updateSaleEvent()` method (depends on Feature #4)
- `my-shop/orders/[saleId]/page.tsx` - Add "Confirm Payment" button

---

### ❌ Feature #7: Shipping and Delivery (Private Communication) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/app/orders/[saleId]/page.tsx` - Buyer order detail page not found
- ❌ `/src/components/shop/ShippingForm.tsx` - Component not found
- ❌ `/src/components/shop/DeliveryConfirmation.tsx` - Component not found
- ❌ `/src/hooks/useShipping.ts` - Hook not found
- ❌ `/src/types/shipping.ts` - Shipping types not found (mentioned in Feature #5)

**What's Missing:**
- No shipping update UI for sellers
- No delivery confirmation UI for buyers
- No tracking number messaging
- No order detail pages for buyers

**Available Infrastructure:**
✅ **Can Reuse:** `/src/services/business/MessagingBusinessService.ts`
  - Can send shipping updates via NIP-17 (seller → buyer)
  - Can send delivery confirmations via NIP-17 (buyer → seller)

**Required Files:**
```
src/
  types/
    shipping.ts                              ← NEW (ShippingUpdate, DeliveryConfirmation)
  hooks/
    useShipping.ts                           ← NEW
  components/
    shop/
      ShippingForm.tsx                       ← NEW
      DeliveryConfirmation.tsx               ← NEW
  app/
    orders/
      [saleId]/
        page.tsx                             ← NEW (buyer order detail)
```

**Update Required:**
- `my-shop/orders/[saleId]/page.tsx` - Add shipping form (depends on Feature #4)

---

### ❌ Feature #8: Order History (Buyer - Private) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/app/orders/page.tsx` - Buyer order list page not found
- ❌ `/src/components/shop/BuyerOrderList.tsx` - Component not found
- ❌ `/src/components/shop/BuyerOrderCard.tsx` - Component not found
- ❌ `/src/components/shop/BuyerOrderDetail.tsx` - Component not found
- ❌ `/src/hooks/useBuyerOrders.ts` - Hook not found
- ❌ `/src/services/business/OrderHistoryService.ts` - Service not found

**What's Missing:**
- No buyer order list page
- No order history query/decryption
- No order timeline construction
- No navigation to order history

**Available Infrastructure:**
✅ **Can Reuse:** `/src/services/generic/GenericRelayService.ts`
  - Has `queryEvents()` for NIP-17 message queries

✅ **Can Reuse:** `/src/services/generic/EncryptionService.ts`
  - Has decryption methods for NIP-17 messages

**Pattern to Follow:**
The existing messaging system already queries and decrypts NIP-17 messages in `MessagingBusinessService`. Similar pattern can be used for order history.

**Required Files:**
```
src/
  services/
    business/
      OrderHistoryService.ts                 ← NEW
  hooks/
    useBuyerOrders.ts                        ← NEW
  components/
    shop/
      BuyerOrderList.tsx                     ← NEW
      BuyerOrderCard.tsx                     ← NEW
      BuyerOrderDetail.tsx                   ← NEW
  app/
    orders/
      page.tsx                               ← NEW
```

**Update Required:**
- `Header.tsx` - Add "My Purchases" navigation link

---

### ❌ Feature #9: Order Management (Seller - Private) - **NOT STARTED (0%)**

**Status:** Partial structure exists

**Existing Structure:**
- ✅ `/src/app/my-shop/page.tsx` - Seller's shop page exists
  - Currently shows product listings only
  - Has tab structure that could be extended

**Missing Components:**
- ❌ `/src/app/my-shop/orders/page.tsx` - Orders list page not found
- ❌ `/src/components/shop/SellerOrderList.tsx` - Component not found
- ❌ `/src/components/shop/SellerOrderCard.tsx` - Partially exists (mentioned in Feature #4)
- ❌ `/src/components/shop/SellerOrderDetail.tsx` - Component not found
- ❌ `/src/hooks/useSellerOrders.ts` - Hook not found

**What's Missing:**
- No seller order list view
- No order status tabs (pending, confirmed, shipped, delivered)
- No order fulfillment actions
- No order timeline for sellers

**Available Infrastructure:**
✅ **Can Reuse:** `OrderHistoryService` (when created in Feature #8)
  - Can add `fetchSellerOrders()`, `filterByStatus()` methods

**Required Files:**
```
src/
  hooks/
    useSellerOrders.ts                       ← NEW
  components/
    shop/
      SellerOrderList.tsx                    ← NEW
      SellerOrderCard.tsx                    ← NEW (or reuse from Feature #4)
      SellerOrderDetail.tsx                  ← NEW
  app/
    my-shop/
      orders/
        page.tsx                             ← NEW
```

**Update Required:**
- `my-shop/page.tsx` - Add "Orders" tab
- `OrderHistoryService.ts` - Add seller-specific methods

---

### ❌ Feature #10: Dispute Resolution (Public Accountability) - **NOT STARTED (0%)**

**Status:** No implementation found

**Missing Components:**
- ❌ `/src/app/disputes/file/page.tsx` - Dispute filing page not found
- ❌ `/src/components/shop/DisputeForm.tsx` - Component not found
- ❌ `/src/components/shop/DisputeTimeline.tsx` - Component not found
- ❌ `/src/components/shop/DisputeButton.tsx` - Component not found
- ❌ `/src/hooks/useDispute.ts` - Hook not found
- ❌ `/src/services/business/DisputeBusinessService.ts` - Service not found
- ❌ `/src/services/nostr/DisputeEventService.ts` - Event service not found
- ❌ `/src/types/dispute.ts` - Types not found

**What's Missing:**
- No dispute filing mechanism
- No Kind 1111 event creation
- No dispute display/timeline
- No seller cancellation workflow
- No reputation system

**Available Infrastructure:**
✅ **Can Reuse:** `/src/services/generic/GenericEventService.ts`
  - Has `signEvent()`, `publishEvent()` methods
  - Can create Kind 1111 events

**Required Files:**
```
src/
  types/
    dispute.ts                               ← NEW (Dispute, DisputeType, DisputeReason)
  services/
    business/
      DisputeBusinessService.ts              ← NEW
    nostr/
      DisputeEventService.ts                 ← NEW
  hooks/
    useDispute.ts                            ← NEW
  components/
    shop/
      DisputeForm.tsx                        ← NEW
      DisputeTimeline.tsx                    ← NEW
      DisputeButton.tsx                      ← NEW
  app/
    disputes/
      file/
        page.tsx                             ← NEW
```

**Update Required:**
- `orders/[saleId]/page.tsx` - Add "File Dispute" button (buyer)
- `my-shop/orders/[saleId]/page.tsx` - Add "Cancel Sale" button (seller)
- `BuyerOrderDetail.tsx` - Add dispute button
- `SellerOrderDetail.tsx` - Add cancel button

---

## Infrastructure Assessment

### ✅ What's Available (Can Be Reused)

1. **Messaging Infrastructure (NIP-17)**
   - ✅ `/src/services/business/MessagingBusinessService.ts`
   - ✅ `/src/services/nostr/NostrEventService.ts` - Has NIP-17 methods
   - ✅ `/src/services/generic/EncryptionService.ts`
   - **Can be used for:** Purchase intent, payment confirmations, shipping updates, delivery confirmations

2. **Event Infrastructure (Kind 30023)**
   - ✅ `/src/services/generic/GenericEventService.ts`
   - ✅ `createNIP23Event()` method
   - ✅ Supports NIP-33 replaceable events
   - **Can be used for:** Sale events, sale status updates

3. **Relay Infrastructure**
   - ✅ `/src/services/generic/GenericRelayService.ts`
   - ✅ `queryEvents()`, `publishEvent()`, `subscribeToEvents()`
   - **Can be used for:** Order history queries, sale event queries

4. **Profile Infrastructure**
   - ✅ `/src/services/business/ProfileBusinessService.ts`
   - **Can be used for:** Fetching Lightning Addresses (lud16/lud06)

5. **Shop Infrastructure**
   - ✅ `/src/services/business/ShopBusinessService.ts`
   - ✅ `/src/services/business/ShopContentService.ts`
   - ✅ Product creation/editing patterns to follow

### ❌ What's Missing (Needs to Be Created)

1. **Purchase Flow Services**
   - ❌ `PurchaseBusinessService.ts`
   - ❌ `SaleBusinessService.ts`
   - ❌ `PaymentBusinessService.ts`
   - ❌ `OrderHistoryService.ts`
   - ❌ `DisputeBusinessService.ts`

2. **Event Services**
   - ❌ `SaleEventService.ts`
   - ❌ `DisputeEventService.ts`

3. **Type Definitions**
   - ❌ `purchase.ts`
   - ❌ `sale.ts`
   - ❌ `payment.ts`
   - ❌ `shipping.ts`
   - ❌ `dispute.ts`

4. **Hooks**
   - ❌ `usePurchaseIntent.ts`
   - ❌ `usePaymentLink.ts`
   - ❌ `usePayment.ts`
   - ❌ `useSaleConfirmation.ts`
   - ❌ `useShipping.ts`
   - ❌ `useBuyerOrders.ts`
   - ❌ `useSellerOrders.ts`
   - ❌ `useDispute.ts`

5. **UI Components** (20+ components needed)
   - Cart page components
   - Purchase flow components
   - Payment components
   - Order management components
   - Shipping components
   - Dispute components

6. **Pages** (8+ pages needed)
   - Cart page
   - Payment pages
   - Buyer order pages
   - Seller order pages
   - Dispute filing page

---

## Recommendations

### Immediate Next Steps (Priority Order)

1. **Feature #2: Shopping Cart Page** ⭐ HIGH PRIORITY
   - Blocks all other features
   - Relatively simple (UI-focused, no complex business logic)
   - Build: `cart/page.tsx`, `CartPage.tsx`, `CartItem.tsx`, `CartSummary.tsx`
   - ~1-2 days of work

2. **Feature #3: Purchase Intent** ⭐ HIGH PRIORITY
   - First transaction step
   - Establishes buyer-seller communication pattern
   - Build: Types, business service, hook, components
   - ~2-3 days of work

3. **Feature #4: Payment Link Ready** ⭐ HIGH PRIORITY
   - Critical for transaction flow
   - Most complex (LNURL-pay, sale events, seller UI)
   - Build: Sale types, services, seller order management pages
   - ~3-5 days of work

4. **Feature #5-7: Payment & Fulfillment** 🔶 MEDIUM PRIORITY
   - Core transaction completion
   - Build: Payment pages, shipping components
   - ~3-4 days of work

5. **Feature #8-9: Order History** 🔶 MEDIUM PRIORITY
   - Critical for user experience
   - Build: Order pages, query/decrypt logic
   - ~2-3 days of work

6. **Feature #10: Dispute Resolution** 🔷 LOWER PRIORITY
   - Important for trust but not day-1 critical
   - Build: Dispute pages, Kind 1111 events
   - ~2-3 days of work

### Estimated Total Effort

- **Remaining Work:** Features #2-10
- **Estimated Time:** 15-25 days of development
- **Complexity:** Medium-High (requires understanding of:)
  - NIP-17 encrypted messaging
  - LNURL-pay invoice generation
  - NIP-33 replaceable events
  - Lightning Address resolution
  - Complex state management

### Architecture Considerations

1. **Follow Existing Patterns**
   - ✅ The shop product flow is a great reference
   - ✅ Messaging system provides NIP-17 pattern
   - ✅ SOA pattern is well-established: Page → Component → Hook → Business → Event → Generic

2. **Reuse Generic Services**
   - ✅ Don't create duplicate relay/event/encryption logic
   - ✅ Wrap `GenericEventService` for sale events (like shop products do)
   - ✅ Use `MessagingBusinessService` for all NIP-17 messages

3. **Type Safety**
   - ✅ Define all types upfront (purchase, sale, payment, shipping, dispute)
   - ✅ Use TypeScript discriminated unions for message types
   - ✅ Validate message structure on receive

4. **Testing Strategy**
   - 🚧 No tests found for existing features
   - ⚠️  Purchase flow should have tests given financial implications
   - Consider: Unit tests for business services, integration tests for full flow

### Risks & Challenges

1. **LNURL-pay Integration** 🔴 HIGH RISK
   - No evidence of LNURL-pay implementation in codebase
   - Requires external service/library
   - May need to research libraries (e.g., `@lawallet/lnurl-pay`, `lnurl-pay`)

2. **Lightning Address Resolution** 🟡 MEDIUM RISK
   - Need to fetch lud16/lud06 from user profiles
   - Handle edge cases (no Lightning Address, invalid address)
   - Validate LNURL-pay responses

3. **Message Ordering** 🟡 MEDIUM RISK
   - NIP-17 messages may arrive out of order
   - Need to construct order timeline correctly
   - Handle duplicate messages

4. **State Management Complexity** 🟡 MEDIUM RISK
   - Order can be in multiple states simultaneously
   - Need to handle edge cases (abandoned checkouts, lost messages)
   - Consider: FSM (Finite State Machine) for order lifecycle

5. **Privacy Leaks** 🔴 HIGH RISK
   - Critical: Don't leak buyer pubkey in public sale events
   - Critical: Don't store shipping addresses in plaintext
   - Audit all public events before publishing

---

## Conclusion

The codebase has a solid foundation with Feature #1 (Add to Cart) fully implemented and robust infrastructure for messaging (NIP-17) and events (Kind 30023). However, **90% of the purchase flow remains unbuilt**.

The good news: The architecture is clean, patterns are established, and reusable services exist. The challenge: Significant development effort required across multiple layers (types, services, hooks, components, pages).

**Recommended Approach:**
1. Build Feature #2 (Cart Page) immediately to enable testing
2. Implement Features #3-4 as a cohesive unit (purchase intent → payment link)
3. Complete payment/fulfillment flow (Features #5-7)
4. Add order history (Features #8-9)
5. Finish with disputes (Feature #10)

**Timeline Estimate:** 3-5 weeks for a single developer working full-time, assuming familiarity with Nostr, Lightning, and the existing codebase.

---

## Appendix: File Creation Checklist

### Types (6 files)
- [ ] `src/types/purchase.ts`
- [ ] `src/types/sale.ts`
- [ ] `src/types/payment.ts`
- [ ] `src/types/shipping.ts`
- [ ] `src/types/dispute.ts`
- [ ] Updates to existing `cart.ts` (if needed)

### Services (7 files)
- [ ] `src/services/business/PurchaseBusinessService.ts`
- [ ] `src/services/business/SaleBusinessService.ts`
- [ ] `src/services/business/PaymentBusinessService.ts`
- [ ] `src/services/business/OrderHistoryService.ts`
- [ ] `src/services/business/DisputeBusinessService.ts`
- [ ] `src/services/nostr/SaleEventService.ts`
- [ ] `src/services/nostr/DisputeEventService.ts`

### Hooks (8 files)
- [ ] `src/hooks/usePurchaseIntent.ts`
- [ ] `src/hooks/usePaymentLink.ts`
- [ ] `src/hooks/usePayment.ts`
- [ ] `src/hooks/useSaleConfirmation.ts`
- [ ] `src/hooks/useShipping.ts`
- [ ] `src/hooks/useBuyerOrders.ts`
- [ ] `src/hooks/useSellerOrders.ts`
- [ ] `src/hooks/useDispute.ts`

### Components (20+ files)
**Cart (3):**
- [ ] `src/components/shop/CartPage.tsx`
- [ ] `src/components/shop/CartItem.tsx`
- [ ] `src/components/shop/CartSummary.tsx`

**Purchase Intent (1):**
- [ ] `src/components/shop/PurchaseIntentButton.tsx`

**Seller Order Management (3):**
- [ ] `src/components/shop/StockConfirmationButton.tsx`
- [ ] `src/components/shop/PaymentLinkGenerator.tsx`
- [ ] `src/components/shop/SellerOrderList.tsx`
- [ ] `src/components/shop/SellerOrderCard.tsx`
- [ ] `src/components/shop/SellerOrderDetail.tsx`

**Payment (5):**
- [ ] `src/components/shop/LightningInvoice.tsx`
- [ ] `src/components/shop/PaymentStatus.tsx`
- [ ] `src/components/shop/QRCodeDisplay.tsx`
- [ ] `src/components/shop/MarkPaidButton.tsx`
- [ ] `src/components/shop/PaymentConfirmationButton.tsx`

**Shipping (3):**
- [ ] `src/components/shop/ShippingAddressForm.tsx`
- [ ] `src/components/shop/ShippingForm.tsx`
- [ ] `src/components/shop/DeliveryConfirmation.tsx`

**Buyer Orders (3):**
- [ ] `src/components/shop/BuyerOrderList.tsx`
- [ ] `src/components/shop/BuyerOrderCard.tsx`
- [ ] `src/components/shop/BuyerOrderDetail.tsx`

**Disputes (3):**
- [ ] `src/components/shop/DisputeForm.tsx`
- [ ] `src/components/shop/DisputeTimeline.tsx`
- [ ] `src/components/shop/DisputeButton.tsx`

### Pages (8+ files)
- [ ] `src/app/cart/page.tsx`
- [ ] `src/app/payment/[saleId]/page.tsx`
- [ ] `src/app/orders/page.tsx`
- [ ] `src/app/orders/[saleId]/page.tsx`
- [ ] `src/app/my-shop/orders/page.tsx`
- [ ] `src/app/my-shop/orders/[saleId]/page.tsx`
- [ ] `src/app/disputes/file/page.tsx`

### Updates to Existing Files
- [ ] `src/components/Header.tsx` - Add "My Purchases" link
- [ ] `src/app/my-shop/page.tsx` - Add "Orders" tab

---

**Total New Files Needed: ~50+**  
**Total Updates to Existing Files: ~2-3**
