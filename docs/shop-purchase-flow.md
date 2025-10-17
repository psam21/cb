# Shop Purchase Flow

## The Problem

Products exist on /shop but no way to actually purchase. Users can only "contact seller" via DM. Need complete purchase flow from cart to payment to fulfillment with proper balance between market transparency and user privacy.

## Current State

**Have:** Product listings (NIP-33), product detail pages, messaging (NIP-17), Lightning donations  
**Missing:** Cart, checkout, payment flow, order management, fulfillment tracking, reputation system

## Purchase Flow Overview

**Note:** This table shows the core purchase transaction lifecycle (Features #3-7, #10). Cart features (#1-2) happen before this flow, and order history features (#8-9) provide retrospective views of completed flows.

| | Phase 1: Discovery | Phase 2: Intent | Phase 3: Payment Setup | Phase 4: Payment | Phase 5: Acceptance | Phase 6: Shipping | Phase 7: Delivery | Phase 8: Dispute (If Needed) |
|---|---|---|---|---|---|---|---|---|
| **PUBLIC** | Product listing (Kind 30023) by seller | | Sale pending event (Kind 30023): stock confirmed, payment link ready, amount visible | | Sale accepted event (Kind 30023): payment confirmed, amount visible | | | Dispute event (Kind 1111): non-shipment or non-payment complaint, references sale event |
| **PRIVATE** | | Purchase intent (NIP-17): buyer → seller with product list | | Payment confirmation (NIP-17): buyer → seller with "marked as paid" + shipping address | | Shipping update (NIP-17): seller → buyer with tracking info | Delivery confirmation (NIP-17): buyer → seller confirms receipt | |
| **Feature** | (Already exists) | #3: Purchase Intent | #4: Payment Link Ready | #5: Payment by Buyer | #6: Payment Received Confirmation | #7: Shipping & Delivery | #7: Shipping & Delivery | #10: Dispute Resolution |

**Key Insight**: Each phase is either public (market activity) or private (participant communication), never both. Market transparency without identity surveillance.

---

## Architecture Philosophy

### Privacy vs Transparency Balance

**Public (Market Transparency):**
- ✅ Product listings (already public)
- ✅ Sale events (what was bought, price, quantity, timestamp)
- ✅ Payment link availability (stock confirmed, payment pending)
- ✅ Payment received confirmations (sale accepted)
- ✅ Dispute events (reputation accountability)

**Private (User Privacy via NIP-17):**
- 🔒 Buyer identity (who purchased)
- 🔒 Seller identity linked to specific sale
- 🔒 Purchase intent (I want to buy this)
- 🔒 Shipping addresses
- 🔒 Payment details (invoices, wallet addresses)
- 🔒 Delivery confirmations
- 🔒 Order status updates

**Philosophy:**
- Like early Bitcoin: Transparent transactions, pseudonymous participants
- Market activity is visible (proves cultural commerce thrives)
- User identity and PII stay encrypted
- Reputation emerges from public sale/dispute events
- No platform intermediary needed

## Purchase Flow Features

**1. Add to Cart**  
What: Button on product detail to add items to shopping cart  
Why: Can't collect multiple items before checkout, forces one-at-a-time purchasing  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `AddToCartButton.tsx` (renders button, calls store methods) | - | - | - | - |
| **UPDATE** | `shop/[id]/page.tsx` (import and render AddToCartButton) | `ProductDetail.tsx` (pass product data to button), `Header.tsx` (show cart icon with item count badge from store) | - | - | - | - |

**Store:** NEW `/src/stores/useCartStore.ts` (Zustand persist) with methods: `addItem()`, `removeItem()`, `updateQuantity()`, `clearCart()`, `getTotal()`  
**Type:** NEW `/src/types/cart.ts` with `CartItem`, `Cart`  
**Value:** Multi-item purchasing, better UX, increased order size

---

**2. Shopping Cart Page**  
What: `/cart` page showing all added items with quantities and total  
Why: Need to review items before purchase, adjust quantities, remove items  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `cart/page.tsx` (render cart UI, read from store) | `CartPage.tsx` (container), `CartItem.tsx` (individual item with quantity controls), `CartSummary.tsx` (total + checkout button) | - | - | - | - |
| **UPDATE** | - | - | - | - | - | - |

**Store:** Reuse `useCartStore` (getters: `items`, `total`, `itemCount`)  
**Value:** Order review, quantity management, price transparency

---

**3. Purchase Intent (Private)**  
What: Buyer expresses intent to purchase, seller confirms stock availability  
Why: Seller needs to confirm stock before buyer proceeds to payment; prevents payment for unavailable items  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `PurchaseIntentButton.tsx` (triggers intent flow) | `usePurchaseIntent.ts` (orchestrates: calls Business → Message Service, manages loading/success states) | `PurchaseBusinessService.ts` (validateCart, preparePurchaseIntent, groupBySeller methods) | - | - |
| **UPDATE** | `cart/page.tsx` (add "Checkout" button triggering intent) | `CartSummary.tsx` (render PurchaseIntentButton, pass cart data) | - | - | - | `GenericMessageService.ts` (reuse sendEncryptedMessage for NIP-17) |

**Type:** NEW `/src/types/purchase.ts` with `PurchaseIntent`, `PurchaseResponse`  
**Nostr:** NIP-17 encrypted message to each seller  
**Message Structure:** JSON with `{ type: 'purchase-intent', products: [{ productId, quantity, price }], total, buyerPubkey, timestamp }`  
**Flow:**
1. Buyer clicks "Checkout" from cart
2. System sends encrypted purchase intent to each seller (NIP-17)
3. Buyer sees "Waiting for seller confirmation..." state
4. Seller receives notification in `/my-shop/orders`
5. Seller confirms stock availability (Feature #4)

**Value:** Stock validation before payment, prevents overselling, seller controls sales flow

---

**4. Payment Link Ready (Public Sale Event)**  
What: Seller confirms stock + provides payment link; publishes public sale event  
Why: Transparent market activity without revealing buyer identity; proves sale in progress  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `StockConfirmationButton.tsx` (confirms stock), `PaymentLinkGenerator.tsx` (generates LNURL-pay invoice) | `usePaymentLink.ts` (orchestrates: calls Business → Event Service → Message Service) | `SaleBusinessService.ts` (confirmStock, generatePaymentLink, fetchLightningAddress, createSaleData methods) | `SaleEventService.ts` (createSaleEvent, publishSaleEvent methods - wraps GenericEventService) | - |
| **UPDATE** | `my-shop/orders/[saleId]/page.tsx` (render confirmation UI) | `SellerOrderCard.tsx` (show "Confirm Stock" action button) | - | - | - | `GenericEventService.ts` (reuse createEvent, signEvent, publishEvent for Kind 30023), `GenericMessageService.ts` (send payment link via NIP-17) |

**Type:** NEW `/src/types/sale.ts` with `Sale`, `SaleStatus`, `SaleEvent`  
**Nostr:** Kind 30023 (public), dTag = `sale-{timestamp}-{random}`, tag `['t', 'culture-bridge-sale-pending']`  
**Event Structure:**
- title: `Sale Pending`
- summary: Product title, quantity, amount
- content: JSON with `{ saleId, productId, productTitle, quantity, amount, paymentLinkReady: true, expiresAt, timestamp }`
- tags: `['t', 'culture-bridge-sale-pending']`, `['product', productId]`, `['status', 'awaiting-payment']`
- **NO buyer pubkey, NO seller link to specific sale**

**Flow:**
1. Seller receives purchase intent (Feature #3)
2. Seller clicks "Confirm Stock" in `/my-shop/orders`
3. System fetches seller's Lightning Address (lud16/lud06 from Kind 0)
4. System generates payment invoice via LNURL-pay
5. Seller publishes public sale event (Kind 30023) - signed by seller
6. System sends encrypted payment link to buyer (NIP-17)
7. Public sees: "A sale is pending for Product X (2 units, 100k sats)"
8. Buyer receives: Private message with payment invoice

**Business Methods:** `confirmStock(intentId, productId)`, `generatePaymentLink(sellerPubkey, amount, saleId)`, `publishSaleEvent(saleData)`  
**Event Methods:** `createSaleEvent(saleData)` → calls GenericEventService.createNIP23Event with `dTagPrefix: 'sale'`  
**Value:** Market transparency (proves sale happening), buyer privacy (identity hidden), seller reputation (signed by seller)

---

**5. Payment by Buyer (Private)**  
What: Buyer receives payment link, pays Lightning invoice, shares shipping address  
Why: Private payment details, secure address exchange  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `payment/[saleId]/page.tsx` (payment page for specific sale) | `LightningInvoice.tsx` (display invoice + QR), `PaymentStatus.tsx` (status indicator), `QRCodeDisplay.tsx` (QR renderer), `MarkPaidButton.tsx` (manual confirmation), `ShippingAddressForm.tsx` (collect address) | `usePayment.ts` (orchestrates: handles form submission, calls Business → Message Service) | `PaymentBusinessService.ts` (validatePayment, preparePaymentConfirmation, validateAddress methods) | - | - |
| **UPDATE** | - | - | - | - | - | `GenericMessageService.ts` (reuse sendEncryptedMessage for payment confirmation + address via NIP-17) |

**Type:** Update `/src/types/payment.ts` with `PaymentConfirmation`; update `/src/types/shipping.ts` with `ShippingAddress`  
**Flow:**
1. Buyer receives encrypted payment link (from Feature #4)
2. Buyer navigates to payment page
3. Displays Lightning invoice QR code + invoice string
4. Buyer pays in their wallet
5. Buyer clicks "Mark as Paid" button
6. Buyer enters shipping address in form
7. System sends encrypted message to seller with:
   - Payment confirmation
   - Shipping address
   - Timestamp

**Nostr:** NIP-17 encrypted message to seller  
**Message Structure:** JSON with `{ type: 'payment-and-address', saleId, paymentProof: 'marked-paid', shippingAddress: {...}, timestamp }`  
**Value:** Private payment confirmation, secure address exchange, no centralized storage

---

**6. Payment Received Confirmation (Public Sale Event)**  
What: Seller confirms payment received and accepts the sale; updates public sale event  
Why: Transparent proof of completed sale without revealing buyer identity  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | - | `PaymentConfirmationButton.tsx` (confirms payment received) | `useSaleConfirmation.ts` (orchestrates: calls Business → Event Service → Message Service) | - | - | - |
| **UPDATE** | `my-shop/orders/[saleId]/page.tsx` (render confirmation UI) | `SellerOrderCard.tsx` (show "Confirm Payment" action button) | - | `SaleBusinessService.ts` (add confirmPayment, updateSaleStatus methods) | `SaleEventService.ts` (add updateSaleEvent method for status changes) | `GenericEventService.ts` (reuse createEvent, signEvent, publishEvent for Kind 30023 replacement via NIP-33), `GenericMessageService.ts` (send confirmation to buyer via NIP-17) |

**Type:** Update `/src/types/sale.ts` with payment confirmation fields  
**Nostr:** Kind 30023 (public, replaces previous sale event), same dTag, tag `['t', 'culture-bridge-sale-accepted']`  
**Event Structure:**
- title: `Sale Accepted`
- summary: Product title, quantity, amount
- content: JSON with `{ saleId, productId, productTitle, quantity, amount, paymentReceived: true, timestamp }`
- tags: `['t', 'culture-bridge-sale-accepted']`, `['product', productId]`, `['status', 'payment-received']`
- **NO buyer pubkey, NO shipping address**

**Flow:**
1. Seller receives encrypted payment confirmation + address (Feature #5)
2. Seller verifies payment in their wallet
3. Seller clicks "Confirm Payment" in `/my-shop/orders`
4. System updates public sale event (replaces "awaiting-payment" event)
5. Public sees: "Sale accepted for Product X (2 units, 100k sats)"
6. System sends encrypted confirmation to buyer (NIP-17)

**Business Methods:** `confirmPayment(saleId)`, `updateSaleStatus(saleId, status)`  
**Event Methods:** `createSaleEvent(saleData)` with updated status → calls GenericEventService.createNIP23Event (NIP-33 replacement)  
**Value:** Transparent proof of sale completion, buyer privacy maintained, seller reputation built

---

**7. Shipping and Delivery (Private Communication)**  
What: Seller ships product and sends tracking info; buyer confirms delivery  
Why: Private fulfillment workflow, no public exposure of shipping details  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `orders/[saleId]/page.tsx` (buyer order detail with delivery confirmation) | `ShippingForm.tsx` (seller enters tracking), `DeliveryConfirmation.tsx` (buyer confirms receipt) | `useShipping.ts` (orchestrates: calls Business → Message Service for shipping/delivery) | - | - | - |
| **UPDATE** | `my-shop/orders/[saleId]/page.tsx` (seller shipping actions) | - | `useMessageSending.ts` (add sendShippingUpdate, sendDeliveryConfirmation methods) | - | - | `GenericMessageService.ts` (reuse sendEncryptedMessage for shipping updates + delivery confirmations via NIP-17) |

**Type:** NEW `/src/types/shipping.ts` with `ShippingUpdate`, `DeliveryConfirmation`  
**Nostr:** NIP-17 encrypted messages between buyer and seller  
**Message Structures:**
- Shipping notification: `{ type: 'shipping-update', saleId, carrier, trackingNumber, estimatedDelivery, timestamp }`
- Delivery confirmation: `{ type: 'delivery-confirmation', saleId, received: true, condition, timestamp }`

**Flow:**
1. Seller prepares shipment
2. Seller sends encrypted shipping update with tracking (NIP-17)
3. Buyer receives notification with tracking details
4. Product arrives
5. Buyer sends encrypted delivery confirmation (NIP-17)
6. Seller receives confirmation

**Value:** Private logistics, secure tracking information, completion verification

---

**8. Order History (Buyer - Private)**  
What: `/orders` page showing buyer's private purchase history  
Why: Buyers need to track their purchases, but history should stay private  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `orders/page.tsx` (order list), `orders/[saleId]/page.tsx` (order detail) | `BuyerOrderList.tsx` (list container), `BuyerOrderCard.tsx` (individual order card), `BuyerOrderDetail.tsx` (full order timeline) | `useBuyerOrders.ts` (orchestrates: calls Business → Relay/Message Services to fetch + decrypt) | `OrderHistoryService.ts` (fetchBuyerOrders, groupBySaleId, constructOrderTimeline methods) | - | - |
| **UPDATE** | - | `Header.tsx` (add "My Purchases" nav link) | - | - | - | `GenericRelayService.ts` (reuse queryEvents for NIP-17 messages), `GenericMessageService.ts` (reuse decryptMessage for order data) |

**Nostr:** Query NIP-17 encrypted messages: `{ kinds: [1059], '#p': [buyerPubkey] }`  
**Data Source:** Encrypted messages containing:
- Purchase intents sent by buyer
- Payment links received from seller
- Payment confirmations sent by buyer
- Shipping updates received from seller
- Delivery confirmations sent by buyer

**Flow:**
1. Query all encrypted messages TO buyer
2. Decrypt and filter for purchase-related messages
3. Group by `saleId` to construct order timeline
4. Display as list of purchases
5. Click order → Navigate to detail page with full message thread

**Value:** Private purchase history, complete order timeline, accessible only to buyer

---

**9. Order Management (Seller - Private)**  
What: `/my-shop/orders` page showing seller's incoming orders and fulfillment workflow  
Why: Sellers need to manage orders privately, fulfill purchases, track sales  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `my-shop/orders/page.tsx` (order list by status), `my-shop/orders/[saleId]/page.tsx` (order detail + fulfillment) | `SellerOrderList.tsx` (list with status tabs), `SellerOrderCard.tsx` (individual order card with actions), `SellerOrderDetail.tsx` (full order detail + fulfillment UI) | `useSellerOrders.ts` (orchestrates: calls Business → Relay/Message Services to fetch + decrypt) | - | - | - |
| **UPDATE** | `my-shop/page.tsx` (add "Orders" tab) | - | - | `OrderHistoryService.ts` (add fetchSellerOrders, filterByStatus, constructOrderTimeline methods) | - | `GenericRelayService.ts` (reuse queryEvents for NIP-17 messages), `GenericMessageService.ts` (reuse decryptMessage for order data) |

**Nostr:** Query NIP-17 encrypted messages: `{ kinds: [1059], '#p': [sellerPubkey] }`  
**Data Source:** Encrypted messages containing:
- Purchase intents received from buyers
- Payment confirmations received from buyers
- Shipping updates sent by seller
- Delivery confirmations received from buyers

**Flow:**
1. Query all encrypted messages TO seller
2. Decrypt and filter for order-related messages
3. Group by `saleId` to construct order timeline
4. Display as list with status tabs (pending, confirmed, shipped, delivered)
5. Click order → Navigate to detail page with fulfillment actions

**Actions Available:**
- Confirm stock → Generate payment link (Feature #4)
- Confirm payment → Accept sale (Feature #6)
- Ship product → Send tracking (Feature #7)
- View buyer address (encrypted, only after payment)

**Value:** Private order management, complete fulfillment workflow, accessible only to seller

---

**10. Dispute Resolution (Public Accountability)**  
What: Public dispute events for reputation accountability when parties don't fulfill obligations  
Why: Decentralized justice through reputation damage; community-visible disputes  
How:

| | Page | Component | Hook | Business Service | Event Service | Generic Service |
|---|---|---|---|---|---|---|
| **NEW** | `disputes/file/page.tsx` (file dispute form) | `DisputeForm.tsx` (dispute filing form), `DisputeTimeline.tsx` (dispute history display), `DisputeButton.tsx` (trigger dispute) | `useDispute.ts` (orchestrates: calls Business → Event Service to publish dispute) | `DisputeBusinessService.ts` (validateDispute, prepareDisputeEvent methods) | `DisputeEventService.ts` (createDisputeEvent, publishDisputeEvent methods - wraps GenericEventService for Kind 1111) | - |
| **UPDATE** | `orders/[saleId]/page.tsx` (buyer "File Dispute" option), `my-shop/orders/[saleId]/page.tsx` (seller "Cancel Sale" option) | `BuyerOrderDetail.tsx` (add "File Dispute" button), `SellerOrderDetail.tsx` (add "Cancel Sale" button) | - | - | - | `GenericEventService.ts` (reuse createEvent, signEvent, publishEvent for Kind 1111) |

**Type:** NEW `/src/types/dispute.ts` with `Dispute`, `DisputeType`, `DisputeReason`  
**Nostr:** Kind 1111 (public comment/complaint), tags reference sale event  
**Event Structure:**
- content: JSON with `{ disputeType: 'non-shipment'|'non-payment', saleId, reason, evidence, timestamp }`
- tags: `['e', saleEventId, '', 'root']`, `['p', accusedPubkey]`, `['t', 'dispute']`, `['dispute-type', type]`, `['L', 'com.culturebridge.dispute']`, `['l', disputeType, 'com.culturebridge.dispute']`

**Dispute Types:**

**A. Buyer Disputes Non-Shipment:**
- Trigger: Seller confirmed payment but hasn't shipped
- Action: Buyer publishes Kind 1111 complaint referencing sale event
- Evidence: Link to public "payment-received" sale event (Feature #6)
- Impact: Damages seller reputation, visible to all

**B. Seller Cancels for Non-Payment:**
- Trigger: Buyer hasn't paid after payment link provided
- Action: Seller updates sale event to "cancelled-non-payment" status
- Evidence: Public "payment-pending" event shows payment link was ready
- Impact: Damages buyer reputation (abandoned checkout)

**Flow (Buyer Dispute):**
1. Buyer determines seller hasn't fulfilled obligation
2. Buyer clicks "File Dispute" on order detail page
3. Submits complaint with evidence (sale event ID)
4. System publishes public Kind 1111 event
5. Community sees dispute tagged to seller
6. Seller reputation damaged

**Flow (Seller Cancellation):**
1. Seller determines buyer hasn't paid
2. Seller clicks "Cancel Sale" on order detail page
3. System updates sale event to "cancelled" status (NIP-33 replacement)
4. Public sees cancellation reason
5. Buyer reputation shows abandoned sale

**Safeguards:**
- Evidence required: Must reference valid sale event
- Permanent record: Dispute visible forever
- Community judgment: No automated enforcement, reputation is social

**Value:** Decentralized accountability, reputation system, fraud prevention, community trust

---

## 🔄 Reusability & Generic Services

### Battle-Tested Patterns to Reuse

These shop purchase features should **NOT** create duplicate code. Follow the battle-tested patterns:

| Feature | What to Reuse | From Where |
|---------|---------------|------------|
| **#3: Purchase Intent** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |
| **#4: Payment Link / Sale Event** | `GenericEventService.createNIP23Event()` | Shop Product Flow (Kind 30023 creation) |
| **#5: Payment & Address** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |
| **#6: Payment Confirmation** | `GenericEventService.createNIP23Event()` | Shop Product Flow (NIP-33 replaceable events) |
| **#7: Shipping & Delivery** | `GenericMessageService` (NIP-17) | Messaging System (encrypted DMs) |
| **#8: Buyer Order History** | Query + decrypt pattern | Messaging System (NIP-17 queries) |
| **#9: Seller Order Management** | Query + decrypt pattern | Messaging System (NIP-17 queries) |
| **#10: Dispute Resolution** | Simple Kind 1111 event creation | Can use GenericEventService.signEvent() |

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

**11. Reputation Dashboard** - Visualize buyer/seller reputation scores based on public sale/dispute events  
**12. Review/Rating System** - Post-delivery reviews and ratings (public)  
**13. Inventory Management** - Track stock, prevent overselling, auto-update availability  
**14. Multi-Currency Display** - Show fiat equivalents (payment still in sats only)  
**15. Abandoned Cart Recovery** - Remind users about cart items via NIP-17  
**16. Bulk Order Discounts** - Quantity-based pricing tiers  
**17. Sale Analytics** - Public marketplace statistics (volume, top products, trends)  
**18. Escrow Service (Optional)** - Third-party Lightning escrow for high-value items  
**19. Auto-Payment Verification** - NIP-57 zap receipt monitoring for automatic confirmation  
**20. Seller Badges** - Display verified seller status, sales milestones, community trust

---

## 📊 Architecture Summary

### Event Flow Overview

```
[PUBLIC] Product Listed (Kind 30023) - Seller
    ↓
[PRIVATE] Purchase Intent (NIP-17) - Buyer → Seller
    ↓
[PUBLIC] Payment Link Ready (Kind 30023) - Seller
    ↓
[PRIVATE] Payment + Address (NIP-17) - Buyer → Seller
    ↓
[PUBLIC] Payment Received (Kind 30023) - Seller
    ↓
[PRIVATE] Shipping Update (NIP-17) - Seller → Buyer
    ↓
[PRIVATE] Delivery Confirmation (NIP-17) - Buyer → Seller
    ↓
[PUBLIC] Dispute (Kind 1111) - Either party (if needed)
```

### Public vs Private Data

**Public Events (Market Transparency):**
- Product listings
- Sale pending (payment link ready)
- Sale accepted (payment received)
- Disputes (reputation accountability)
- **Queryable by anyone, proves market activity**

**Private Messages (User Privacy):**
- Purchase intents
- Payment details
- Shipping addresses
- Delivery confirmations
- **Only accessible by buyer and seller**

### Key Design Principles

1. **Transparency Without Surveillance**: Market activity is public, user identity is private
2. **Reputation Through Accountability**: Public disputes damage bad actors' reputations
3. **Early Bitcoin Philosophy**: Public transactions, pseudonymous participants
4. **No Platform Intermediary**: Seller signs public events directly
5. **Decentralized Justice**: Community sees disputes, reputation emerges organically
6. **Privacy Where It Matters**: PII (addresses, names) always encrypted
7. **Trust Through Evidence**: Public sale events serve as evidence for disputes

### Reputation System

**Seller Reputation Indicators:**
- Total sales (public sale-accepted events)
- Dispute count (public Kind 1111 events)
- Cancellation rate (cancelled sales due to stock issues)
- Response time (time between purchase intent and payment link)

**Buyer Reputation Indicators:**
- Completed purchases (inferred from lack of non-payment disputes)
- Abandoned checkouts (seller cancellations due to non-payment)
- Dispute count (public Kind 1111 events)

**Queryable Reputation:**
```typescript
// Anyone can query seller's public track record
const sales = await queryEvents({ 
  kinds: [30023], 
  '#t': ['culture-bridge-sale-accepted'],
  authors: [sellerPubkey] 
});

const disputes = await queryEvents({
  kinds: [1111],
  '#p': [sellerPubkey],
  '#t': ['dispute']
});

// Calculate reputation score
const reputationScore = (sales.length - disputes.length) / sales.length;
```

### Security Considerations

1. **Payment Verification**: Manual "Mark as Paid" by buyer, seller verifies independently
2. **Address Privacy**: Always NIP-17 encrypted, never in public events
3. **Dispute Evidence**: Must reference valid public sale event to prevent false claims
4. **Grace Periods**: 24-hour buffer before disputes allowed, prevents premature accusations
5. **One Dispute Per Sale**: Prevents spam, dispute is permanent record
6. **Seller Control**: Seller confirms stock before payment link generation

### Benefits of This Architecture

✅ **For Buyers:**
- Private purchase history
- Public accountability for bad sellers
- Simple checkout flow
- Fast Lightning payments

✅ **For Sellers:**
- Builds verifiable reputation
- Controls sales workflow
- Public proof of successful sales
- Private customer data

✅ **For Community:**
- Transparent marketplace activity
- Visible dispute resolution
- Cultural commerce validation
- No platform censorship

✅ **For CultureBridge:**
- Proves indigenous commerce thrives
- No liability for disputes
- No payment processing needed
- Aligned with Nostr/Bitcoin ethos
