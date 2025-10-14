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
How: **New:** `src/stores/useCartStore.ts` (Zustand persist), `src/types/cart.ts`, `src/components/shop/AddToCartButton.tsx` | **Update:** `src/components/shop/ProductDetail.tsx` (add button), `src/components/Header.tsx` (cart icon + count)  
Value: Multi-item purchasing, better UX, increased order size

**2. Shopping Cart Page**  
What: `/cart` page showing all added items with quantities and total  
Why: Need to review items before purchase, adjust quantities, remove items  
How: **New:** `src/app/cart/page.tsx`, `src/components/shop/CartPage.tsx` | **Use:** useCartStore to read state, fetch product details from Nostr by dTag  
Value: Order review, quantity management, price transparency

**3. Checkout Flow**  
What: Multi-step checkout process (review → shipping → payment)  
Why: Need structured process to collect all required information  
How: **New:** `src/app/checkout/page.tsx`, `src/components/shop/CheckoutFlow.tsx`, `src/components/shop/CheckoutSteps.tsx` (multi-step form with validation)  
Value: Guided purchase process, reduced errors, professional experience

**4. Lightning Payment Integration**  
What: Generate Lightning invoice and accept payment via Bitcoin Lightning Network (sats only)  
Why: Fast, low-fee payments aligned with Nostr ecosystem, default and only payment method  
How: **New:** `src/services/business/PaymentBusinessService.ts`, `src/hooks/usePayment.ts`, `src/components/shop/LightningInvoice.tsx`, `src/types/payment.ts` | **Nostr:** NIP-57 Zap integration or LNURL  
Value: Instant settlement, low fees, crypto-native, global payments, no fiat complexity

**5. Order Placement (Nostr Event)**  
What: Create order event on Nostr when checkout completes  
Why: Need decentralized, permanent record of order details  
How: **New:** `src/services/business/OrderBusinessService.ts`, `src/services/nostr/OrderEventService.ts`, `src/hooks/useOrderPlacement.ts`, `src/types/order.ts` | **Nostr:** Kind 30023, dTag = "order-{timestamp}-{random}", tag `#t: culture-bridge-order` | **Reuse:** GenericEventService.createNIP23Event()  
Value: Permanent order record, verifiable on Nostr, decentralized commerce

**6. Shipping Address Exchange**  
What: Securely share shipping address with seller  
Why: Seller needs address to fulfill, but address is sensitive PII  
How: **New:** `src/components/shop/ShippingAddressForm.tsx` | **Extend:** `src/hooks/useMessageSending.ts` (already has NIP-17 encryption) | **Nostr:** Encrypted DM with structured shipping data  
Value: Privacy-preserving, secure address sharing, no centralized storage

**7. Order Confirmation**  
What: Send confirmation to both buyer and seller after order placement  
Why: Both parties need proof of transaction and order details  
How: **Use:** OrderBusinessService sends confirmations via NIP-17 encrypted messages | **Extend:** `src/hooks/useMessages.ts` for order context | **Nostr:** Kind 1 notification or NIP-17 DM  
Value: Transaction proof, clear communication, reduces confusion

**8. Order History (Buyer)**  
What: `/orders` page showing all past purchases  
Why: Buyers need to track orders, reorder, view history  
How: **New:** `src/app/orders/page.tsx`, `src/hooks/useOrderHistory.ts`, `src/components/shop/OrderList.tsx`, `src/components/shop/OrderDetail.tsx` | **Nostr:** Query `{ kinds: [30023], '#t': ['culture-bridge-order'], authors: [userPubkey] }`  
Value: Order tracking, purchase history, reorder convenience

**9. Order Management (Seller)**  
What: `/my-shop/orders` page showing all incoming orders  
Why: Sellers need to see pending orders, fulfill them, track revenue  
How: **New:** `src/app/my-shop/orders/page.tsx`, `src/hooks/useSellerOrders.ts` | **Update:** `src/app/my-shop/page.tsx` (add orders link) | **Nostr:** Query orders referencing seller's products, filter by status  
Value: Fulfillment workflow, revenue tracking, business management

**10. Order Status Updates**  
What: Update order status (pending → processing → shipped → delivered)  
Why: Buyers need visibility into fulfillment progress  
How: **New:** `src/services/business/OrderStatusService.ts`, `src/services/nostr/CommentEventService.ts`, `src/hooks/useOrderStatus.ts`, `src/components/shop/OrderStatusTimeline.tsx`, `src/components/shop/StatusUpdateForm.tsx` | **Nostr:** Kind 1111 with 'e' tag to order event, query `{ kinds: [1111], '#e': [orderId] }`  
Value: Transparency, verifiable proof of work, reduced support requests, permanent order history

**11. Payment Verification**  
What: Verify Lightning payment was received before releasing order  
Why: Prevent fraud, ensure seller gets paid  
How: **Extend:** PaymentBusinessService checks NIP-57 zap receipt or LN node webhook | **Update:** OrderBusinessService auto-updates status on payment confirmation  
Value: Fraud prevention, automated fulfillment, trust building

**12. Shipping Notifications**  
What: Alert buyer when order ships with tracking info  
Why: Buyers want to know when to expect delivery  
How: **Use:** CommentEventService (kind 1111) with tracking number, carrier, ship date | **Component:** StatusUpdateForm in seller dashboard | **Nostr:** Permanent relay record  
Value: Delivery expectations, tracking capability, verifiable proof of shipment

**13. Delivery Confirmation**  
What: Mark order as delivered/completed  
Why: Close order lifecycle, trigger reviews, finalize transaction  
How: **Component:** "Confirm Delivery" button in OrderDetail | **Use:** CommentEventService (kind 1111) for delivery confirmation | **Update:** Order status in local state  
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
