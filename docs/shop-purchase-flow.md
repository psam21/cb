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
How: Nostr: N/A (client-side flow) | Codebase: New /checkout route, multi-step form component, validation per step  
Value: Guided purchase process, reduced errors, professional experience

**4. Lightning Payment Integration**  
What: Generate Lightning invoice and accept payment via Bitcoin Lightning Network  
Why: Fast, low-fee payments aligned with Nostr ecosystem  
How: Nostr: Use NIP-57 (Lightning Zaps) or integrate with LNURL/Lightning Address | Codebase: New PaymentBusinessService, LN invoice generation, payment verification  
Value: Instant settlement, low fees, crypto-native, global payments

**5. Order Placement (Nostr Event)**  
What: Create order event on Nostr when checkout completes  
Why: Need decentralized, permanent record of order details  
How: Nostr: New kind (TBD, maybe kind 30311 for orders), include product IDs, quantities, total, buyer pubkey | Codebase: New OrderBusinessService, create order event, publish to relays  
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
How: Nostr: Query order events where buyer pubkey matches `{ kinds: [30311?], authors: [userPubkey] }` | Codebase: New useOrderHistory hook, display list with status/tracking  
Value: Order tracking, purchase history, reorder convenience

**9. Order Management (Seller)**  
What: `/my-shop/orders` page showing all incoming orders  
Why: Sellers need to see pending orders, fulfill them, track revenue  
How: Nostr: Query order events where product author matches seller pubkey | Codebase: New useSellerOrders hook, filter by status (pending/shipped/completed)  
Value: Fulfillment workflow, revenue tracking, business management

**10. Order Status Updates**  
What: Update order status (pending → processing → shipped → delivered)  
Why: Buyers need visibility into fulfillment progress  
How: Nostr: Seller publishes status update events (kind 1 reply or update to order event) | Codebase: Status update UI in seller dashboard, query status events in buyer order view  
Value: Transparency, reduced support requests, customer satisfaction

**11. Payment Verification**  
What: Verify Lightning payment was received before releasing order  
Why: Prevent fraud, ensure seller gets paid  
How: Nostr: Check Lightning payment proof (NIP-57 zap receipt) or LN node confirmation | Codebase: PaymentBusinessService verifies payment, updates order status automatically  
Value: Fraud prevention, automated fulfillment, trust building

**12. Shipping Notifications**  
What: Alert buyer when order ships with tracking info  
Why: Buyers want to know when to expect delivery  
How: Nostr: Seller sends NIP-17 encrypted DM with tracking number and carrier | Codebase: Shipping form in seller dashboard, sends notification on submit  
Value: Delivery expectations, tracking capability, reduced anxiety

**13. Delivery Confirmation**  
What: Mark order as delivered/completed  
Why: Close order lifecycle, trigger reviews, finalize transaction  
How: Nostr: Buyer or seller publishes delivery confirmation event | Codebase: "Confirm Delivery" button in order detail, updates order status  
Value: Order closure, review trigger, dispute prevention

**14. Review/Rating System**  
What: Leave reviews and ratings for products after delivery  
Why: Build trust, help future buyers, motivate quality  
How: Nostr: Kind 1985 (label/review event) with product 'a' tag and rating | Codebase: Review form on completed orders, display reviews on product detail  
Value: Social proof, quality signal, community trust

**15. Dispute Resolution**  
What: Handle refunds, returns, or order issues  
Why: Things go wrong, need mechanism to resolve fairly  
How: Nostr: Dispute event (kind TBD) with issue description, both parties can respond | Codebase: Dispute form on orders, mediation UI, refund process (Lightning)  
Value: Customer protection, seller accountability, fair commerce

**16. Inventory Management**  
What: Track product stock, mark out of stock, auto-update availability  
Why: Prevent overselling, manage limited inventory  
How: Nostr: Update product event (NIP-33 replacement) with stock count | Codebase: Stock field in product creation, decrement on purchase, disable purchase when 0  
Value: Inventory control, prevent overselling, operational efficiency

**17. Multi-Currency Support**  
What: Display prices in multiple fiat currencies (USD, EUR, etc.) alongside sats  
Why: Global buyers think in local currency  
How: Client-side conversion using BTC exchange rate API, store price in sats | Codebase: Currency selector, real-time conversion display  
Value: Global accessibility, price clarity, wider market

**18. Abandoned Cart Recovery**  
What: Remind users about items left in cart  
Why: Users forget, gentle nudge increases conversion  
How: Client-side: Check cart age in localStorage, show notification | Nostr: Optional reminder event if user opts in  
Value: Increased sales, reduced abandonment, customer service

**19. Seller Reputation**  
What: Display seller stats (total sales, rating, response time)  
Why: Buyers need trust signals before purchasing  
How: Nostr: Aggregate order events by seller, count completions, calculate avg rating | Codebase: Seller profile shows stats, badge system  
Value: Trust building, seller motivation, informed purchases

**20. Bulk Order Discounts**  
What: Offer quantity-based pricing (e.g., 10+ items get 20% off)  
Why: Incentivize larger purchases, clear inventory  
How: Nostr: Include pricing tiers in product event metadata | Codebase: Auto-apply discount in cart based on quantity  
Value: Increased order value, inventory movement, buyer savings

_Last Updated: October 14, 2025_
