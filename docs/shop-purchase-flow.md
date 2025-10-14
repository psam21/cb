# Shop Purchase Flow

## The Problem

Products exist on /shop but no way to actually purchase. Users can only "contact seller" via DM. Need complete purchase flow from cart to payment to fulfillment.

## Current State

**Have:** Product listings (NIP-33), product detail pages, messaging (NIP-17), Lightning donations  
**Missing:** Cart, checkout, payment flow, order management, fulfillment tracking

## Purchase Flow Feature Ideas

**1. Add to Cart**  
What: Button on product detail to add items to shopping cart  
Why: Can't collect multiple items before checkout, forces one-at-a-time purchasing  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/shop/AddToCartButton.tsx` | - | - | - | - |
| **UPDATE** | `/src/app/shop/[id]/page.tsx` (ProductDetail page - add AddToCartButton) | `/src/components/shop/ProductDetail.tsx` (integrate button), `/src/components/Header.tsx` (add cart icon + badge with item count) | - | - | - | - |

**Store:** NEW `/src/stores/useCartStore.ts` (Zustand persist) with methods: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`, `getTotal()`  
**Type:** NEW `/src/types/cart.ts` with `CartItem`, `Cart`  
Value: Multi-item purchasing, better UX, increased order size

---

**2. Shopping Cart Page**  
What: `/cart` page showing all added items with quantities and total  
Why: Need to review items before purchase, adjust quantities, remove items  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/cart/page.tsx` | `/src/components/shop/CartPage.tsx`, `/src/components/shop/CartItem.tsx`, `/src/components/shop/CartSummary.tsx` | - | - | - | - |
| **UPDATE** | - | - | - | - | - | - |

**Store:** Reuse `useCartStore` (getters: `items`, `total`, `itemCount`)  
Value: Order review, quantity management, price transparency

---

**3. Checkout Flow**  
What: Multi-step checkout process (review → shipping → payment)  
Why: Need structured process to collect all required information  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/checkout/page.tsx` | `/src/components/shop/CheckoutFlow.tsx`, `/src/components/shop/CheckoutSteps.tsx`, `/src/components/shop/ReviewStep.tsx`, `/src/components/shop/ShippingStep.tsx`, `/src/components/shop/PaymentStep.tsx` | `/src/hooks/useCheckout.ts` | - | - | - |
| **UPDATE** | - | - | - | - | - | - |

**Store:** Reuse `useCartStore` for cart data  
**Type:** NEW `/src/types/checkout.ts` with `CheckoutStep`, `CheckoutData`  
Value: Guided purchase process, reduced errors, professional experience

---

**4. Lightning Payment Integration**  
What: Generate Lightning invoice and accept payment via Bitcoin Lightning Network (sats only)  
Why: Fast, low-fee payments aligned with Nostr ecosystem, default and only payment method  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/shop/LightningInvoice.tsx`, `/src/components/shop/PaymentStatus.tsx`, `/src/components/shop/QRCodeDisplay.tsx`, `/src/components/shop/MarkPaidButton.tsx` | `/src/hooks/usePayment.ts` | `/src/services/business/PaymentBusinessService.ts` | - | - |
| **UPDATE** | `/src/app/checkout/page.tsx` (PaymentStep - show invoice, poll status, show "Mark as Paid" button) | `/src/components/shop/PaymentStep.tsx` (integrate LightningInvoice + MarkPaidButton components) | - | - | - | - |

**Type:** NEW `/src/types/payment.ts` with `LightningInvoice`, `PaymentStatus`, `PaymentVerification`  
**Lightning Address Source:** Seller's Nostr profile (Kind 0 metadata) - `lud16` field (Lightning Address) OR `lud06` field (LNURL)  
**Flow:**

1. Fetch seller's Kind 0 profile metadata
2. Extract `lud16` (e.g., `seller@getalby.com`) OR `lud06` (LNURL) from profile
3. Generate invoice using seller's Lightning Address via LNURL-pay protocol
4. Display QR code + invoice string + Lightning Address for buyer to pay
5. Show **"Mark as Paid"** button for buyer to confirm payment manually
6. On "Mark as Paid" click → Set payment status to verified, proceed to order placement

