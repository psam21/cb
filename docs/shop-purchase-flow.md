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

| | Store | Type | Component | Page |
|---|---|---|---|---|
| **NEW** | useCartStore.ts | cart.ts | AddToCartButton.tsx | - |
| **UPDATE** | - | - | ProductDetail.tsx, Header.tsx | - |

Value: Multi-item purchasing, better UX, increased order size

---

**2. Shopping Cart Page**  
What: `/cart` page showing all added items with quantities and total  
Why: Need to review items before purchase, adjust quantities, remove items  
How:

| | Component | Page |
|---|---|---|
| **NEW** | CartPage.tsx | cart/page.tsx |
| **UPDATE** | - | - |

Value: Order review, quantity management, price transparency

---

**3. Checkout Flow**  
What: Multi-step checkout process (review → shipping → payment)  
Why: Need structured process to collect all required information  
How:

| | Component | Page |
|---|---|---|
| **NEW** | CheckoutFlow.tsx, CheckoutSteps.tsx | checkout/page.tsx |
| **UPDATE** | - | - |

Value: Guided purchase process, reduced errors, professional experience

---

**4. Lightning Payment Integration**  
What: Generate Lightning invoice and accept payment via Bitcoin Lightning Network (sats only)  
Why: Fast, low-fee payments aligned with Nostr ecosystem, default and only payment method  
How:

| | Hook | Component | Business Service | Type |
|---|---|---|---|---|
| **NEW** | usePayment.ts | LightningInvoice.tsx | PaymentBusinessService.ts | payment.ts |
| **UPDATE** | - | - | - | - |

**Nostr:** NIP-57 Zap integration or LNURL  
Value: Instant settlement, low fees, crypto-native, global payments, no fiat complexity

---

**5. Order Placement (Nostr Event)**  
What: Create order event on Nostr when checkout completes  
Why: Need decentralized, permanent record of order details  
How:

| | Hook | Business Service | Event Service | Type |
|---|---|---|---|---|
| **NEW** | useOrderPlacement.ts | OrderBusinessService.ts | OrderEventService.ts | order.ts |
| **UPDATE** | - | - | - | - |

**Nostr:** Kind 30023, dTag = "order-{timestamp}-{random}", tag `#t: culture-bridge-order`  
**Reuse:** GenericEventService.createNIP23Event()  
Value: Permanent order record, verifiable on Nostr, decentralized commerce

---

**6. Shipping Address Exchange**  
What: Securely share shipping address with seller  
Why: Seller needs address to fulfill, but address is sensitive PII  
How:

| | Hook | Component |
|---|---|---|
| **NEW** | - | ShippingAddressForm.tsx |
| **UPDATE** | useMessageSending.ts (extend) | - |

**Nostr:** NIP-17 encrypted DM with structured shipping data  
Value: Privacy-preserving, secure address sharing, no centralized storage

---

**7. Order Confirmation**  
What: Send confirmation to both buyer and seller after order placement  
Why: Both parties need proof of transaction and order details  
How:

| | Hook | Business Service |
|---|---|---|
| **NEW** | - | - |
| **UPDATE** | useMessages.ts (extend for order context) | OrderBusinessService.ts (sends confirmations) |

**Nostr:** Kind 1 notification or NIP-17 DM  
Value: Transaction proof, clear communication, reduces confusion

---

**8. Order History (Buyer)**  
What: `/orders` page showing all past purchases  
Why: Buyers need to track orders, reorder, view history  
How:

| | Hook | Component | Page |
|---|---|---|---|
| **NEW** | useOrderHistory.ts | OrderList.tsx, OrderDetail.tsx | orders/page.tsx |
| **UPDATE** | - | - | - |

**Nostr:** Query `{ kinds: [30023], '#t': ['culture-bridge-order'], authors: [userPubkey] }`  
Value: Order tracking, purchase history, reorder convenience

---

**9. Order Management (Seller)**  
What: `/my-shop/orders` page showing all incoming orders  
Why: Sellers need to see pending orders, fulfill them, track revenue  
How:

| | Hook | Page |
|---|---|---|
| **NEW** | useSellerOrders.ts | my-shop/orders/page.tsx |
| **UPDATE** | - | my-shop/page.tsx (add orders link) |

**Nostr:** Query orders referencing seller's products, filter by status  
Value: Fulfillment workflow, revenue tracking, business management

---

**10. Order Status Updates**  
What: Update order status (pending → processing → shipped → delivered)  
Why: Buyers need visibility into fulfillment progress  
How:

| | Hook | Component | Business Service | Event Service |
|---|---|---|---|---|
| **NEW** | useOrderStatus.ts | OrderStatusTimeline.tsx, StatusUpdateForm.tsx | OrderStatusService.ts | CommentEventService.ts |
| **UPDATE** | - | - | - | - |

**Nostr:** Kind 1111 with 'e' tag to order event, query `{ kinds: [1111], '#e': [orderId] }`  
Value: Transparency, verifiable proof of work, reduced support requests, permanent order history

---

**11. Payment Verification**  
What: Verify Lightning payment was received before releasing order  
Why: Prevent fraud, ensure seller gets paid  
How:

| | Business Service |
|---|---|
| **NEW** | - |
| **UPDATE** | PaymentBusinessService.ts (verify NIP-57 zap receipt), OrderBusinessService.ts (auto-update status) |

Value: Fraud prevention, automated fulfillment, trust building

---

**12. Shipping Notifications**  
What: Alert buyer when order ships with tracking info  
Why: Buyers want to know when to expect delivery  
How:

| | Event Service | Component |
|---|---|---|
| **NEW** | - | - |
| **UPDATE** | CommentEventService.ts (kind 1111 with tracking) | StatusUpdateForm.tsx (seller dashboard) |

**Nostr:** Kind 1111 comment with tracking number, carrier, ship date (permanent relay record)  
Value: Delivery expectations, tracking capability, verifiable proof of shipment

---

**13. Delivery Confirmation**  
What: Mark order as delivered/completed  
Why: Close order lifecycle, trigger reviews, finalize transaction  
How:

| | Component | Event Service |
|---|---|---|
| **NEW** | - | - |
| **UPDATE** | OrderDetail.tsx (add "Confirm Delivery" button) | CommentEventService.ts (kind 1111 delivery confirmation) |

**Nostr:** Kind 1111 delivery confirmation comment on order event  
Value: Order closure, review trigger, dispute prevention

---

## Future Enhancements (Not Required for Initial Release)

**14. Review/Rating System** - Post-delivery reviews and ratings  
**15. Dispute Resolution** - Handle refunds, returns, order issues  
**16. Inventory Management** - Track stock, prevent overselling  
**17. Multi-Currency Display** - Show fiat equivalents (payment still in sats)  
**18. Abandoned Cart Recovery** - Remind users about cart items  
**19. Seller Reputation** - Display seller stats and badges  
**20. Bulk Order Discounts** - Quantity-based pricing tiers

_Last Updated: October 14, 2025_
