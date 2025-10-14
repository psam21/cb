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
How: Client-side state (Zustand), store product IDs + quantities in localStorage, cart icon with count in header  
Value: Multi-item purchasing, better UX, increased order size

**2. Shopping Cart Page**  
What: `/cart` page showing all added items with quantities and total  
Why: Need to review items before purchase, adjust quantities, remove items  
How: Read cart state, display product details (fetch from Nostr by ID), quantity controls, calculate totals  
Value: Order review, quantity management, price transparency

**3. Checkout Flow**  
What: Multi-step checkout process (review → shipping → payment)  
Why: Need structured process to collect all required information  
How: Nostr: N/A (client-side flow) | Codebase: New /checkout route, multi-step form component, validation per step, Lightning-only payment (sats)  
Value: Guided purchase process, reduced errors, professional experience

**4. Lightning Payment Integration**  
What: Generate Lightning invoice and accept payment via Bitcoin Lightning Network (sats only)  
Why: Fast, low-fee payments aligned with Nostr ecosystem, default and only payment method  
How: Nostr: Use NIP-57 (Lightning Zaps) or integrate with LNURL/Lightning Address | Codebase: New PaymentBusinessService, LN invoice generation, payment verification webhook  
Value: Instant settlement, low fees, crypto-native, global payments, no fiat complexity

**5. Order Placement (Nostr Event)**  
What: Create order event on Nostr when checkout completes  
Why: Need decentralized, permanent record of order details  
How: Nostr: Kind 30023 (NIP-23) with dTag = "order-{timestamp}-{random}", include product IDs, quantities, total, buyer pubkey | Codebase: New OrderBusinessService, reuse GenericEventService.createNIP23Event()  
Value: Permanent order record, verifiable on Nostr, decentralized commerce

**6. Shipping Address Exchange**  
What: Securely share shipping address with seller  
Why: Seller needs address to fulfill, but address is sensitive PII  
How: Nostr: Encrypted NIP-17 DM from buyer to seller with shipping details | Codebase: Extend messaging to send structured address data, encrypt before publishing  
Value: Privacy-preserving, secure address sharing, no centralized storage

**7. Order Confirmation**  
What: Send confirmation to both buyer and seller after order placement  
Why: Both parties need proof of transaction and order details  
How: Nostr: Kind 1 notification event or NIP-17 encrypted message to both parties | Codebase: OrderBusinessService sends confirmations, includes order ID, summary, next steps  
Value: Transaction proof, clear communication, reduces confusion

**8. Order History (Buyer)**  
What: `/orders` page showing all past purchases  
Why: Buyers need to track orders, reorder, view history  
How: Nostr: Query `{ kinds: [30023], '#t': ['culture-bridge-order'], authors: [userPubkey] }` | Codebase: New useOrderHistory hook, display list with status/tracking  
Value: Order tracking, purchase history, reorder convenience

**9. Order Management (Seller)**  
What: `/my-shop/orders` page showing all incoming orders  
Why: Sellers need to see pending orders, fulfill them, track revenue  
How: Nostr: Query order events where product author matches seller pubkey | Codebase: New useSellerOrders hook, filter by status (pending/shipped/completed)  
Value: Fulfillment workflow, revenue tracking, business management

**10. Order Status Updates**  
What: Update order status (pending → processing → shipped → delivered)  
Why: Buyers need visibility into fulfillment progress  
How: Nostr: Kind 1111 comment event with 'e' tag referencing order event ID, content = status + details (tracking, ship date, etc.) | Codebase: Status update UI in seller dashboard, query `{ kinds: [1111], '#e': [orderId] }` for timeline, all updates become permanent relay record  
Value: Transparency, verifiable proof of work, reduced support requests, permanent order history

**11. Payment Verification**  
What: Verify Lightning payment was received before releasing order  
Why: Prevent fraud, ensure seller gets paid  
How: Nostr: Check Lightning payment proof (NIP-57 zap receipt) or LN node confirmation | Codebase: PaymentBusinessService verifies payment, updates order status automatically  
Value: Fraud prevention, automated fulfillment, trust building

**12. Shipping Notifications**  
What: Alert buyer when order ships with tracking info  
Why: Buyers want to know when to expect delivery  
How: Nostr: Kind 1111 comment on order event with tracking number, carrier, ship date | Codebase: Shipping form in seller dashboard, publishes kind 1111 with structured data, becomes permanent relay record  
Value: Delivery expectations, tracking capability, verifiable proof of shipment

**13. Delivery Confirmation**  
What: Mark order as delivered/completed  
Why: Close order lifecycle, trigger reviews, finalize transaction  
How: Nostr: Buyer or seller publishes kind 1111 delivery confirmation comment on order event | Codebase: "Confirm Delivery" button in order detail, updates order status  
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