**Manual Payment Verification:**
- Buyer clicks "Mark as Paid" after paying invoice in their wallet
- System trusts buyer (seller will verify payment on their end)
- Order proceeds to placement immediately
- Seller can dispute/cancel if payment not received (handled in seller order management)

**Business Methods:** `getSellerLightningAddress(sellerPubkey)`, `generateInvoiceFromLUD16(lud16, amount, orderId)`, `markPaymentAsPaid(orderId)`, `checkPaymentStatus(invoiceId)` (optional auto-verification)  
**Nostr:** Query Kind 0 for seller, parse `lud16`/`lud06` field  
**Protocol:** LNURL-pay for invoice generation from Lightning Address  
**UI:** Display Lightning Address, QR code, invoice string, AND "Mark as Paid" button  
Value: Instant settlement, low fees, crypto-native, global payments, no fiat complexity, decentralized (no payment processor middleman), simple manual verification

---

**5. Order Placement (Nostr Event)**  
What: Create order event on Nostr when checkout completes  
Why: Need decentralized, permanent record of order details  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | - | `/src/hooks/useOrderPlacement.ts` | `/src/services/business/OrderBusinessService.ts` | `/src/services/nostr/OrderEventService.ts` | - |
| **UPDATE** | `/src/app/checkout/page.tsx` (call useOrderPlacement.placeOrder() on payment verified, then redirect to confirmation) | `/src/components/shop/PaymentStep.tsx` (trigger order placement on payment success) | - | - | - | `/src/services/generic/GenericEventService.ts` (reuse createNIP23Event, signEvent) |

**Type:** NEW `/src/types/order.ts` with `Order`, `OrderItem`, `OrderStatus`  
**Nostr:** Kind 30023, dTag = `order-{timestamp}-{random}`, tag `['t', 'culture-bridge-order']`  
**Event Structure:**

- title: `Order #{orderId}`
- summary: Order total, item count
- content: JSON stringified order details (items, quantities, total, seller pubkeys)
- tags: `['t', 'culture-bridge-order']`, `['p', sellerPubkey]` for each seller

**Business Methods:** `createOrder(cartItems, shippingAddress, paymentId)`, `getOrderById(dTag)`  
**Event Methods:** `createOrderEvent(orderData)` → calls GenericEventService.createNIP23Event  
**Reuse:** ✅ GenericEventService.createNIP23Event() with `dTagPrefix: 'order'` (battle-tested pattern)  
Value: Permanent order record, verifiable on Nostr, decentralized commerce

---

**6. Shipping Address Exchange**  
What: Securely share shipping address with seller  
Why: Seller needs address to fulfill, but address is sensitive PII  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/shop/ShippingAddressForm.tsx` | - | - | - | - |
| **UPDATE** | `/src/app/checkout/page.tsx` (ShippingStep - collect address, send to seller(s) on step complete) | `/src/components/shop/ShippingStep.tsx` (integrate ShippingAddressForm, validate before next) | `/src/hooks/useMessageSending.ts` (add sendShippingAddress method) | - | - | `/src/services/generic/GenericMessageService.ts` (reuse NIP-17 encryption) |

**Type:** NEW `/src/types/shipping.ts` with `ShippingAddress`, `ShippingMethod`  
**Nostr:** NIP-17 encrypted DM with structured shipping data sent to each seller  
**Message Structure:** JSON with `{ type: 'shipping-address', orderId, address, phone, notes }`  
**Hook Methods:** `sendShippingAddress(sellerPubkey, orderId, addressData)` in useMessageSending  
Value: Privacy-preserving, secure address sharing, no centralized storage

---

**7. Order Confirmation**  
What: Send confirmation to both buyer and seller after order placement  
Why: Both parties need proof of transaction and order details  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/checkout/success/page.tsx` (order confirmation page after successful checkout) | `/src/components/shop/OrderConfirmation.tsx` (display order summary, event ID, next steps) | - | - | - | - |
| **UPDATE** | `/src/app/checkout/page.tsx` (redirect to /checkout/success after order placed) | - | `/src/hooks/useMessages.ts` (extend for order context messages) | `/src/services/business/OrderBusinessService.ts` (add sendOrderConfirmations method - calls on placeOrder success) | - | `/src/services/generic/GenericMessageService.ts` (reuse NIP-17) |

**Nostr:** NIP-17 encrypted DMs to buyer and seller(s) with order summary  
**Message Structure:** JSON with `{ type: 'order-confirmation', orderId, items, total, status }`  
**Business Methods:** `sendOrderConfirmations(order)` → sends to buyer + all sellers  
Value: Transaction proof, clear communication, reduces confusion

---

**8. Order History (Buyer)**  
What: `/orders` page showing all past purchases  
Why: Buyers need to track orders, reorder, view history  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/orders/page.tsx` (order list - click order → navigate to detail page), `/src/app/orders/[orderId]/page.tsx` (full order detail page) | `/src/components/shop/OrderList.tsx`, `/src/components/shop/OrderCard.tsx` (clickable, links to detail), `/src/components/shop/OrderDetail.tsx` (full order view with status timeline) | `/src/hooks/useOrderHistory.ts` (fetch buyer's orders, subscribe to status updates), `/src/hooks/useOrderDetail.ts` (fetch single order + status history) | - | - | - |
| **UPDATE** | - | `/src/components/Header.tsx` (add "My Orders" nav link → /orders) | - | `/src/services/business/OrderBusinessService.ts` (add getBuyerOrders, getOrderById methods) | - | `/src/services/generic/GenericRelayService.ts` (reuse queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#t': ['culture-bridge-order'], authors: [userPubkey] }`  
**Hook Methods:** `fetchOrders()`, `getOrderStatus(orderId)` (query Kind 1111 comments)  
**Business Methods:** `getBuyerOrders(pubkey)` → fetches + parses orders  
**Pattern:** List page → Detail page (no modals)  
Value: Order tracking, purchase history, reorder convenience

---

**9. Order Management (Seller)**  
What: `/my-shop/orders` page showing all incoming orders  
Why: Sellers need to see pending orders, fulfill them, track revenue  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `/src/app/my-shop/orders/page.tsx` (order list by status tabs), `/src/app/my-shop/orders/[orderId]/page.tsx` (full order detail + fulfillment page) | `/src/components/shop/SellerOrderList.tsx`, `/src/components/shop/SellerOrderCard.tsx` (clickable, links to detail), `/src/components/shop/OrderFulfillment.tsx` (update status, add tracking - on detail page) | `/src/hooks/useSellerOrders.ts` (fetch orders for seller's products, real-time updates), `/src/hooks/useOrderDetail.ts` (fetch single order + status history) | - | - | - |
| **UPDATE** | `/src/app/my-shop/page.tsx` (add "Orders" tab/link to navigation → /my-shop/orders) | - | - | `/src/services/business/OrderBusinessService.ts` (add getSellerOrders method) | - | `/src/services/generic/GenericRelayService.ts` (reuse queryEvents) |

**Nostr:** Query `{ kinds: [30023], '#t': ['culture-bridge-order'], '#p': [sellerPubkey] }`  
**Hook Methods:** `fetchSellerOrders()`, `filterByStatus(status)`, `getOrderDetails(orderId)`  
**Business Methods:** `getSellerOrders(sellerPubkey)` → fetches orders referencing seller's products  
**Pattern:** List page → Detail/Fulfillment page (no modals)  
Value: Fulfillment workflow, revenue tracking, business management

---

**10. Order Status Updates**  
What: Update order status (pending → processing → shipped → delivered)  
Why: Buyers need visibility into fulfillment progress  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `/src/components/shop/OrderStatusTimeline.tsx` (buyer view on order detail page - read-only timeline), `/src/components/shop/StatusUpdateForm.tsx` (seller view on order detail page - post updates) | `/src/hooks/useOrderStatus.ts` (fetch status history, subscribe to new updates) | `/src/services/business/OrderStatusService.ts` (validate status transitions, post updates) | `/src/services/nostr/CommentEventService.ts` (create Kind 1111 events) | - |
| **UPDATE** | `/src/app/orders/[orderId]/page.tsx` (buyer - show OrderStatusTimeline), `/src/app/my-shop/orders/[orderId]/page.tsx` (seller - show StatusUpdateForm) | `/src/components/shop/OrderDetail.tsx` (add OrderStatusTimeline for buyer view), `/src/components/shop/OrderFulfillment.tsx` (add StatusUpdateForm for seller view) | - | - | - | `/src/services/generic/GenericEventService.ts` (reuse signEvent), `/src/services/generic/GenericRelayService.ts` (publishEvent, queryEvents, subscribeToEvents) |

**Type:** NEW `/src/types/order-status.ts` with `OrderStatus`, `StatusUpdate`  
**Nostr:** Kind 1111 with `['e', orderId, relay, 'root']` tag, query `{ kinds: [1111], '#e': [orderId] }`  
**Event Structure:**
- content: JSON `{ status: 'processing|shipped|delivered', timestamp, note, trackingNumber? }`
- tags: `['e', orderId, relay, 'root']`, `['p', buyerPubkey]`, `['status', statusValue]`

**Hook Methods:** `fetchStatusUpdates(orderId)`, `subscribeToUpdates(orderId)`, `postStatusUpdate(orderId, statusData)` (seller only)  
**Business Methods:** `updateOrderStatus(orderId, status, note, trackingNumber)` → validates, creates Kind 1111  
**Event Methods:** `createStatusUpdateEvent(orderId, statusData)` → builds Kind 1111 comment  
Value: Transparency, verifiable proof of work, reduced support requests, permanent order history

---

**11. Payment Verification**  
What: Verify Lightning payment was received before releasing order  
Why: Prevent fraud, ensure seller gets paid  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | - | - | - | - | - |
| **UPDATE** | `/src/app/checkout/page.tsx` (manual verification via "Mark as Paid" button, buyer-initiated) | `/src/components/shop/PaymentStatus.tsx` (show payment info + "Mark as Paid" button) | `/src/hooks/usePayment.ts` (add markAsPaid method, optional auto-verification) | `/src/services/business/PaymentBusinessService.ts` (add markAsPaid, optional checkZapReceipt methods), `/src/services/business/OrderBusinessService.ts` (auto-update order to 'processing' on marked paid) | - | `/src/services/generic/GenericRelayService.ts` (optional: query NIP-57 zap receipts for auto-verify) |

**Manual Verification (Primary):**
- Buyer clicks "Mark as Paid" button after paying invoice
- System trusts buyer, proceeds to order placement
- Seller verifies payment on their end (can dispute/cancel if not received)

**Optional Auto-Verification (Future Enhancement):**
- Query `{ kinds: [9735], '#e': [paymentRequestId] }` for NIP-57 zap receipts
- Check Lightning provider API for payment status
- Auto-enable "Continue" button when payment detected

**Business Methods:** 
- `markAsPaid(orderId)` → sets payment status to verified, triggers order placement
- `checkZapReceipt(paymentId)` → (optional) queries Kind 9735 events for auto-verify
- OrderBusinessService: `onPaymentVerified(orderId)` → auto-update to 'processing'

**Pattern:** Manual verification via buyer confirmation, seller validates on their end  
Value: Simple UX, no complex payment polling, fraud handled by seller dispute process

---

**12. Shipping Notifications**  
What: Alert buyer when order ships with tracking info  
Why: Buyers want to know when to expect delivery  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | - | - | - | - | - |
| **UPDATE** | `/src/app/my-shop/orders/[orderId]/page.tsx` (seller posts shipping update from StatusUpdateForm) | `/src/components/shop/StatusUpdateForm.tsx` (add carrier dropdown, tracking number field, estimated delivery datepicker), `/src/components/shop/OrderStatusTimeline.tsx` (display shipping info in timeline) | `/src/hooks/useOrderStatus.ts` (parse shipping data from Kind 1111 content) | `/src/services/business/OrderStatusService.ts` (add validateShippingData method) | `/src/services/nostr/CommentEventService.ts` (include tracking fields in Kind 1111 content JSON) | - |

**Nostr:** Kind 1111 comment with content = JSON `{ status: 'shipped', trackingNumber, carrier, estimatedDelivery, timestamp }`  
**Business Methods:** `updateOrderStatus(orderId, 'shipped', { trackingNumber, carrier, estimatedDelivery })` → validates shipping data, creates permanent relay record  
**Pattern:** Shipping notification = Kind 1111 status update with specific fields on detail page  
Value: Delivery expectations, tracking capability, verifiable proof of shipment

---

**13. Delivery Confirmation**  
What: Mark order as delivered/completed  
Why: Close order lifecycle, trigger reviews, finalize transaction  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | - | - | - | - | - |
| **UPDATE** | `/src/app/orders/[orderId]/page.tsx` (buyer clicks "Confirm Delivery" button on detail page), `/src/app/my-shop/orders/[orderId]/page.tsx` (seller marks delivered on detail page) | `/src/components/shop/OrderDetail.tsx` (add "Confirm Delivery" button for buyer), `/src/components/shop/OrderFulfillment.tsx` (add "Mark Delivered" button for seller) | `/src/hooks/useOrderStatus.ts` (add confirmDelivery method) | `/src/services/business/OrderStatusService.ts` (add confirmDelivery method - records who confirmed) | `/src/services/nostr/CommentEventService.ts` (create Kind 1111 with status='delivered', confirmedBy field) | - |

**Nostr:** Kind 1111 delivery confirmation comment with content = JSON `{ status: 'delivered', confirmedBy: 'buyer|seller', timestamp }`  
**Hook Methods:** `confirmDelivery(orderId)` (buyer) or seller can mark delivered in StatusUpdateForm  
**Business Methods:** `confirmDelivery(orderId, confirmedBy)` → creates permanent delivery record  
**Pattern:** Final Kind 1111 status update marking order complete on detail page  
Value: Order closure, review trigger, dispute prevention

---

## 🔄 Reusability & Generic Services

### Battle-Tested Patterns to Reuse

These shop purchase features should **NOT** create duplicate code. Follow the battle-tested patterns:

| Feature | What to Reuse | From Where |
|---------|---------------|------------|
| **#5: Order Placement** | `GenericEventService.createNIP23Event()` | Shop Product Flow (Kind 30023 creation) |
| **#6: Shipping Address** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |
| **#6: Order Confirmation** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |
| **#8: Order History** | Query pattern from `useExploreHeritage` | Heritage Contribution Flow |
| **#9: Seller Orders** | Same query pattern, different filters | Heritage Contribution Flow |
| **#10: Status Updates** | Simple event creation (Kind 1111) | Can extend GenericEventService |
| **#13: Receipt DM** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |

### Generic Opportunities (For Future)

If implementing multiple similar features (e.g., Comments, Reactions, Status Updates all in one sprint), consider creating:

**1. Generic Query Hook**
```typescript
// Instead of separate useOrderHistory, useSellerOrders hooks
// Create: useNostrQuery<T>(kind, filters, mapper)

const orders = useNostrQuery(
  30023,
  { '#t': ['culture-bridge-order'], authors: [pubkey] },
  mapToOrder
);
```

**2. Generic Interaction Service**
```typescript
// Instead of separate CommentEventService, ReactionEventService
// Extend: GenericEventService with createSimpleEvent()

GenericInteractionService.createStatusUpdate(
  orderId,
  'shipped',
  { trackingNumber },
  sellerPubkey,
  buyerPubkey
);
```

**When to Genericize:**
- ✅ Pattern repeats 3+ times
- ✅ Logic is identical or nearly identical
- ❌ Don't over-abstract prematurely

### Critical: Follow Battle-Tested Patterns

**DO:**
- ✅ Study reference implementations (Shop Product, Heritage Contribution, Profile)
- ✅ Copy proven patterns, adapt minimally
- ✅ Reuse existing services before creating new ones
- ✅ Follow SOA strictly: Page → Component → Hook → Business → Event → Generic

**DON'T:**
- ❌ Create new EventService if GenericEventService can handle it
- ❌ Write custom relay queries if GenericRelayService works
- ❌ Duplicate NIP-17 logic when GenericMessageService exists
- ❌ Skip battle-tested comparison (see implementation-protocol.md)

---

## Future Enhancements (Not Required for Initial Release)

**14. Review/Rating System** - Post-delivery reviews and ratings  
**15. Dispute Resolution** - Handle refunds, returns, order issues  
**16. Inventory Management** - Track stock, prevent overselling  
**17. Multi-Currency Display** - Show fiat equivalents (payment still in sats)  
**18. Abandoned Cart Recovery** - Remind users about cart items  
**19. Seller Reputation** - Display seller stats and badges  
**20. Bulk Order Discounts** - Quantity-based pricing tiers

---

_Last Updated: October 14, 2025_
